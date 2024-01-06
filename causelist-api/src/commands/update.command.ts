import { Command, Option, Positional } from 'nestjs-command/dist/index.js';
import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as util from 'node:util';
import * as child_process from 'node:child_process';
import { createHash } from 'node:crypto';
import * as nunjucks from 'nunjucks';

import { InjectModel } from '@nestjs/mongoose';
import { MenuEntry, MenuEntryDocument } from '../schemas/menu-entry.schema.js';
import { InfoFile, InfoFileDocument } from '../schemas/info-file.schema.js';
import { FilterQuery, Model } from 'mongoose';
import { FileLines } from '../data-importer/parser/file-lines.js';
import { CauselistHeaderParser } from '../data-importer/parser/causelist-header-parser.js';
import { NoticeParser } from '../data-importer/parser/notice-parser.js';
import { peekForRe, peekForWord } from '../data-importer/parser/util.js';
import {
  CauselistMultiDocumentParser,
  CauselistParser,
} from '../data-importer/parser/causelist-parser.js';
import { format } from 'date-fns';
import { CauseList } from '../schemas/causelist.schema.js';
import { Court, CourtDocument } from '../schemas/court.schema.js';
import { UpdateStatsService } from '../data-importer/update-stats.service.js';

const fixturesDir = 'src/commands/parser/__fixtures__/data';

const exec = util.promisify(child_process.exec);

@Injectable()
export class UpdateCommand {
  constructor(protected statsService: UpdateStatsService) {}

  @Command({
    command: 'update:courts-stats',
    describe: 'Update Courts Stats',
  })
  async updateCourtsStats() {
    return this.statsService.updateCourtsStats();
  }
}
