import { Command, Option, Positional } from 'nestjs-command/dist/index.js';
import { Injectable, Logger } from '@nestjs/common';
import * as util from 'node:util';
import * as child_process from 'node:child_process';

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema.js';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import {
  CRAWLER_JOB_QUEUE_NAME,
  CrawlJobParams,
} from '../k8s-jobs/crawler-job.processor.js';
import {
  PARSE_CRAWLED_JOB_QUEUE_NAME,
  ParseJobParams,
} from '../k8s-jobs/parse-crawled-job.processor.js';

@Injectable()
export class CrawlerCommand {
  private readonly log = new Logger(CrawlerCommand.name);

  constructor(
    @InjectQueue(CRAWLER_JOB_QUEUE_NAME)
    private crawlerQueue: Queue<CrawlJobParams>,
    @InjectQueue(PARSE_CRAWLED_JOB_QUEUE_NAME)
    private parserQueue: Queue<ParseJobParams>,
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
  ) {
    const job = await this.crawlerQueue.add({
      crawlerTest: crawlerTest as CrawlJobParams['crawlerTest'],
      crawlTime: new Date().toISOString(),
    });
    const r = await job.finished();
    this.logK8sResult(r);
  }

  @Command({
    command: 'parse:crawled crawlTime',
    describe: 'Parse latest crawled data',
  })
  async parseCrawledStart(
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
}
