import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type UserDocument = HydratedDocument<User>;

@Schema({
  versionKey: false,
  timestamps: { updatedAt: false },
})
export class User {
  @Prop({ unique: true })
  email: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  avatar: string;

  @Prop({ required: true })
  wbTokenStatistics: string;

  @Prop({ required: true })
  wbTokenPromotionAndAnalytics: string;

  @Prop({ required: true })
  wbContentToken: string;

  @Prop()
  createdAt: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
