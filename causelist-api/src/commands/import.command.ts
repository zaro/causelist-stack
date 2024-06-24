import { Command, Positional } from 'nestjs-command/dist/index.js';
import { Injectable, Logger } from '@nestjs/common';
import { parse } from 'csv-parse/sync';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as util from 'node:util';
import * as child_process from 'node:child_process';
import { createHash } from 'node:crypto';

import { InjectModel } from '@nestjs/mongoose';
import { InfoFile, InfoFileDocument } from '../schemas/info-file.schema.js';
import { Model } from 'mongoose';
import { KenyaLawImporterService } from '../data-importer/kenya-law-importer.service.js';
import { DirectoryListing } from '../schemas/directory-listing.schema.js';

const exec = util.promisify(child_process.exec);

@Injectable()
export class ImportCommand {
  private readonly log = new Logger(ImportCommand.name);

  constructor(
    protected importerService: KenyaLawImporterService,
    @InjectModel(DirectoryListing.name)
    protected directoryListingModel: Model<DirectoryListing>,
  ) {}

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

  @Command({
    command: 'import:directory-listing [csvFile]',
    describe: 'Import directory listings from CSV file',
  })
  async importDirectoryListings(
    @Positional({
      name: 'csvFile',
      describe: 'csv file to import',
      type: 'string',
    })
    csvFile: string,
  ) {
    const csvContent = fs.readFileSync(csvFile).toString();
    const records = parse(csvContent, {
      columns: ['name', 'city', 'county'],
      skip_empty_lines: true,
    });
    for (const record of records) {
      await this.directoryListingModel.findOneAndUpdate(
        { name: record.name },
        record,
        {
          new: true,
          upsert: true, // Make this update into an upsert
        },
      );
    }
  }
}
