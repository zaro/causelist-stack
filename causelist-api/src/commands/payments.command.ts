import { Command, Positional } from 'nestjs-command/dist/index.js';
import { Injectable, Logger } from '@nestjs/common';
import * as util from 'node:util';
import * as child_process from 'node:child_process';

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema.js';
import { UserRole } from '../interfaces/users.js';
import { KopoKopoPaymentApiService } from '../payments/kopokopo.payment-api.service.js';

@Injectable()
export class PaymentsCommand {
  private readonly log = new Logger(PaymentsCommand.name);

  constructor(protected kopokopoService: KopoKopoPaymentApiService) {}

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
}
