import { Processor, Process, OnQueueFailed } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job, JobOptions } from 'bull';
import k8s from '@kubernetes/client-node';
import { ConfigService } from '@nestjs/config';
import { S3Service } from '../s3/s3.service.js';
import { EnvForPod, K8sJobProcessorBase } from './k8s-job-processor-base.js';

export const PARSE_CRAWLED_JOB_QUEUE_NAME = 'parse-courts-job';
export const PARSE_CRAWLED_JOB_DEFAULT_OPTIONS: JobOptions = {
  timeout: 60 * 60 * 1000,
  attempts: 1,
};

export interface ParseJobParams {
  crawlTime: string;
}

@Processor(PARSE_CRAWLED_JOB_QUEUE_NAME)
export class ParseCrawledJobProcessor extends K8sJobProcessorBase {
  protected readonly logsPrefix = 'logs/';
  protected readonly nodeEnvProduction: boolean;
  protected readonly currentPodName: string;

  constructor(
    protected s3Service: S3Service,
    configService: ConfigService,
  ) {
    super(new Logger(ParseCrawledJobProcessor.name));
    this.nodeEnvProduction = configService.get('NODE_ENV') === 'production';
    this.currentPodName = configService.getOrThrow('CURRENT_POD_NAME');
  }

  getCurrentPodName() {
    return this.currentPodName;
  }

  async buildPodEnv(
    job: Job<ParseJobParams>,
    currentPodEnv: k8s.V1EnvVar[],
    currentPodEnvFrom: k8s.V1EnvFromSource[],
  ): Promise<EnvForPod> {
    return {
      envFrom: currentPodEnvFrom,
      env: [
        ...(Array.isArray(currentPodEnv) ? currentPodEnv : []),
        { name: 'FORCE_CRAWL_TIME', value: job.data.crawlTime },
      ],
    };
  }

  buildPodName(job: Job<any>): string {
    return `parser-job-${job.id}`;
  }

  buildContainerImage(
    job: Job<any>,
    currentPodContainers: k8s.V1Container[],
  ): string {
    return currentPodContainers[0].image;
  }

  buildContainerName(job: Job<any>): string {
    return 'parser';
  }

  buildContainerCommand(job: Job<ParseJobParams>): string[] | undefined {
    return [
      'yarn',
      `cli${this.nodeEnvProduction ? '' : ':dev'}`,
      'parse:crawled',
      job.data.crawlTime,
    ];
  }

  async handlePodLogs(
    job: Job<ParseJobParams>,
    logContent: string,
  ): Promise<any> {
    const podLogKey =
      this.logsPrefix + job.data.crawlTime + '/parser-pod.log.txt';

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
  async startCrawlJob(job: Job<ParseJobParams>) {
    return this.startJobAsPod(job);
  }

  @OnQueueFailed()
  handleError(bullJob: Job<ParseJobParams>, e: Error) {
    this.log.error(e);
  }
}
