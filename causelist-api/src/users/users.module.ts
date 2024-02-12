import { Module } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../schemas/user.schema.js';
import { Otp, OtpSchema } from '../schemas/otp.schema.js';
import { UsersController } from './users.controller.js';
import { SubscriptionModule } from '../subscription/subscription.module.js';

@Module({
  imports: [
    SubscriptionModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Otp.name, schema: OtpSchema },
    ]),
  ],
  providers: [UsersService],
  exports: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
