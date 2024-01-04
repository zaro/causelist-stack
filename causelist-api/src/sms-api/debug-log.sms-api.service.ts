import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SmsSendOptions, SmsSendResult } from './sms-api.service.js';
import { catchError, firstValueFrom } from 'rxjs';
import { BaseSmsApiService } from './base.sms-api.service.js';

@Injectable()
export class DebugLogSmsApiService extends BaseSmsApiService {
  protected logger = new Logger(DebugLogSmsApiService.name);

  configValid() {
    return true;
  }

  async sendMessage(
    mobile: string,
    msg: string,
    options: SmsSendOptions,
  ): Promise<SmsSendResult> {
    this.logger.debug(`To [${mobile}], Msg:[${msg}]`, options);
    return {
      success: true,
    };
  }
}
