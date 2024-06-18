import { Module } from '@nestjs/common';
import { MeiliService } from './meili.service.js';

@Module({
  providers: [MeiliService],
  exports: [MeiliService],
})
export class MeiliModule {}
