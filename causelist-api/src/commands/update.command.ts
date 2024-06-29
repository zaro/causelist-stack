import { Command, Positional, Option } from 'nestjs-command/dist/index.js';
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
    command: 'update:cases [startCase]',
    describe: 'Update search Index',
  })
  async updateCasesSearchIndex(
    @Option({
      name: 'drop',
      describe: 'Drop index if it exists',
      type: 'boolean',
    })
    drop: boolean,
    @Positional({
      name: 'startCase',
      describe: 'start update from case Number',
      type: 'string',
    })
    startCase?: string,
  ) {
    await this.meiliService.createIndexes(drop);
    const keyPairs: Record<
      string,
      { metaKey?: string; htmlKey?: string; textKey?: string }
    > = {};
    this.log.log('Loading data...');
    let startCaseN;
    if (startCase) {
      this.log.log(`Will start from case : ${startCase}`);
      startCaseN = parseInt(startCase, 10);
      if (isNaN(startCaseN)) {
        throw new Error('Invalid start case ');
      }
    }
    await this.s3Service.eachFile(
      { prefix: 'cases/files/' },
      (o) => {
        const [_, caseId, file] = o.Key?.match(/\/(\d+)\/([^\/]+)/);
        if (caseId) {
          if (startCaseN > parseInt(caseId)) {
            return;
          }
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
      },
      (r) => {
        console.log(
          '>>> IsTruncated=',
          r.IsTruncated,
          ' ateampts=',
          r.$metadata?.attempts,
          ' Next token=',
          r.NextContinuationToken,
        );
      },
    );

    let chunk: CaseIndex[] = [];
    let c = 0;
    const entries = Object.entries(keyPairs);
    for (const [caseId, k] of entries) {
      let metaR, htmlR, textR;
      try {
        if (!k.metaKey || !k.htmlKey || !k.textKey) {
          this.log.warn(
            `at least one missing key for ${caseId} : meta=${k.metaKey} , html=${k.htmlKey} , txt=${k.textKey}`,
          );
          continue;
        }
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
      const date_delivered = parse(
        metaR.dataAsObject.metadata['Date Delivered'],
        'dd LLL yyyy',
        new Date(0),
      );
      chunk.push({
        meta: metaR.dataAsObject,
        title: metaR.dataAsObject.title,
        url: metaR.dataAsObject.url,
        case_id: metaR.dataAsObject.caseId,
        case_number: metaR.dataAsObject.metadata['Case Number'],
        parties: metaR.dataAsObject.metadata['Parties'],
        date_delivered_human: metaR.dataAsObject.metadata['Date Delivered'],
        date_delivered,
        date_delivered_ms: date_delivered.getTime(),
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
