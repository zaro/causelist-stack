import { Processor, Process, OnQueueFailed } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job, JobOptions } from 'bull';
import k8s from '@kubernetes/client-node';
import { ConfigService } from '@nestjs/config';
import { S3Service } from '../s3/s3.service.js';
import { EnvForPod, K8sJobProcessorBase } from './k8s-job-processor-base.js';

export const PARSE_CORRECTED_JOB_QUEUE_NAME = 'parse-corrected';
export const PARSE_CORRECTED_JOB_DEFAULT_OPTIONS: JobOptions = {
  timeout: 60 * 60 * 1000,
  attempts: 1,
};

export interface ParseCorrectedJobParams {}

@Processor(PARSE_CORRECTED_JOB_QUEUE_NAME)
export class ParseCorrectedJobProcessor extends K8sJobProcessorBase {
  protected readonly logsPrefix = 'corrections/logs/';
  protected readonly nodeEnvProduction: boolean;
  protected readonly currentPodName: string;

  constructor(
    protected s3Service: S3Service,
    configService: ConfigService,
  ) {
    super(configService, new Logger(ParseCorrectedJobProcessor.name));
    this.nodeEnvProduction = configService.get('NODE_ENV') === 'production';
    this.currentPodName = configService.getOrThrow('CURRENT_POD_NAME');
  }

  getCurrentPodName() {
    return this.currentPodName;
  }

  async buildPodEnv(
    job: Job<ParseCorrectedJobParams>,
    currentPodEnv: k8s.V1EnvVar[],
    currentPodEnvFrom: k8s.V1EnvFromSource[],
  ): Promise<EnvForPod> {
    return {
      envFrom: currentPodEnvFrom,
      env: [...(Array.isArray(currentPodEnv) ? currentPodEnv : [])],
    };
  }

  buildPodName(job: Job<any>): string {
    return `parse-corrected-job-${job.id}`;
  }

  buildContainerImage(
    job: Job<any>,
    currentPodContainers: k8s.V1Container[],
  ): string {
    return currentPodContainers[0].image;
  }

  buildContainerName(job: Job<any>): string {
    return 'parse-corrected';
  }

  buildContainerCommand(
    job: Job<ParseCorrectedJobParams>,
  ): string[] | undefined {
    return [
      'yarn',
      `cli${this.nodeEnvProduction ? '' : ':dev'}`,
      'parse:corrections',
    ];
  }

  async handlePodLogs(
    job: Job<ParseCorrectedJobParams>,
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
  async startCrawlJob(job: Job<ParseCorrectedJobParams>) {
    const r = await this.startJobAsPod(job);
    if (r.failed) {
      throw new Error('Pod Failed');
    }
  }

  @OnQueueFailed()
  handleError(bullJob: Job<ParseCorrectedJobParams>, e: Error) {
    this.log.error(e);
  }
}
