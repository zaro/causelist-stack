import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PaymentTransaction } from '../schemas/payment-transaction.schema.js';
import { PaymentStatus } from '../interfaces/payments.js';
import { PACKAGES, SubscriptionPackage } from '../interfaces/packages.js';
import { SubscriptionService } from '../subscription/subscription.service.js';
import { Counter } from '../schemas/counter.schema.js';
import type { CounterWithStatics } from '../schemas/counter.schema.js';

@Injectable()
export class PaymentsService {
  protected logger = new Logger(PaymentsService.name);
  constructor(
    protected subscriptionService: SubscriptionService,
    @InjectModel(PaymentTransaction.name)
    protected paymentTransactionModel: Model<PaymentTransaction>,
    @InjectModel(Counter.name)
    protected counterModel: CounterWithStatics,
  ) {}

  async newOrderId(): Promise<string> {
    const orderId = await this.counterModel.next('orderId');
    return `CLO-${orderId}`;
  }

  async listForUser(userId: string) {
    return this.paymentTransactionModel
      .find({
        user: new Types.ObjectId(userId),
      })
      .sort({
        createdAt: 'desc',
      })
      .exec();
  }

  async getPayment(orderId: string) {
    const tx = await this.paymentTransactionModel.findOne({ orderId });
    if (!tx) {
      throw new NotFoundException();
    }
    return tx;
  }

  async updatePaymentStatus(orderId: string, newStatus: PaymentStatus) {
    const tx = await this.paymentTransactionModel
      .findOne({ orderId })
      .populate('user')
      .exec();
    if (!tx) {
      throw new NotFoundException();
    }
    if (tx.status == newStatus) {
      this.logger.warn(`Order ${orderId} already in status ${newStatus}`);
      return tx;
    }

    tx.status = newStatus;
    await tx.save();

    if (tx.status === PaymentStatus.PAID) {
      const packageDesc = PACKAGES.find((p) => p.id === tx.packageId);
      if (!packageDesc) {
        throw new Error(
          '[updatePaymentStatus] Invalid package id:' + tx.packageId,
        );
      }
      this.logger.log(`Creating subscription for Order ${orderId}`);
      await this.subscriptionService.newForUser(
        tx.user.id,
        packageDesc.period,
        packageDesc.unit,
        tx.amount,
      );
    }

    return tx;
  }

  selectPackageForAmount(amount: string | number) {
    if (typeof amount === 'string') {
      amount = parseFloat(amount);
    }
    if (!amount) {
      return null;
    }
    let selected: SubscriptionPackage | null = null;
    for (const p of PACKAGES.toSorted((a, b) => a.price - b.price)) {
      if (p.price < amount) {
        selected = p;
      }
    }

    return selected;
  }
}
