import { Module } from '@nestjs/common';
import { NodemailerService } from './nodemailer.service.js';
import { EmailService } from './email.service.js';
import { BullModule } from '@nestjs/bull';
import {
  EMAIL_DEFAULT_OPTIONS,
  EMAIL_QUEUE_NAME,
  EmailProcessor,
} from './email.processor.js';

@Module({
  imports: [
    BullModule.registerQueue({
      name: EMAIL_QUEUE_NAME,
      defaultJobOptions: EMAIL_DEFAULT_OPTIONS,
    }),
  ],
  providers: [NodemailerService, EmailService, EmailProcessor],
  exports: [EmailService],
})
export class EmailModule {}
