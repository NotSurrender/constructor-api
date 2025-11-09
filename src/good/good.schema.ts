import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type GoodDocument = HydratedDocument<Good>;

@Schema({
  versionKey: false,
})
export class Good {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop()
  nmId?: number;

  @Prop()
  image?: string;

  @Prop({ required: true })
  projectId: Types.ObjectId;

  @Prop({ required: true })
  userId: Types.ObjectId;
}

export const GoodSchema = SchemaFactory.createForClass(Good);
