import { HttpService } from '@nestjs/axios';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { catchError, firstValueFrom } from 'rxjs';
import {
  PaymentApiService,
  CreateTransactionParameters,
  StkPushResult,
  Transaction,
  checkTransactionResult,
} from './base.payment-api.service.js';
import { createHmac } from 'node:crypto';
import { InjectModel } from '@nestjs/mongoose';
import { PaymentTransaction } from '../schemas/payment-transaction.schema.js';
import { Model, Types } from 'mongoose';
import {
  IpayAfricaPaymentTxParameters,
  PaymentStatus,
} from '../interfaces/payments.js';

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
  checkTx: ['oid', 'vid'],
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

interface CheckTx {
  oid: string;
  vid: string;
  hash?: string;
}

@Injectable()
export class IPayAfricaPaymentApiService extends PaymentApiService {
  protected logger = new Logger(IPayAfricaPaymentApiService.name);
  protected secret: string;
  protected vendorId: string;
  protected liveMode: number;
  protected callbackURL: string;
  constructor(
    configService: ConfigService,
    protected httpService: HttpService,
    @InjectModel(PaymentTransaction.name)
    protected paymentTransactionModel: Model<PaymentTransaction>,
  ) {
    super();
    this.secret = configService.get('IPAY_AFRICA_SECRET');
    this.vendorId = configService.get('IPAY_AFRICA_VENDOR_ID');
    this.liveMode = parseInt(
      configService.get('IPAY_AFRICA_LIVE_MODE', '0'),
      10,
    );
    this.callbackURL = `https://${configService.getOrThrow(
      'APP_MAIN_DOMAIN',
    )}/api/payments/ipay-africa-callback`;

    if (configService.get('IPAY_AFRICA_OVERRIDE_CALLBACK_URL')?.length) {
      this.callbackURL = configService.get('IPAY_AFRICA_OVERRIDE_CALLBACK_URL');
    }

    this.logger.log('Using callback url: ' + this.callbackURL);

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

  isLiveMode() {
    return !!this.liveMode;
  }

  addHash(
    type: keyof typeof hashOrder,
    data: CreateTransaction | StkPush | CheckTx,
  ) {
    let keys = hashOrder[type];
    let s = '';
    for (const key of keys) {
      s += (data[key] ?? '').toString();
    }
    const hmac = createHmac('sha256', this.secret);
    hmac.update(s);
    data.hash = hmac.digest('hex');
  }

  paymentFormParamsHash(
    params: IpayAfricaPaymentTxParameters,
  ): IpayAfricaPaymentTxParameters {
    const body: IpayAfricaPaymentTxParameters = {
      live: this.liveMode,
      oid: params.oid,
      inv: params.oid ?? params.oid,
      ttl: params.ttl,
      tel: params.tel.replace(/^\+/, ''),
      eml: params.eml,
      vid: this.vendorId,
      curr: 'KES',
      p1: params?.p1,
      p2: params?.p2,
      p3: params?.p3,
      p4: params?.p4,
      cbk: this.callbackURL,
      cst: 1,
      crl: 0,
      autopay: 0,
    };
    const keys: (keyof IpayAfricaPaymentTxParameters)[] = [
      'live',
      'oid',
      'inv',
      'ttl',
      'tel',
      'eml',
      'vid',
      'curr',
      'p1',
      'p2',
      'p3',
      'p4',
      'cbk',
      'cst',
      'crl',
    ];
    let s = '';
    for (const key of keys) {
      s += (body[key] ?? '').toString();
    }
    const hmac = createHmac('sha1', this.secret);
    hmac.update(s);
    body.hsh = hmac.digest('hex');
    return body;
  }

  async createTransaction(
    txParams: CreateTransactionParameters,
    forUserId: string,
  ): Promise<Transaction> {
    const body: CreateTransaction = {
      live: this.liveMode,
      oid: txParams.orderId,
      inv: txParams.invoiceId ?? txParams.orderId,
      amount: txParams.amount,
      tel: txParams.phone.replace(/^\+/, ''),
      eml: txParams.email,
      vid: this.vendorId,
      curr: 'KES',
      p1: txParams?.extraParameters?.[0],
      p2: txParams?.extraParameters?.[1],
      p3: txParams?.extraParameters?.[2],
      p4: txParams?.extraParameters?.[3],
      cbk: this.callbackURL,
      cst: 1,
      crl: 0,
      autopay: 1,
    };
    this.addHash('tx', body);
    const {
      data: ipayResponse,
      status,
      statusText,
    } = await firstValueFrom(
      this.httpService.post(
        'https://apis.ipayafrica.com/payments/v2/transact',
        body,
        {
          headers: {
            apikey: this.secret,
            'cache-control': 'no-cache',
            'content-type': 'application/x-www-form-urlencoded',
          },
          validateStatus(status) {
            return true;
          },
        },
      ),
    );
    this.logger.debug('IPAY create TX response', ipayResponse);
    if (status != 200) {
      this.logger.error(`API returned ${status} ${statusText}`);
      this.logger.error(`> ${JSON.stringify(ipayResponse)}`);
      this.logger.error(`Request was > ${JSON.stringify(body)}`);
      throw new InternalServerErrorException();
    }
    const { data } = ipayResponse;
    const tx = new this.paymentTransactionModel({
      sid: data.sid,
      amount: data.amount,
      packageId: txParams.packageId,
      orderId: data.oid,
      phone: txParams.phone,
      email: txParams.email,
      user: new Types.ObjectId(forUserId),
    });
    await tx.save();
    return tx;
  }

  async triggerStkPush(tx: Transaction): Promise<StkPushResult> {
    const body: StkPush = {
      phone: tx.phone,
      sid: tx.sid,
      vid: this.vendorId,
    };
    this.addHash('stkPush', body);
    const {
      data: ipayResponse,
      status,
      statusText,
    } = await firstValueFrom(
      this.httpService.post(
        'https://apis.ipayafrica.com/payments/v2/transact/push/mpesa',
        body,
        {
          headers: {
            apikey: this.secret,
            'cache-control': 'no-cache',
            'content-type': 'application/x-www-form-urlencoded',
          },
          validateStatus(status) {
            return true;
          },
        },
      ),
    );
    this.logger.debug('IPAY STK Push response', ipayResponse);
    if (status != 200) {
      this.logger.error(`API returned ${status} ${statusText}`);
      this.logger.error(`> ${JSON.stringify(ipayResponse)}`);
      this.logger.error(`Request was > ${JSON.stringify(body)}`);
      throw new InternalServerErrorException();
    }

    return {
      status: ipayResponse.status,
      text: ipayResponse.text,
      orderId: tx.orderId,
    };
  }

  async checkTransaction(orderId: string): Promise<any> {
    const body: CheckTx = {
      oid: orderId,
      vid: this.vendorId,
    };
    this.addHash('checkTx', body);
    const {
      data: ipayResponse,
      status,
      statusText,
    } = await firstValueFrom(
      this.httpService.post(
        'https://apis.ipayafrica.com/payments/v2/transaction/search',
        body,
        {
          headers: {
            apikey: this.secret,
            'cache-control': 'no-cache',
            'content-type': 'application/x-www-form-urlencoded',
          },
          validateStatus(status) {
            return true;
          },
        },
      ),
    );
    this.logger.debug('IPAY checkTx response', ipayResponse);
    if (status != 200) {
      this.logger.error(`API returned ${status} ${statusText}`);
      this.logger.error(`> ${JSON.stringify(ipayResponse)}`);
      this.logger.error(`Request was > ${JSON.stringify(body)}`);
      throw new InternalServerErrorException();
    }

    return ipayResponse;
  }

  decodeStatus(status: string) {
    switch (status) {
      case 'fe2707etr5s4wq': // Failed transaction. Not all parameters fulfilled. A notification of this transaction sent to the merchant.
        return PaymentStatus.FAILED;
      case 'aei7p7yrx4ae34': // Success: The transaction is valid. Therefore you can update this transaction.
        return PaymentStatus.PAID;
      case 'bdi6p2yy76etrs': // Pending: Incoming Mobile Money Transaction Not found. Please try again in 5 minutes.
        return PaymentStatus.PENDING;
      case 'cr5i3pgy9867e1': // Used: This code has been used already. A notification of this transaction sent to the merchant.
        return PaymentStatus.FAILED;
      case 'dtfi4p7yty45wq': // Less: The amount that you have sent via mobile money is LESS than what was required to validate this transaction.
        return PaymentStatus.INSUFFICIENT_AMOUNT;
      case 'eq3i7p5yt7645e': // More: The amount that you have sent via mobile money is MORE than what was required to validate this transaction. (Up to the merchant to decide what to do with this transaction; whether to pass it or not)
        return PaymentStatus.PAID;
      default:
        throw new Error('Unknown iPay Africa Payment status: ' + status);
    }
  }

  async validateTransaction(
    params: Record<string, string>,
  ): Promise<PaymentStatus> {
    const query = {
      vendor: this.vendorId,
      id: params.id,
      ivm: params.ivm,
      qwh: params.qwh,
      afd: params.afd,
      poi: params.poi,
      uyt: params.uyt,
      ifd: params.ifd,
    };
    const searchParams = new URLSearchParams(query);
    const {
      data: ipayResponse,
      status,
      statusText,
    } = await firstValueFrom(
      this.httpService.post(
        `https://www.ipayafrica.com/ipn/?${searchParams.toString()}`,
        {
          validateStatus(status) {
            return true;
          },
        },
      ),
    );
    this.logger.debug(`IPAY status ${status} ${statusText}`);
    this.logger.debug(`IPAY ipn response: ${ipayResponse}`);
    this.logger.debug(`Request was > ${searchParams.toString()}`);
    if (status != 200) {
      this.logger.error(`API returned ${status} ${statusText}`);
      this.logger.error(`> ${JSON.stringify(ipayResponse)}`);
      this.logger.error(`Request was > ${JSON.stringify(searchParams)}`);
      throw new InternalServerErrorException();
    }
    // Test Mode always return Failed
    // this workaround is seen also in the WooCommerce plugin
    const result = this.isLiveMode() ? ipayResponse : 'aei7p7yrx4ae34';

    return this.decodeStatus(result);
  }
}
