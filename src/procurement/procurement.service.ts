import { Injectable } from "@nestjs/common";
import { ClientSession, Connection, FilterQuery, Model, Types } from "mongoose";
import { InjectConnection, InjectModel } from "@nestjs/mongoose";
import { CreateProcurementDto } from "./dto/create-procurement.dto";
import {
  Procurement,
  ProcurementDocument,
  ProcurementSupply,
} from "./procurement.schema";
import { GoodService } from "src/good/good.service";
import { BalanceOperationService } from "src/balance-operation/balance-operation.service";
import { ProjectService } from "src/project/project.service";
import { WbService } from "src/wb/wb.service";
import { AuthService } from "src/auth/auth.service";
import { ProcurementStatus } from "./procurement.interface";
import { UpdateSupplyProcurementDto } from "src/supply/dto/update-supply-procurement.dto";
import { ProcurementAttachmentStatus } from "./procurement.interface";
import { Sort } from "src/common";

@Injectable()
export class ProcurementService {
  constructor(
    @InjectModel(Procurement.name) private procurementModel: Model<Procurement>,
    @InjectConnection() private readonly connection: Connection,
    private readonly goodService: GoodService,
    private readonly balanceOperationService: BalanceOperationService,
    private readonly projectService: ProjectService,
    private readonly authService: AuthService,
    private readonly wbService: WbService
  ) {}

  async find(
    userId: string,
    filter?: {
      projectId?: string;
      goodId?: string;
      status?: ProcurementStatus | ProcurementStatus[];
      supplyId?: string;
      attachmentStatuses?: ProcurementAttachmentStatus[];
    },
    sort: Sort = Sort.ASC
  ) {
    const filterQuery: FilterQuery<Procurement> = {
      userId: new Types.ObjectId(userId),
    };

    if (filter?.projectId) {
      filterQuery.projectId = new Types.ObjectId(filter.projectId);
    }

    if (filter?.goodId) {
      filterQuery.goodId = new Types.ObjectId(filter.goodId);
    }

    if (filter?.status) {
      filterQuery.status = filter.status;
    }

    if (filter?.supplyId) {
      filterQuery["supplies._id"] = new Types.ObjectId(filter.supplyId);
    }

    if (filter?.attachmentStatuses?.length) {
      filterQuery["attachmentStatus"] = filter.attachmentStatuses;
    }

    try {
      // Execute the query and exclude userId from the result set
      const results = await this.procurementModel.find(
        filterQuery,
        {
          userId: 0, // Exclude userId from the results
        },
        { sort: { createdAt: sort } }
      );

      // Return the results
      return results;
    } catch (err) {
      console.error("Error finding procurements:", err);
      throw new Error("Failed to find procurements");
    }
  }

  async findById(userId: string, procurementId: string) {
    return this.procurementModel
      .findById(
        {
          _id: new Types.ObjectId(procurementId),
          userId: new Types.ObjectId(userId),
        },
        { userId: 0 }
      )
      .exec();
  }

  async count(
    userId: string,
    filters?: { goodId?: string; status?: ProcurementStatus; nmId?: number }
  ) {
    const filterQuery: FilterQuery<Procurement> = {
      userId: new Types.ObjectId(userId),
    };

    if (filters?.goodId) {
      filterQuery.goodId = new Types.ObjectId(filters.goodId);
    }

    if (filters?.nmId) {
      filterQuery.goodArticle = filters.nmId;
    }

    if (filters?.status) {
      filterQuery.status = filters.status;
    }

    return this.procurementModel.countDocuments(filterQuery);
  }

  async getTotalExpenses(
    userId: string,
    nmId: number
  ): Promise<{ _id: string; totalExpenses: number }[]> {
    return this.procurementModel
      .aggregate([
        {
          $match: {
            userId: new Types.ObjectId(userId),
            nmId,
            status: {
              $in: ["purchased", "delivered", "packed"],
            },
          },
        },
        {
          $addFields: {
            totalFulfillmentExpenses: {
              $multiply: ["$fulfillmentPricePerUnit", "$fulfillmentQuantity"],
            },
          },
        },
        {
          $addFields: {
            totalExpenses: {
              $add: [
                "$procurementAmount",
                "$logisticsAmount",
                "$logisticsOtherExpenses",
                "$totalFulfillmentExpenses",
              ],
            },
          },
        },
        {
          $project: {
            totalExpenses: 1,
          },
        },
      ])
      .exec();
  }

  async create(userId: string, projectId: string, dto: CreateProcurementDto) {
    const procurementSession = await this.connection.startSession();

    try {
      procurementSession.startTransaction();

      let goodId: Types.ObjectId;
      let goodImage: string | undefined;
      let goodName = dto.goodName;
      let procurementNumber = 1;

      if (dto.goodArticle) {
        const user = await this.authService.findUserById(userId);

        const { cards } = await this.wbService.getCards(
          user.wbTokenPromotionAndAnalytics,
          {
            textSearch: dto.goodArticle.toString(),
          }
        );

        goodImage = cards?.[0]?.photos?.[0].c246x328;
        0;
        goodName = cards?.[0]?.vendorCode;
        const good = await this.goodService.findOne(userId, projectId, {
          nmId: dto.goodArticle,
        });

        if (!good) {
          const newGood = await this.goodService.create(
            userId,
            {
              projectId,
              name: goodName,
              nmId: dto.goodArticle,
              image: goodImage,
            },
            { session: procurementSession }
          );

          await this.projectService.attachGood(
            userId,
            projectId,
            newGood._id.toString(),
            { session: procurementSession }
          );

          goodId = newGood._id;
        } else {
          goodId = good._id;
        }

        procurementNumber += await this.procurementModel.countDocuments({
          userId: new Types.ObjectId(userId),
          goodId,
        });
      } else {
        const newGood = await this.goodService.create(
          userId,
          {
            projectId,
            name: goodName,
            nmId: dto.goodArticle,
            image: goodImage,
          },
          { session: procurementSession }
        );

        goodId = newGood._id;
      }

      const totalExpenses =
        dto.amount +
        (dto.logisticsAmount ?? 0) +
        (dto.fulfillmentQuantity ?? 0) * (dto.fulfillmentPricePerUnit ?? 0);

      const procurementModel: Procurement = {
        procurementNumber,
        procurementDate: new Date(dto.date),
        procurementAmount: dto.amount,
        procurementQuantity: dto.quantity,
        goodId,
        goodName,
        goodImage,
        logisticsDate: dto.logisticsDate ? new Date(dto.logisticsDate) : null,
        logisticsAmount: dto.logisticsAmount ? dto.logisticsAmount : 0,
        logisticsOtherExpenses: dto.logisticsOtherExpenses
          ? dto.logisticsOtherExpenses
          : 0,
        fulfillmentDate: null,
        fulfillmentQuantity: dto.fulfillmentQuantity ?? null,
        fulfillmentPricePerUnit: dto.fulfillmentPricePerUnit ?? null,
        nmId: dto.goodArticle ?? null,
        projectId: new Types.ObjectId(projectId),
        status: this.computeStatus(dto),
        totalExpenses,
        costPrice: totalExpenses / dto.quantity,
        supplies: [],
        attachedQuantity: 0,
        availableQuantity: dto.fulfillmentQuantity || dto.amount,
        attachmentStatus: ProcurementAttachmentStatus.UNATTACHED,
        dateAttachment: null,
        userId: new Types.ObjectId(userId),
      };

      const newProcurement = new this.procurementModel(procurementModel);

      await newProcurement.save({ session: procurementSession });

      const targetProject = await this.projectService.decreaseBalance(
        userId,
        {
          projectId,
          amount: dto.amount,
          goodId: dto.goodArticle ? undefined : goodId.toString(),
        },
        procurementSession
      );

      await this.balanceOperationService.create(
        userId,
        "procurement",
        {
          amount: dto.amount,
          toProjectId: projectId,
          toProjectName: targetProject.name,
        },
        { session: procurementSession }
      );

      await procurementSession.commitTransaction();
      return newProcurement;
    } catch (error) {
      await procurementSession.abortTransaction();
      throw error;
    } finally {
      await procurementSession.endSession();
    }
  }

  async updateMany(
    userId: string,
    data: {
      supplyId: string;
      supplyQuantityAttached: number;
      supplyQuantityAvailable: number;
      procurements: Array<{
        id: string;
        quantityAttached: number;
        quantityAvailable: number;
      }>;
    },
    session: ClientSession
  ) {
    try {
      const userIdObject = new Types.ObjectId(userId);
      const suplyIdObject = new Types.ObjectId(data.supplyId);
      const procurementsWithSupplyFromDb = await this.procurementModel.find({
        userId: userIdObject,
        "supplies._id": suplyIdObject,
      });

      const procurementsMap = data.procurements.reduce(
        (acc, currentElement) => {
          return acc.set(currentElement.id, currentElement);
        },
        new Map<
          string,
          {
            id: string;
            quantityAttached: number;
            quantityAvailable: number;
          }
        >()
      );

      const bulkOps = procurementsWithSupplyFromDb.map((procurement) => {
        const procurementFromParam = procurementsMap.get(
          procurement._id.toString()
        );
        let attachedQuantity = procurement.attachedQuantity;
        let availableQuantity = procurement.availableQuantity;

        if (
          procurementFromParam &&
          procurementFromParam.quantityAttached !== procurement.attachedQuantity
        ) {
          attachedQuantity = procurementFromParam.quantityAttached;
          availableQuantity = procurementFromParam.quantityAvailable;
        }

        return {
          updateOne: {
            filter: {
              _id: procurement.id,
              userId: userIdObject,
            },
            update: {
              $inc: {
                "supplies.$[supplies].procurementQuantityAttached":
                  -availableQuantity,
              },
              $set: {
                attachedQuantity,
                availableQuantity,
                attachmentStatus: this.computeAttachmentStatus(
                  attachedQuantity,
                  availableQuantity
                ),
                "supplies.$[supplies].supplyQuantityAttached":
                  data.supplyQuantityAttached,
                "supplies.$[supplies].supplyQuantityAvailable":
                  data.supplyQuantityAvailable,
              },
            },
            arrayFilters: [
              { "supplies._id": new Types.ObjectId(data.supplyId) },
            ],
            upsert: false,
          },
        };
      });

      const result = await this.procurementModel.bulkWrite(bulkOps, {
        session,
      });

      if (result.modifiedCount === 0) {
        console.log("No procurements were updated.");
      } else {
        console.log(`Updated ${result.modifiedCount} procurements.`);
      }
    } catch (error) {
      console.error("Error updating procurements:", error);
      throw new Error("Failed to update procurements");
    }
  }

  async attachSupply(
    userId: string,
    supply: {
      _id: Types.ObjectId;
      quantity: number;
      quantityAttached: number;
    },
    procurements: UpdateSupplyProcurementDto[],
    session: ClientSession
  ) {
    try {
      const newSupply = {
        _id: supply._id,
        supplyQuantity: supply.quantity,
        supplyQuantityAttached: supply.quantityAttached,
        supplyQuantityAvailable: supply.quantity - supply.quantityAttached,
      };

      console.log(procurements);

      const updates = procurements.map((procurement) => {
        const supplyToAttach: ProcurementSupply = {
          ...newSupply,
          procurementQuantityAttached: procurement.quantityAttached,
        };
        return {
          updateOne: {
            filter: {
              userId: new Types.ObjectId(userId),
              _id: new Types.ObjectId(procurement._id),
            },
            update: {
              $push: {
                supplies: supplyToAttach,
              },
              $inc: {
                attachedQuantity: procurement.quantityAttached,
                availableQuantity: -procurement.quantityAttached,
              },
              $set: {
                attachmentStatus: this.computeAttachmentStatus(
                  procurement.quantityAttached,
                  procurement.quantityAvailable
                ),
                dateAttachment: new Date(),
              },
            },
          },
        };
      });

      await this.procurementModel.bulkWrite(updates, { session });
    } catch (error) {
      console.error("Error attaching supplies:", error);
      throw new Error("Failed to attach supplies");
    }
  }

  async detachSupplies(
    userId: string,
    supplyId: string,
    data: {
      supplyQuantityAttached: number;
      supplyQuantityAvailable: number;
      procurements: UpdateSupplyProcurementDto[];
    },
    session: ClientSession
  ) {
    const userIdObject = new Types.ObjectId(userId);
    const suplyIdObject = new Types.ObjectId(supplyId);
    const procurementsWithSupply = await this.procurementModel.find({
      userId: new Types.ObjectId(userId),
      "supplies._id": suplyIdObject,
    });

    const procurementsForDetachSupply: ProcurementDocument[] = [];
    const procurementsForUpdateSupply: ProcurementDocument[] = [];
    procurementsWithSupply.forEach((procurement) => {
      if (
        data.procurements.some(({ _id }) =>
          new Types.ObjectId(_id).equals(procurement._id)
        )
      ) {
        procurementsForDetachSupply.push(procurement);
      } else {
        procurementsForUpdateSupply.push(procurement);
      }
    });

    try {
      const pullOperations = procurementsForDetachSupply.map((procurement) => {
        const { procurementQuantityAttached } = procurement.supplies.find(
          ({ _id }) => _id.equals(suplyIdObject)
        );

        return {
          updateOne: {
            filter: {
              userId: userIdObject,
              _id: new Types.ObjectId(procurement._id),
            },
            update: {
              $pull: {
                supplies: { _id: suplyIdObject },
              },
              $inc: {
                attachedQuantity: procurementQuantityAttached,
                availableQuantity: -procurementQuantityAttached,
              },
              $set: {
                dateAttachment: new Date(),
                attachmentStatus: ProcurementAttachmentStatus.UNATTACHED,
              },
            },
          },
        };
      });

      const setOperations = procurementsForUpdateSupply.map((procurement) => {
        return {
          updateOne: {
            filter: {
              userId: userIdObject,
              _id: new Types.ObjectId(procurement._id),
            },
            update: {
              $inc: {
                attachedQuantity: data.supplyQuantityAttached,
                availableQuantity: -data.supplyQuantityAttached,
              },
              $set: {
                "supplies.$[supplies].supplyQuantityAttached":
                  data.supplyQuantityAttached,
                "supplies.$[supplies].supplyQuantityAvailable":
                  data.supplyQuantityAvailable,
              },
            },
            arrayFilters: [
              {
                "supplies._id": new Types.ObjectId(supplyId),
              },
            ],
          },
        };
      });

      // First, perform the $pull operations
      await this.procurementModel.bulkWrite(pullOperations, { session });

      // Then, perform the $set operations
      await this.procurementModel.bulkWrite(setOperations, { session });
    } catch (error) {
      console.error("Error attaching supplies:", error);
      throw new Error("Failed to attach supplies");
    }
  }

  private computeStatus(dto: CreateProcurementDto): ProcurementStatus {
    if (!dto.logisticsDate || !dto.logisticsAmount) {
      return "purchased";
    }

    if (
      !dto.fulfillmentDate &&
      !dto.fulfillmentPricePerUnit &&
      !dto.fulfillmentQuantity
    ) {
      return "delivered";
    }

    return "await";
  }

  private computeAttachmentStatus(
    attachedQuantity: number,
    availableQuantity: number
  ): ProcurementAttachmentStatus {
    if (availableQuantity !== 0 && attachedQuantity !== 0) {
      return ProcurementAttachmentStatus.ATTACHED_PARTLY;
    } else if (availableQuantity === 0) {
      return ProcurementAttachmentStatus.ATTACHED;
    }

    return ProcurementAttachmentStatus.UNATTACHED;
  }
}
