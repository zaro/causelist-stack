import { Logger, Module } from '@nestjs/common';
import { BullModule, InjectQueue } from '@nestjs/bull';
import { S3Module } from '../s3/s3.module.js';
import {
  CRAWLER_JOB_DEFAULT_OPTIONS,
  CRAWLER_JOB_QUEUE_NAME,
  CrawlJobParams,
  CrawlerJobProcessor,
} from './crawler-job.processor.js';
import {
  PARSE_CRAWLED_JOB_DEFAULT_OPTIONS,
  PARSE_CRAWLED_JOB_QUEUE_NAME,
  ParseCrawledJobProcessor,
} from './parse-crawled-job.processor.js';
import type { Queue } from 'bull';
import {
  CRAWLER_CRON_DEFAULT_OPTIONS,
  CRAWLER_CRON_QUEUE_NAME,
  CrawlerCronParams,
  CrawlerCronProcessor,
} from './crawler-cron.processor.js';
import { K8sJobsController } from './k8s-jobs.controller.js';
import {
  PROCESS_CORRECTION_JOB_DEFAULT_OPTIONS,
  PROCESS_CORRECTION_JOB_QUEUE_NAME,
  ProcessCorrectionJobProcessor,
} from './process-correction.processor.js';
import { MongooseModule } from '@nestjs/mongoose';
import { InfoFile, InfoFileSchema } from '../schemas/info-file.schema.js';
import {
  PARSE_CORRECTED_JOB_DEFAULT_OPTIONS,
  PARSE_CORRECTED_JOB_QUEUE_NAME,
  ParseCorrectedJobProcessor,
} from './parse-corrected.processor.js';

@Module({
  imports: [
    S3Module,
    MongooseModule.forFeature([
      { name: InfoFile.name, schema: InfoFileSchema },
    ]),
    BullModule.registerQueue(
      {
        name: CRAWLER_JOB_QUEUE_NAME,
        defaultJobOptions: CRAWLER_JOB_DEFAULT_OPTIONS,
      },
      {
        name: PARSE_CRAWLED_JOB_QUEUE_NAME,
        defaultJobOptions: PARSE_CRAWLED_JOB_DEFAULT_OPTIONS,
      },
      {
        name: PROCESS_CORRECTION_JOB_QUEUE_NAME,
        defaultJobOptions: PROCESS_CORRECTION_JOB_DEFAULT_OPTIONS,
      },
      {
        name: PARSE_CORRECTED_JOB_QUEUE_NAME,
        defaultJobOptions: PARSE_CORRECTED_JOB_DEFAULT_OPTIONS,
      },
      {
        name: CRAWLER_CRON_QUEUE_NAME,
        defaultJobOptions: CRAWLER_CRON_DEFAULT_OPTIONS,
      },
    ),
  ],
  providers: [
    CrawlerJobProcessor,
    ParseCrawledJobProcessor,
    CrawlerCronProcessor,
    ProcessCorrectionJobProcessor,
    ParseCorrectedJobProcessor,
  ],
  exports: [BullModule],
  controllers: [K8sJobsController],
})
export class K8sJobsModule {
  protected log = new Logger(K8sJobsModule.name);

  constructor(
    @InjectQueue(CRAWLER_CRON_QUEUE_NAME)
    private crawlerCronQueue: Queue<CrawlerCronParams>,
  ) {}

  async findRepeatableJob(jobId: string) {
    const existingJobs = await this.crawlerCronQueue.getRepeatableJobs();
    return existingJobs.find((job) => job.id === jobId);
  }

  async onApplicationBootstrap() {
    if (
      process.env.NEXT_PUBLIC_ENVIRONMENT === 'staging' ||
      process.env.NEXT_PUBLIC_ENVIRONMENT === 'development'
    ) {
      this.log.warn(
        `Environment is ${process.env.NEXT_PUBLIC_ENVIRONMENT}, skip adding cron job!`,
      );
      return;
    }
    const cron = '1 1 * * *'; // each work day at 01:01
    const jobId = 'crawler-cron-job';

    const existingJob = await this.findRepeatableJob(jobId);
    if (existingJob && existingJob.cron === cron) {
      this.log.log(`Job ${jobId} with cron '${cron}' already exists!`);
      this.log.log(`Job ${jobId} next=${new Date(existingJob.next)}`);
      return;
    }
    if (existingJob) {
      this.log.log(
        `Job ${jobId} with non matching cron, removing! current(${existingJob.cron}) !== desired(${cron}) `,
      );
      await this.crawlerCronQueue.removeRepeatable({
        ...existingJob,
        jobId,
      });
    }
    this.log.log(`Adding crawler cron job ${jobId} with cron: ${cron}`);
    const job = await this.crawlerCronQueue.add(
      {},
      {
        jobId,
        repeat: { cron },
      },
    );
    const newRepeatable = await this.findRepeatableJob(jobId);
    this.log.log(`Job ${jobId} next=${new Date(newRepeatable.next)}`);
  }
}
