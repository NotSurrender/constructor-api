export type ReportType = 1 | 2;

export interface WbApiSale {
  date: string;
  lastChangeDate: string;
  warehouseName: string;
  countryName: string;
  oblastOkrugName: string;
  regionName: string;
  supplierArticle: string;
  nmId: number;
  barcode: string;
  category: string;
  subject: string;
  brand: string;
  techSize: string;
  incomeId: number;
  isSupply: boolean;
  isRealization: boolean;
  totalPrice: number;
  discountPercent: number;
  spp: number;
  paymentSaleAmount: number;
  forPay: number;
  finishedPrice: number;
  priceWithDisc: number;
  saleID: string;
  orderType: string;
  sticker: string;
  gNumber: string;
  srid: string;
}

export interface WbApiSaleFromReport {
  realizationreport_id: number;
  date_from: string;
  date_to: string;
  create_dt: string;
  currency_name: string;
  suppliercontract_code: null;
  rrd_id: number;
  gi_id: number;
  subject_name: string;
  nm_id: number;
  brand_name: string;
  sa_name: string;
  ts_name: string;
  barcode: string;
  doc_type_name: string;
  quantity: number;
  retail_price: number;
  retail_amount: number;
  sale_percent: number;
  commission_percent: number;
  office_name: string;
  supplier_oper_name: string;
  order_dt: string;
  sale_dt: string;
  rr_dt: string;
  shk_id: number;
  retail_price_withdisc_rub: number;
  delivery_amount: number;
  return_amount: number;
  delivery_rub: number;
  gi_box_type_name: string;
  product_discount_for_report: number;
  supplier_promo: number;
  rid: number;
  ppvz_spp_prc: number;
  ppvz_kvw_prc_base: number;
  ppvz_kvw_prc: number;
  sup_rating_prc_up: number;
  is_kgvp_v2: number;
  ppvz_sales_commission: number;
  ppvz_for_pay: number;
  ppvz_reward: number;
  acquiring_fee: number;
  acquiring_bank: string;
  ppvz_vw: number;
  ppvz_vw_nds: number;
  ppvz_office_id: number;
  ppvz_office_name: string;
  ppvz_supplier_id: number;
  ppvz_supplier_name: string;
  ppvz_inn: string;
  declaration_number: string;
  bonus_type_name: string;
  sticker_id: string;
  site_country: string;
  penalty: number;
  additional_payment: number;
  rebill_logistic_cost: number;
  rebill_logistic_org: string;
  kiz: string;
  storage_fee: number;
  deduction: number;
  acceptance: number;
  srid: string;
  report_type: ReportType;
}

export interface WbApiStock {
  lastChangeDate: string;
  warehouseName: string;
  supplierArticle: string;
  nmId: number;
  barcode: string;
  quantity: number;
  inWayToClient: number;
  inWayFromClient: number;
  quantityFull: number;
  category: string;
  subject: string;
  brand: string;
  techSize: string;
  Price: number;
  Discount: number;
  isSupply: boolean;
  isRealization: boolean;
  SCCode: string;
}

export interface WbSale {
  nmId: number;
  docTypeName: string;
  quantity: number;
  saleDt: string;
  shkId: number;
  retailPrice: number;
  retailPriceWithdiscRub: number;
  ppvzForPay: number;
  deliveryRub: number;
  penalty: number;
  srid: string;
  giId: number;
}

export type AdCampaignStatus = 4 | 7 | 8 | 9 | 11;

export type AdCampaignType = 4 | 5 | 6 | 7 | 8 | 9;

export interface WbApiAdCost {
  updNum: number;
  updTime: string;
  updSum: number;
  advertId: number;
  campName: string;
  advertType: AdCampaignType;
  paymentType: string;
  advertStatus: AdCampaignStatus;
}

export interface WbAdCostData
  extends Pick<WbApiAdCost, "advertId" | "campName" | "updTime" | "updSum"> {
  nmId: number;
}

export interface WbCampaignAutoParams {
  nms: number[] | null;
}

export interface WbApiAdCampaignInfo {
  advertId: number;
  name: string;
  type: AdCampaignType;
  status: AdCampaignStatus;
  dailyBudget: number;
  createTime: string;
  changeTime: string;
  startTime: string;
  endTime: string;
  autoParams: WbCampaignAutoParams;
  searchPluseState: boolean;
}

export type WbApiAdCampaignsInfoResponse = WbApiAdCampaignInfo[];

export interface WbCardPhoto {
  big: string;
  c246x328: string;
  c516x688: string;
  square: string;
  tm: string;
}

export interface WbCardDimension {
  length: number;
  width: number;
  height: number;
  isValid: boolean;
}

export interface WbCardCharacteristic {
  id: number;
  name: string;
  value: string;
}

export interface WbCardSize {
  chrtID: number;
  techSize: string;
  wbSize: string;
  skus: string[];
}

export type WbCardTagColor =
  | "D1CFD7"
  | "FEE0E0"
  | "ECDAFF"
  | "E4EAFF"
  | "DEF1DD"
  | "FFECC7";

export interface WbCardTag {
  id: number;
  name: string;
  color: WbCardTagColor;
}

export interface WbCard {
  nmID: number;
  imtID: number;
  nmUUID: string;
  subjectID: number;
  subjectName: string;
  vendorCode: string;
  brand: string;
  title: string;
  description: string;
  photos: WbCardPhoto[];
  video: string;
  dimensions: WbCardDimension[];
  characteristic: WbCardCharacteristic[];
  sizes: WbCardSize[];
  tags: WbCardTag[];
  createdAt: string;
  updatedAt: string;
}

export interface WbApiCardsResponseCursor {
  updatedAt: string;
  nmId: number;
  total: number;
}
export interface WbApiCardsResponseData {
  cards: WbCard[];
  cursor: WbApiCardsResponseCursor;
}

export interface WbApiCardsRequestCursor {
  limit?: number;
  updatedAt?: string;
  nmId?: number;
}

export interface WbApiSupply {
  incomeId: number;
  number: string;
  date: string;
  lastChangeDate: string;
  supplierArticle: string;
  techSize: string;
  barcode: string;
  quantity: number;
  totalPrice: number;
  dateClose: string;
  warehouseName: string;
  nmId: number;
  status: string;
}
