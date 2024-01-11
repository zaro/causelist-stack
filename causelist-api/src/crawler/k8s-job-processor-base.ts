import { Processor, Process, OnQueueFailed } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job, JobOptions } from 'bull';
import k8s from '@kubernetes/client-node';
import { readFileSync } from 'fs';
import stream from 'stream';
import { ConfigService } from '@nestjs/config';

const POD_FINISHED_PHASES = {
  Succeeded: true,
  Failed: true,
};

export interface StartJobAsPodParams {
  namePrefix: string;
  containerName: string;
  containerImage: string;
}

export abstract class K8sJobProcessorBase {
  protected coreApi: k8s.CoreV1Api;
  protected k8sLog: k8s.Log;
  protected readonly namespace: string;

  constructor(protected log: Logger) {
    const kc = new k8s.KubeConfig();
    kc.loadFromCluster();

    this.k8sLog = new k8s.Log(kc);
    this.coreApi = kc.makeApiClient(k8s.CoreV1Api);
    this.namespace = readFileSync(
      '/var/run/secrets/kubernetes.io/serviceaccount/namespace',
    ).toString();
  }

  abstract buildPodEnv(job: Job<any>): Promise<Record<string, string>>;
  abstract buildPodName(job: Job<any>): string;
  abstract buildContainerImage(job: Job<any>): string;
  abstract buildContainerName(job: Job<any>): string;

  abstract handlePodLogs(job: Job<any>, logContent: string): Promise<any>;

  async startJobAsPod(job: Job<any>) {
    this.log.log('Starting job as pod with data: ', job.data);
    const k8sJob = new k8s.V1Pod();
    const name = this.buildPodName(job);
    k8sJob.apiVersion = 'v1';
    k8sJob.kind = 'Pod';
    k8sJob.metadata = {
      name,
    };
    const podEnv = await this.buildPodEnv(job);
    const env = Object.entries(podEnv).map(([name, value]) => ({
      name,
      value,
    }));
    const containerImage = this.buildContainerImage(job);
    const containerName = this.buildContainerName(job);
    k8sJob.spec = {
      containers: [
        {
          name: containerName,
          image: containerImage,
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
    const logs = await this.handlePodLogs(job, logContent);

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
      containerImage,
      containerName,
      k8sPodData: podRes.body,
      logs,
    };
  }
}
