import { Get, Injectable, Logger, Query, UseGuards } from "@nestjs/common";
import { WbService } from "src/wb/wb.service";
import { Cron } from "@nestjs/schedule";
import { AuthService } from "src/auth/auth.service";
import { InjectModel } from "@nestjs/mongoose";
import { FilterQuery, Model, Types } from "mongoose";
import * as dayjs from "dayjs";
import { Sale } from "./sale.schema";
import { DATE_FORMAT } from "src/common";
import { UserDocument } from "src/auth/user.schema";
import { CRON_CONFIG } from "./sale.constants";
import { ProjectService } from "src/project/project.service";
import { ReducedSaleWithCount, SaleResponseDocument } from "./sale.interface";
import { JwtAuthGuard } from "src/auth/guards/jwt.guard";
import { UserId } from "src/decorators/user-id.decorator";
import { IntValidationPipe } from "src/pipes/int-validation.pipe";

interface FindFilters {
  userId: Types.ObjectId;
  goodId?: Types.ObjectId | string[];
}

@Injectable()
export class SaleService {
  private readonly logger = new Logger(SaleService.name);

  constructor(
    @InjectModel(Sale.name) private saleModel: Model<Sale>,
    private readonly wbService: WbService,
    private readonly authSerivce: AuthService,
    private readonly projectService: ProjectService
  ) {}

  async find(
    userId: string,
    filter?: {
      nmId?: number;
      withReturns?: boolean;
    }
  ): Promise<SaleResponseDocument[]> {
    const filterQuery: FilterQuery<Sale> = {
      userId: new Types.ObjectId(userId),
      docTypeName: "продажа",
      retailPrice: { $ne: 0 },
      quantity: { $ne: 0 },
    };

    if (filter?.nmId) {
      filterQuery.nmId = filter.nmId;
    }

    if (filter?.withReturns) {
      filterQuery.docTypeName = ["продажа", "возврат"];
    }

    return this.saleModel
      .find(
        filterQuery,
        { userId: 0 },
        {
          sort: { saleDt: -1 },
        }
      )
      .exec();
  }

  async count(userId: string, nmId: number): Promise<number> {
    return this.saleModel.countDocuments({
      userId: new Types.ObjectId(userId),
      nmId,
    });
  }

  async findWithCount(
    userId: string,
    nmId: number
  ): Promise<ReducedSaleWithCount[]> {
    return this.saleModel
      .aggregate([
        {
          $match: {
            userId: new Types.ObjectId(userId),
            nmId,
          },
        },
        {
          $group: {
            _id: "$goodId",
            saleName: { $first: "$saName" },
            saleCount: { $count: {} },
          },
        },
      ])
      .exec();
  }

  // async findById(userId: string, id: string): Promise<SaleResponseDocument> {
  //   return this.saleModel
  //     .findById(
  //       { _id: new Types.ObjectId(id), userId: new Types.ObjectId(userId) },
  //       projection
  //     )
  //     .exec();
  // }

  @Cron(CRON_CONFIG)
  async handleCron(): Promise<void> {
    const users = await this.authSerivce.find();
    const wednesday = dayjs();
    const monday = wednesday.subtract(9, "day").format(DATE_FORMAT);
    const sunday = wednesday.subtract(3, "day").format(DATE_FORMAT);

    await this.updateSalesFromWbSales(monday, sunday, users);
    this.logger.debug("Cron was called");
  }

  async updateSalesFromWbSales(
    dateFrom: string,
    dateTo: string,
    users: UserDocument[]
  ): Promise<void> {
    for (const user of users) {
      const newSales = await this.wbService.getSalesFromReport(
        dateFrom,
        dateTo,
        user.wbTokenStatistics
      );

      const projects = await this.projectService.find(user.id);

      const newSalesModels = newSales.map<Sale>((sale) => {
        const project = projects.find((project) =>
          project.goodIds.some(
            (goodId) => goodId.toString() === String(sale.nmId)
          )
        );
        return {
          nmId: sale.nmId,
          docTypeName: sale.docTypeName,
          quantity: sale.quantity,
          saleDt: sale.saleDt,
          shkId: sale.shkId,
          retailPrice: sale.retailPrice,
          retailPriceWithdiscRub: sale.retailPriceWithdiscRub,
          ppvzForPay: sale.ppvzForPay,
          deliveryRub: sale.deliveryRub,
          penalty: sale.penalty,
          projectId: project?.id ?? null,
          srid: sale.srid,
          incomeId: sale.giId,
          userId: user._id,
        };
      });

      await this.saleModel.create(newSalesModels);
    }
  }
}
