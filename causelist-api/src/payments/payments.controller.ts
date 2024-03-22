import {
  BadRequestException,
  Body,
  Headers,
  Controller,
  Get,
  Logger,
  Param,
  Post,
  Query,
  Redirect,
  Req,
} from '@nestjs/common';
import type { RequestWithUser } from '../auth/request.js';
import { PaymentsService } from './payments.service.js';
import { IsNumber, IsString, Min, MinLength } from 'class-validator';
import { PaymentApiService } from './base.payment-api.service.js';
import { UsersService } from '../users/users.service.js';
import { InjectModel } from '@nestjs/mongoose';
import { PACKAGES } from '../interfaces/packages.js';
import { IPayAfricaPaymentApiService } from './ipay-africa.payment-api.service.js';
import { Public } from '../auth/public.decorator.js';
import { ConfigService } from '@nestjs/config';
import { IOrderStatus, PaymentStatus } from '../interfaces/payments.js';
import { KopoKopoPaymentApiService } from './kopokopo.payment-api.service.js';

export class NewPaymentParams {
  @IsString()
  @MinLength(3)
  packageId: string;
}

export class PaymentFormParams {
  @IsString()
  @MinLength(3)
  packageId: string;
}

export class CheckOrderParams {
  @IsString()
  @MinLength(3)
  orderId: string;
}

@Controller('payments')
export class PaymentsController {
  protected logger = new Logger(PaymentsController.name);
  protected readonly appMainDomain: string;
  protected readonly isDevEnvironment: boolean;

  constructor(
    configService: ConfigService,
    protected service: PaymentsService,
    protected paymentApiService: PaymentApiService,
    protected userService: UsersService,
  ) {
    this.appMainDomain = configService.getOrThrow('APP_MAIN_DOMAIN');
    this.isDevEnvironment =
      configService.getOrThrow('NEXT_PUBLIC_ENVIRONMENT') == 'development';
  }

  @Get('all')
  async allUserPayments(@Req() req: RequestWithUser) {
    return this.service.listForUser(req.user.id);
  }

  @Post('stk-push-payment/:packageId')
  async stkPushPayment(
    @Req() req: RequestWithUser,
    @Param() params: NewPaymentParams,
  ) {
    const packageDesc = PACKAGES.find((p) => p.id === params.packageId);
    if (!packageDesc) {
      throw new BadRequestException({
        message: `Invalid package id: ${params.packageId}`,
        statusCode: 400,
      });
    }
    const user = await this.userService.findById(req.user.id);
    const orderId = await this.service.newOrderId();
    const tx = await this.paymentApiService.createTransaction(
      {
        packageId: packageDesc.id,
        amount: packageDesc.price,
        email: user.email,
        phone: user.phone,
        orderId,
      },
      req.user.id,
    );
    const pushResult = await this.paymentApiService.triggerStkPush(tx);
    console.log(pushResult);
    return pushResult;
  }

  @Post('payment-form-params/:packageId')
  async paymentFormParams(
    @Req() req: RequestWithUser,
    @Param() params: PaymentFormParams,
  ) {
    if (!(this.paymentApiService instanceof IPayAfricaPaymentApiService)) {
      throw new BadRequestException();
    }

    const packageDesc = PACKAGES.find((p) => p.id === params.packageId);
    if (!packageDesc) {
      throw new BadRequestException({
        message: `Invalid package id: ${params.packageId}`,
        statusCode: 400,
      });
    }
    const user = await this.userService.findById(req.user.id);
    const orderId = await this.service.newOrderId();
    const tx = await this.paymentApiService.paymentFormParamsHash({
      oid: orderId,
      ttl: packageDesc.price,
      eml: user.email,
      tel: user.phone,
      curr: 'KES',
    });
    return tx;
  }

  @Get('ipay-africa-pay-for/:packageId')
  @Redirect('https://payments.ipayafrica.com/v3/ke', 302)
  async ipayAfricaSubmit(
    @Req() req: RequestWithUser,
    @Param() params: NewPaymentParams,
  ) {
    this.logger.debug(`ipay-africa-pay-for: packageId ${params.packageId}`);
    if (!(this.paymentApiService instanceof IPayAfricaPaymentApiService)) {
      throw new BadRequestException();
    }

    const packageDesc = PACKAGES.find((p) => p.id === params.packageId);
    if (!packageDesc) {
      throw new BadRequestException({
        message: `Invalid package id: ${params.packageId}`,
        statusCode: 400,
      });
    }

    const user = await this.userService.findById(req.user.id);
    const orderId = await this.service.newOrderId();
    const tx = await this.paymentApiService.createTransaction(
      {
        packageId: packageDesc.id,
        amount: packageDesc.price,
        email: user.email,
        phone: user.phone,
        orderId,
      },
      req.user.id,
    );
    const ipayParams = await this.paymentApiService.paymentFormParamsHash({
      oid: tx.orderId,
      ttl: tx.amount,
      eml: tx.email,
      tel: tx.phone,
      curr: 'KES',
    });

    const query = new URLSearchParams(
      Object.fromEntries(
        Object.entries(ipayParams).map(([k, v]) => [k, (v ?? '').toString()]),
      ),
    );
    const url = `https://payments.ipayafrica.com/v3/ke?${query.toString()}`;
    return {
      url,
    };
  }

  @Public()
  @Get('ipay-africa-callback')
  @Redirect('https://causelist.co.ke/payment-status', 302)
  async ipayAfricaCallback(@Query() params) {
    const { status, id: orderId } = params;
    this.logger.debug(
      `ipay-africa-callback: received ${JSON.stringify(params)}`,
    );
    const verifiedStatus =
      await this.paymentApiService.validateTransaction(params);
    this.logger.debug(
      `ipay-africa-callback: receivedStatus=${status} , verifiedStatus=${verifiedStatus}`,
    );

    const tx = await this.service.updatePaymentStatus(orderId, verifiedStatus);
    const url = `http${this.isDevEnvironment ? '' : 's'}://${
      this.appMainDomain
    }/payment-status?oid=${orderId}`;
    return {
      url,
    };
  }

  @Public()
  @Post('kopo-kopo-callback')
  async kopokopoCallback(@Body() body: any) {
    const { type, id, attributes } = body?.data;
    this.logger.debug(`kopo-kopo-callback: received ${type} with id: ${id}`);
    const { orderId } = attributes?.metadata;
    if (!orderId) {
      this.logger.error('Unknown payment message:');
      this.logger.error(body);
      return {
        unknownPayment: true,
      };
    }
    const status = await this.paymentApiService.validateTransaction({
      orderId,
    });

    const tx = await this.service.updatePaymentStatus(orderId, status);
    return {
      ok: true,
    };
  }

  @Public()
  @Post('kopo-kopo-buy-goods-callback')
  async kopokopoBuyGoodsCallback(
    @Body() body: any,
    @Headers('x-kopokopo-signature') signature: string,
  ) {
    if (!(this.paymentApiService instanceof KopoKopoPaymentApiService)) {
      throw new BadRequestException();
    }
    const { topic, id, event } = body;
    this.logger.debug(
      `kopo-kopo-buy-goods-callback: received ${topic} with id: ${id}`,
    );

    if (
      !this.paymentApiService.validateEvent(JSON.stringify(body), signature)
    ) {
      this.logger.error(
        `kopo-kopo-buy-goods-callback: Failed to validate body`,
      );
      return true;
    }

    const { amount, sender_phone_number, status } = event?.resource;
    const selectedUser =
      await this.userService.findOneByPhone(sender_phone_number);
    if (!selectedUser) {
      this.logger.error(
        `kopo-kopo-buy-goods-callback: Failed to select package for amount: ${amount}`,
      );
      return true;
    }

    const selectedPackage = this.service.selectPackageForAmount(amount);
    if (!selectedPackage) {
      this.logger.error(
        `kopo-kopo-buy-goods-callback: Failed to select package for amount: ${amount}`,
      );
      return true;
    }

    this.logger.log(
      `kopo-kopo-buy-goods-callback: Selected package ${selectedPackage.id} for amount: ${amount}`,
    );
    const orderId = await this.service.newOrderId();

    const tx = await this.paymentApiService.createTransactionForEvent(
      {
        orderId,
        packageId: selectedPackage.id,
        amount,
        phone: selectedUser.phone,
        email: selectedUser.email,
      },
      selectedUser.id,
      body,
    );

    await this.service.updatePaymentStatus(
      orderId,
      status === 'Received' ? PaymentStatus.PAID : PaymentStatus.PENDING,
    );

    return true;
  }

  @Get('check-order-status/:orderId')
  async checkOrderStatus(
    @Req() req: RequestWithUser,
    @Param() params: CheckOrderParams,
  ): Promise<IOrderStatus> {
    let tx = await this.service.getPayment(params.orderId);

    if (tx.status === PaymentStatus.PENDING) {
      const status = await this.paymentApiService.validateTransaction({
        orderId: params.orderId,
      });

      tx = await this.service.updatePaymentStatus(params.orderId, status);
    }

    return {
      orderId: tx.orderId,
      status: tx.status,
    };
  }
}
