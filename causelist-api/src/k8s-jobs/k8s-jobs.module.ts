import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { S3Module } from '../s3/s3.module.js';
import {
  CRAWLER_JOB_DEFAULT_OPTIONS,
  CRAWLER_JOB_QUEUE_NAME,
  CrawlerJobProcessor,
} from './crawler-job.processor.js';
import {
  PARSE_CRAWLED_JOB_DEFAULT_OPTIONS,
  PARSE_CRAWLED_JOB_QUEUE_NAME,
  ParseCrawledJobProcessor,
} from './parse-crawled-job.processor.js';

@Module({
  imports: [
    S3Module,
    BullModule.registerQueue(
      {
        name: CRAWLER_JOB_QUEUE_NAME,
        defaultJobOptions: CRAWLER_JOB_DEFAULT_OPTIONS,
      },
      {
        name: PARSE_CRAWLED_JOB_QUEUE_NAME,
        defaultJobOptions: PARSE_CRAWLED_JOB_DEFAULT_OPTIONS,
      },
    ),
  ],
  providers: [CrawlerJobProcessor, ParseCrawledJobProcessor],
  exports: [BullModule],
})
export class K8sJobsModule {}
