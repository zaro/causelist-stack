import {
  BadRequestException,
  Controller,
  Get,
  Header,
  Param,
  Post,
} from '@nestjs/common';
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
import {
  PARSE_CORRECTED_JOB_QUEUE_NAME,
  ParseCorrectedJobParams,
} from './parse-corrected.processor.js';
import { CacheTTL } from '@nestjs/cache-manager';
import { S3Service } from '../s3/s3.service.js';
import { AnsiUp } from 'ansi_up';

@Controller('k8s-jobs')
export class K8sJobsController {
  constructor(
    @InjectModel(InfoFile.name) private infoFileModel: Model<InfoFile>,
    @InjectQueue(PROCESS_CORRECTION_JOB_QUEUE_NAME)
    private processCorrectionQueue: Queue<ProcessCorrectionJobParams>,
    @InjectQueue(PARSE_CORRECTED_JOB_QUEUE_NAME)
    private parseCorrectedQueue: Queue<ParseCorrectedJobParams>,
    protected s3Service: S3Service,
  ) {}

  @CacheTTL(1)
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

    const parseJobs = await this.parseCorrectedQueue.getJobs([
      'completed',
      'waiting',
      'active',
      'delayed',
      'failed',
      'paused',
    ]);

    const jobsWithStatus = await Promise.all(
      jobs.map(async (job) => ({ state: await job.getState(), job: job })),
    );

    const parseJobsWithStatus = await Promise.all(
      parseJobs.map(async (job) => ({ state: await job.getState(), job: job })),
    );

    const allSha1 = jobs.map((j) => j.data.sha1);
    const infoFiles = await this.infoFileModel.find({ sha1: { $in: allSha1 } });
    const fileNamesBySha1 = infoFiles.reduce(
      (r, f) => ({ ...r, [f.sha1]: f.fileName }),
      {},
    );

    const result = jobsWithStatus
      .map((c) => ({
        type: 'correction',
        id: c.job.id.toString(),
        status: c.state,
        sha1: c.job.data.sha1,
        fileName: fileNamesBySha1[c.job.data.sha1],
        finishedOn: c.job.finishedOn,
      }))
      .concat(
        parseJobsWithStatus.map((c) => ({
          type: 'parse',
          id: c.job.id.toString(),
          status: c.state,
          sha1: '-',
          fileName: '-',
          finishedOn: c.job.finishedOn,
        })),
      );

    return result;
  }

  @CacheTTL(1)
  @Get('job-log/:type/:id')
  async jobPodLog(
    @Param('type') type: string,
    @Param('id') id: string,
  ): Promise<string> {
    // let q: Queue<ParseCorrectedJobParams | ProcessCorrectionJobParams>;
    let p: string;
    let l: string;
    switch (type) {
      case 'parse':
        // q = this.parseCorrectedQueue;
        p = `parse-corrected-job-`;
        l = 'parse-corrected-pod.log.txt';
        break;
      case 'correction':
        // q = this.processCorrectionQueue;
        p = `correction-job-`;
        l = 'correction-pod.log.txt';
        break;
      default:
        throw new BadRequestException(`Invalid type : '${type}'`);
    }
    const logKey = `corrections/logs/${p}${id}/${l}`;
    let logHtml: string;
    try {
      const s3r = await this.s3Service.downloadFile({
        key: logKey,
      });
      const data = s3r.data.toString();
      var ansiUp = new AnsiUp();

      logHtml = ansiUp.ansi_to_html(data);
    } catch (e) {
      logHtml = `failed to get ${logKey} : ${e.toString()}`;
    }

    return `
    <!DOCTYPE html>
    <html>
      <head>
      </head>
      <body style="background-color: black; color: white;">
      <pre>${logHtml}</pre>
      </body>
    </html>
    `;
  }

  @Post('run-parse-corrections')
  @Header('Content-Type', 'application/json')
  async runParseCorrections(): Promise<boolean> {
    const r = await this.parseCorrectedQueue.add({});
    return !!r;
  }
}
