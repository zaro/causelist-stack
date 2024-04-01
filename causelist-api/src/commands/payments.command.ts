import { Command, Positional } from 'nestjs-command/dist/index.js';
import { Injectable, Logger } from '@nestjs/common';
import * as util from 'node:util';
import * as child_process from 'node:child_process';

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema.js';
import { UserRole } from '../interfaces/users.js';
import { KopoKopoPaymentApiService } from '../payments/kopokopo.payment-api.service.js';
import { SubscriptionService } from '../subscription/subscription.service.js';
import { trialSubscriptionNote } from '../users/users.service.js';

@Injectable()
export class PaymentsCommand {
  private readonly log = new Logger(PaymentsCommand.name);

  constructor(
    protected kopokopoService: KopoKopoPaymentApiService,
    @InjectModel(User.name)
    protected userModel: Model<User>,
    protected subscriptionService: SubscriptionService,
  ) {}

  @Command({
    command: 'payments:webhook [webhookUrl]',
    describe: 'Initialize Payment webhook',
  })
  async init(
    @Positional({
      name: 'webhookUrl',
      describe: 'Webhook url to register',
      type: 'string',
      demandOption: false,
    })
    webhookUrl: string,
  ) {
    this.log.log('Creating webhook subsription for KopoKopo...');
    await this.kopokopoService.kopokopoRegisterWebhook(webhookUrl);
    this.log.log(`Done!`);
  }

  @Command({
    command: 'payments:init-trials <startDate> <endDate> <daysOfTrial>',
    describe: 'Give trial to users',
  })
  async initTrials(
    @Positional({
      name: 'startDate',
      describe: 'users registered after',
      type: 'string',
      demandOption: true,
    })
    startDate: string,
    @Positional({
      name: 'endDate',
      describe: 'users registered before',
      type: 'string',
      demandOption: true,
    })
    endDate: string,
    @Positional({
      name: 'daysOfTrial',
      describe: 'How many days of trial to give to users',
      type: 'number',
      demandOption: true,
    })
    daysOfTrial: number,
  ) {
    this.log.log('Creating webhook subscription for KopoKopo...');
    const users = await this.userModel
      .find({
        $and: [
          { createdAt: { $gte: startDate } },
          { createdAt: { $lte: endDate } },
        ],
      })
      .exec();
    this.log.log(
      `Potentially giving 0-${daysOfTrial} trial days subscription to ${users.length} users`,
    );
    const now = new Date();
    for (const u of users) {
      const diffTime = now.getTime() - u.createdAt.getTime();
      const alreadyUsed = Math.round(diffTime / (1000 * 3600 * 24));

      const addDays = daysOfTrial - alreadyUsed;
      if (addDays > 0) {
        const currentSubs = await this.subscriptionService.listForUser(u.id);
        if (currentSubs.some((s) => s.note === trialSubscriptionNote)) {
          this.log.log(
            `User ${u.phone} already has '${trialSubscriptionNote}' trial`,
          );
          continue;
        }
        this.log.log(
          `User ${u.phone} createdAt=${u.createdAt} adding ${addDays} of '${trialSubscriptionNote}' trial`,
        );
        await this.subscriptionService.newForUser(
          u.id,
          addDays,
          'day',
          0,
          now,
          trialSubscriptionNote,
        );
      }
    }
    this.log.log(`Done!`);
  }
}
