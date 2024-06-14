import { Processor, Process, OnQueueFailed, InjectQueue } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job, JobOptions } from 'bull';
import type { Queue } from 'bull';
import k8s from '@kubernetes/client-node';
import { ConfigService } from '@nestjs/config';
import { S3Service } from '../s3/s3.service.js';
import { EnvForPod, K8sJobProcessorBase } from './k8s-job-processor-base.js';
import {
  PARSE_CRAWLED_JOB_QUEUE_NAME,
  ParseJobParams,
} from './parse-crawled-job.processor.js';

export const CRAWLER_JOB_QUEUE_NAME = 'crawler-job';
export const CRAWLER_JOB_DEFAULT_OPTIONS: JobOptions = {
  timeout: 6 * 60 * 60 * 1000,
  attempts: 1,
};

export interface CrawlJobParams {
  crawlerTest?: 'job' | 'dev' | 'no';
  crawlTime: string;
  startProcessorOnSuccess: boolean;
}

@Processor(CRAWLER_JOB_QUEUE_NAME)
export class CrawlerJobProcessor extends K8sJobProcessorBase {
  protected batchV1Api: k8s.BatchV1Api;
  protected crawlerImage: string;
  protected readonly logsPrefix = 'logs/';
  protected podEnv: Record<string, string>;
  protected readonly currentPodName: string;

  constructor(
    @InjectQueue(PARSE_CRAWLED_JOB_QUEUE_NAME)
    private parserQueue: Queue<ParseJobParams>,
    protected s3Service: S3Service,
    configService: ConfigService,
  ) {
    super(configService, new Logger(CrawlerJobProcessor.name));
    this.currentPodName = configService.getOrThrow('CURRENT_POD_NAME');

    this.crawlerImage = configService.getOrThrow('CRAWLER_IMAGE');
    this.podEnv = {
      S3_ACCESS_KEY: configService.getOrThrow('S3_ACCESS_KEY'),
      S3_SECRET: configService.getOrThrow('S3_SECRET'),
      S3_CRAWLER_BUCKET: configService.getOrThrow('S3_CRAWLER_BUCKET'),
      S3_REGION: configService.getOrThrow('S3_REGION'),
      S3_ENDPOINT: configService.getOrThrow('S3_ENDPOINT'),
    };
  }

  getCurrentPodName() {
    return this.currentPodName;
  }

  async buildPodEnv(
    job: Job<any>,
    currentPodEnv: k8s.V1EnvVar[],
    currentPodEnvFrom: k8s.V1EnvFromSource[],
  ): Promise<EnvForPod> {
    const envRecord: Record<string, string> = {
      ...this.podEnv,
      FORCE_CRAWL_TIME: job.data.crawlTime,
    };
    if (job.data.crawlerTest && job.data.crawlerTest !== 'no') {
      envRecord.CRAWLER_TEST = job.data.crawlerTest;
    }
    const env = Object.entries(envRecord).map(([name, value]) => ({
      name,
      value,
    }));

    return { env };
  }

  buildPodName(job: Job<any>): string {
    return `crawl-job-${job.id}`;
  }

  buildContainerImage(
    job: Job<any>,
    currentPodContainers: k8s.V1Container[],
  ): string {
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
    const result = await this.startJobAsPod(job);
    let parserJobId = null;
    if (job.data.startProcessorOnSuccess && !result.failed) {
      const parserJob = await this.parserQueue.add({
        crawlTime: job.data.crawlTime,
      });
      parserJobId = parserJob.id;
    }
    return {
      ...result,
      parserJobId,
    };
  }

  @OnQueueFailed()
  handleError(bullJob: Job<CrawlJobParams>, e: Error) {
    this.log.error(e);
  }
}
