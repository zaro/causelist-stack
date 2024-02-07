import { Controller, Get, Query } from '@nestjs/common';

@Controller('payments')
export class PaymentsController {
  @Get('ipay-africa-callback')
  async ipayAfricaCallback(@Query() params) {
    console.log(params);
    return 'ok';
  }
}
