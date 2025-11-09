import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type SaleDocument = HydratedDocument<Sale>;

@Schema({ versionKey: false })
export class Sale {
  @Prop({ required: true })
  nmId: number;

  @Prop()
  docTypeName: string;

  @Prop({ required: true })
  quantity: number;

  @Prop({ required: true })
  saleDt: string;

  @Prop({ required: true })
  shkId: number;

  @Prop({ required: true })
  retailPrice: number;

  @Prop({ required: true })
  retailPriceWithdiscRub: number;

  @Prop({ required: true })
  ppvzForPay: number;

  @Prop({ required: true })
  deliveryRub: number;

  @Prop({ required: true })
  penalty: number;

  @Prop()
  srid: string;

  @Prop({ required: true })
  incomeId: number;

  @Prop({ required: true })
  userId: Types.ObjectId;
}

export const SaleSchema = SchemaFactory.createForClass(Sale);
