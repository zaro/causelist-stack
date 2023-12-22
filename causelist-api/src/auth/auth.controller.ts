import {
  Controller,
  Post,
  UseGuards,
  Request,
  Param,
  Logger,
  Body,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service.js';
import { Public } from './public.decorator.js';
import { UsersService } from '../users/users.service.js';
import { IsPhoneNumber } from 'class-validator';

export class SendOtpParams {
  @IsPhoneNumber('KE')
  phone: string;
}

@Controller('auth')
export class AuthController {
  private readonly log = new Logger(AuthController.name);

  constructor(
    private authService: AuthService,
    private userService: UsersService,
  ) {}

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
    console.log(params);
    const otp = await this.userService.makeOtp(params.phone);
    if (!otp) {
      return {
        phone: params.phone,
        userMissing: true,
      };
    }
    this.log.log(`OTP for ${params.phone} => ${otp.code}`);
    return {
      phone: otp.phone,
      expiresAt: otp.expiresAt,
    };
  }
}
