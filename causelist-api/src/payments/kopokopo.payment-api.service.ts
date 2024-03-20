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

import * as K2ConnectNode from 'k2-connect-node';

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
  protected callbackURL: string;
  protected token: any;
  protected k2: any;
  protected stkService: any;

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

    this.callbackURL = `https://${configService.getOrThrow(
      'APP_MAIN_DOMAIN',
    )}/api/payments/kopo-kopo-callback`;

    if (configService.get('K2_OVERRIDE_CALLBACK_URL')?.length) {
      this.callbackURL = configService.get('K2_OVERRIDE_CALLBACK_URL');
    }

    this.logger.log('Using callback url: ' + this.callbackURL);
    this.k2 = K2ConnectNode.default({
      clientId: this.k2ClientId,
      clientSecret: this.k2ClientSecret,
      baseUrl: this.k2BaseUrl,
      apiKey: this.k2ApiKey,
    });
    this.stkService = this.k2.StkService;

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
      this.token = await this.k2.TokenService.getToken();
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
    await this.refreshAccessToken();
    const body: StkOptions = {
      paymentChannel: 'M-PESA STK Push',
      tillNumber: this.tillNumber,
      amount: tx.amount,
      currency: 'KES',
      firstName: txDocument.user.firstName,
      lastName: txDocument.user.lastName,
      phoneNumber: tx.phone,
      email: tx.email,
      metadata: {
        orderId: tx.orderId,
        txId: tx.id,
      },
      callbackUrl: this.callbackURL,
      accessToken: this.token.access_token,
    };
    try {
      const response = await this.stkService.initiateIncomingPayment(body);
      if (!response) {
        return {
          status: 0,
          success: false,
          text: 'Failed to trigger STK Push',
          orderId: tx.orderId,
        };
      }
      this.logger.debug('KopoKopo STK Push response', response);
      txDocument.sid = response;
      await txDocument.save();
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
    await this.refreshAccessToken();
    const body: CheckStkStatus = {
      location: txDocument.sid,
      accessToken: this.token.access_token,
    };
    const response = await this.stkService.getStatus(body);

    return response;
  }

  async validateTransaction(
    params: Record<string, string>,
  ): Promise<PaymentStatus> {
    const result = await this.checkTransaction(params.orderId);
    if (result?.data?.attributes?.status === 'Success') {
      return PaymentStatus.PAID;
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
}
