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
import { Court } from '../schemas/court.schema.js';

const fixturesDir = 'src/commands/parser/__fixtures__/data';

const exec = util.promisify(child_process.exec);

function nextLineStats(docs: { doc: InfoFile; fl: FileLines }[]) {
  const s = [];
  for (const doc of docs) {
    doc.fl.skipEmptyLines();
    const t = doc.fl.peekNext()?.trim();
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
    command: 'parse:make-fixture <docIdOrMd5>',
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
    fs.mkdirSync(fixturesDir, { recursive: true });

    // Store under MD5(textContent) filename
    const fileName = `${data.textContentMd5}.json`;
    fs.writeFileSync(
      path.join(fixturesDir, fileName),
      JSON.stringify(data, undefined, 2),
    );
    this.log.log(`Wrote: ${fileName}!`);
  }

  @Command({
    command: 'parse:courts',
    describe: 'Parse Courts from Menu',
  })
  async parseCourts() {
    const root = await this.menuEntryModel
      .findOne({ name: '_root' })
      .sort({ updatedAt: 'desc' })
      .exec();
    const ignoreSections = [
      'Vacation Notices',
      'Notices',
      'Licensed process servers',
    ];
    const courtsDocumentsAll = root.children.filter(
      (e) => !ignoreSections.includes(e.name),
    );
    this.log.log(`Processing courts: ${courtsDocumentsAll.map((e) => e.name)}`);
    const toSave: Court[] = [];
    // Supreme Court
    const noBranches = ['Supreme Court'];
    toSave.push({
      name: 'Supreme Court',
      type: 'Supreme Court',
      path: 'Supreme Court',
    });
    let courtsDocuments = courtsDocumentsAll.filter(
      (e) => !noBranches.includes(e.name),
    );

    // High Court of Kenya
    const hkName = 'High Court of Kenya';
    const hightCourt = courtsDocumentsAll.find((e) => hkName === e.name);
    const milimaniLawCourts = hightCourt.children.find(
      (e) => e.name === 'Milimani Law Courts',
    );
    // console.dir(milimaniLawCourts);
    for (const d of milimaniLawCourts.children) {
      toSave.push({
        name: milimaniLawCourts.name + ' / ' + d.name,
        type: hkName,
        path: d.path,
      });
    }
    hightCourt.children = hightCourt.children.filter(
      (e) => e.name !== 'Vacation Notice' && e.name !== 'Milimani Law Courts',
    );
    for (const d of hightCourt.children) {
      toSave.push({
        name: hightCourt.name + ' / ' + d.name,
        type: hkName,
        path: d.path,
      });
    }
    courtsDocuments = courtsDocuments.filter((e) => e.name != hkName);

    // TODO: Court of Appeal Causelist
    const coaName = 'Court of Appeal';
    // const courtOfAppealTop = courtsDocuments.find((e) => coaName === e.name);
    // console.log(courtsDocuments);
    // const courtOfAppeal = courtOfAppealTop.children.find(
    //   (e) => 'Court of Appeal Causelist' === e.name,
    // );
    // for (const d of courtOfAppeal.children) {
    //   toSave.push({
    //     name: coaName,
    //     type: coaName,
    //     path: d.path,
    //   });
    // }

    courtsDocuments = courtsDocuments.filter((e) => e.name != coaName);

    for (const t of courtsDocuments) {
      for (const d of t.children) {
        toSave.push({
          name: d.name,
          type: t.name,
          path: d.path,
        });
      }
    }
    this.log.log('Saving...');
    const r = await Promise.all(
      toSave.map((e) => {
        return new this.courtModel(e).save();
      }),
    );
    this.log.log(`Saved ${r.length} courts`);
    // console.log(courtsDocuments);
  }

  @Command({
    command: 'parse:files <path>',
    describe: 'Parse Cuaselists under path',
  })
  async parse(
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
      name: 'md5',
      describe: 'specific document with md5 sum',
      type: 'string',
      required: false,
    })
    md5: string,
    @Option({
      name: 'write',
      describe: 'Write parsed data to db',
      type: 'boolean',
      required: false,
    })
    write: string,
    @Option({
      name: 'stats',
      describe: 'Output more stats',
      type: 'boolean',
      required: false,
    })
    stats: string,
  ) {
    const filter: FilterQuery<InfoFile> = docId
      ? { _id: docId }
      : md5
        ? {
            md5,
          }
        : {
            parentPath: { $regex: `^${path}` },
          };
    const allDocuments = await this.infoFileModel.find(filter).exec();
    this.log.log(`Processing ${allDocuments.length} documents`);
    const documents = allDocuments.filter((d) => !!d.textContent);

    const parsedList = documents.map((d) => {
      const fl = new FileLines(d.textContent);
      const f = fl.clone();
      const p = new CauselistMultiDocumentParser(fl);
      p.tryParse();
      return {
        docId: d._id.toString(),
        doc: d,
        fl,
        p,
        s: p?.matchScore() ?? 0,
        hasCourt: peekForWord(f, 'court', 1),
        hasCauseList: peekForRe(f, /cause\s+list/i),
        isNotice: peekForWord(f, 'notice'),
      };
    });
    // .map((e) => [e.docId, e.p.matchScore(), e.p.getParsed()]);
    // console.dir(cl., {
    //   depth: null,
    //   maxArrayLength: null,
    // });
    const haveCourt = parsedList.filter(
      (e) => e.hasCourt && !e.isNotice && e.hasCauseList,
    );
    const good = parsedList.filter((e) => e.s >= e.p.minValidScore());
    const goodAtEnd = good.filter((e) => e.p.file.end());
    const bins = {
      0: ' 0- 9',
      10: '10-19',
      20: '20-29',
      30: '30-39',
      40: '40-49',
      50: '50-59',
      60: '60-69',
      70: '70-79',
    };
    const scoreBins: { [key: string]: Array<(typeof parsedList)[0]> } =
      haveCourt.reduce((acc, e) => {
        const k = Object.keys(bins);
        const binIdx = k.findLastIndex((v) => e.s >= Number(v));
        const b = k[binIdx];
        if (!acc[b]) {
          acc[b] = [];
        }
        acc[b].push(e);
        return acc;
      }, {});

    console.log('Total:', allDocuments.length);
    console.log('Total Parsable:', documents.length);
    console.log('Total With passing:', good.length);
    console.log('Total With passing and reached end:', goodAtEnd.length);
    console.log('Total with court:', haveCourt.length);
    console.log(
      'minValidScores are:',
      parsedList.reduce((a, e) => {
        const s = e.p.minValidScore();
        a[s] = (a[s] ?? 0) + 1;
        return a;
      }, {}),
    );
    console.log('Score histogram:');
    for (const [bin, count] of Object.entries(scoreBins).map(([k, v]) => [
      k,
      v.length,
    ])) {
      console.log(`  ${bins[bin]} => ${count}`);
    }
    if (write) {
      const savePromises = [];
      let deletedOld = 0;
      for (const parsed of goodAtEnd) {
        const infoFile = parsed.doc;
        const data = parsed.p.getParsed();
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
        Object.entries(nextLineStats(good.filter((e) => !e.p.file.end()))).map(
          ([k, d]) => [k, d.map((e) => e.doc.md5.toString())],
        ),
        { maxArrayLength: null },
      );

      if (docId || md5) {
        console.dir([parsedList[0].docId, parsedList[0].p.getParsed()], {
          depth: null,
        });
        if (!parsedList[0].p.file.end()) {
          console.log('First unparsed line: ');
          console.log(parsedList[0].p.file.peekNext());
        }
      }
    }
  }

  makeNunjucksEnv() {
    const env = new nunjucks.Environment(
      new nunjucks.FileSystemLoader('src/commands/parser/debug/nunjucks/'),
    );
    env.addFilter('date', function (date, formatSpecifier) {
      return format(date, formatSpecifier ?? 'yyyy-MM-dd');
    });
    env.addFilter('dateTime', function (date, formatSpecifier) {
      return format(date, formatSpecifier ?? 'yyyy-MM-dd HH:mm');
    });
    return env;
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
    const filter: FilterQuery<InfoFile> = {
      parentPath: { $regex: `^${menuPath}` },
    };
    const documents = await this.infoFileModel.find(filter).exec();
    this.log.log(`Processing ${documents.length} documents`);

    const parsedList = documents.map((d) => {
      const fl = new FileLines(d.textContent);
      const f = fl.clone();
      const p = new CauselistMultiDocumentParser(fl);
      p.tryParse();
      return {
        docId: d._id.toString(),
        doc: d,
        fl,
        p,
        s: p?.matchScore() ?? 0,
        hasCourt: peekForWord(f, 'court', 1),
        hasCauseList: peekForRe(f, /cause\s+list/i),
        isNotice: peekForWord(f, 'notice'),
      };
    });
    const good = parsedList.filter((e) => e.s >= e.p.minValidScore());
    const goodAtEnd = good.filter((e) => e.p.file.end());
    console.log('Total:', documents.length);
    console.log('Total With passing:', good.length);
    console.log('Total With passing and reached end:', goodAtEnd.length);

    fs.mkdirSync(outputDir, { recursive: true });
    const env = this.makeNunjucksEnv();
    const csvFileData = [['md5', 'parentUrl', 'fileName', 'toVerify', 'VALID']];
    for (const g of goodAtEnd.toSorted((a, b) =>
      a.doc.fileName.localeCompare(b.doc.fileName),
    )) {
      const rendered = env.render('parsed-to-html.html.nunjucks', {
        documents: g.p.documents.getParsed(),
        fileName: g.doc.fileName,
        textContent: g.doc.textContent,
      });
      const fileName = `${g.doc.fileName}.html`;
      fs.writeFileSync(path.join(outputDir, fileName), rendered);
      fs.copyFileSync(
        path.join(documentsPath, g.doc.fileName),
        path.join(outputDir, g.doc.fileName),
      );
      csvFileData.push([g.doc.md5, g.doc.parentUrl, g.doc.fileName, fileName]);
    }
    fs.writeFileSync(
      path.join(outputDir, 'a_check_list.csv'),
      csvFileData.map((la) => la.map((i) => `"${i}"`).join(',')).join('\n'),
    );
    console.log('wrote:', goodAtEnd.length);
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
    const filter: FilterQuery<InfoFile> = {
      md5: docMd5,
    };
    const document = await this.infoFileModel.findOne(filter).exec();
    const fl = new FileLines(document.textContent);
    const p = new CauselistMultiDocumentParser(fl);
    p.tryParse();
    const parsedDocument = {
      doc: document,
      fl,
      p,
      s: p?.matchScore() ?? 0,
    };

    fs.mkdirSync(outputDir, { recursive: true });
    const env = this.makeNunjucksEnv();
    const currentLine = fl.getCurrentLine();
    const rendered = env.render('parsed-to-debug-html.html.nunjucks', {
      documents: p.documents.getParsed(),
      fileName: document.fileName,
      textContent: document.textContent,
      currentLine,
      numberedLines: document.textContent
        .split('\n')
        .map((l, i) => ({ n: i + 1, l, current: currentLine == i })),
    });
    const fileName = `${document.fileName}.html`;
    fs.writeFileSync(path.join(outputDir, fileName), rendered);
  }
}
