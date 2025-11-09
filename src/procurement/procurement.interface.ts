import { ProcurementDocument } from "./procurement.schema";

export type ProcurementResponseDocument = Omit<ProcurementDocument, "userId">;

export type ProcurementStatus =
  | "active"
  | "inline"
  | "purchased"
  | "delivered"
  | "await"
  | "sold";

export enum ProcurementAttachmentStatus {
  UNATTACHED = "unattached",
  ATTACHED_PARTLY = "attachedPartly",
  ATTACHED = "attached",
}
