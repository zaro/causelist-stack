import { InjectModel } from '@nestjs/mongoose';
import { Injectable, Logger } from '@nestjs/common';
import { InfoFile } from '../schemas/info-file.schema.js';

import { S3Service } from '../s3/s3.service.js';
import { FilterQuery, Model } from 'mongoose';
import { Court, CourtDocument } from '../schemas/court.schema.js';

import { CauseList } from '../schemas/causelist.schema.js';
import * as nunjucks from 'nunjucks';
import { format } from 'date-fns';
import { FileLines } from './parser/file-lines.js';
import { CauselistMultiDocumentParser } from './parser/causelist-parser.js';
import { KenyaLawParserService } from './kenya-law-parser.service.js';

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

  async debugHTML(docSha1: string) {
    const [document] = await this.parserService.loadDocumentsWithData({
      sha1: docSha1,
    });
    const fl = new FileLines(document.textContent);
    const p = new CauselistMultiDocumentParser(fl);
    p.tryParse();

    const env = this.makeNunjucksEnv();
    const currentLine = fl.getCurrentLine();
    const rendered = env.render('parsed-to-debug-html.html.nunjucks', {
      documents: p.documents.getParsed(),
      fileName: document.doc.fileName,
      textContent: document.textContent,
      currentLine,
      numberedLines: document.textContent
        .split('\n')
        .map((l, i) => ({ n: i + 1, l, current: currentLine == i })),
    });
    return rendered;
  }
}
