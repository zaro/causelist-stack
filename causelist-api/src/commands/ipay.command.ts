import { Command, Positional } from 'nestjs-command/dist/index.js';
import { Injectable, Logger } from '@nestjs/common';
import * as util from 'node:util';
import * as child_process from 'node:child_process';

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema.js';
import { UserRole } from '../interfaces/users.js';
import { PaymentTransaction } from '../schemas/payment-transaction.schema.js';
import { PaymentApiService } from '../payments/base.payment-api.service.js';

@Injectable()
export class IpayCommand {
  private readonly log = new Logger(IpayCommand.name);

  constructor(
    protected paymentApiService: PaymentApiService,
    @InjectModel(PaymentTransaction.name)
    protected paymentTransactionModel: Model<PaymentTransaction>,
  ) {}

  @Command({
    command: 'ipay:check-last',
    describe: 'Check last 5 tx',
  })
  async checkLast5() {
    const txs = await this.paymentTransactionModel
      .find()
      .sort({
        createdAt: 'desc',
      })
      .limit(5)
      .exec();

    for (const tx of txs) {
      this.log.log('OrderId: ' + tx.orderId);
      const s = await this.paymentApiService.checkTransaction(tx.orderId);
      this.log.log('Status:' + JSON.stringify(s));
    }
  }

  @Command({
    command: 'ipay:check-oid <orderId>',
    describe: 'Check tx',
  })
  async checkOrder(
    @Positional({
      name: 'orderId',
      describe: 'Order ID to Check',
      type: 'string',
    })
    orderId: string,
  ) {
    this.log.log('OrderId: ' + orderId);
    try {
      const s = await this.paymentApiService.checkTransaction(orderId);
      this.log.log('Status:' + JSON.stringify(s));
    } catch (e) {}
  }
}
