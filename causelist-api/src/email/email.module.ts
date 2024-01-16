import { Module } from '@nestjs/common';
import { NodemailerService } from './nodemailer.service.js';
import { EmailService } from './email.service.js';

@Module({
  providers: [NodemailerService, EmailService],
  exports: [EmailService],
})
export class EmailModule {}
