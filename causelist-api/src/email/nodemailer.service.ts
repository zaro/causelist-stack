import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';
import SMTPTransport, {
  MailOptions,
} from 'nodemailer/lib/smtp-transport/index.js';
import nodeMailerHtmlToText from 'nodemailer-html-to-text';

@Injectable()
export class NodemailerService {
  protected transporter: nodemailer.Transporter<SMTPTransport.SentMessageInfo>;

  constructor(configService: ConfigService) {
    const user = configService.get('SMTP_USER');
    const pass = configService.get('SMTP_PASS');
    const auth = user || pass ? { user, pass } : undefined;
    const from = configService.get('EMAIL_FROM', 'no-reply@causelist.co.ke');
    this.transporter = nodemailer.createTransport(
      {
        host: configService.getOrThrow('SMTP_HOST'),
        port: configService.getOrThrow('SMTP_PORT'),
        secure: configService.getOrThrow('SMTP_SSL') === 'true',
        auth,
      },
      {
        from,
      },
    );
    this.transporter.use('compile', nodeMailerHtmlToText.htmlToText());
  }

  sendMessage(mailOptions: MailOptions) {
    return this.transporter.sendMail(mailOptions);
  }
}
