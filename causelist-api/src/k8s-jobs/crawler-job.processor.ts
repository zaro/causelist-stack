import { Processor, Process, OnQueueFailed } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job, JobOptions } from 'bull';
import k8s from '@kubernetes/client-node';
import { readFileSync } from 'fs';
import stream from 'stream';
import { ConfigService } from '@nestjs/config';
import { S3Service } from '../s3/s3.service.js';
import { K8sJobProcessorBase } from './k8s-job-processor-base.js';

export const CRAWLER_JOB_QUEUE_NAME = 'crawler-job';
export const CRAWLER_JOB_DEFAULT_OPTIONS: JobOptions = {
  timeout: 60 * 60 * 1000,
  attempts: 1,
};

export interface CrawlJobParams {
  crawlerTest?: 'job' | 'dev' | 'no';
  crawlTime: string;
}

@Processor(CRAWLER_JOB_QUEUE_NAME)
export class CrawlerJobProcessor extends K8sJobProcessorBase {
  protected batchV1Api: k8s.BatchV1Api;
  protected crawlerImage: string;
  protected readonly logsPrefix = 'logs/';
  protected podEnv: Record<string, string>;

  constructor(
    protected s3Service: S3Service,
    configService: ConfigService,
  ) {
    super(new Logger(CrawlerJobProcessor.name));
    this.crawlerImage = configService.getOrThrow('CRAWLER_IMAGE');
    this.podEnv = {
      S3_ACCESS_KEY: configService.getOrThrow('S3_ACCESS_KEY'),
      S3_SECRET: configService.getOrThrow('S3_SECRET'),
      S3_CRAWLER_BUCKET: configService.getOrThrow('S3_CRAWLER_BUCKET'),
      S3_REGION: configService.getOrThrow('S3_REGION'),
      S3_ENDPOINT: configService.getOrThrow('S3_ENDPOINT'),
    };
  }

  async buildPodEnv(job: Job<CrawlJobParams>): Promise<Record<string, string>> {
    const env: Record<string, string> = {
      ...this.podEnv,
      FORCE_CRAWL_TIME: job.data.crawlTime,
    };
    if (job.data.crawlerTest && job.data.crawlerTest !== 'no') {
      env.CRAWLER_TEST = job.data.crawlerTest;
    }
    return env;
  }

  buildPodName(job: Job<any>): string {
    return `crawl-job-${job.id}`;
  }

  buildContainerImage(job: Job<any>): string {
    return this.crawlerImage;
  }

  buildContainerName(job: Job<any>): string {
    return 'crawler';
  }

  buildContainerCommand(job: Job<any>): string[] | undefined {
    return;
  }

  async handlePodLogs(
    job: Job<CrawlJobParams>,
    logContent: string,
  ): Promise<any> {
    const podLogKey =
      this.logsPrefix + job.data.crawlTime + '/crawler-pod.log.txt';

    await this.s3Service.uploadFile({
      content: logContent,
      key: podLogKey,
      mimeType: 'text/plain',
    });

    return {
      podLogKey,
    };
  }

  @Process()
  async startCrawlJob(job: Job<CrawlJobParams>) {
    return this.startJobAsPod(job);
  }

  @OnQueueFailed()
  handleError(bullJob: Job<CrawlJobParams>, e: Error) {
    this.log.error(e);
  }
}
