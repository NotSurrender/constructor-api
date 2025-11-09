import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type AdvertDocument = HydratedDocument<Advert>;

@Schema({ versionKey: false })
export class Advert {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  period: string;

  @Prop({ required: true })
  goodId: number;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  projectId: Types.ObjectId;

  @Prop({ required: true })
  projectName: string;

  @Prop({ required: true })
  userId: Types.ObjectId;
}

export const AdvertSchema = SchemaFactory.createForClass(Advert);
