import { BalanceOperationDocument } from "./balance-operation.schema";

export type BalanceOperationType =
  | "investition"
  | "withdrawal"
  | "transfer"
  | "procurement";

export type BalanceOperationResponseDocument = Omit<
  BalanceOperationDocument,
  "userId"
>;
