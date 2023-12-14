import { Command, Option, Positional } from 'nestjs-command/dist/index.js';
import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as util from 'node:util';
import * as child_process from 'node:child_process';
import { createHash } from 'node:crypto';
import { parse } from 'csv-parse/sync';

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

const fixturesDir = 'src/commands/parser/__fixtures__/data';

const exec = util.promisify(child_process.exec);

@Injectable()
export class TestsCommand {
  private readonly log = new Logger(TestsCommand.name);

  constructor(
    @InjectModel(MenuEntry.name)
    protected menuEntryModel: Model<MenuEntry>,
    @InjectModel(InfoFile.name)
    protected infoFileModel: Model<InfoFile>,
  ) {}

  async makeFixtureFromDocument(document: InfoFile) {
    const data = {
      fileName: document.fileName,
      fileMd5: document.md5,
      mimeType: document.mimeType,
      textContent: document.textContent,
      textContentType: document.textContentType,
      parentUrl: document.parentUrl,
      parentPath: document.parentPath,
      textContentMd5: createHash('md5')
        .update(document.textContent)
        .digest('hex'),
    };

    // Store under MD5(textContent) filename
    const fileName = `${data.textContentMd5}.json`;
    fs.writeFileSync(
      path.join(fixturesDir, fileName),
      JSON.stringify(data, undefined, 2),
    );
    this.log.log(`Wrote: ${fileName}!`);
  }

  @Command({
    command: 'tests:make-fixture <docIdOrMd5>',
    describe: 'save InfoFile document as test fixture',
  })
  async makeFixture(
    @Positional({
      name: 'docIdOrMd5',
      describe: 'document id',
      type: 'string',
    })
    docIdOrMd5: string,
  ) {
    const document = await this.infoFileModel
      .findOne(
        docIdOrMd5.length === 24 ? { _id: docIdOrMd5 } : { md5: docIdOrMd5 },
      )
      .exec();
    if (!document) {
      this.log.error(`Document with id: ${docIdOrMd5} not found!`);
      return;
    }
    fs.mkdirSync(fixturesDir, { recursive: true });
    this.makeFixtureFromDocument(document);
  }

  @Command({
    command: 'tests:make-fixtures-from-csv <csvPath>',
    describe: 'save InfoFile document as test fixture from csv file',
  })
  async makeFixturesFromCsv(
    @Positional({
      name: 'csvPath',
      describe: 'csvPath',
      type: 'string',
    })
    csvPath: string,
  ) {
    const records = parse(fs.readFileSync(csvPath), {
      skip_empty_lines: true,
      columns: (fl) => {
        const validIdx = fl.indexOf('VALID');
        if (validIdx >= 0 && fl[validIdx + 1] === '') {
          fl[validIdx + 1] = 'COMMENT';
        }
        return fl;
      },
    });
    // console.log(records);
    const goodRecords = records.filter(
      (r) => r.VALID.length && !r.COMMENT.length,
    );
    // console.log(goodRecords);
    this.log.log(`Found ${goodRecords.length} good records`);
    const documents = await this.infoFileModel
      .find({ md5: { $in: goodRecords.map((r) => r.md5) } })
      .exec();
    this.log.log(`Loaded ${documents.length} documents`);
    for (const document of documents) {
      this.makeFixtureFromDocument(document);
    }
  }
}
