import { Module } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { UsersModule } from '../users/users.module.js';
import { OtpStrategy } from './otp.strategy.js';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller.js';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy.js';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { SmsApiModule } from '../sms-api/sms-api.module.js';
import { ConfigService } from '@nestjs/config';
import { RolesGuard } from './roles.guard.js';
import { EmailModule } from '../email/email.module.js';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Subscription,
  SubscriptionSchema,
} from '../schemas/subscription.schema.js';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    SmsApiModule,
    EmailModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow('JWT_SECRET'),
        signOptions: { expiresIn: '90d' },
      }),
    }),
    MongooseModule.forFeature([
      { name: Subscription.name, schema: SubscriptionSchema },
    ]),
  ],
  providers: [
    AuthService,
    OtpStrategy,
    JwtStrategy,
    {
      // Make jwt Auth guard global
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      // Make Roles guard global
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
  controllers: [AuthController],
})
export class AuthModule {}
