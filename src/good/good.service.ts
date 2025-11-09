import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { UnallocatedGood } from "./good.interface";
import { SaleService } from "src/sale/sale.service";
import { Good, GoodDocument } from "./good.schema";
import { InjectModel } from "@nestjs/mongoose";
import {
  FilterQuery,
  Model,
  ProjectionType,
  SaveOptions,
  Types,
} from "mongoose";
import { WbService } from "src/wb/wb.service";
import { AuthService } from "src/auth/auth.service";
import { ProcurementService } from "src/procurement/procurement.service";
import * as dayjs from "dayjs";
import { UserDocument } from "src/auth/user.schema";

const projection: ProjectionType<Good> = {
  userId: 0,
  createdAt: 0,
  updatedAt: 0,
};

@Injectable()
export class GoodService {
  constructor(
    @InjectModel(Good.name) private goodModel: Model<Good>,
    @Inject(forwardRef(() => ProcurementService))
    private readonly procurementService: ProcurementService,
    private readonly saleService: SaleService,
    private readonly wbSerivce: WbService,
    private readonly authService: AuthService
  ) {}

  async find(
    userId: string,
    projectId?: string,
    filters?: { query?: string }
  ): Promise<GoodDocument[]> {
    const filterQuery: FilterQuery<Good> = {
      userId: new Types.ObjectId(userId),
      projectId: new Types.ObjectId(projectId),
    };

    if (filters?.query) {
      filterQuery.$text.$search = filters.query;
    }

    return this.goodModel.find(filterQuery, { userId: 0 }).exec();
  }

  async findById(userId: string, goodId: string) {
    return this.goodModel
      .findById(
        { _id: new Types.ObjectId(goodId), userId: new Types.ObjectId(userId) },
        projection
      )
      .exec();
  }

  async getGoodDetails(userId: string, goodId: string) {
    const good = await this.findById(userId, goodId);
    const user = await this.authService.findUserById(userId);

    const { weekSales, weekReturns } = await this.getWeekSalesAndReturns(
      user.wbTokenStatistics,
      good.nmId
    );

    const goodSales = await this.saleService.find(userId, {
      nmId: good.nmId,
    });

    let totalSales = goodSales.length;

    if (goodSales[0]?.saleDt) {
      const lastSalesFromReportDate = new Date(
        goodSales[0]?.saleDt
      ).toLocaleDateString();

      const lastDaySales = goodSales.filter((sale) => {
        return (
          lastSalesFromReportDate === new Date(sale.saleDt).toLocaleDateString()
        );
      });

      const latestSales = await this.wbSerivce.getSales(
        goodSales?.[0].saleDt,
        user.wbTokenStatistics
      );

      const goodLatestSales = latestSales.filter(
        ({ nmId, srid, finishedPrice }) =>
          finishedPrice &&
          nmId === good.nmId &&
          !lastDaySales.some((sale) => srid === sale.srid)
      );

      totalSales += goodLatestSales.length;
    }

    const stocks = await this.getStocksAmount(user, good);

    const procurementTotalExpenses =
      await this.procurementService.getTotalExpenses(userId, good.nmId);

    const costPrice =
      procurementTotalExpenses.reduce(
        (acc, currentElement) => acc + currentElement.totalExpenses,
        0
      ) / procurementTotalExpenses.length;

    const frozenMoney = costPrice * stocks;

    return {
      weekSales,
      weekReturns,
      totalSales,
      stocks,
      frozenMoney,
    };
  }

  async findOne(
    userId: string,
    projectId: string,
    filters: {
      goodName?: string;
      nmId?: number;
    }
  ): Promise<GoodDocument | null> {
    const filterQuery: FilterQuery<Good> = {
      userId: new Types.ObjectId(userId),
      projectId: new Types.ObjectId(projectId),
    };

    if (filters.goodName) {
      filterQuery.name = filters.goodName;
    }

    if (filters.nmId) {
      filterQuery.nmId = filters.nmId;
    }

    return this.goodModel.findOne(filterQuery, projection).exec();
  }

  async findUnallocatedGoods(
    userId: string,
    filters?: { size?: number }
  ): Promise<UnallocatedGood[]> {
    const user = await this.authService.findUserById(userId);
    const goods = await this.goodModel
      .find({
        userId: new Types.ObjectId(userId),
      })
      .exec();

    const { cards } = await this.wbSerivce.getCards(
      user.wbTokenPromotionAndAnalytics,
      filters
    );

    const goodIds = goods.map((good) => good.nmId);
    return cards
      .filter(({ nmID }) => !goodIds.includes(nmID))
      .map((good) => ({
        name: good.vendorCode,
        image: good.photos?.[0].c246x328,
        nmId: good.nmID,
      }));
  }

  async create(
    userId: string,
    data: { name: string; projectId: string; nmId?: number; image?: string },
    saveOptions?: SaveOptions
  ): Promise<GoodDocument> {
    const goodModel: Good = {
      name: data.name,
      projectId: new Types.ObjectId(data.projectId),
      userId: new Types.ObjectId(userId),
    };

    if (data.nmId) {
      goodModel.nmId = data.nmId;
    }

    if (data.image) {
      goodModel.image = data.image;
    }

    const newGood = new this.goodModel(goodModel);

    return newGood.save(saveOptions);
  }

  async countUnallocated(userId: string): Promise<number> {
    const user = await this.authService.findUserById(userId);

    const response = await this.wbSerivce.getCards(
      user.wbTokenPromotionAndAnalytics
    );

    const allnNmIds = response.cards.map(({ nmID }) => nmID);
    const allocatedGoods = await this.goodModel.countDocuments({
      userId: new Types.ObjectId(userId),
      nmId: allnNmIds,
    });

    return response.cursor.total - allocatedGoods;
  }

  async getWeekSalesAndReturns(wbTokenStatistics: string, nmId: number) {
    const today = dayjs();
    const dateFrom = today.subtract(7, "days");
    const wbSales = await this.wbSerivce.getSales(
      dateFrom.toISOString(),
      wbTokenStatistics
    );

    let salesCounter = 0;
    let returnCounter = 0;

    wbSales.forEach((sale) => {
      if (sale.nmId === nmId) {
        if (sale.orderType === "Клиентский") {
          salesCounter++;
        } else {
          returnCounter++;
        }
      }
    });

    return {
      weekSales: salesCounter,
      weekReturns: returnCounter,
    };
  }

  async getStocksAmount(user: UserDocument, good: GoodDocument) {
    const procurementsOnTheWay = await this.procurementService.find(
      user._id.toString(),
      {
        goodId: good._id.toString(),
        status: ["purchased", "delivered", "await"],
      }
    );

    const wbStocks = await this.wbSerivce.getStocks(
      dayjs(user.createdAt).toISOString(),
      user.wbTokenStatistics
    );

    const filteredWbStocksAmount = wbStocks
      .filter((stock) => {
        return stock.nmId === good.nmId;
      })
      .reduce((acc, currentElement) => {
        return acc + currentElement.quantityFull;
      }, 0);

    const amountOfGoodsOnTheWay = procurementsOnTheWay.reduce(
      (acc, currentElement) => {
        switch (currentElement.status) {
          case "purchased":
          case "delivered":
            return acc + currentElement.procurementQuantity;

          case "await":
            return acc + currentElement.fulfillmentQuantity;
        }
      },
      0
    );

    return amountOfGoodsOnTheWay + filteredWbStocksAmount;
  }

  // async getBalances(
  //   userId: string,
  //   projectId?: string
  // ): Promise<BalanceResponseData[]> {
  //   const salesWithCounts = await this.saleService.findWithCount(userId);

  //   const salesAndCountsMap = salesWithCounts.reduce(
  //     reduceCallbackForMap("_id"),
  //     new Map<number, ReducedSaleWithCount>()
  //   );

  //   const purchases = await this.purchaseService.find(userId, projectId);
  //   const balancesMap = new Map<number, BalanceResponseData>();

  //   purchases.forEach((purchase) => {
  //     if (salesAndCountsMap.has(purchase.goodId)) {
  //       const { saleName, saleCount } = salesAndCountsMap.get(purchase.goodId);

  //       const remainingQuantity = purchase.quantity - saleCount;

  //       const remainingMoney = purchase.costPrice * remainingQuantity;
  //       const newPurchase: BalancePurchase = {
  //         id: purchase._id.toString(),
  //         count: purchase.count,
  //         quantity: purchase.quantity,
  //         saleCount,
  //         remainingQuantity,
  //         remainingMoney,
  //       };

  //       if (saleCount < purchase.quantity) {
  //         if (balancesMap.has(purchase.goodId)) {
  //           const balance = balancesMap.get(purchase.goodId);
  //           balance.totalQuantity += purchase.quantity;
  //           balance.totalSalesCount += saleCount;
  //           balance.totalRemainingQuantity += remainingQuantity;
  //           balance.purchases.push(newPurchase);
  //         } else {
  //           balancesMap.set(purchase.goodId, {
  //             goodName: saleName,
  //             goodId: purchase.goodId,
  //             totalQuantity: purchase.quantity,
  //             totalSalesCount: saleCount,
  //             totalRemainingQuantity: remainingQuantity,
  //             purchases: [newPurchase],
  //           });
  //         }
  //         return true;
  //       }
  //     }
  //   });

  //   return Array.from(balancesMap.values());
  // }
}
