import { InjectModel } from '@nestjs/mongoose';
import { ConsoleLogger, Injectable, Logger } from '@nestjs/common';
import { MenuEntry, MenuEntryDocument } from '../schemas/menu-entry.schema.js';
import { InfoFile, InfoFileDocument } from '../schemas/info-file.schema.js';

import { S3Service } from '../s3/s3.service.js';
import { FilterQuery, Model } from 'mongoose';
import { Court } from '../schemas/court.schema.js';
import { fileKey, menuEntryKey } from './const.js';

import { FileLines } from './parser/file-lines.js';
import { CauselistHeaderParser } from './parser/causelist-header-parser.js';
import { NoticeParser } from './parser/notice-parser.js';
import { peekForRe, peekForWord } from './parser/util.js';
import { CauselistMultiDocumentParser } from './parser/causelist-parser.js';

export interface DocumentParseRequest {
  path?: string;
  docId?: string;
  sha1?: string;
}

export interface DocumentWithData {
  doc: InfoFileDocument;
  textContent: string;
  textContentType: string;
  textContentSha1: string;
}

export interface DocumentParseResult {
  doc: InfoFileDocument;
  textContent: string;
  fileLines: FileLines;
  parser: CauselistMultiDocumentParser;
  score: number;
  // for development
  hasCourt: boolean;
  hasCauseList: boolean;
  isNotice: boolean;
}

@Injectable()
export class KenyaLawParserService {
  private readonly log = new Logger(KenyaLawParserService.name);

  constructor(
    protected s3Service: S3Service,
    @InjectModel(MenuEntry.name)
    protected menuEntryModel: Model<MenuEntry>,
    @InjectModel(InfoFile.name)
    protected infoFileModel: Model<InfoFile>,
    @InjectModel(Court.name)
    protected courtModel: Model<Court>,
  ) {}

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
      documentsCount: 0,
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
        documentsCount: 0,
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
        documentsCount: 0,
      });
    }
    courtsDocuments = courtsDocuments.filter((e) => e.name != hkName);

    // TODO: Court of Appeal Causelist
    const coaName = 'Court of Appeal';
    const courtOfAppealTop = courtsDocuments.find((e) => coaName === e.name);
    console.log(courtsDocuments);
    const courtOfAppeal = courtOfAppealTop.children.find(
      (e) => 'Court of Appeal Causelist' === e.name,
    );
    console.log(courtOfAppeal.children);
    for (const d of courtOfAppeal.children) {
      toSave.push({
        name: d.name,
        type: coaName,
        path: d.path,
        documentsCount: 0,
      });
    }
    courtsDocuments = courtsDocuments.filter((e) => e.name != coaName);

    for (const t of courtsDocuments) {
      for (const d of t.children) {
        toSave.push({
          name: d.name,
          type: t.name,
          path: d.path,
          documentsCount: 0,
        });
      }
    }
    this.log.log('Saving...');
    const r = await Promise.all(
      toSave.map((e) => {
        const { name, type, documentsCount, ...rest } = e;
        return this.courtModel
          .findOneAndUpdate({ name, type }, rest, {
            upsert: true,
            new: true,
          })
          .exec();
      }),
    );
    this.log.log(`Saved ${r.length} courts`);
    // console.log(courtsDocuments);
  }

  async loadDocumentsWithData(
    req: DocumentParseRequest,
  ): Promise<DocumentWithData[]> {
    const filter: FilterQuery<InfoFile> = req.docId
      ? { _id: req.docId }
      : req.sha1
        ? {
            sha1: req.sha1,
          }
        : {
            parentPath: { $regex: `^${req.path}` },
          };
    const infoFiles = await this.infoFileModel.find(filter).exec();
    const resultList: DocumentWithData[] = [];
    for (const file of infoFiles) {
      const downloaded = await this.s3Service.downloadMultipleFiles([
        {
          key: fileKey(file.sha1 + '/text'),
        },
        {
          key: fileKey(file.sha1 + '/meta.json'),
          parseJson: true,
        },
      ]);

      const textContent = downloaded[0].data as string;
      const { textContentType, textContentSha1 } = downloaded[1].dataAsObject;

      resultList.push({
        doc: file,
        textContent,
        textContentType,
        textContentSha1,
      });
    }
    return resultList;
  }

  async parseFilesAsData(req: DocumentParseRequest) {
    const documentsWithData = await this.loadDocumentsWithData(req);
    const parsedList: DocumentParseResult[] = [];
    this.log.log(`Processing ${documentsWithData.length} documents`);
    for (const dd of documentsWithData) {
      const textContent = dd.textContent;
      const fileLines = new FileLines(textContent);
      const f = fileLines.clone();
      const parser = new CauselistMultiDocumentParser(fileLines);
      parser.tryParse();

      parsedList.push({
        doc: dd.doc,
        textContent,
        fileLines,
        parser,
        score: parser?.matchScore() ?? 0,
        hasCourt: peekForWord(f, 'court', 1),
        hasCauseList: peekForRe(f, /cause\s+list/i),
        isNotice: peekForWord(f, 'notice'),
      });
    }
    return parsedList;
  }

  parsedDataStats(parsedList: DocumentParseResult[]) {
    const haveCourt = parsedList.filter(
      (e) => e.hasCourt && !e.isNotice && e.hasCauseList,
    );
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
        const binIdx = k.findLastIndex((v) => e.score >= Number(v));
        const b = k[binIdx];
        if (!acc[b]) {
          acc[b] = [];
        }
        acc[b].push(e);
        return acc;
      }, {});
    return {
      haveCourt,
      scoreBins,
      bins,
    };
  }

  printParsedDataStats(parsedList: DocumentParseResult[]) {
    const { bins, scoreBins, haveCourt } = this.parsedDataStats(parsedList);
    const good = parsedList.filter((e) => e.score >= e.parser.minValidScore());
    const goodAtEnd = good.filter((e) => e.parser.file.end());

    this.log.log('Total:', parsedList.length);
    this.log.log('Total With passing:', good.length);
    this.log.log('Total With passing and reached end:', goodAtEnd.length);
    this.log.log('Total with court:', haveCourt.length);
    this.log.log(
      'minValidScores are:',
      parsedList.reduce((a, e) => {
        const s = e.parser.minValidScore();
        a[s] = (a[s] ?? 0) + 1;
        return a;
      }, {}),
    );
    this.log.log('Score histogram:');
    for (const [bin, count] of Object.entries(scoreBins).map(([k, v]) => [
      k,
      v.length,
    ])) {
      this.log.log(`  ${bins[bin]} => ${count}`);
    }
  }
}
