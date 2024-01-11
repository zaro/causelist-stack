import {
  Controller,
  Post,
  UseGuards,
  Request,
  Param,
  Logger,
  Body,
  Get,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service.js';
import { Public } from './public.decorator.js';
import { UsersService } from '../users/users.service.js';
import { IsPhoneNumber } from 'class-validator';
import { SmsApiService } from '../sms-api/sms-api.service.js';
import { UserRole } from '../schemas/user.schema.js';

export class SendOtpParams {
  @IsPhoneNumber('KE', {
    message: 'Must be valid Kenya phone number',
  })
  phone: string;
}

@Controller('auth')
export class AuthController {
  private readonly log = new Logger(AuthController.name);

  constructor(
    private authService: AuthService,
    private userService: UsersService,
    private smsService: SmsApiService,
  ) {}

  @Get('me')
  async me(@Request() req) {
    return this.userService.findById(req.user.userId);
  }

  @Public()
  @UseGuards(AuthGuard('otp'))
  @Post('login-otp')
  async login(@Request() req) {
    const result: any = await this.authService.login(req.user);
    result.user = req.user;
    return result;
  }

  @Public()
  @Post('send-otp')
  async sendOtp(@Body() params: SendOtpParams) {
    const otp = await this.userService.makeOtp(params.phone);
    if (!otp) {
      return {
        phone: params.phone,
        userMissing: true,
      };
    }
    this.log.log(`Sending OTP for ${params.phone} => ${otp.code}`);
    if (
      process.env.NEXT_PUBLIC_ENVIRONMENT === 'staging' ||
      process.env.NEXT_PUBLIC_ENVIRONMENT === 'development'
    ) {
      const user = await this.userService.findOneByPhone(params.phone);
      if (user.role === UserRole.Admin) {
        this.log.log(
          `Skip Sending OTP for ${params.phone}, env is ${process.env.NEXT_PUBLIC_ENVIRONMENT} and user is admin`,
        );
        return {
          phone: otp.phone,
          expiresAt: otp.expiresAt,
          smsSuccess: true,
        };
      }
    }

    const msg = `Login code for causelist.co.ke : ${otp.code}`;
    const smsResult = await this.smsService.sendMessage(params.phone, msg);
    return {
      phone: otp.phone,
      expiresAt: otp.expiresAt,
      smsSuccess: smsResult.success,
    };
  }
}
