import { Injectable, Logger } from '@nestjs/common';
import { NodemailerService } from './nodemailer.service.js';
import { User } from '../schemas/user.schema.js';
import { ISubscription } from '../interfaces/users.js';
import { InjectQueue } from '@nestjs/bull';
import { EMAIL_QUEUE_NAME } from './email.processor.js';
import type { Queue } from 'bull';

export type Recipient =
  | string
  | {
      to: string | string[];
      cc?: string | string[];
      bcc?: string | string[];
    };

export interface EmailCommonContext {
  user: User;
}

export interface EmailLoginCodeContext extends EmailCommonContext {
  code: string;
  phone: string;
  expiresAt: Date;
}

export interface EmailSubscribedContext extends EmailCommonContext {
  subscription: ISubscription;
}

export interface EmailLoginCodeParams {
  templateName: 'login-code';
  recipient: Recipient;
  context: EmailLoginCodeContext;
}

export interface EmailSignedUpParams {
  templateName: 'signed-up';
  recipient: Recipient;
  context: EmailLoginCodeContext;
}

export interface EmailSubscribedParams {
  templateName: 'subscribed';
  recipient: Recipient;
  context: EmailSubscribedContext;
}

export type EmailParams =
  | EmailLoginCodeParams
  | EmailSignedUpParams
  | EmailSubscribedParams;

@Injectable()
export class EmailService {
  protected log = new Logger(EmailService.name);

  constructor(
    protected nodemailerService: NodemailerService,
    @InjectQueue(EMAIL_QUEUE_NAME) protected emailQueue: Queue<EmailParams>,
  ) {}

  async renderAndSendEmail(params: EmailParams) {
    this.log.log(`Sending ${params.templateName} to ${params.recipient}`);
    return this.nodemailerService.renderAndSendMessage(params);
  }

  async renderAndSendEmailAsync(params: EmailParams, delay?: number) {
    this.log.log(`Queueing ${params.templateName} to ${params.recipient}`);
    return this.emailQueue.add(params, {
      delay,
    });
  }

  async sendSignedUp(recipient: Recipient, context: EmailLoginCodeContext) {
    return this.renderAndSendEmailAsync({
      templateName: 'signed-up',
      recipient,
      context,
    });
  }

  async sendLoginCode(recipient: Recipient, context: EmailLoginCodeContext) {
    return this.renderAndSendEmailAsync({
      templateName: 'login-code',
      recipient,
      context,
    });
  }

  async sendSubscribed(recipient: Recipient, context: EmailSubscribedContext) {
    return this.renderAndSendEmailAsync(
      {
        templateName: 'subscribed',
        recipient,
        context,
      },
      10000, // Delay it 10s so it is sent after the login code
    );
  }
}
