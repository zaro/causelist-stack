import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { User } from './user.schema.js';

export type OtpDocument = HydratedDocument<Otp>;

@Schema({ timestamps: true })
export class Otp {
  @Prop()
  phone: string;

  @Prop()
  code: string;

  @Prop()
  used: boolean;

  @Prop()
  expiresAt: Date;

  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;

  @Prop({ type: 'ObjectId', ref: () => User })
  user: User;
}

export const OtpSchema = SchemaFactory.createForClass(Otp);
