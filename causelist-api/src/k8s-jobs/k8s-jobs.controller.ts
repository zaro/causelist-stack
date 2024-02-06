import { Controller, Get } from '@nestjs/common';
import {
  PROCESS_CORRECTION_JOB_QUEUE_NAME,
  ProcessCorrectionJobParams,
} from './process-correction.processor.js';
import { InjectQueue } from '@nestjs/bull';
import type { Job, Queue } from 'bull';
import { InjectModel } from '@nestjs/mongoose';
import { InfoFile } from '../schemas/info-file.schema.js';
import { Model } from 'mongoose';
import { ICorrectionJob } from '../interfaces/jobs.js';

@Controller('k8s-jobs')
export class K8sJobsController {
  constructor(
    @InjectModel(InfoFile.name) private infoFileModel: Model<InfoFile>,
    @InjectQueue(PROCESS_CORRECTION_JOB_QUEUE_NAME)
    private processCorrectionQueue: Queue<ProcessCorrectionJobParams>,
  ) {}

  @Get('corrections')
  async listCorrectionJobs(): Promise<ICorrectionJob[]> {
    const jobs = await this.processCorrectionQueue.getJobs([
      'completed',
      'waiting',
      'active',
      'delayed',
      'failed',
      'paused',
    ]);
    const allSha1 = jobs.map((j) => j.data.sha1);

    const jobsWithStatus = await Promise.all(
      jobs.map(async (job) => ({ state: await job.getState(), job: job })),
    );

    const infoFiles = await this.infoFileModel.find({ sha1: { $in: allSha1 } });
    const fileNamesBySha1 = infoFiles.reduce(
      (r, f) => ({ ...r, [f.sha1]: f.fileName }),
      {},
    );

    const result = jobsWithStatus.map((c) => ({
      type: 'correction',
      id: c.job.id.toString(),
      status: c.state,
      sha1: c.job.data.sha1,
      fileName: fileNamesBySha1[c.job.data.sha1],
      finishedOn: c.job.finishedOn,
    }));

    return result;
  }
}
