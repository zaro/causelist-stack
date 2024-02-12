import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Subscription } from '../schemas/subscription.schema.js';
import { Model, Types } from 'mongoose';
import { SubscriptionTier } from '../interfaces/users.js';

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectModel(Subscription.name)
    protected subscriptionModel: Model<Subscription>,
  ) {}

  async listForUser(userId: string) {
    return this.subscriptionModel.find({
      user: new Types.ObjectId(userId),
    });
  }

  async newForUser(
    userId: string,
    numUnits: number,
    unitType: 'day' | 'week' | 'month' | 'year',
    paid?: number,
    from?: Date,
  ) {
    if (!from) {
      from = new Date();
    }
    const to = new Date(from);
    switch (unitType) {
      case 'day':
        to.setDate(to.getDate() + numUnits);
        break;
      case 'week':
        to.setDate(to.getDate() + numUnits * 7);
        break;
      case 'month':
        to.setMonth(to.getMonth() + numUnits);
        break;
      case 'year':
        to.setFullYear(to.getFullYear() + numUnits);
        break;
    }

    const r = new this.subscriptionModel({
      from,
      to,
      tier: SubscriptionTier.STANDARD,
      paid,
      user: new Types.ObjectId(userId),
    });
    await r.save();
    return r;
  }
}
