import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller.js';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Subscription,
  SubscriptionSchema,
} from '../schemas/subscription.schema.js';
import {
  PaymentTransaction,
  PaymentTransactionSchema,
} from '../schemas/payment-transaction.schema.js';
import { PaymentsService } from './payments.service.js';
import { PaymentApiService } from './base.payment-api.service.js';
import { IPayAfricaPaymentApiService } from './ipay-africa.payment-api.service.js';
import { HttpModule } from '@nestjs/axios';
import { UsersModule } from '../users/users.module.js';
import { Counter, CounterSchema } from '../schemas/counter.schema.js';
import { SubscriptionModule } from '../subscription/subscription.module.js';

@Module({
  imports: [
    HttpModule,
    UsersModule,
    SubscriptionModule,
    MongooseModule.forFeature([
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: PaymentTransaction.name, schema: PaymentTransactionSchema },
      { name: Counter.name, schema: CounterSchema },
    ]),
  ],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    {
      provide: PaymentApiService,
      useClass: IPayAfricaPaymentApiService,
    },
  ],
  exports: [PaymentApiService, PaymentsService],
})
export class PaymentsModule {}
