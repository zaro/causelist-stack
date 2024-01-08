import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';

export const CRAWLER_JOB_QUEUE_NAME = 'crawler-job';

export interface CrawlJobParams {
  something?: boolean;
}

@Processor(CRAWLER_JOB_QUEUE_NAME)
export class CrawlerJobProcessor {
  protected log = new Logger(CrawlerJobProcessor.name);
  @Process()
  async startCrawlJob(job: Job<CrawlJobParams>) {
    this.log.log('Starting crawler job with data ');
    return { podName: 'something', something: job.data.something };
  }
}
