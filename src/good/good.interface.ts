export interface UnallocatedGood {
  name: string;
  image: string;
  nmId: number;
}

export interface UnallocatedIncome {
  name: string;
  nmId: string;
}

export interface BalancePurchase {
  id: string;
  count: number;
  quantity: number;
  saleCount: number;
  remainingQuantity: number;
  remainingMoney: number;
}

export interface BalanceResponseData {
  goodName: string;
  goodId: number;
  totalQuantity: number;
  totalSalesCount: number;
  totalRemainingQuantity: number;
  purchases: BalancePurchase[];
}
