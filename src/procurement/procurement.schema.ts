import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type ProcurementDocument = HydratedDocument<Procurement>;

@Schema({ versionKey: false })
export class ProcurementSupply {
  @Prop({ required: false })
  _id: Types.ObjectId;

  @Prop({ required: false })
  supplyQuantity: number;

  @Prop({ required: false })
  supplyQuantityAttached: number;

  @Prop({ required: false })
  supplyQuantityAvailable: number;

  @Prop({ required: false })
  procurementQuantityAttached: number;
}

@Schema({ versionKey: false, timestamps: true })
export class Procurement {
  @Prop({ required: true })
  procurementNumber: number;

  @Prop({ required: true })
  procurementDate: Date;

  @Prop({ required: true })
  procurementAmount: number;

  @Prop({ required: true })
  procurementQuantity: number;

  @Prop({ required: false })
  goodId: Types.ObjectId;

  @Prop({ required: false })
  goodName: string;

  @Prop({ required: false })
  goodImage: string;

  @Prop({ required: true })
  logisticsDate: Date | null;

  @Prop({ required: true })
  logisticsAmount: number;

  @Prop({ required: false })
  logisticsOtherExpenses: number;

  @Prop({ required: false })
  fulfillmentDate: Date | null;

  @Prop({ required: false })
  fulfillmentPricePerUnit: number;

  @Prop({ required: false })
  fulfillmentQuantity: number;

  @Prop({ required: true })
  nmId: number;

  @Prop({ required: true })
  status: string;

  @Prop({ required: false })
  totalExpenses: number;

  @Prop({ required: false })
  costPrice: number;

  @Prop({ required: false })
  supplies: ProcurementSupply[];

  @Prop({ required: false })
  availableQuantity: number;

  @Prop({ required: false })
  attachedQuantity: number;

  @Prop({ required: false })
  attachmentStatus: string;

  @Prop({ required: false })
  dateAttachment: Date | null;

  @Prop({ required: true })
  projectId: Types.ObjectId;

  @Prop({ required: true })
  userId: Types.ObjectId;
}

export const ProcurementSchema = SchemaFactory.createForClass(Procurement);
