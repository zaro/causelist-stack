import { Logger, Module } from '@nestjs/common';
import { BullModule, InjectQueue } from '@nestjs/bull';
import { S3Module } from '../s3/s3.module.js';
import {
  CRAWLER_JOB_DEFAULT_OPTIONS,
  CRAWLER_JOB_QUEUE_NAME,
  CrawlJobParams,
  CrawlerJobProcessor,
} from './crawler-job.processor.js';
import {
  PARSE_CRAWLED_JOB_DEFAULT_OPTIONS,
  PARSE_CRAWLED_JOB_QUEUE_NAME,
  ParseCrawledJobProcessor,
} from './parse-crawled-job.processor.js';
import type { Queue } from 'bull';
import {
  CRAWLER_CRON_DEFAULT_OPTIONS,
  CRAWLER_CRON_QUEUE_NAME,
  CrawlerCronParams,
} from './crawler-cron.processor.js';

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
      {
        name: CRAWLER_CRON_QUEUE_NAME,
        defaultJobOptions: CRAWLER_CRON_DEFAULT_OPTIONS,
      },
    ),
  ],
  providers: [CrawlerJobProcessor, ParseCrawledJobProcessor],
  exports: [BullModule],
})
export class K8sJobsModule {
  protected log = new Logger(K8sJobsModule.name);

  constructor(
    @InjectQueue(CRAWLER_CRON_QUEUE_NAME)
    private crawlerCronQueue: Queue<CrawlerCronParams>,
  ) {}

  onApplicationBootstrap() {
    const cron = '1 1 * * *'; // each work day at 01:01
    this.log.log(`Adding crawler cron job with cron: ${cron}`);
    this.crawlerCronQueue.add(
      'crawler-cron',
      {},
      {
        repeat: { cron },
      },
    );
  }
}
