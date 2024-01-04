import { Module } from '@nestjs/common';
import { SmsApiService } from './sms-api.service.js';
import { HttpModule } from '@nestjs/axios';
import { ZettatelSmsApiService } from './zettatel.sms-api.service.js';
import { DebugLogSmsApiService } from './debug-log.sms-api.service.js';

@Module({
  imports: [HttpModule],
  providers: [SmsApiService, ZettatelSmsApiService, DebugLogSmsApiService],
  exports: [SmsApiService],
})
export class SmsApiModule {}
