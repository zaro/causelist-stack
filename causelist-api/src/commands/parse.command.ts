import { Command, Option, Positional } from 'nestjs-command/dist/index.js';
import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as util from 'node:util';
import * as child_process from 'node:child_process';
import { createHash } from 'node:crypto';

import { InjectModel } from '@nestjs/mongoose';
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
import { CauseList } from '../schemas/causelist.schema.js';
import { Court } from '../schemas/court.schema.js';
import {
  KenyaLawParserService,
  DocumentParseResult,
} from '../data-importer/kenya-law-parser.service.js';
import { KenyaLawImporterService } from '../data-importer/kenya-law-importer.service.js';

const fixturesDir = 'src/commands/parser/__fixtures__/data';

const exec = util.promisify(child_process.exec);

function nextLineStats(docs: DocumentParseResult[]) {
  const s = [];
  for (const doc of docs) {
    doc.fileLines.skipEmptyLines();
    const t = doc.fileLines.peekNext()?.trim();
    if (!t) continue;
    if (!s[t]) {
      s[t] = [];
    }
    s[t].push(doc);
  }
  return s;
}

@Injectable()
export class ParseCommand {
  private readonly log = new Logger(ParseCommand.name);

  constructor(
    protected parserService: KenyaLawParserService,
    protected importerService: KenyaLawImporterService,
    @InjectModel(InfoFile.name)
    protected infoFileModel: Model<InfoFile>,
    @InjectModel(CauseList.name)
    protected causeListModel: Model<CauseList>,
    @InjectModel(Court.name)
    protected courtModel: Model<Court>,
  ) {}

  @Command({
    command: 'parse:crawled crawlTime',
    describe: 'Parse last crawled data',
  })
  async parseCrawled(
    @Positional({
      name: 'crawlTime',
      describe: 'crawlTime key from crawler',
      type: 'string',
    })
    crawlTime: string,
  ) {
    await this.importerService.processMenu(crawlTime);
    await this.importerService.importFiles();
    await this.parserService.parseCourts(crawlTime);
    await this.parseFiles('.', null, null, true, false);
  }

  @Command({
    command: 'parse:courts crawlTime',
    describe: 'Parse Courts from Menu',
  })
  async parseCourts(
    @Positional({
      name: 'crawlTime',
      describe: 'crawlTime key from crawler',
      type: 'string',
    })
    crawlTime: string,
  ) {
    return this.parserService.parseCourts(crawlTime);
  }

  @Command({
    command: 'parse:files <path>',
    describe: 'Parse Cuaselists under path',
  })
  async parseFiles(
    @Positional({
      name: 'path',
      describe: 'menu path to parse',
      type: 'string',
    })
    path: string,
    @Option({
      name: 'id',
      describe: 'specific document id',
      type: 'string',
      required: false,
    })
    docId: string,
    @Option({
      name: 'sha1',
      describe: 'specific document with sha1 sum',
      type: 'string',
      required: false,
    })
    sha1: string,
    @Option({
      name: 'write',
      describe: 'Write parsed data to db',
      type: 'boolean',
      required: false,
    })
    write: boolean,
    @Option({
      name: 'stats',
      describe: 'Output more stats',
      type: 'boolean',
      required: false,
    })
    stats: boolean,
  ) {
    const parsedList = await this.parserService.parseFilesAsData({
      docId,
      path,
      sha1,
    });
    this.parserService.printParsedDataStats(parsedList);
    const good = parsedList.filter((e) => e.score >= e.parser.minValidScore());

    if (write) {
      const goodAtEnd = good.filter((e) => e.parser.file.end());
      const savePromises = [];
      let deletedOld = 0;
      for (const parsed of goodAtEnd) {
        const infoFile = parsed.doc;
        const data = parsed.parser.getParsed();
        const deleted = await this.causeListModel
          .deleteMany({
            parsedFrom: infoFile._id,
          })
          .exec();
        deletedOld += deleted.deletedCount;
        for (const document of data.documents) {
          const causeList = new this.causeListModel({
            parsedFrom: infoFile._id,
            type: document.type,
            header: document.header,
            causeLists: document.causeLists,
            parentPath: infoFile.parentPath,
          });
          savePromises.push(causeList.save());
        }
      }
      console.log(`Deleted ${deletedOld} existing CauseLists!`);
      console.log(`Writing ${savePromises.length} CauseList to db!`);
      await Promise.all(savePromises);
      return;
    }
    // console.dir(
    //   good.map((e) => e.p.documents[0].header.getParsed().court),
    //   { depth: null, maxArrayLength: null },
    // );
    // console.dir(
    //   new Set(good.map((e) => e.p.getParsed().header.court[0]?.trim())),
    //   { maxArrayLength: null },
    // );
    // console.dir(
    //   new Set(good.map((e) => e.p.getParsed().header.court[1]?.trim())),
    // );
    // console.dir(
    //   Object.fromEntries(
    //     Object.entries(nextLineStats(haveCourt)).map(([k, d]) => [
    //       k,
    //       d.map((e) => e.doc._id.toString()),
    //     ]),
    //   ),
    // );
    // console.dir(Object.entries(nextLineStats(haveCourt)).map(([k, d]) => k));
    if (stats) {
      console.dir(
        Object.entries(
          nextLineStats(good.filter((e) => !e.parser.file.end())),
        ).map(([k, d]) => [k, d.map((e) => e.doc.sha1.toString())]),
        { maxArrayLength: null },
      );
      if (docId || sha1) {
        console.dir(
          [parsedList[0].doc._id.toString(), parsedList[0].parser.getParsed()],
          {
            depth: null,
          },
        );
        if (!parsedList[0].parser.file.end()) {
          console.log('First unparsed line: ');
          console.log(parsedList[0].parser.file.peekNext());
        }
      }
    }
  }

  @Command({
    command: 'parse:gen-html <menuPath> <documentsPath> <outputDir>',
    describe: 'Parse Cuaselists under path',
  })
  async getHTML(
    @Positional({
      name: 'menuPath',
      describe: 'menu path to parse',
      type: 'string',
    })
    menuPath: string,
    @Positional({
      name: 'documentsPath',
      describe: 'path to original files',
      type: 'string',
    })
    documentsPath: string,
    @Positional({
      name: 'outputDir',
      describe: 'output directory',
      type: 'string',
    })
    outputDir: string,
  ) {
    // const filter: FilterQuery<InfoFile> = {
    //   parentPath: { $regex: `^${menuPath}` },
    // };
    // const documents = await this.infoFileModel.find(filter).exec();
    // this.log.log(`Processing ${documents.length} documents`);
    // const parsedList = documents.map((d) => {
    //   const fl = new FileLines(d.textContent);
    //   const f = fl.clone();
    //   const p = new CauselistMultiDocumentParser(fl);
    //   p.tryParse();
    //   return {
    //     docId: d._id.toString(),
    //     doc: d,
    //     fl,
    //     p,
    //     s: p?.matchScore() ?? 0,
    //     hasCourt: peekForWord(f, 'court', 1),
    //     hasCauseList: peekForRe(f, /cause\s+list/i),
    //     isNotice: peekForWord(f, 'notice'),
    //   };
    // });
    // const good = parsedList.filter((e) => e.s >= e.p.minValidScore());
    // const goodAtEnd = good.filter((e) => e.p.file.end());
    // console.log('Total:', documents.length);
    // console.log('Total With passing:', good.length);
    // console.log('Total With passing and reached end:', goodAtEnd.length);
    // fs.mkdirSync(outputDir, { recursive: true });
    // const env = this.makeNunjucksEnv();
    // const csvFileData = [['md5', 'parentUrl', 'fileName', 'toVerify', 'VALID']];
    // for (const g of goodAtEnd.toSorted((a, b) =>
    //   a.doc.fileName.localeCompare(b.doc.fileName),
    // )) {
    //   const rendered = env.render('parsed-to-html.html.nunjucks', {
    //     documents: g.p.documents.getParsed(),
    //     fileName: g.doc.fileName,
    //     textContent: g.doc.textContent,
    //   });
    //   const fileName = `${g.doc.fileName}.html`;
    //   fs.writeFileSync(path.join(outputDir, fileName), rendered);
    //   fs.copyFileSync(
    //     path.join(documentsPath, g.doc.fileName),
    //     path.join(outputDir, g.doc.fileName),
    //   );
    //   csvFileData.push([g.doc.md5, g.doc.parentUrl, g.doc.fileName, fileName]);
    // }
    // fs.writeFileSync(
    //   path.join(outputDir, 'a_check_list.csv'),
    //   csvFileData.map((la) => la.map((i) => `"${i}"`).join(',')).join('\n'),
    // );
    // console.log('wrote:', goodAtEnd.length);
  }

  @Command({
    command: 'parse:debug-html <docMd5> <outputDir>',
    describe: 'Parse Cuaselists and output html with debug info',
  })
  async debugHTML(
    @Positional({
      name: 'docMd5',
      describe: 'menu path to parse',
      type: 'string',
    })
    docMd5: string,
    @Positional({
      name: 'outputDir',
      describe: 'output directory',
      type: 'string',
    })
    outputDir: string,
  ) {
    // const filter: FilterQuery<InfoFile> = {
    //   md5: docMd5,
    // };
    // const document = await this.infoFileModel.findOne(filter).exec();
    // const fl = new FileLines(document.textContent);
    // const p = new CauselistMultiDocumentParser(fl);
    // p.tryParse();
    // const parsedDocument = {
    //   doc: document,
    //   fl,
    //   p,
    //   s: p?.matchScore() ?? 0,
    // };
    // fs.mkdirSync(outputDir, { recursive: true });
    // const env = this.makeNunjucksEnv();
    // const currentLine = fl.getCurrentLine();
    // const rendered = env.render('parsed-to-debug-html.html.nunjucks', {
    //   documents: p.documents.getParsed(),
    //   fileName: document.fileName,
    //   textContent: document.textContent,
    //   currentLine,
    //   numberedLines: document.textContent
    //     .split('\n')
    //     .map((l, i) => ({ n: i + 1, l, current: currentLine == i })),
    // });
    // const fileName = `${document.fileName}.html`;
    // fs.writeFileSync(path.join(outputDir, fileName), rendered);
  }
}
