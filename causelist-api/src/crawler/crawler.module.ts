import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { S3Module } from '../s3/s3.module.js';
import {
  CRAWLER_JOB_QUEUE_NAME,
  CrawlerJobProcessor,
} from './crawler-job.processor.js';

@Module({
  imports: [
    S3Module,
    BullModule.registerQueue({
      name: CRAWLER_JOB_QUEUE_NAME,
    }),
  ],
  providers: [CrawlerJobProcessor],
  exports: [BullModule],
})
export class CrawlerModule {}
