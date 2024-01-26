import { Command, Option, Positional } from 'nestjs-command/dist/index.js';
import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as util from 'node:util';
import * as child_process from 'node:child_process';
import * as os from 'node:os';
import open from 'open';

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
import { UnassignedMatters } from '../schemas/unassigned-matters.schema.js';
import { ParsingDebugService } from '../data-importer/parsing-debug.service.js';
import { UpdateStatsService } from '../data-importer/update-stats.service.js';

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
    protected parsingDebugService: ParsingDebugService,
    protected updateStatsService: UpdateStatsService,
    @InjectModel(InfoFile.name)
    protected infoFileModel: Model<InfoFile>,
    @InjectModel(CauseList.name)
    protected causeListModel: Model<CauseList>,
    @InjectModel(UnassignedMatters.name)
    protected unassignedMattersModel: Model<UnassignedMatters>,
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
    await this.parseFiles('.', null, null, true, false, false);
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
    menuPath: string,
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
      name: 'debug-html',
      describe: 'Write HTML for debugging',
      type: 'boolean',
      required: false,
    })
    debugHtml: boolean,
    @Option({
      name: 'partial-debug-html',
      describe: 'Write HTML for debugging with all files',
      type: 'boolean',
      required: false,
    })
    partialDebugHtml: boolean,
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
      path: menuPath,
      sha1,
    });
    this.parserService.printParsedDataStats(parsedList);
    const good = parsedList.filter((e) => e.score >= e.parser.minValidScore());
    const haveCourt = good.filter(
      (e) => e.hasCourt && !e.isNotice && e.hasCauseList,
    );
    if (debugHtml || partialDebugHtml) {
      let documentsToDebug = good;
      if (debugHtml) {
        documentsToDebug = documentsToDebug.filter((e) => e.parser.file.end());
      }
      if (documentsToDebug.length) {
        // Document counts
        const courts = await this.updateStatsService.getAllCourts();
        const prevCourtDocCount: Record<string, number> = {};
        for (const v of courts) {
          prevCourtDocCount[v.path] =
            (prevCourtDocCount[v.path] ?? 0) + (v.documentsCount ?? 0);
        }
        const nextCourtDocCount = {
          ...prevCourtDocCount,
        };
        for (const parsedDoc of documentsToDebug) {
          const path = parsedDoc.doc.parentPath;
          nextCourtDocCount[path] = (nextCourtDocCount[path] ?? 0) + 1;
        }
        // Generate HTML
        const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'debug-html-'));
        const debugHtmls = await Promise.all(
          documentsToDebug.map((d) =>
            this.parsingDebugService.debugHTMLForParsedDocument(d),
          ),
        );
        const filenames = this.parsingDebugService.writeDebugHtml(
          debugHtmls,
          outDir,
          {
            prevCourtDocCount,
            nextCourtDocCount,
          },
        );
        this.log.log(`Wrote ${filenames.length} files to ${outDir}.`);
        await open(path.join(outDir, 'index.html'));
      } else {
        this.log.warn('No fully parsed files.');
      }
      return;
    }
    if (write) {
      const now = new Date();
      const goodAtEnd = good.filter((e) => e.parser.file.end());
      let deletedOld = 0,
        savedNew = 0,
        updatedInfoFiles = 0;
      for (const parsed of goodAtEnd) {
        const savePromises = [];
        const infoFile = parsed.doc;
        const data = parsed.parser.getParsed();
        const deleted = await this.causeListModel
          .deleteMany({
            parsedFrom: infoFile._id,
          })
          .exec();
        deletedOld += deleted.deletedCount;
        for (const document of data.documents) {
          if (document.type === 'CAUSE LIST') {
            const causeList = new this.causeListModel({
              ...document,
              parsedFrom: infoFile._id,
              parentPath: infoFile.parentPath,
            });
            savePromises.push(causeList.save());
          } else if (document.type === 'UNASSIGNED MATTERS') {
            const unassignedMatters = new this.unassignedMattersModel({
              ...document,
              parsedFrom: infoFile._id,
              parentPath: infoFile.parentPath,
            });
            savePromises.push(unassignedMatters.save());
          }
        }
        await Promise.all(savePromises);
        savedNew += savePromises.length;
        infoFile.parsedAt = now;
        await infoFile.save();
        updatedInfoFiles++;
      }
      this.log.log(`Deleted ${deletedOld} existing !`);
      this.log.log(`Writing ${savedNew} CauseList|UnassignedMatters to db!`);
      this.log.log(`Updated ${updatedInfoFiles} InfoFile as parsed...`);

      this.log.log(`Updating court document count...`);
      await this.updateStatsService.updateCourtsStats();
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
    console.dir(
      Object.fromEntries(
        Object.entries(nextLineStats(haveCourt)).map(([k, d]) => [
          k,
          d.map((e) => e.doc.sha1),
        ]),
      ),
    );
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
    command: 'parse:unparsed-stats [path]',
    describe: 'print unparsed documents stats',
  })
  async unparsedStats(
    @Positional({
      name: 'path',
      describe: 'menu path to parse',
      type: 'string',
    })
    menuPath: string,
  ) {
    console.log('stats for ', menuPath);
    const unparsed = await this.infoFileModel
      .find({
        parsedAt: { $exists: false },
        ...(menuPath ? { parentPath: new RegExp(menuPath) } : {}),
      })
      .exec();
    const counts: Record<string, number> = {};
    for (const doc of unparsed) {
      counts[doc.parentPath] = (counts[doc.parentPath] ?? 0) + 1;
    }
    const countKeysSorted = Object.keys(counts).toSorted(
      (a, b) => counts[b] - counts[a],
    );
    for (const k of countKeysSorted) {
      console.log(`${counts[k]}\t${k}`);
    }
    if (Object.keys(counts).length == 1) {
      console.log('Documents sha');
      for (const doc of unparsed) {
        console.log(doc.sha1);
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
    command: 'parse:debug-html <docSha1> [outputDir]',
    describe: 'Parse Cuaselists and output html with debug info',
  })
  async debugHTML(
    @Positional({
      name: 'docSha1',
      describe: 'document Sha1',
      type: 'string',
    })
    docSha1: string,
    @Positional({
      name: 'outputDir',
      describe: 'output directory',
      type: 'string',
    })
    outputDir: string,
  ) {
    const debugHTML = await this.parsingDebugService.debugHTMLForHash(docSha1);
    const fileNames = this.parsingDebugService.writeDebugHtml(
      [debugHTML],
      outputDir,
    );
    await open(fileNames[0]);
  }
}
