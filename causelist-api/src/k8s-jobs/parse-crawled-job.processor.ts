import { Processor, Process, OnQueueFailed } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job, JobOptions } from 'bull';
import k8s from '@kubernetes/client-node';
import { readFileSync } from 'fs';
import stream from 'stream';
import { ConfigService } from '@nestjs/config';
import { S3Service } from '../s3/s3.service.js';
import { K8sJobProcessorBase } from './k8s-job-processor-base.js';

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
  protected podEnv: Record<string, string>;
  protected readonly nodeEnvProduction: boolean;
  protected readonly currentPodName: string;
  protected currentPodImages: string[];
  protected currentPodEnv: k8s.V1EnvVar[];
  protected currentPodEnvFrom: k8s.V1EnvFromSource[];

  constructor(
    protected s3Service: S3Service,
    configService: ConfigService,
  ) {
    super(new Logger(ParseCrawledJobProcessor.name));
    this.nodeEnvProduction = configService.get('NODE_ENV') === 'production';
    this.currentPodName = configService.getOrThrow('CURRENT_POD_NAME');
  }

  async onModuleInit(): Promise<void> {
    const currentPod = await this.coreApi.readNamespacedPod(
      this.currentPodName,
      this.namespace,
    );
    this.currentPodImages = currentPod.body.spec.containers.map((c) => c.image);
    this.currentPodEnv = currentPod.body.spec.containers[0].env;
    this.currentPodEnvFrom = currentPod.body.spec.containers[0].envFrom;
  }

  async buildPodEnv(job: Job<ParseJobParams>): Promise<Record<string, string>> {
    const env: Record<string, string> = {
      ...this.podEnv,
      FORCE_CRAWL_TIME: job.data.crawlTime,
    };
    return env;
  }

  buildPodName(job: Job<any>): string {
    return `parser-job-${job.id}`;
  }

  buildContainerImage(job: Job<any>): string {
    return this.currentPodImages[0];
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
  async beforePodCreate(k8sPod: k8s.V1Pod, job: Job<any>): Promise<void> {
    k8sPod.spec.containers[0].envFrom = this.currentPodEnvFrom;
    k8sPod.spec.containers[0].env.push(...this.currentPodEnv);
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
