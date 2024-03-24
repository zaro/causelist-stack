import { Processor, Process, OnQueueFailed } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job, JobOptions } from 'bull';
import {
  EmailLoginCodeContext,
  EmailParams,
  EmailService,
  EmailSubscribedContext,
  Recipient,
} from './email.service.js';
import { NodemailerService } from './nodemailer.service.js';

export const EMAIL_QUEUE_NAME = 'email';
export const EMAIL_DEFAULT_OPTIONS: JobOptions = {
  attempts: 3,
  backoff: {
    type: 'fixed',
    delay: 5000,
  },
};

@Processor(EMAIL_QUEUE_NAME)
export class EmailProcessor {
  protected log = new Logger(EmailProcessor.name);
  constructor(protected nodeMailer: NodemailerService) {}

  @Process()
  async sendEmailMessage(job: Job<EmailParams>) {
    this.log.log(`Sending ${job.data.templateName} to ${job.data.recipient}`);
    return this.nodeMailer.renderAndSendMessage(job.data);
  }

  @OnQueueFailed()
  handleError(bullJob: Job<EmailParams>, e: Error) {
    this.log.error(e);
  }
}
