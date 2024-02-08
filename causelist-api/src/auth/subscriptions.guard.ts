import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RequestWithUser } from './request.js';
import { RequiresSubscription } from './subscription.decorator.js';
import { SubscriptionTier } from '../interfaces/users.js';
import { InjectModel } from '@nestjs/mongoose';
import { Subscription } from '../schemas/subscription.schema.js';
import { Model } from 'mongoose';

@Injectable()
export class SubscriptionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectModel(Subscription.name)
    private subscriptionModel: Model<Subscription>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.get(
      RequiresSubscription,
      context.getHandler(),
    );
    if (!required) {
      return true;
    }
    const requiredSet = new Set(
      required.includes('ANY') ? Object.values(SubscriptionTier) : required,
    );

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;
    const now = new Date();
    const active = await this.subscriptionModel
      .distinct('tier', {
        user: user.id,
        to: { $lte: now },
        from: { $gte: now },
      })
      .exec();
    for (const r of requiredSet) {
      if (active.includes(r)) {
        return true;
      }
    }
    throw new HttpException('Subscription Required', 402);
  }
}
