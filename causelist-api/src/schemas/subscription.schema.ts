import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { User } from './user.schema.js';
import { ISubscription, SubscriptionTier } from '../interfaces/users.js';

export type SubscriptionDocument = HydratedDocument<Subscription>;

@Schema({
  timestamps: true,
})
export class Subscription implements ISubscription {
  @Prop()
  from: Date;

  @Prop()
  to: Date;

  @Prop({
    type: String,
    enum: SubscriptionTier,
  })
  tier: SubscriptionTier;

  @Prop()
  paid: number;

  @Prop()
  note?: string;

  @Prop({ required: true, type: 'ObjectId', ref: 'User', index: 1 })
  user: User;

  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);
