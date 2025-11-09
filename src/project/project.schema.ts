import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type ProjectDocument = HydratedDocument<Project>;

@Schema({
  versionKey: false,
  timestamps: true,
})
export class Project {
  @Prop({ required: true, type: String })
  name: string;

  @Prop({ required: true, type: String })
  color: string;

  @Prop({ required: true, type: [Types.ObjectId] })
  goodIds: Types.ObjectId[];

  @Prop({ required: true, type: Number })
  balance: number;

  @Prop({ required: true, type: Number })
  numberGoodsOnTheWay: number;

  @Prop({ required: true, type: Types.ObjectId })
  userId: Types.ObjectId;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);
