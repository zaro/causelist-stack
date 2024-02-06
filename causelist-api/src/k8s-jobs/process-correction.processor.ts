import { Processor, Process, OnQueueFailed } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job, JobOptions } from 'bull';
import k8s from '@kubernetes/client-node';
import { ConfigService } from '@nestjs/config';
import { S3Service } from '../s3/s3.service.js';
import { EnvForPod, K8sJobProcessorBase } from './k8s-job-processor-base.js';

export const PROCESS_CORRECTION_JOB_QUEUE_NAME = 'process-correction-job';
export const PROCESS_CORRECTION_JOB_DEFAULT_OPTIONS: JobOptions = {
  timeout: 60 * 60 * 1000,
  attempts: 1,
};

export interface ProcessCorrectionJobParams {
  correctionTime: string;
  sha1: string;
}

@Processor(PROCESS_CORRECTION_JOB_QUEUE_NAME)
export class ProcessCorrectionJobProcessor extends K8sJobProcessorBase {
  protected readonly logsPrefix = 'corrections/logs/';
  protected readonly nodeEnvProduction: boolean;
  protected readonly currentPodName: string;
  protected readonly crawlerImage: string;

  constructor(
    protected s3Service: S3Service,
    configService: ConfigService,
  ) {
    super(new Logger(ProcessCorrectionJobProcessor.name));
    this.nodeEnvProduction = configService.get('NODE_ENV') === 'production';
    this.currentPodName = configService.getOrThrow('CURRENT_POD_NAME');
    this.crawlerImage = configService.getOrThrow('CRAWLER_IMAGE');
  }

  getCurrentPodName() {
    return this.currentPodName;
  }

  async buildPodEnv(
    job: Job<ProcessCorrectionJobParams>,
    currentPodEnv: k8s.V1EnvVar[],
    currentPodEnvFrom: k8s.V1EnvFromSource[],
  ): Promise<EnvForPod> {
    return {
      envFrom: currentPodEnvFrom,
      env: [
        ...(Array.isArray(currentPodEnv) ? currentPodEnv : []),
        { name: 'FORCE_CRAWL_TIME', value: job.data.correctionTime },
      ],
    };
  }

  buildPodName(job: Job<any>): string {
    return `correction-job-${job.id}`;
  }

  buildContainerImage(
    job: Job<any>,
    currentPodContainers: k8s.V1Container[],
  ): string {
    return this.crawlerImage;
  }

  buildContainerName(job: Job<any>): string {
    return 'correction';
  }

  buildContainerCommand(
    job: Job<ProcessCorrectionJobParams>,
  ): string[] | undefined {
    return [
      'yarn',
      `process-correction:${this.nodeEnvProduction ? 'prod' : 'dev'}`,
      'storage-correction/',
      job.data.sha1,
    ];
  }

  async handlePodLogs(
    job: Job<ProcessCorrectionJobParams>,
    logContent: string,
  ): Promise<any> {
    const podLogKey =
      this.logsPrefix + job.data.correctionTime + '/correction-pod.log.txt';

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
  async startCrawlJob(job: Job<ProcessCorrectionJobParams>) {
    return this.startJobAsPod(job);
  }

  @OnQueueFailed()
  handleError(bullJob: Job<ProcessCorrectionJobParams>, e: Error) {
    this.log.error(e);
  }
}
