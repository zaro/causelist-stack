import { Command, Option, Positional } from 'nestjs-command/dist/index.js';
import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as util from 'node:util';
import * as child_process from 'node:child_process';
import { createHash } from 'node:crypto';
import { parse } from 'csv-parse/sync';

import { InjectModel } from '@nestjs/mongoose';
import { InfoFile, InfoFileDocument } from '../schemas/info-file.schema.js';
import { FilterQuery, Model } from 'mongoose';
import { FileLines } from '../data-importer/parser/file-lines.js';
import { CauselistHeaderParser } from '../data-importer/parser/causelist-header-parser.js';
import { NoticeParser } from '../data-importer/parser/notice-parser.js';
import { peekForRe, peekForWord } from '../data-importer/parser/util.js';
import { format } from 'date-fns';
import {
  DocumentWithData,
  KenyaLawParserService,
} from '../data-importer/kenya-law-parser.service.js';

const fixturesDir = 'src/data-importer/parser/__fixtures__/data';
const devFixturesDir = 'src/data-importer/parser/__fixtures__/dev-data';

const exec = util.promisify(child_process.exec);

@Injectable()
export class TestsCommand {
  private readonly log = new Logger(TestsCommand.name);

  constructor(
    protected parserService: KenyaLawParserService,
    @InjectModel(InfoFile.name)
    protected infoFileModel: Model<InfoFile>,
  ) {}

  async makeFixtureFromDocument(document: DocumentWithData, outputDir: string) {
    const data = {
      fileName: document.doc.fileName,
      fileSha1: document.doc.sha1,
      mimeType: document.doc.mimeType,
      textContent: document.textContent,
      textContentType: document.textContentType,
      parentUrl: document.doc.parentUrl,
      parentPath: document.doc.parentPath,
      textContentHash: document.textContentSha1,
    };
    // Store under sha1(originalFile) filename
    const fileName = `${data.fileSha1}.json`;
    fs.writeFileSync(
      path.join(outputDir, fileName),
      JSON.stringify(data, undefined, 2),
    );
    this.log.log(`Wrote: ${fileName}!`);
  }

  @Command({
    command: 'tests:make-dev-fixtures-from-db',
    describe:
      'save all successfully parsed InfoFile document as dev test fixture',
  })
  async makeDevFixtures() {
    const documents = await this.parserService.loadDocumentsWithData({
      path: '.',
      onlyAlreadyParsed: true,
    });
    if (!documents.length) {
      this.log.error(`Couldn't fine any successfully parsed documents!`);
      return;
    }
    fs.mkdirSync(devFixturesDir, { recursive: true });
    for (const document of documents) {
      this.makeFixtureFromDocument(document, devFixturesDir);
    }
  }

  @Command({
    command: 'tests:make-fixture <docIdOrMd5>',
    describe: 'save InfoFile document as test fixture',
  })
  async makeFixture(
    @Positional({
      name: 'sha1',
      describe: 'document sha1',
      type: 'string',
    })
    sha1: string,
  ) {
    const documents = await this.parserService.loadDocumentsWithData({
      sha1,
    });
    if (!documents.length) {
      this.log.error(`Document with sha1: ${sha1} not found!`);
      return;
    }
    fs.mkdirSync(fixturesDir, { recursive: true });
    this.makeFixtureFromDocument(documents[0], fixturesDir);
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
    // TODO:
    // const documents = await this.infoFileModel
    //   .find({ md5: { $in: goodRecords.map((r) => r.md5) } })
    //   .exec();
    // this.log.log(`Loaded ${documents.length} documents`);
    // for (const document of documents) {
    //   this.makeFixtureFromDocument(document);
    // }
  }
}
