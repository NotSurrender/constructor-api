import { Injectable } from "@nestjs/common";
import { InjectConnection, InjectModel } from "@nestjs/mongoose";
import { Connection, FilterQuery, Model, Types } from "mongoose";
import { Supply, SupplyDocument, SupplyProcurement } from "./supply.schema";
import { WbService } from "src/wb/wb.service";
import { AuthService } from "src/auth/auth.service";
import { GoodService } from "src/good/good.service";
import { WbApiSupply } from "src/wb/wb.interface";
import { UpdateSupplyProcurementDto } from "./dto/update-supply-procurement.dto";
import { ProcurementService } from "src/procurement/procurement.service";
import { SupplyStatus } from "./supply.interface";

@Injectable()
export class SupplyService {
  constructor(
    @InjectModel(Supply.name) private supplyModel: Model<Supply>,
    @InjectConnection() private readonly connection: Connection,
    private readonly wbSerivce: WbService,
    private readonly authService: AuthService,
    private readonly goodService: GoodService,
    private readonly procurementService: ProcurementService
  ) {}

  async find(
    userId: string,
    filters?: {
      goodId?: string;
      procurementId?: string;
    }
  ): Promise<
    (SupplyDocument & {
      procurements: { _id: string; number: number; attachedExpenses: number }[];
    })[]
  > {
    const filterQuery: FilterQuery<Supply> = {
      userId: new Types.ObjectId(userId),
    };

    if (filters?.procurementId) {
      filterQuery["procurements._id"] = new Types.ObjectId(
        filters.procurementId
      );
    }

    if (filters?.goodId) {
      const good = await this.goodService.findById(userId, filters.goodId);
      const user = await this.authService.findUserById(userId);
      const wbSupplies =
        (await this.wbSerivce.getSupplies(
          user.wbTokenStatistics,
          "2019-01-01"
        )) || [];

      const wbGoodSupplies = wbSupplies.filter((supply) => {
        return supply.nmId === good.nmId;
      });
      filterQuery.goodId = new Types.ObjectId(filters.goodId);
      const suppliesCount = await this.supplyModel
        .countDocuments(filterQuery)
        .exec();
      if (wbGoodSupplies.length > suppliesCount) {
        const supplies = await this.supplyModel.find(filterQuery);
        const nmIdsAndSuppliesMap = supplies.reduce<
          Record<number, WbApiSupply>
        >((acc, currentItem) => {
          acc[currentItem.nmId.toString()] = currentItem;
          return acc;
        }, {});
        const suppliesToCreate: Supply[] = [];
        wbGoodSupplies.forEach((supply) => {
          const nmId = supply.nmId.toString();
          if (!nmIdsAndSuppliesMap[nmId]) {
            suppliesToCreate.push({
              warehouseName: supply.warehouseName,
              goodId: new Types.ObjectId(filters.goodId),
              nmId: supply.nmId,
              supplyId: supply.incomeId,
              date: supply.date,
              procurements: [],
              quantity: supply.quantity,
              quantityAttached: 0,
              quantityAvailable: supply.quantity,
              status: "unattached",
              userId: new Types.ObjectId(userId),
            });
          }
        });
        if (suppliesToCreate.length) {
          await this.supplyModel.create(suppliesToCreate);
        }
      }
    }

    return await this.supplyModel.find(filterQuery);
  }

  async findById(
    userId: string,
    supplyId: string
  ): Promise<SupplyDocument | null> {
    return this.supplyModel
      .findById(
        {
          _id: new Types.ObjectId(supplyId),
          userId: new Types.ObjectId(userId),
        },
        { userId: 0 }
      )
      .exec();
  }

  async changeSupplyProcurements(
    userId: string,
    supplyId: string,
    dto: UpdateSupplyProcurementDto[]
  ) {
    const updateSupplyProcurementsSession =
      await this.connection.startSession();

    try {
      updateSupplyProcurementsSession.startTransaction();

      const supply = await this.findById(userId, supplyId);

      const totalQuantityAttachedFromDto = dto.reduce((acc, currentElement) => {
        return acc + currentElement.quantityAttached;
      }, 0);

      const supplyStatus: SupplyStatus = dto.length
        ? totalQuantityAttachedFromDto === supply.quantity
          ? "attached"
          : "attachedPartly"
        : "unattached";

      const updatedSupply = await this.supplyModel
        .findByIdAndUpdate(
          {
            _id: new Types.ObjectId(supplyId),
            userId: new Types.ObjectId(userId),
          },
          [
            {
              $set: {
                procurements: dto.map((procurement) => ({
                  ...procurement,
                  _id: new Types.ObjectId(procurement._id),
                })),
                quantityAttached: totalQuantityAttachedFromDto,
                status: supplyStatus,
                quantityAvailable: {
                  $subtract: ["$quantity", totalQuantityAttachedFromDto],
                },
              },
            },
          ],
          {
            projection: {
              userId: 0,
            },
            session: updateSupplyProcurementsSession,
          }
        )
        .exec();

      const currentTotalAttachedItems = updatedSupply.procurements.reduce(
        (acc, currentItem) => {
          acc += currentItem.quantityAttached;
          return acc;
        },
        0
      );

      if (!updatedSupply.procurements.length) {
        console.log("attach 1");
        await this.procurementService.attachSupply(
          userId,
          {
            _id: updatedSupply._id,
            quantity: updatedSupply.quantity,
            quantityAttached: totalQuantityAttachedFromDto,
          },
          dto,
          updateSupplyProcurementsSession
        );
      } else if (dto.length > updatedSupply.procurements.length) {
        console.log("attach 2");
        await this.procurementService.attachSupply(
          userId,
          updatedSupply,
          dto.filter(({ _id }) => {
            return updatedSupply.procurements.some(
              (procurement) => procurement._id.toString() !== _id.toString()
            );
          }),
          updateSupplyProcurementsSession
        );
      } else if (dto.length < updatedSupply.procurements.length) {
        await this.procurementService.detachSupplies(
          userId,
          supplyId,
          {
            procurements: updatedSupply.procurements
              .filter(({ _id }) => {
                return !dto.some(
                  (procurement) => procurement._id === _id.toString()
                );
              })
              .map<UpdateSupplyProcurementDto>((procurement) => ({
                _id: procurement._id.toString(),
                costPrice: procurement.costPrice,
                number: procurement.number,
                quantity: procurement.quantity,
                quantityAttached: procurement.quantityAttached,
                quantityAvailable: procurement.quantityAvailable,
              })),
            supplyQuantityAttached: totalQuantityAttachedFromDto,
            supplyQuantityAvailable:
              supply.quantity - totalQuantityAttachedFromDto,
          },
          updateSupplyProcurementsSession
        );
      } else {
        if (totalQuantityAttachedFromDto !== currentTotalAttachedItems) {
          const procurements = dto.map((item) => ({
            id: item._id,
            quantityAttached: item.quantityAttached,
            quantityAvailable: item.quantityAvailable,
          }));
          await this.procurementService.updateMany(
            userId,
            {
              supplyId: updatedSupply._id.toString(),
              procurements,
              supplyQuantityAttached: totalQuantityAttachedFromDto,
              supplyQuantityAvailable:
                supply.quantity - totalQuantityAttachedFromDto,
            },
            updateSupplyProcurementsSession
          );
        }
      }

      await updateSupplyProcurementsSession.commitTransaction();
    } catch (error) {
      await updateSupplyProcurementsSession.abortTransaction();
      throw error;
    } finally {
      await updateSupplyProcurementsSession.endSession();
    }
  }
}
