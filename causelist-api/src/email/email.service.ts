import { Injectable } from '@nestjs/common';
import { NodemailerService } from './nodemailer.service.js';
import * as nunjucks from 'nunjucks';
import { makeNunjucksEnv, moduleRelativePath } from './nunjucks-environment.js';

export type Recipient =
  | string
  | {
      to: string | string[];
      cc?: string | string[];
      bcc?: string | string[];
    };

export interface EmailLoginCodeContext {
  code: string;
}

@Injectable()
export class EmailService {
  protected env: nunjucks.Environment;

  constructor(protected nodemailerService: NodemailerService) {
    this.env = makeNunjucksEnv(moduleRelativePath(import.meta, 'templates'));
  }

  async sendLoginCode(recipient: Recipient, context: EmailLoginCodeContext) {
    if (typeof recipient === 'string') {
      recipient = {
        to: recipient,
      };
    }
    console.log('>>>', recipient);
    const html = this.env.render('login-code.body.html', context);
    const subject = this.env.render('login-code.subject.html', context);
    return this.nodemailerService.sendMessage({
      ...recipient,
      subject,
      html,
    });
  }
}
