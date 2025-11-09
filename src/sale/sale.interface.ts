import { SaleDocument } from './sale.schema';

export type SaleResponseDocument = Omit<SaleDocument, 'userId'>;

export interface ReducedSaleWithCount {
  _id: number;
  saleName: string;
  saleCount: number;
}
