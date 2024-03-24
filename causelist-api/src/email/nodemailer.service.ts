import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';
import SMTPTransport, {
  MailOptions,
} from 'nodemailer/lib/smtp-transport/index.js';
import nodeMailerHtmlToText from 'nodemailer-html-to-text';

import * as nunjucks from 'nunjucks';
import { makeNunjucksEnv, moduleRelativePath } from './nunjucks-environment.js';
import { EmailParams, Recipient } from './email.service.js';

@Injectable()
export class NodemailerService {
  protected transporter: nodemailer.Transporter<SMTPTransport.SentMessageInfo>;
  protected env: nunjucks.Environment;

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
    // Nujucks env
    this.env = makeNunjucksEnv(moduleRelativePath(import.meta, 'templates'));
  }

  renderEmail(templateName: string, context: any) {
    const contextWithDefaults = {
      currentYear: new Date().getFullYear(),
      ...context,
    };
    const html = this.env.render(
      `${templateName}.body.html.nunjucks`,
      contextWithDefaults,
    );
    const subject = this.env.render(
      `${templateName}.subject.nunjucks`,
      contextWithDefaults,
    );
    return { html, subject };
  }

  sendMessage(recipient: Recipient, subject: string, html: string) {
    if (typeof recipient === 'string') {
      recipient = {
        to: recipient,
      };
    }
    return this.transporter.sendMail({
      ...recipient,
      subject,
      html,
    });
  }

  renderAndSendMessage(params: EmailParams) {
    const { html, subject } = this.renderEmail(
      params.templateName,
      params.context,
    );
    return this.sendMessage(params.recipient, subject, html);
  }
}
