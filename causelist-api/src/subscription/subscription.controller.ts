import { Controller, Get, Req } from '@nestjs/common';
import { SubscriptionService } from './subscription.service.js';
import { RequestWithUser } from '../auth/request.js';

@Controller('subscription')
export class SubscriptionController {
  constructor(protected service: SubscriptionService) {}

  @Get('all')
  async list(@Req() req: RequestWithUser) {
    return this.service.listForUser(req.user.id);
  }
}
