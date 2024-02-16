import {
  Controller,
  Post,
  UseGuards,
  Request,
  Param,
  Logger,
  Body,
  Get,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service.js';
import { Public } from './public.decorator.js';
import { UsersService } from '../users/users.service.js';
import { IsBoolean, IsOptional, IsPhoneNumber } from 'class-validator';
import { SmsApiService } from '../sms-api/sms-api.service.js';
import { UserRole } from '../interfaces/users.js';
import { EmailService } from '../email/email.service.js';

export class SendOtpParams {
  @IsPhoneNumber('KE', {
    message: 'Must be valid Kenya phone number',
  })
  phone: string;

  @IsOptional()
  @IsBoolean()
  useEmail?: boolean;

  @IsOptional()
  @IsBoolean()
  skipSms?: boolean;

  @IsOptional()
  @IsBoolean()
  welcomeMessage?: boolean;
}

@Controller('auth')
export class AuthController {
  private readonly log = new Logger(AuthController.name);

  constructor(
    protected authService: AuthService,
    protected userService: UsersService,
    protected smsService: SmsApiService,
    protected emailService: EmailService,
  ) {}

  @Get('me')
  async me(@Request() req) {
    const me = await this.userService.findById(req.user.id);
    if (!me) {
      throw new UnauthorizedException();
    }
    return me;
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
    this.log.log(
      `Sending OTP for ${params.phone} => ${otp.code} useEmail=${params.useEmail}, skipSms=${params.skipSms}`,
    );
    const user = await this.userService.findOneByPhone(params.phone);
    let smsSuccess = null,
      emailSuccess = null;

    if (params.useEmail) {
      const context = {
        user,
        code: otp.code,
        phone: otp.phone,
        expiresAt: otp.expiresAt,
      };
      if (params.welcomeMessage) {
        await this.emailService.sendSignedUp(user.email, context);
      } else {
        await this.emailService.sendLoginCode(user.email, context);
      }
      emailSuccess = true;
    }

    if (!params.skipSms) {
      if (
        process.env.NEXT_PUBLIC_ENVIRONMENT === 'staging' ||
        process.env.NEXT_PUBLIC_ENVIRONMENT === 'development'
      ) {
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
      const msg = params.welcomeMessage
        ? `Welcome to causelist.co.ke . ${otp.code} is your code for logging in.`
        : `Login code for causelist.co.ke : ${otp.code}`;

      const smsResult = await this.smsService.sendMessage(user.phone, msg);
      smsSuccess = smsResult.success;
    }

    return {
      phone: otp.phone,
      expiresAt: otp.expiresAt,
      smsSuccess,
      emailSuccess,
    };
  }
}
