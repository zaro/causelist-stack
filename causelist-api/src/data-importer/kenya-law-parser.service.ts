import { InjectModel } from '@nestjs/mongoose';
import { ConsoleLogger, Injectable, Logger } from '@nestjs/common';
import { InfoFile, InfoFileDocument } from '../schemas/info-file.schema.js';

import { S3Service } from '../s3/s3.service.js';
import { FilterQuery, Model } from 'mongoose';
import { Court } from '../schemas/court.schema.js';
import { fileKey, getTimedKey, menuEntryKey } from './const.js';

import { FileLines } from './parser/file-lines.js';
import { CauselistHeaderParser } from './parser/causelist-header-parser.js';
import { NoticeParser } from './parser/notice-parser.js';
import { peekForRe, peekForWord } from './parser/util.js';
import { CauselistMultiDocumentParser } from './parser/causelist-parser.js';
import { MenuEntry } from './kenya-law-importer.service.js';

export interface DocumentParseRequest {
  onlyAlreadyParsed?: boolean;
  includeAlreadyParsed?: boolean;
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

function isCourtTypeContainedInName(type: string, name: string) {
  if (name.includes(type)) {
    return true;
  }
  // handle typos
  const typos = [
    [/\bClaims\b/, 'Claim'],
    [/Kadhis'/, "Kadhi's"],
    [/Kadhis'/, 'Kadhis'],
  ];
  for (const typo of typos) {
    const ttype = type.replace(typo[0], typo[1].toString());
    if (name.includes(ttype)) {
      return true;
    }
  }
  // Handle missing Court at the end
  const tnc = type.replace(/\s+Court$/, '');
  if (name.includes(tnc)) {
    return true;
  }

  return false;
}

@Injectable()
export class KenyaLawParserService {
  private readonly log = new Logger(KenyaLawParserService.name);

  constructor(
    protected s3Service: S3Service,
    @InjectModel(InfoFile.name)
    protected infoFileModel: Model<InfoFile>,
    @InjectModel(Court.name)
    protected courtModel: Model<Court>,
  ) {}

  async parseCourts(crawlTime: string) {
    const menuResult = await this.s3Service.downloadFile({
      key: getTimedKey(crawlTime, 'menu'),
      parseJson: true,
    });
    const root = menuResult.dataAsObject as MenuEntry;
    const ignoreSections = [
      'Vacation Notices',
      'Notices',
      'Licensed process servers',
    ];
    const courtsDocumentsAll = root.children.filter(
      (e) => !ignoreSections.includes(e.name),
    );
    this.log.log(`Processing courts: ${courtsDocumentsAll.map((e) => e.name)}`);
    let courtsDocuments = courtsDocumentsAll;
    const toSave: Court[] = [];
    // Supreme Court
    const noBranches = ['Supreme Court'];
    for (const noBranchCourt of noBranches) {
      const current = courtsDocumentsAll.find((e) => noBranchCourt === e.name);
      toSave.push({
        name: 'Supreme Court',
        type: 'Supreme Court',
        path: 'Supreme Court',
        url: current.url,
        documentsCount: 0,
      });
      courtsDocuments = courtsDocumentsAll.filter(
        (e) => noBranchCourt !== e.name,
      );
    }

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
        url: d.url,
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
        url: d.url,
        documentsCount: 0,
      });
    }
    courtsDocuments = courtsDocuments.filter((e) => e.name != hkName);

    // TODO: Court of Appeal Causelist
    const coaName = 'Court of Appeal';
    const courtOfAppealTop = courtsDocuments.find((e) => coaName === e.name);
    // console.log(courtsDocuments);
    const courtOfAppeal = courtOfAppealTop.children.find(
      (e) => 'Court of Appeal Causelist' === e.name,
    );
    // console.log(courtOfAppeal.children);
    for (const d of courtOfAppeal.children) {
      const name = isCourtTypeContainedInName(coaName, d.name)
        ? d.name
        : coaName + ' / ' + d.name;
      toSave.push({
        name,
        type: coaName,
        path: d.path,
        url: d.url,
        documentsCount: 0,
      });
    }
    courtsDocuments = courtsDocuments.filter((e) => e.name != coaName);

    const ealName = 'Environment and Land Court';
    const envAndLandCourt = courtsDocuments.find((e) => ealName === e.name);

    for (const d of envAndLandCourt.children) {
      const r = new RegExp(`^${ealName}\\s+\\(?(\\w+)\\)?\\s*$`);
      const m = d.name.match(r);
      if (m) {
        toSave.push({
          name: `${ealName} / ${m[1]} `,
          type: ealName,
          path: d.path,
          url: d.url,
          documentsCount: 0,
        });
      } else {
        this.log.error('Failed to match ');
        throw new Error('Failed to match', { cause: { d, r } });
      }
    }
    courtsDocuments = courtsDocuments.filter((e) => e.name != ealName);

    for (const t of courtsDocuments) {
      for (const d of t.children) {
        const name = isCourtTypeContainedInName(t.name, d.name)
          ? d.name
          : t.name + ' / ' + d.name;
        toSave.push({
          name,
          type: t.name,
          path: d.path,
          url: d.url,
          documentsCount: 0,
        });
      }
    }
    this.log.log('Saving...');
    const uniqueURLs = new Set(toSave.map((c) => c.url));

    if (uniqueURLs.size !== toSave.length) {
      this.log.error('Not all URLS for courts are unique');
      throw new Error('Not all courts have unique URLS!');
    }

    const r = await Promise.all(
      toSave.map((e) => {
        const { url, documentsCount, ...rest } = e;
        return this.courtModel
          .findOneAndUpdate({ url }, rest, {
            upsert: true,
            new: true,
            includeResultMetadata: true,
          })
          .exec();
      }),
    );
    this.log.log(`Saved total ${r.length} courts`);
    const updateExisting = r.filter((r) => r.lastErrorObject.updatedExisting);
    const upserted = r.filter((r) => r.lastErrorObject.upserted);
    this.log.log(`Updated ${updateExisting.length} courts`);
    this.log.log(`Upserted ${upserted.length} courts`);
  }

  async loadDocumentsWithData(
    req: DocumentParseRequest,
  ): Promise<DocumentWithData[]> {
    let filter: FilterQuery<InfoFile> = req.docId
      ? { _id: req.docId }
      : req.sha1
        ? {
            sha1: req.sha1,
          }
        : {
            parentPath: { $regex: `^${req.path}` },
          };
    if (!req.includeAlreadyParsed) {
      filter.parsedAt = { $exists: false };
    }

    if (req.onlyAlreadyParsed) {
      filter = { parsedAt: { $exists: true } };
    }
    const infoFiles = await this.infoFileModel.find(filter).exec();
    this.log.log(`Loading data for ${infoFiles.length} InfoFiles`);
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
    this.log.log(`Loaded ${resultList.length} InfoFiles`);
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
    return { bins, scoreBins, haveCourt };
  }
}
