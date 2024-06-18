import { Module } from '@nestjs/common';
import { CasesController } from './cases.controller.js';
import { ManticoreModule } from '../manticore/manticore.module.js';
import { MeiliModule } from '../meili/meili.module.js';
import { S3Module } from '../s3/s3.module.js';

@Module({
  controllers: [CasesController],
  imports: [MeiliModule, S3Module],
})
export class CasesModule {}
