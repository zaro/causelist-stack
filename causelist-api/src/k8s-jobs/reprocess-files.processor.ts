import { Processor, Process, OnQueueFailed } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job, JobOptions } from 'bull';
import k8s from '@kubernetes/client-node';
import { ConfigService } from '@nestjs/config';
import { S3Service } from '../s3/s3.service.js';
import { EnvForPod, K8sJobProcessorBase } from './k8s-job-processor-base.js';

export const REPROCESS_FILES_JOB_QUEUE_NAME = 'reprocess-files';
export const REPROCESS_FILES_JOB_DEFAULT_OPTIONS: JobOptions = {
  timeout: 60 * 60 * 1000,
  attempts: 1,
};

export interface ReprocessFilesJobParams {
  sha1: string[];
}

@Processor(REPROCESS_FILES_JOB_QUEUE_NAME)
export class ReprocessFilesJobProcessor extends K8sJobProcessorBase {
  protected readonly logsPrefix = 'reprocess/logs/';
  protected readonly nodeEnvProduction: boolean;
  protected readonly currentPodName: string;
  protected crawlerImage: string;

  protected podEnv: Record<string, string>;

  constructor(
    protected s3Service: S3Service,
    configService: ConfigService,
  ) {
    super(configService, new Logger(ReprocessFilesJobProcessor.name));
    this.nodeEnvProduction = configService.get('NODE_ENV') === 'production';
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
    job: Job<ReprocessFilesJobParams>,
    currentPodEnv: k8s.V1EnvVar[],
    currentPodEnvFrom: k8s.V1EnvFromSource[],
  ): Promise<EnvForPod> {
    const env = Object.entries(this.podEnv).map(([name, value]) => ({
      name,
      value,
    }));

    return { env };
  }

  buildPodName(job: Job<any>): string {
    return `reprocess-files-${job.id}`;
  }

  buildContainerImage(
    job: Job<any>,
    currentPodContainers: k8s.V1Container[],
  ): string {
    return this.crawlerImage;
  }

  buildContainerName(job: Job<any>): string {
    return 'reprocess-files';
  }

  buildContainerCommand(
    job: Job<ReprocessFilesJobParams>,
  ): string[] | undefined {
    return [
      'yarn',
      `reprocess-files:${this.nodeEnvProduction ? 'prod' : 'dev'}`,
      'storage-correction/',
      job.data.sha1.join(','),
    ];
  }

  async handlePodLogs(
    job: Job<ReprocessFilesJobParams>,
    logContent: string,
  ): Promise<any> {
    const podLogKey =
      this.logsPrefix +
      this.buildPodName(job) +
      '/' +
      this.buildContainerName(job) +
      '-pod.log.txt';

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
  async startCrawlJob(job: Job<ReprocessFilesJobParams>) {
    const r = await this.startJobAsPod(job);
    if (r.failed) {
      throw new Error('Pod Failed');
    }
  }

  @OnQueueFailed()
  handleError(bullJob: Job<ReprocessFilesJobParams>, e: Error) {
    this.log.error(e);
  }
}
