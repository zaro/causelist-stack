import { Strategy } from 'passport-json';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service.js';

@Injectable()
export class OtpStrategy extends PassportStrategy(Strategy, 'otp') {
  constructor(private authService: AuthService) {
    super({
      usernameProp: 'phone',
      passwordProp: 'otp',
    });
  }

  async validate(phone: string, code: string): Promise<any> {
    const user = await this.authService.validateUser(phone, code);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
