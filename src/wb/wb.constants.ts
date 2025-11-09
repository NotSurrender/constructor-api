const API_ROOT_ADVERTISEMENT = "https://advert-api.wb.ru/adv";

const API_ROOT_STATISTICS = "https://statistics-api.wildberries.ru/api";

const API_ROOT_CONTENT = "https://content-api.wildberries.ru/content";

export const API_URL = {
  statistics: {
    sales: API_ROOT_STATISTICS + "/v1/supplier/sales",
    supplies: API_ROOT_STATISTICS + "/v1/supplier/incomes",
    salesFromReport: API_ROOT_STATISTICS + "/v5/supplier/reportDetailByPeriod",
    stocks: API_ROOT_STATISTICS + "/v1/supplier/stocks",
  },
  ad: {
    costHistory: API_ROOT_ADVERTISEMENT + "/v1/upd",
    campaignsInfo: API_ROOT_ADVERTISEMENT + "/v1/promotion/adverts",
  },
  content: {
    cards: API_ROOT_CONTENT + "/v2/get/cards/list",
  },
};

export const CARDS_MAX_SIZE_PER_REQUEST = 100;
export const CARDS_CHUNK_SIZE = 10;
