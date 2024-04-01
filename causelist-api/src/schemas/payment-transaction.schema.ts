import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { User } from './user.schema.js';
import { PaymentStatus } from '../interfaces/payments.js';

export type PaymentTransactionDocument = HydratedDocument<PaymentTransaction>;

@Schema({
  timestamps: true,
})
export class PaymentTransaction {
  id: string;

  @Prop()
  sid: string;

  @Prop({ index: 1 })
  orderId: string;

  @Prop()
  packageId: string;

  @Prop()
  amount: number;

  @Prop()
  phone: string;

  @Prop()
  email: string;

  @Prop({ type: String })
  status: PaymentStatus;

  @Prop({ type: Object })
  receivedEvent: any;

  @Prop({ required: true, type: 'ObjectId', ref: 'User', index: 1 })
  user: User;

  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
}

export const PaymentTransactionSchema =
  SchemaFactory.createForClass(PaymentTransaction);
