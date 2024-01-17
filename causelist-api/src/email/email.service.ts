import { Injectable } from '@nestjs/common';
import { NodemailerService } from './nodemailer.service.js';
import * as nunjucks from 'nunjucks';
import { makeNunjucksEnv, moduleRelativePath } from './nunjucks-environment.js';
import { User } from '../schemas/user.schema.js';

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

@Injectable()
export class EmailService {
  protected env: nunjucks.Environment;

  constructor(protected nodemailerService: NodemailerService) {
    this.env = makeNunjucksEnv(moduleRelativePath(import.meta, 'templates'));
  }

  protected sendMessage(recipient: Recipient, subject: string, html: string) {
    if (typeof recipient === 'string') {
      recipient = {
        to: recipient,
      };
    }
    return this.nodemailerService.sendMessage({
      ...recipient,
      subject,
      html,
    });
  }

  protected renderEmail(templateName: string, context: any) {
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

  async sendSignedUp(recipient: Recipient, context: EmailLoginCodeContext) {
    const { html, subject } = this.renderEmail('signed-up', context);
    return this.sendMessage(recipient, subject, html);
  }

  async sendLoginCode(recipient: Recipient, context: EmailLoginCodeContext) {
    const { html, subject } = this.renderEmail('login-code', context);
    return this.sendMessage(recipient, subject, html);
  }
}
