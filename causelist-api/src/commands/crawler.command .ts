import { Command, Option, Positional } from 'nestjs-command/dist/index.js';
import { Injectable, Logger } from '@nestjs/common';
import * as util from 'node:util';
import * as child_process from 'node:child_process';

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema.js';
import { InjectQueue } from '@nestjs/bull';
import type { Queue, Job } from 'bull';
import {
  CRAWLER_JOB_QUEUE_NAME,
  CrawlJobParams,
} from '../k8s-jobs/crawler-job.processor.js';
import {
  PARSE_CRAWLED_JOB_QUEUE_NAME,
  ParseJobParams,
} from '../k8s-jobs/parse-crawled-job.processor.js';
import {
  CRAWLER_CRON_QUEUE_NAME,
  CrawlerCronParams,
} from '../k8s-jobs/crawler-cron.processor.js';
import { S3Service } from '../s3/s3.service.js';
import { fileKey } from '../data-importer/const.js';
import {
  REPROCESS_FILES_JOB_QUEUE_NAME,
  ReprocessFilesJobParams,
} from '../k8s-jobs/reprocess-files.processor.js';

@Injectable()
export class CrawlerCommand {
  private readonly log = new Logger(CrawlerCommand.name);

  constructor(
    protected s3Service: S3Service,
    @InjectQueue(CRAWLER_JOB_QUEUE_NAME)
    private crawlerQueue: Queue<CrawlJobParams>,
    @InjectQueue(CRAWLER_CRON_QUEUE_NAME)
    private crawlerCronQueue: Queue<CrawlerCronParams>,
    @InjectQueue(PARSE_CRAWLED_JOB_QUEUE_NAME)
    private parserQueue: Queue<ParseJobParams>,
    @InjectQueue(REPROCESS_FILES_JOB_QUEUE_NAME)
    private reprocessQueue: Queue<ReprocessFilesJobParams>,
  ) {}

  logK8sResult(r: any) {
    const msg = `Pod ${r.k8sPodData.metadata.name} completed in phase: ${r.k8sPodData.status.phase}`;
    if (r.failed) {
      this.log.error(msg);
    } else {
      this.log.log(msg);
    }
  }

  @Command({
    command: 'crawler:start',
    describe: 'Start a new crawler job',
  })
  async crawlerStart(
    @Option({
      name: 'test',
      describe: 'mark crawl job as test job',
      type: 'string',
      choices: ['job', 'dev', 'no'],
      requiresArg: true,
    })
    crawlerTest: string,
    @Option({
      name: 'processOnSuccess',
      describe: 'Start a process job on crawler success',
      type: 'boolean',
    })
    processOnSuccess: boolean,
  ) {
    const job = await this.crawlerQueue.add({
      crawlerTest: crawlerTest as CrawlJobParams['crawlerTest'],
      crawlTime: new Date().toISOString(),
      startProcessorOnSuccess: processOnSuccess,
    });
    const r = await job.finished();
    this.logK8sResult(r);
  }

  @Command({
    command: 'crawler:process crawlTime',
    describe: 'Parse latest crawled data',
  })
  async crawlerProcess(
    @Positional({
      name: 'crawlTime',
      describe: 'crawlTime key from crawler',
      type: 'string',
    })
    crawlTime: string,
  ) {
    const job = await this.parserQueue.add({
      crawlTime,
    });
    const r = await job.finished();
    this.logK8sResult(r);
  }

  @Command({
    command: 'crawler:reprocess [maxJobs] [filesInAJob]',
    describe: 'Parse reprocess files with latest crawler data processing',
  })
  async crawlerReprocess(
    @Positional({
      name: 'maxJobs',
      describe: 'maxJobs to queue',
      type: 'number',
      default: 1,
    })
    maxJobs: number,
    @Positional({
      name: 'filesInAJob',
      describe: 'number of files to process in single job',
      type: 'number',
      default: 20,
    })
    filesInAJob: number,
  ) {
    const allFiles = (
      await this.s3Service.listFilesAll(
        {
          prefix: fileKey(''),
        },
        (o) => o.Key.endsWith('/meta.json'),
      )
    ).entries.map((e) => e.Key);
    console.log(`Reprocessing ${allFiles.length} entries total`);
    let list = [];
    for (const fileKey of allFiles) {
      const { dataAsObject: datasetFile } = await this.s3Service.downloadFile({
        key: fileKey,
        parseJson: true,
      });
      const { fileName, sha1, hasPdf, hasPages } = datasetFile;

      if (hasPdf !== undefined || hasPages !== undefined) {
        this.log.debug(`Ignoring ${fileName}, already reprocessed`);
        continue;
      }
      list.push(sha1);
      if (list.length >= filesInAJob) {
        maxJobs--;
        await this.reprocessQueue.add({
          sha1: list,
        });
        this.log.log(`Queued ${list.length} files...`);
        list = [];
      }
      if (maxJobs <= 0) {
        break;
      }
    }
  }

  async logJobsInQueue(queue: Queue<any>) {
    const jobs = await queue.getJobs([
      'completed',
      'waiting',
      'active',
      'delayed',
      'failed',
      'paused',
    ]);
    const withStatus = await Promise.all(
      jobs.map(async (j) => ({ s: await j.getState(), j })),
    );
    const byStatus: Record<string, Job[]> = withStatus.reduce(
      (acc, c) => ({
        [c.s]: [...(acc[c.s] ?? []), c.j],
      }),
      {},
    );
    for (const [status, jobs] of Object.entries(byStatus)) {
      this.log.log(`Status: ${status}`);
      for (const j of jobs) {
        const repeat = j.opts.repeat;
        this.log.log(
          `  ${j.id} ${
            j.finishedOn ? new Date(j.finishedOn).toISOString() : '-'
          } ${j.failedReason ? j.failedReason : '-'} ${JSON.stringify(
            repeat,
          )} `,
        );
      }
    }
  }

  @Command({
    command: 'crawler:jobs',
    describe: 'list crawler jobs',
  })
  async crawlerJobs() {
    this.log.log('CRAWLER CRON QUEUE');
    await this.logJobsInQueue(this.crawlerCronQueue);
    this.log.log('CRAWLER JOB QUEUE');
    await this.logJobsInQueue(this.crawlerQueue);
    this.log.log('CRAWLER REPROCESS QUEUE');
    await this.logJobsInQueue(this.reprocessQueue);
  }
}
