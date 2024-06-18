import { Module } from '@nestjs/common';
import { ManticoreService } from './manticore.service.js';

@Module({
  providers: [ManticoreService],
  exports: [ManticoreService],
})
export class ManticoreModule {}
