import { Processor, Process, OnQueueFailed } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import k8s from '@kubernetes/client-node';
import { readFileSync } from 'fs';
import stream from 'stream';
import { ConfigService } from '@nestjs/config';
import { S3Service } from '../s3/s3.service.js';

export const CRAWLER_JOB_QUEUE_NAME = 'crawler-job';

export interface CrawlJobParams {
  something?: boolean;
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
    k8sJob.spec = {
      containers: [
        {
          name: containerName,
          image: this.crawlerImage,
          imagePullPolicy: 'IfNotPresent',
          env: [
            { name: 'CRAWLER_TEST', value: 'job' },
            {
              name: 'FORCE_CRAWL_TIME',
              value: crawlTime,
            },
          ].concat(
            Object.entries(this.podEnv).map(([name, value]) => ({
              name,
              value,
            })),
          ),
        },
      ],
      restartPolicy: 'Never',
    };
    this.log.log('Creating k8s job ');
    let podRes = await this.coreApi.createNamespacedPod(this.namespace, k8sJob);

    while (!POD_FINISHED_PHASES[podRes.body.status.phase]) {
      this.log.log(
        `k8s job status ${JSON.stringify(podRes.body.status.phase)}`,
      );
      await new Promise((ok) => setTimeout(ok, 5000));
      podRes = await this.coreApi.readNamespacedPodStatus(
        podRes.body.metadata.name,
        podRes.body.metadata.namespace,
      );
    }

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
    return {
      namespace: this.namespace,
      crawlerImage: this.crawlerImage,
      k8sPodData: podRes,
      podLogKey,
    };
  }

  @OnQueueFailed()
  handleError(bullJob: Job<CrawlJobParams>, e: Error) {
    console.dir(e);
    this.log.error(e);
  }
}
