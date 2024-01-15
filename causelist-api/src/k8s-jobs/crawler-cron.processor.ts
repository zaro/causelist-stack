import { Processor, Process, OnQueueFailed, InjectQueue } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job, JobOptions } from 'bull';
import type { Queue } from 'bull';
import k8s from '@kubernetes/client-node';
import { ConfigService } from '@nestjs/config';
import { S3Service } from '../s3/s3.service.js';
import { EnvForPod, K8sJobProcessorBase } from './k8s-job-processor-base.js';
import {
  CRAWLER_JOB_QUEUE_NAME,
  CrawlJobParams,
} from './crawler-job.processor.js';

export const CRAWLER_CRON_QUEUE_NAME = 'crawler-cron';
export const CRAWLER_CRON_DEFAULT_OPTIONS: JobOptions = {
  attempts: 1,
};

export interface CrawlerCronParams {}

@Processor(CRAWLER_CRON_QUEUE_NAME)
export class CrawlerCronProcessor {
  protected log = new Logger(CrawlerCronProcessor.name);
  constructor(
    @InjectQueue(CRAWLER_JOB_QUEUE_NAME)
    private crawlerQueue: Queue<CrawlJobParams>,
  ) {}

  @Process()
  async startCrawlCron(job: Job<CrawlerCronParams>) {
    const crawlTime = new Date().toISOString();
    this.log.log(`Queueing crawler job with crawlTime=${crawlTime}`);
    const crawlerJob = await this.crawlerQueue.add({
      crawlTime,
      startProcessorOnSuccess: true,
    });
    return {
      crawlerJobId: crawlerJob.id,
    };
  }

  @OnQueueFailed()
  handleError(bullJob: Job<CrawlerCronParams>, e: Error) {
    this.log.error(e);
  }
}
