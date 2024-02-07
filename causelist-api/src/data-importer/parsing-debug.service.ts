import * as os from 'node:os';
import * as fs from 'node:fs';
import * as path from 'node:path';

import { InjectModel } from '@nestjs/mongoose';
import { Injectable, Logger } from '@nestjs/common';
import { InfoFile } from '../schemas/info-file.schema.js';

import { S3Service } from '../s3/s3.service.js';
import { FilterQuery, Model } from 'mongoose';
import { Court, CourtDocument } from '../schemas/court.schema.js';

import { CauseList, ParsedDocument } from '../schemas/causelist.schema.js';
import * as nunjucks from 'nunjucks';
import { format } from 'date-fns';
import { FileLines } from './parser/file-lines.js';
import { CauselistMultiDocumentParser } from './parser/causelist-parser.js';
import {
  DocumentParseRequest,
  DocumentParseResult,
  DocumentWithData,
  KenyaLawParserService,
} from './kenya-law-parser.service.js';
import { loadCourtNames } from './parser/court-name-matcher.js';

export interface DebugHtml {
  html: string;
  fileName: string;
  matchScore: number;
  minValidScore: number;
  parserReachedEnd: boolean;
}

@Injectable()
export class ParsingDebugService {
  private readonly log = new Logger(ParsingDebugService.name);
  protected env: nunjucks.Environment;

  constructor(
    protected parserService: KenyaLawParserService,
    @InjectModel(Court.name)
    protected courtModel: Model<Court>,
    @InjectModel(CauseList.name)
    protected causeListModel: Model<CauseList>,
    @InjectModel(InfoFile.name)
    protected infoFileModel: Model<InfoFile>,
  ) {
    this.env = this.makeNunjucksEnv();
  }

  makeNunjucksEnv() {
    const env = new nunjucks.Environment(
      new nunjucks.FileSystemLoader([
        'src/data-importer/parser/debug/nunjucks',
        'dist/data-importer/parser/debug/nunjucks',
      ]),
    );

    env.addFilter('date', function (date: string | Date, formatSpecifier) {
      if (typeof date === 'string') {
        date = new Date(date);
      }
      return format(date, formatSpecifier ?? 'yyyy-MM-dd');
    });
    env.addFilter('dateTime', function (date: string | Date, formatSpecifier) {
      if (typeof date === 'string') {
        date = new Date(date);
      }
      return format(date, formatSpecifier ?? 'yyyy-MM-dd HH:mm');
    });
    return env;
  }

  async debugHTMLForHash(
    docSha1: string,
    useCorrection?: boolean,
  ): Promise<DebugHtml> {
    const [document] = await this.parserService.loadDocumentsWithData({
      debug: true,
      sha1: docSha1,
      includeAlreadyParsed: true,
      useCorrection: useCorrection,
    });
    if (!document) {
      throw new Error('No file found with sha1: ' + docSha1);
    }
    return this.debugHTMLForDocument(document);
  }

  async debugHTMLForDocument(document: DocumentWithData): Promise<DebugHtml> {
    const parsed = await this.parserService.parseDocumentsWithData([document]);
    return this.debugHTMLForParsedDocument(parsed[0]);
  }

  async debugHTMLForParsedDocument(parsed: DocumentParseResult) {
    const env = this.makeNunjucksEnv();
    const currentLine = parsed.fileLines.getCurrentLine();
    const fileName = parsed.doc.fileName;
    const matchScore = parsed.score;
    const minValidScore = parsed.parser.minValidScore();
    const parserReachedEnd = parsed.parser.file.end();
    const html = env.render('parsed-to-debug-html.html.nunjucks', {
      documents: parsed.parser.documents.getParsed(),
      matchScore,
      minValidScore,
      fileName,
      textContent: parsed.textContent,
      currentLine,
      numberedLines: parsed.textContent
        .split('\n')
        .map((l, i) => ({ n: i + 1, l, current: currentLine == i })),
      parserReachedEnd,
    });
    return { html, fileName, matchScore, minValidScore, parserReachedEnd };
  }

  async writeDebugHtmlForParseResults(
    parsedDocuments: DocumentParseResult[],
    outputDir?: string,
    indexContext?: Record<string, any>,
  ) {
    const debugHtmls = await Promise.all(
      parsedDocuments.map((d) => this.debugHTMLForParsedDocument(d)),
    );
    return this.writeDebugHtml(debugHtmls, outputDir, indexContext);
  }

  writeDebugHtml(
    files: DebugHtml[],
    outputDir?: string,
    indexContext?: Record<string, any>,
  ): string[] {
    if (!files.length) {
      return;
    }
    if (!outputDir) {
      outputDir = os.tmpdir();
    }
    fs.mkdirSync(outputDir, { recursive: true });
    const absoluteFileNames: string[] = [];
    const generatedFiles: { file: string; parserReachedEnd: boolean }[] = [];
    for (const { fileName, html, parserReachedEnd } of files) {
      const file = fileName + '.html';
      const fullFileName = path.join(outputDir, file);
      fs.writeFileSync(fullFileName, html);
      absoluteFileNames.push(fullFileName);
      generatedFiles.push({ file, parserReachedEnd });
    }

    if (indexContext) {
      const env = this.makeNunjucksEnv();
      const html = env.render('debug-html-index.html.nunjucks', {
        ...indexContext,
        generatedFiles,
      });
      fs.writeFileSync(path.join(outputDir, 'index.html'), html);
    }

    return absoluteFileNames;
  }

  courtNamesHtml() {
    const courtNames = loadCourtNames();
    const env = this.makeNunjucksEnv();
    const html = env.render('court-names.html.nunjucks', {
      courtNames,
    });
    return { html };
  }
}
