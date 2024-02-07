import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { catchError, firstValueFrom } from 'rxjs';
import {
  BasePaymentApiService,
  CreateTransactionParameters,
  StkPushResult,
  Transaction,
} from './base.payment-api.service.js';
import { createHmac } from 'node:crypto';

const hashOrder = {
  tx: [
    'live',
    'oid',
    'inv',
    'amount',
    'tel',
    'eml',
    'vid',
    'curr',
    'p1',
    'p2',
    'p3',
    'p4',
    'cst',
    'cbk',
  ],
  stkPush: ['phone', 'vid', 'sid'],
};

interface CreateTransaction {
  live: number;
  oid: string;
  inv: string;
  amount: number;
  tel: string;
  eml: string;
  vid: string;
  curr: 'USD' | 'KES';
  p1: string;
  p2: string;
  p3: string;
  p4: string;
  cbk: string;
  cst: number;
  crl: number;
  hash?: string;
  autopay?: number;
}

interface StkPush {
  phone: string;
  sid: string;
  vid: string;
  hash?: string;
}

@Injectable()
export class IPayAfricaPaymentApiService extends BasePaymentApiService {
  protected logger = new Logger(IPayAfricaPaymentApiService.name);
  protected secret: string;
  protected vendorId: string;
  protected liveMode: number;
  protected callbackURL: string;
  constructor(
    configService: ConfigService,
    protected httpService: HttpService,
  ) {
    super();
    this.secret = configService.get('IPAY_AFRICA_SECRET');
    this.vendorId = configService.get('IPAY_AFRICA_VENDOR_ID');
    this.liveMode = parseInt(
      configService.get('IPAY_AFRICA_TEST_MODE', '1'),
      10,
    );
    this.callbackURL = `https://${configService.getOrThrow(
      'APP_MAIN_DOMAIN',
    )}/api/payments/ipay-africa-callback`;

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

  addHash(type: keyof typeof hashOrder, data: CreateTransaction | StkPush) {
    let keys = hashOrder[type];
    let s = '';
    for (const key of keys) {
      s += (data[key] ?? '').toString();
    }
    const hmac = createHmac('sha256', this.secret);
    hmac.update(s);
    data.hash = hmac.digest('hex');
  }

  async createTransaction(
    txParams: CreateTransactionParameters,
  ): Promise<Transaction> {
    const body: CreateTransaction = {
      live: this.liveMode,
      oid: txParams.orderId,
      inv: txParams.invoiceId,
      amount: txParams.amount,
      tel: txParams.phone,
      eml: txParams.email,
      vid: this.vendorId,
      curr: 'KES',
      p1: txParams.extraParameters[0],
      p2: txParams.extraParameters[1],
      p3: txParams.extraParameters[2],
      p4: txParams.extraParameters[3],
      cbk: this.callbackURL,
      cst: 1,
      crl: 0,
      autopay: 1,
    };
    this.addHash('tx', body);
    const { data } = await firstValueFrom(
      this.httpService.post(
        'https://apis.ipayafrica.com/payments/v2/transact',
        body,
        {
          headers: {
            apikey: this.secret,
            'cache-control': 'no-cache',
            'content-type': 'application/x-www-form-urlencoded',
          },
        },
      ),
    );
    this.logger.debug('IPAY create TX response', data);
    return {
      id: data.sid,
      amount: data.amount,
      orderId: data.oid,
      phone: txParams.phone,
      email: txParams.email,
    };
  }

  async triggerStkPush(tx: Transaction): Promise<StkPushResult> {
    const body: StkPush = {
      phone: tx.phone,
      sid: tx.id,
      vid: this.vendorId,
    };
    this.addHash('stkPush', body);
    const { data } = await firstValueFrom(
      this.httpService.post(
        'https://apis.ipayafrica.com/payments/v2/transact',
        body,
        {
          headers: {
            apikey: this.secret,
            'cache-control': 'no-cache',
            'content-type': 'application/x-www-form-urlencoded',
          },
        },
      ),
    );
    this.logger.debug('IPAY STK Push response', data);
    return {
      status: data.status,
      text: data.text,
    };
  }
}
