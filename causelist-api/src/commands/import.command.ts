import { Command, Positional } from 'nestjs-command/dist/index.js';
import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as util from 'node:util';
import * as child_process from 'node:child_process';
import { createHash } from 'node:crypto';

import { InjectModel } from '@nestjs/mongoose';
import { InfoFile, InfoFileDocument } from '../schemas/info-file.schema.js';
import { Model } from 'mongoose';
import { KenyaLawImporterService } from '../data-importer/kenya-law-importer.service.js';

const exec = util.promisify(child_process.exec);

@Injectable()
export class ImportCommand {
  private readonly log = new Logger(ImportCommand.name);

  constructor(protected importerService: KenyaLawImporterService) {}

  @Command({
    command: 'import:menu crawlTime',
    describe: 'Import menu from crawl data',
  })
  async importMenu(
    @Positional({
      name: 'crawlTime',
      describe: 'crawlTime key from crawler',
      type: 'string',
    })
    crawlTime: string,
  ) {
    return this.importerService.processMenu(crawlTime);
  }

  @Command({
    command: 'import:files',
    describe: 'Import menu and files from crawl data',
  })
  async importFiles() {
    return this.importerService.importFiles();
  }
}
