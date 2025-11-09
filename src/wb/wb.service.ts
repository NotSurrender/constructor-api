import { Inject, Injectable, Logger, UseInterceptors } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import {
  API_URL,
  CARDS_CHUNK_SIZE,
  CARDS_MAX_SIZE_PER_REQUEST,
} from "./wb.constants";
import {
  WbApiAdCost,
  WbAdCostData,
  WbApiSaleFromReport,
  WbSale,
  WbApiAdCampaignsInfoResponse,
  WbApiCardsResponseData,
  WbApiCardsRequestCursor,
  WbApiStock,
  WbApiSale,
  WbApiSupply,
} from "./wb.interface";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";

@Injectable()
export class WbService {
  constructor(
    private readonly httpService: HttpService,
    @Inject(CACHE_MANAGER) private cacheService: Cache
  ) {}

  async getSales(dateFrom: string, token: string): Promise<WbApiSale[]> {
    const cachedData = await this.cacheService.get<WbApiSale[]>(token);

    if (cachedData) {
      return cachedData;
    }

    try {
      const { data } = await this.httpService.axiosRef.get<WbApiSale[] | null>(
        API_URL.statistics.sales,
        {
          params: {
            dateFrom,
          },
          headers: {
            Authorization: token,
          },
        }
      );

      await this.cacheService.set(token, data);

      if (!data) {
        return [];
      }

      return data;
    } catch (error) {
      Logger.error(error);
    }
  }

  async getSalesFromReport(dateFrom: string, dateTo: string, token: string) {
    try {
      const { data } = await this.httpService.axiosRef.get<
        WbApiSaleFromReport[] | null
      >(API_URL.statistics.salesFromReport, {
        params: {
          dateFrom,
          dateTo,
        },
        headers: {
          Authorization: token,
        },
      });

      if (!data) {
        return [];
      }

      return data
        .filter(({ nm_id }) => nm_id)
        .map(this.mapWbApiSaleFromReportToWbSaleData);
    } catch (error) {
      Logger.error(error);
    }
  }

  async getStocks(dateFrom: string, token: string): Promise<WbApiStock[]> {
    const { data } = await this.httpService.axiosRef.get(
      API_URL.statistics.stocks,
      {
        params: {
          dateFrom,
        },
        headers: {
          Authorization: token,
        },
      }
    );
    return data;
  }

  async getAdCostHistory(
    dateFrom: string,
    dateTo: string,
    token: string
  ): Promise<WbAdCostData[]> {
    try {
      const { data } = await this.httpService.axiosRef.get<WbApiAdCost[]>(
        API_URL.ad.costHistory,
        {
          params: {
            from: dateFrom,
            to: dateTo,
          },
          headers: {
            Authorization: token,
          },
        }
      );

      if (data.length) {
        // const campaignIds: number[] = Array.from(
        //   new Set(data.map(({ advertId }) => advertId)),
        // );

        // const adCampaignsInfo = await this.getAdCampaignsInfo(
        //   campaignIds,
        //   token,
        // );

        // console.log(adCampaignsInfo);
        // const adCampaignsInfoMap = adCampaignsInfo.reduce<
        //   Record<number, WbApiAdCampaignInfo>
        // >((acc, currElem) => {
        //   if (currElem.autoParams.nms && currElem.autoParams.nms.length) {
        //     acc[currElem.advertId] = currElem;
        //   }
        //   return acc;
        // }, {});

        return data.map<WbAdCostData>((adCampaign) => {
          return {
            advertId: adCampaign.advertId,
            campName: adCampaign.campName,
            updSum: adCampaign.updSum,
            updTime: adCampaign.updTime,
            nmId: 1111,
          };
        });
      }

      return [];
    } catch (error) {
      Logger.error(error);
    }
  }

  async getAdCampaignsInfo(
    campaignIds: number[],
    token: string
  ): Promise<WbApiAdCampaignsInfoResponse> {
    try {
      const { data } =
        await this.httpService.axiosRef.post<WbApiAdCampaignsInfoResponse>(
          API_URL.ad.campaignsInfo,
          campaignIds,
          {
            headers: {
              Authorization: token,
            },
          }
        );
      return data;
    } catch (error) {
      Logger.error(error);
    }
  }

  async getCards(
    token: string,
    filters?: { size?: number; textSearch?: string }
  ): Promise<WbApiCardsResponseData> {
    try {
      const size = filters?.size
        ? filters.size * CARDS_CHUNK_SIZE
        : CARDS_MAX_SIZE_PER_REQUEST;

      const cursor: WbApiCardsRequestCursor = {
        limit: filters?.size
          ? filters.size * CARDS_CHUNK_SIZE
          : CARDS_MAX_SIZE_PER_REQUEST,
      };

      const response: WbApiCardsResponseData = {
        cards: [],
        cursor: {
          nmId: 0,
          total: 0,
          updatedAt: "",
        },
      };

      const filter: Record<string, unknown> = {
        withPhoto: -1,
      };

      if (filters?.textSearch) {
        filter.textSearch = filters.textSearch;
      }

      for (let i = 0; i <= size; i += CARDS_MAX_SIZE_PER_REQUEST) {
        if (i > CARDS_MAX_SIZE_PER_REQUEST) {
          cursor.updatedAt = response.cursor.updatedAt;
          cursor.nmId = response.cursor.nmId;
        }

        const { data } =
          await this.httpService.axiosRef.post<WbApiCardsResponseData>(
            API_URL.content.cards,
            {
              settings: {
                cursor,
                filter,
              },
            },
            {
              headers: {
                Authorization: token,
              },
            }
          );

        response.cards.push(...data.cards);
        response.cursor = data.cursor;

        if (response.cursor.total < size) {
          break;
        }
      }
      return response;
    } catch (error) {
      Logger.error(error);
    }
  }

  async getSupplies(token: string, dateFrom: string): Promise<WbApiSupply[]> {
    try {
      const { data } = await this.httpService.axiosRef.get<WbApiSupply[]>(
        API_URL.statistics.supplies,
        {
          params: {
            dateFrom,
          },
          headers: {
            Authorization: token,
          },
        }
      );
      return data;
    } catch (error) {
      Logger.error(error);
    }
  }

  private mapWbApiSaleFromReportToWbSaleData(
    sale: WbApiSaleFromReport
  ): WbSale {
    return {
      nmId: sale.nm_id,
      docTypeName: sale.doc_type_name,
      quantity: sale.quantity,
      saleDt: sale.sale_dt,
      shkId: sale.shk_id,
      retailPrice: sale.retail_price,
      retailPriceWithdiscRub: sale.retail_price_withdisc_rub,
      ppvzForPay: sale.ppvz_for_pay,
      deliveryRub: sale.delivery_rub,
      penalty: sale.penalty,
      srid: sale.srid,
      giId: sale.gi_id,
    };
  }
}
