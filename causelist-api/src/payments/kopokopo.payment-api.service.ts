import { HttpService } from '@nestjs/axios';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { catchError, firstValueFrom } from 'rxjs';
import {
  PaymentApiService,
  CreateTransactionParameters,
  StkPushResult,
  Transaction,
} from './base.payment-api.service.js';
import { createHmac } from 'node:crypto';
import { InjectModel } from '@nestjs/mongoose';
import { PaymentTransaction } from '../schemas/payment-transaction.schema.js';
import { Model, Types } from 'mongoose';
import { PaymentStatus } from '../interfaces/payments.js';
import crypto from 'node:crypto';

interface StkOptions {
  tillNumber: string;
  firstName?: string;
  lastName?: string;
  phoneNumber: string;
  email?: string;
  currency: string;
  amount: number;
  callbackUrl?: string;
  paymentChannel: string;
  accessToken: string;
  metadata: Record<string, string>;
}

interface CheckStkStatus {
  location: string;
  accessToken: string;
}

@Injectable()
export class KopoKopoPaymentApiService extends PaymentApiService {
  protected logger = new Logger(KopoKopoPaymentApiService.name);
  protected liveMode: boolean;
  protected k2ClientId: string;
  protected k2ClientSecret: string;
  protected k2BaseUrl: string;
  protected k2ApiKey: string;
  protected tillNumber: string;
  protected stkPushTillNumber: string;
  protected callbackURL: string;
  protected buyGoodsCallbackURL: string;
  protected token: any;

  constructor(
    configService: ConfigService,
    protected httpService: HttpService,
    @InjectModel(PaymentTransaction.name)
    protected paymentTransactionModel: Model<PaymentTransaction>,
  ) {
    super();
    this.k2ClientId = configService.get('K2_CLIENT_ID');
    this.k2ClientSecret = configService.get('K2_CLIENT_SECRET');
    this.liveMode = !!parseInt(configService.get('K2_LIVE_MODE', '0'));

    this.k2BaseUrl = this.liveMode
      ? 'https://api.kopokopo.com'
      : 'https://sandbox.kopokopo.com';
    this.k2ApiKey = configService.get('K2_API_KEY');

    this.tillNumber = configService.get('MPESA_TILL_NUMBER');
    this.stkPushTillNumber = configService.get('MPESA_STK_PUSH_NUMBER');

    this.callbackURL = `https://${configService.getOrThrow(
      'APP_MAIN_DOMAIN',
    )}/api/payments/kopo-kopo-callback`;

    if (configService.get('K2_OVERRIDE_CALLBACK_URL')?.length) {
      this.callbackURL = configService.get('K2_OVERRIDE_CALLBACK_URL');
    }

    this.logger.log('Using callback url: ' + this.callbackURL);

    this.buyGoodsCallbackURL = `https://${configService.getOrThrow(
      'APP_MAIN_DOMAIN',
    )}/api/payments/kopo-kopo-buy-goods-callback`;

    if (configService.get('K2_OVERRIDE_BUY_GOODS_CALLBACK_URL')?.length) {
      this.callbackURL = configService.get(
        'K2_OVERRIDE_BUY_GOODS_CALLBACK_URL',
      );
    }

    this.logger.log('Using BuyGoods callback url: ' + this.callbackURL);

    // this.httpService.axiosRef.interceptors.request.use((request) => {
    //   console.log('Starting Request:', request.url);
    //   console.log('Headers:', request.headers);
    //   console.log('Data:', request.data);
    //   // console.dir(request, { depth: null });
    //   return request;
    // });

    // this.httpService.axiosRef.interceptors.response.use((response) => {
    //   console.log('Response:', response.status, response.data);
    //   // console.dir(response, { depth: null });
    //   return response;
    // });
  }

  async kopokopoGetAccessToken() {
    var body = new FormData();
    body.append('client_id', this.k2ClientId);
    body.append('client_secret', this.k2ClientSecret);
    body.append('grant_type', 'client_credentials');
    const { data } = await firstValueFrom(
      this.httpService.post(`${this.k2BaseUrl}/oauth/token`, body, {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      }),
    );

    return {
      data,
    };
  }

  async kopokopoRequest(endpoint: string, body: any) {
    await this.refreshAccessToken();

    return firstValueFrom(
      this.httpService.post(`${this.k2BaseUrl}${endpoint}`, body, {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + this.token.access_token,
        },
        validateStatus(status) {
          return true;
        },
      }),
    );
  }

  async kopokopoRegisterWebhook(webhookUrl?: string) {
    const url = webhookUrl ?? this.buyGoodsCallbackURL;
    try {
      this.logger.log(
        `Registering webhook ${url} for scope till with TillNumber: ${this.tillNumber}`,
      );
      const { status, statusText } = await this.kopokopoRequest(
        '/api/v1/webhook_subscriptions',
        {
          event_type: 'buygoods_transaction_received',
          url,
          scope: 'till',
          scope_reference: this.tillNumber,
        },
      );
      this.logger.log('Register webhook status', status, statusText);
      //
    } catch (e) {
      this.logger.error(`Failed subscription of ${url}: `, null, e);
    }
  }

  isLiveMode() {
    return this.liveMode;
  }

  getTokenExpiration() {
    if (this.token) {
      const exp = new Date(this.token.created_at);
      exp.setSeconds(exp.getSeconds() + this.token.expires_in);
      return exp;
    }
    return new Date(0);
  }

  async refreshAccessToken() {
    if (this.getTokenExpiration() < new Date()) {
      const { data } = await this.kopokopoGetAccessToken();
      this.token = data;
      this.logger.log(
        `Got new token: ${
          this.token.access_token
        } expires at : ${this.getTokenExpiration()}`,
      );
    }
  }

  async createTransaction(
    txParams: CreateTransactionParameters,
    forUserId: string,
  ): Promise<Transaction> {
    const tx = new this.paymentTransactionModel({
      amount: txParams.amount,
      packageId: txParams.packageId,
      orderId: txParams.orderId,
      phone: txParams.phone,
      email: txParams.email,
      status: PaymentStatus.PENDING,
      user: new Types.ObjectId(forUserId),
    });
    await tx.save();
    return tx;
  }

  async triggerStkPush(tx: Transaction): Promise<StkPushResult> {
    const txDocument = await this.paymentTransactionModel
      .findById(tx.id)
      .populate('user')
      .exec();
    const body = {
      payment_channel: 'M-PESA STK Push',
      till_number: this.stkPushTillNumber,
      subscriber: {
        first_name: txDocument.user.firstName,
        last_name: txDocument.user.lastName,
        phone_number: tx.phone,
        email: tx.email,
      },
      amount: {
        currency: 'KES',
        value: tx.amount,
      },
      metadata: {
        orderId: tx.orderId,
        txId: tx.id,
      },
      _links: {
        callback_url: this.callbackURL,
      },
    };
    try {
      const { data, status, statusText, headers } = await this.kopokopoRequest(
        '/api/v1/incoming_payments',
        body,
      );

      this.logger.debug(`KopoKopo STK Push response: ${status} ${statusText}`);
      if (headers['location']) {
        txDocument.sid = headers['location'];
        await txDocument.save();
      } else {
        this.logger.error(`KopoKopo API did not return transaction id `);
        this.logger.error(`Request was > ${JSON.stringify(body)}`);
        return {
          status: 0,
          success: false,
          text: 'Failed to trigger STK Push',
          orderId: tx.orderId,
        };
      }
    } catch (error: any) {
      this.logger.error(`KopoKopo API returned error `, error.stack, error);
      this.logger.error(`Request was > ${JSON.stringify(body)}`);
      return {
        status: 0,
        success: false,
        text: 'Failed to trigger STK Push',
        orderId: tx.orderId,
      };
    }

    return {
      status: 1,
      success: true,
      text: 'Request sent',
      orderId: tx.orderId,
    };
  }

  async checkTransaction(orderId: string): Promise<any> {
    const txDocument = await this.paymentTransactionModel
      .findOne({
        orderId,
      })
      .exec();
    if (!txDocument) {
      return;
    }
    await this.refreshAccessToken();

    return firstValueFrom(
      this.httpService.get(txDocument.sid, {
        headers: {
          Accept: 'application/json',
          Authorization: 'Bearer ' + this.token.access_token,
        },
        validateStatus(status) {
          return true;
        },
      }),
    );
  }

  async validateTransaction(
    params: Record<string, string>,
  ): Promise<PaymentStatus> {
    const { data: result } = await this.checkTransaction(params.orderId);
    if (result?.data?.attributes?.status === 'Success') {
      return PaymentStatus.PAID;
    }
    if (result?.data?.attributes?.status === 'Failed') {
      return PaymentStatus.FAILED;
    }
    // if (result?.data?.attributes?.status === 'Pending') {
    //   return PaymentStatus.PAID;
    // }
    const nonReadyStatus = ['Received'];
    if (!nonReadyStatus.includes(result?.data?.attributes?.status)) {
      this.logger.log(
        `Unknown tx status received for ${params.orderId}: ${JSON.stringify(
          result,
        )}`,
      );
    }
    return PaymentStatus.PENDING;
  }

  validateEvent(body: string, signature: string) {
    const hash = crypto
      .createHmac('sha256', this.k2ApiKey)
      .update(body)

      .digest('hex');

    return hash === signature;
  }

  async createTransactionForEvent(
    txParams: CreateTransactionParameters,
    forUserId: string,
    eventData: any,
  ): Promise<Transaction> {
    const tx = new this.paymentTransactionModel({
      amount: txParams.amount,
      packageId: txParams.packageId,
      orderId: txParams.orderId,
      phone: txParams.phone,
      email: txParams.email,
      status: PaymentStatus.PENDING,
      user: new Types.ObjectId(forUserId),
      receivedEvent: eventData,
      sid: eventData?._links?.self,
    });
    await tx.save();
    return tx;
  }
}
