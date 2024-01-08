import { Processor, Process, OnQueueFailed } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job, JobOptions } from 'bull';
import k8s from '@kubernetes/client-node';
import { readFileSync } from 'fs';
import stream from 'stream';
import { ConfigService } from '@nestjs/config';
import { S3Service } from '../s3/s3.service.js';

export const CRAWLER_JOB_QUEUE_NAME = 'crawler-job';
export const CRAWLER_JOB_DEFAULT_OPTIONS: JobOptions = {
  timeout: 60 * 60 * 1000,
  attempts: 1,
};

export interface CrawlJobParams {
  crawlerTest?: 'job' | 'dev' | 'no';
}

const POD_FINISHED_PHASES = {
  Succeeded: true,
  Failed: true,
};

@Processor(CRAWLER_JOB_QUEUE_NAME)
export class CrawlerJobProcessor {
  protected log = new Logger(CrawlerJobProcessor.name);
  protected batchV1Api: k8s.BatchV1Api;
  protected coreApi: k8s.CoreV1Api;
  protected k8sLog: k8s.Log;
  protected readonly namespace: string;
  protected readonly crawlerImage: string;
  protected readonly logsPrefix = 'logs/';
  protected podEnv: Record<string, string>;

  constructor(
    protected s3Service: S3Service,
    configService: ConfigService,
  ) {
    const kc = new k8s.KubeConfig();
    kc.loadFromCluster();

    this.k8sLog = new k8s.Log(kc);
    this.batchV1Api = kc.makeApiClient(k8s.BatchV1Api);
    this.coreApi = kc.makeApiClient(k8s.CoreV1Api);
    this.namespace = readFileSync(
      '/var/run/secrets/kubernetes.io/serviceaccount/namespace',
    ).toString();
    this.crawlerImage = configService.getOrThrow('CRAWLER_IMAGE');
    this.podEnv = {
      S3_ACCESS_KEY: configService.getOrThrow('S3_ACCESS_KEY'),
      S3_SECRET: configService.getOrThrow('S3_SECRET'),
      S3_CRAWLER_BUCKET: configService.getOrThrow('S3_CRAWLER_BUCKET'),
      S3_REGION: configService.getOrThrow('S3_REGION'),
      S3_ENDPOINT: configService.getOrThrow('S3_ENDPOINT'),
    };
  }

  @Process()
  async startCrawlJob(job: Job<CrawlJobParams>) {
    this.log.log('Starting crawler job with data ');
    const k8sJob = new k8s.V1Pod();
    const name = `crawl-job-${job.id}`;
    const containerName = 'crawler';
    const crawlTime = new Date().toISOString();
    k8sJob.apiVersion = 'v1';
    k8sJob.kind = 'Pod';
    k8sJob.metadata = {
      name,
    };
    const env = [
      {
        name: 'FORCE_CRAWL_TIME',
        value: crawlTime,
      },
    ].concat(
      Object.entries(this.podEnv).map(([name, value]) => ({
        name,
        value,
      })),
    );
    if (job.data.crawlerTest && job.data.crawlerTest !== 'no') {
      env.push({ name: 'CRAWLER_TEST', value: job.data.crawlerTest });
    }
    k8sJob.spec = {
      containers: [
        {
          name: containerName,
          image: this.crawlerImage,
          imagePullPolicy: 'IfNotPresent',
          env,
        },
      ],
      restartPolicy: 'Never',
    };
    this.log.log(`Creating k8s pod : ${this.namespace}/${name}`);
    let podRes = await this.coreApi.createNamespacedPod(this.namespace, k8sJob);

    while (!POD_FINISHED_PHASES[podRes.body.status.phase]) {
      await new Promise((ok) => setTimeout(ok, 5000));
      podRes = await this.coreApi.readNamespacedPodStatus(
        podRes.body.metadata.name,
        podRes.body.metadata.namespace,
      );
    }
    this.log.log(`K8s pod status ${JSON.stringify(podRes.body.status.phase)}`);

    const logStream = new stream.PassThrough();

    const logReq = await this.k8sLog.log(
      this.namespace,
      name,
      containerName,
      logStream,
      {},
    );

    const logBuffers = [];
    for await (const chunk of logStream) {
      logBuffers.push(chunk);
    }

    const logContent = Buffer.concat(logBuffers).toString();
    const podLogKey = this.logsPrefix + crawlTime + '/crawler-pod.log.txt';
    await this.s3Service.uploadFile({
      content: logContent,
      key: podLogKey,
      mimeType: 'text/plain',
    });

    // Delete pod if run was successful
    if (podRes.body.status.phase === 'Succeeded') {
      await this.coreApi.deleteNamespacedPod(
        podRes.body.metadata.name,
        podRes.body.metadata.namespace,
      );
    }

    return {
      namespace: this.namespace,
      name,
      crawlerImage: this.crawlerImage,
      k8sPodData: podRes.body,
      podLogKey,
    };
  }

  @OnQueueFailed()
  handleError(bullJob: Job<CrawlJobParams>, e: Error) {
    this.log.error(e);
  }
}
