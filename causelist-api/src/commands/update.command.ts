import { Command } from 'nestjs-command/dist/index.js';
import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'node:fs';
import * as path from 'node:path';

import * as util from 'node:util';
import * as child_process from 'node:child_process';

import { UpdateStatsService } from '../data-importer/update-stats.service.js';

const configDir = 'src/data-importer/parser/config/';

@Injectable()
export class UpdateCommand {
  log = new Logger(UpdateCommand.name);
  constructor(protected statsService: UpdateStatsService) {}

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
}
