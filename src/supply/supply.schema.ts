import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { SupplyStatus } from "./supply.interface";

export type SupplyDocument = HydratedDocument<Supply>;

@Schema({ versionKey: false })
export class SupplyProcurement {
  @Prop({ required: true })
  _id: Types.ObjectId;

  @Prop({ required: true })
  number: number;

  @Prop({ required: true })
  quantity: number;

  @Prop({ required: true })
  quantityAttached: number;

  @Prop({ required: true })
  quantityAvailable: number;

  @Prop({ required: true })
  costPrice: number;
}

@Schema({
  versionKey: false,
})
export class Supply {
  @Prop({ required: true })
  warehouseName: string;

  @Prop({ required: true })
  goodId: Types.ObjectId;

  @Prop({ required: true })
  nmId: number;

  @Prop({ required: true, unique: true })
  supplyId: number;

  @Prop({ required: true })
  date: string;

  @Prop({ required: true })
  procurements: SupplyProcurement[];

  @Prop({ required: true })
  quantity: number;

  @Prop({ required: true })
  quantityAttached: number;

  @Prop({ required: true })
  quantityAvailable: number;

  @Prop({ requited: true })
  status: SupplyStatus;

  @Prop({ required: true })
  userId: Types.ObjectId;
}

export const SupplySchema = SchemaFactory.createForClass(Supply);
