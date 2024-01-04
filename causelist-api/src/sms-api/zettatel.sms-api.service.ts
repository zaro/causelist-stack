import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SmsSendOptions, SmsSendResult } from './sms-api.service.js';
import { catchError, firstValueFrom } from 'rxjs';
import { BaseSmsApiService } from './base.sms-api.service.js';

@Injectable()
export class ZettatelSmsApiService extends BaseSmsApiService {
  protected logger = new Logger(ZettatelSmsApiService.name);
  protected apiKey: string;
  protected user: string;
  protected pass: string;
  protected senderId: string;
  constructor(
    configService: ConfigService,
    protected httpService: HttpService,
  ) {
    super();
    this.apiKey = configService.get('ZETTATEL_API_KEY');
    this.user = configService.get('ZETTATEL_USER');
    this.senderId = configService.get('ZETTATEL_SENDER_ID', 'ZTSMS');

    // this.httpService.axiosRef.interceptors.request.use((request) => {
    //   console.log('Starting Request:');
    //   console.dir(request, { depth: null });
    //   return request;
    // });

    // this.httpService.axiosRef.interceptors.response.use((response) => {
    //   console.log('Response:');
    //   console.dir(response, { depth: null });
    //   return response;
    // });
  }

  configValid() {
    return !!(this.apiKey && this.user && this.apiKey);
  }

  async sendMessage(
    mobile: string,
    msg: string,
    options?: SmsSendOptions,
  ): Promise<SmsSendResult> {
    const body: any = {
      userid: this.user,
      sendMethod: 'quick',
      mobile,
      msg,
      senderid: this.senderId,
      msgType: 'text',
      output: 'json',
    };
    if (options?.testMessage !== undefined) {
      body.testMessage = options.testMessage.toString();
    }
    if (options?.duplicateCheck !== undefined) {
      body.duplicatecheck = options.duplicateCheck.toString();
    }
    if (options?.trackLink !== undefined) {
      body.trackLink = options.trackLink.toString();
    }
    if (options?.smartLinkTitle !== undefined) {
      body.smartLinkTitle = options.smartLinkTitle;
    }
    if (options?.scheduleTime !== undefined) {
      body.scheduleTime = options.scheduleTime;
    }

    const { data } = await firstValueFrom(
      this.httpService.post('https://portal.zettatel.com/SMSApi/send', body, {
        headers: {
          apikey: this.apiKey,
          'cache-control': 'no-cache',
          'content-type': 'application/x-www-form-urlencoded',
        },
      }),
    );
    this.logger.debug('ZETTATEL_RESPONSE', data);
    return {
      success: data.status === 'success',
    };
  }
}
