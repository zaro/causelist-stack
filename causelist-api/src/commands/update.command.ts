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
import { FileLines } from './parser/file-lines.js';
import { CauselistHeaderParser } from './parser/causelist-header-parser.js';
import { NoticeParser } from './parser/notice-parser.js';
import { peekForRe, peekForWord } from './parser/util.js';
import {
  CauselistMultiDocumentParser,
  CauselistParser,
} from './parser/causelist-parser.js';
import { format } from 'date-fns';
import { CauseList } from '../schemas/causelist.schema.js';
import { Court, CourtDocument } from '../schemas/court.schema.js';

const fixturesDir = 'src/commands/parser/__fixtures__/data';

const exec = util.promisify(child_process.exec);

@Injectable()
export class UpdateCommand {
  private readonly log = new Logger(UpdateCommand.name);

  constructor(
    @InjectModel(MenuEntry.name)
    protected menuEntryModel: Model<MenuEntry>,
    @InjectModel(InfoFile.name)
    protected infoFileModel: Model<InfoFile>,
    @InjectModel(CauseList.name)
    protected causeListModel: Model<CauseList>,
    @InjectModel(Court.name)
    protected courtModel: Model<Court>,
  ) {}

  @Command({
    command: 'update:courts-stats',
    describe: 'Update Courts Stats',
  })
  async updateCourtsStats() {
    const courts = await this.courtModel.find().exec();
    const toSave: CourtDocument[] = [];
    for (const court of courts) {
      const clCount = await this.causeListModel
        .count({
          parentPath: new RegExp(`^${court.path}`),
        })
        .exec();
      if (clCount != court.documentsCount) {
        court.documentsCount = clCount;
        toSave.push(court);
      }
    }
    const r = await Promise.all(
      toSave.map((c) => {
        return c.save();
      }),
    );

    this.log.log(`Updated ${r.length} courts`);
  }
}
