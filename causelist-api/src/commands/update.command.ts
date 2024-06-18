import { Command } from 'nestjs-command/dist/index.js';
import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { parse } from 'date-fns';

import * as util from 'node:util';
import * as child_process from 'node:child_process';

import { UpdateStatsService } from '../data-importer/update-stats.service.js';
import { S3Service } from '../s3/s3.service.js';
import e from 'express';
import { CaseIndex } from '../interfaces/search-index.js';
import { MeiliService } from '../meili/meili.service.js';

const configDir = 'src/data-importer/parser/config/';

@Injectable()
export class UpdateCommand {
  log = new Logger(UpdateCommand.name);
  constructor(
    protected statsService: UpdateStatsService,
    protected s3Service: S3Service,
    protected meiliService: MeiliService,
  ) {}

  @Command({
    command: 'update:courts-stats',
    describe: 'Update Courts Stats',
  })
  async updateCourtsStats() {
    return this.statsService.updateCourtsStats();
  }

  @Command({
    command: 'update:courts-names',
    describe: 'Update Parsable Court Names',
  })
  async updateCourtsNames() {
    const courts = await this.statsService.buildCourtNamesForMatching();
    fs.mkdirSync(configDir, { recursive: true });
    const file = path.join(configDir, 'courtNames.json');
    fs.writeFileSync(file, JSON.stringify(courts, null, 2));
    this.log.log(`Wrote ${file}`);
  }

  @Command({
    command: 'update:cases',
    describe: 'Update search Index',
  })
  async updateCasesSearchIndex() {
    await this.meiliService.createIndexes();
    const keyPairs: Record<
      string,
      { metaKey?: string; htmlKey?: string; textKey?: string }
    > = {};
    this.log.log('Loading data...');
    await this.s3Service.eachFile({ prefix: 'cases/files/' }, (o) => {
      const [_, caseId, file] = o.Key?.match(/\/(\d+)\/([^\/]+)/);
      if (caseId) {
        if (!keyPairs[caseId]) {
          keyPairs[caseId] = {};
        }
        if (file === 'html') {
          keyPairs[caseId].htmlKey = o.Key;
        }
        if (file === 'text') {
          keyPairs[caseId].textKey = o.Key;
        }
        if (file === 'meta.json') {
          keyPairs[caseId].metaKey = o.Key;
        }
      }
    });

    let chunk: CaseIndex[] = [];
    let c = 0;
    const entries = Object.entries(keyPairs);
    for (const [caseId, k] of entries) {
      let metaR, htmlR, textR;
      try {
        [metaR, htmlR, textR] = await this.s3Service.downloadMultipleFiles([
          {
            key: k.metaKey,
            parseJson: true,
          },
          {
            key: k.htmlKey,
          },
          {
            key: k.textKey,
          },
        ]);
      } catch (e) {
        this.log.error(`Failed to load data for case ${caseId}`);
        this.log.error(e);
        continue;
      }
      chunk.push({
        meta: metaR.dataAsObject,
        title: metaR.dataAsObject.title,
        url: metaR.dataAsObject.url,
        case_id: metaR.dataAsObject.caseId,
        case_number: metaR.dataAsObject.metadata['Case Number'],
        parties: metaR.dataAsObject.metadata['Parties'],
        date_delivered_human: metaR.dataAsObject.metadata['Date Delivered'],
        date_delivered: parse(
          metaR.dataAsObject.metadata['Date Delivered'],
          'dd LLL yyyy',
          new Date(0),
        ),
        case_class: metaR.dataAsObject.metadata['Case Class'],
        court: metaR.dataAsObject.metadata['Court'],
        case_action: metaR.dataAsObject.metadata['Case Action'],
        judge: metaR.dataAsObject.metadata['Judge(s)'],
        citation: metaR.dataAsObject.metadata['Citation'],
        disclaimer: metaR.dataAsObject.metadata['Disclaimer'],
        html: htmlR.data.toString(),
        txt: textR.data.toString(),
      });
      if (chunk.length >= 100) {
        const nonExisting = await this.meiliService.filterOutExisting(chunk);
        if (nonExisting.length !== chunk.length) {
          this.log.log(
            `Skipping ${chunk.length - nonExisting.length} existing [${c}/${
              entries.length
            }]`,
          );
        }
        if (nonExisting.length) {
          this.log.log(
            `Inserting ${nonExisting.length} [${c}/${entries.length}]`,
          );
          await this.meiliService.insertCases(nonExisting);
          c += chunk.length;
        }
        chunk = [];
      }
    }
    await this.meiliService.waitAllTasks();
  }
}
