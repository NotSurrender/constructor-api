import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type BalanceOperationDocument = HydratedDocument<BalanceOperation>;

@Schema({
  versionKey: false,
  timestamps: { updatedAt: false },
  collection: "balance-operations",
})
export class BalanceOperation {
  @Prop({ required: true })
  type: string;

  @Prop({ required: true })
  amount: number;

  @Prop()
  fromProjectId: Types.ObjectId;

  @Prop()
  fromProjectName: string;

  @Prop({ required: true })
  toProjectId: Types.ObjectId;

  @Prop({ required: true })
  toProjectName: string;

  @Prop({ required: true })
  userId: Types.ObjectId;
}

export const BalanceOperationSchema =
  SchemaFactory.createForClass(BalanceOperation);
