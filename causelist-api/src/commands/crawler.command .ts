import { Command } from 'nestjs-command/dist/index.js';
import { Injectable, Logger } from '@nestjs/common';
import * as util from 'node:util';
import * as child_process from 'node:child_process';

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema.js';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import {
  CRAWLER_JOB_QUEUE_NAME,
  CrawlJobParams,
} from '../crawler/crawler-job.processor.js';

@Injectable()
export class CrawlerCommand {
  private readonly log = new Logger(CrawlerCommand.name);

  constructor(
    @InjectQueue(CRAWLER_JOB_QUEUE_NAME)
    private crawlerQueue: Queue<CrawlJobParams>,
  ) {}

  @Command({
    command: 'crawler:start',
    describe: 'Start a new crawler job',
  })
  async crawlerStart() {
    const job = await this.crawlerQueue.add({ something: false });
    const r = await job.finished();
    console.log(r);
  }
}
