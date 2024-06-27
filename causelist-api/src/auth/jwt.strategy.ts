import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserDataInRequest } from './request.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  static payloadToUser(payload: any): UserDataInRequest {
    return { id: payload.sub, role: payload.role };
  }
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromHeader('auth-token'),
        ExtractJwt.fromUrlQueryParameter('jwt'),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow('JWT_SECRET'),
    });
  }

  async validate(payload: any): Promise<UserDataInRequest> {
    return JwtStrategy.payloadToUser(payload);
  }
}
