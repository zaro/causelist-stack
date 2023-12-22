import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { User } from './user.schema.js';

export type OtpDocument = HydratedDocument<Otp>;

@Schema({ timestamps: true })
export class Otp {
  @Prop({ required: true })
  phone: string;

  @Prop({ required: true })
  code: string;

  @Prop({ required: true })
  used: boolean;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;

  @Prop({ required: true, type: 'ObjectId', ref: 'User' })
  user: User;
}

export const OtpSchema = SchemaFactory.createForClass(Otp);
