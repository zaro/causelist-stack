import { SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SubscriptionTier } from '../interfaces/users.js';

export type RequiredSubscriptionTier = SubscriptionTier | 'ANY';

export const RequiresSubscription = Reflector.createDecorator<
  RequiredSubscriptionTier[]
>({
  transform(value) {
    if (value === undefined) {
      return ['ANY'];
    }
    return value;
  },
});
