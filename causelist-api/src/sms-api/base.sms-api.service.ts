import { SmsSendOptions, SmsSendResult } from './sms-api.service.js';

export abstract class BaseSmsApiService {
  abstract configValid(): boolean;

  abstract sendMessage(
    mobile: string,
    msg: string,
    options?: SmsSendOptions,
  ): Promise<SmsSendResult>;
}
