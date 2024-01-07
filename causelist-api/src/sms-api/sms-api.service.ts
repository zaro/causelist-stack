import { Injectable, Logger } from '@nestjs/common';
import { ZettatelSmsApiService } from './zettatel.sms-api.service.js';
import { DebugLogSmsApiService } from './debug-log.sms-api.service.js';
import { BaseSmsApiService } from './base.sms-api.service.js';
import parsePhoneNumber from 'libphonenumber-js';

export interface SmsSendOptions {
  msgType?: 'unicode' | 'text';
  duplicateCheck?: boolean;
  scheduleTime?: string; //Date format YYYY-MM-DD HH:MM:SS
  trackLink?: boolean;
  smartLinkTitle?: string;
  testMessage?: boolean;
}

export interface SmsSendResult {
  success: boolean;
}

@Injectable()
export class SmsApiService {
  private log = new Logger(SmsApiService.name);
  protected backends: BaseSmsApiService[] = [];
  constructor(
    protected zettatel: ZettatelSmsApiService,
    protected debugLog: DebugLogSmsApiService,
  ) {
    if (debugLog.configValid()) {
      this.log.log(`Adding DebugLogSmsApiService`);
      this.backends.push(debugLog);
    }

    if (zettatel.configValid()) {
      this.log.log(`Adding ZettatelSmsApiService`);
      this.backends.push(zettatel);
    }
  }

  async sendMessage(mobile: string, msg: string, options?: SmsSendOptions) {
    const parsedPhone = parsePhoneNumber(mobile, 'KE');

    let results = await Promise.all(
      this.backends.map((b) => b.sendMessage(parsedPhone.number, msg, options)),
    );
    return results.at(-1);
  }
}
