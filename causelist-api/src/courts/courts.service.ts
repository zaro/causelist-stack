import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CauseList } from '../schemas/causelist.schema.js';
import { Model } from 'mongoose';
import { Court } from '../schemas/court.schema.js';
import { ICourt, ICourtStats, ISearchResult } from '../interfaces/courts.js';
import { RandomCourtData } from '../interfaces/ssr.js';
import { CauseListDocumentParsed } from '../interfaces/index.js';
import {
  getDateOnlyISOFromDate,
  getDateOnlyISOFromParts,
  getMonthOnlyISOFromParts,
} from '../interfaces/util.js';
import { InfoFile } from '../schemas/info-file.schema.js';
import { ParsingDebugService } from '../data-importer/parsing-debug.service.js';
import { UnassignedMatters } from '../schemas/unassigned-matters.schema.js';
import { escapeForRegex } from '../data-importer/parser/util.js';

const RANDOM_COURTS = [
  'Chief Magistrates Court:Milimani Chief Magistrate Criminal Court',
];

const CASE_FIELDS = [
  'caseNumber',
  'additionalNumber',
  'partyA',
  'partyB',
  'description',
];

@Injectable()
export class CourtsService {
  constructor(
    @InjectModel(Court.name) private courtModel: Model<Court>,
    @InjectModel(CauseList.name) private causeListModel: Model<CauseList>,
    @InjectModel(UnassignedMatters.name)
    private unassignedMattersModel: Model<UnassignedMatters>,
    @InjectModel(InfoFile.name) private infoFileModel: Model<InfoFile>,
    protected parsingDebugService: ParsingDebugService,
  ) {}

  async findAll(): Promise<ICourt[]> {
    const courts = await this.courtModel
      .find<ICourt>(
        {},
        {
          name: 1,
          type: 1,
          path: 1,
          hasData: { $gt: ['$documentsCount', 0] },
        },
      )
      .exec();
    // await new Promise((ok, fail) => setTimeout(() => ok(1), 5000));
    // return courts.reduce(
    //   (r, c) => ({
    //     ...r,
    //     [c.type]: r[c.type] ? [...r[c.type], c] : [c],
    //   }),
    //   {},
    // );
    return courts;
  }

  async getCauseList(id: string): Promise<CauseList> {
    return this.causeListModel.findOne({ _id: id }).exec();
  }

  async getUnassignedMatters(id: string): Promise<UnassignedMatters> {
    return this.unassignedMattersModel.findOne({ _id: id }).exec();
  }

  async getCauseListDebug(
    id: string,
    useCorrection?: boolean | undefined,
  ): Promise<{
    infoFile: InfoFile;
    debugHTML: string;
    usedCorrectedVersion: boolean;
  }> {
    let infoFile = await this.infoFileModel.findOne({
      _id: id,
    });
    if (!infoFile) {
      const causelist = await this.causeListModel.findOne({ _id: id }).exec();
      if (!causelist) {
        throw new NotFoundException();
      }
      infoFile = await this.infoFileModel.findOne({
        _id: causelist.parsedFrom,
      });
    }
    const useCorrectedVersion =
      typeof useCorrection === 'boolean'
        ? useCorrection
        : infoFile.hasCorrection;

    const { html } = await this.parsingDebugService.debugHTMLForHash(
      infoFile.sha1,
      useCorrectedVersion,
    );
    return {
      infoFile,
      debugHTML: html,
      usedCorrectedVersion: useCorrectedVersion,
    };
  }

  async findAllJudgesForCourt(courtPath: string): Promise<string[]> {
    return this.causeListModel
      .distinct('header.judge', {
        parentPath: new RegExp(`^${escapeForRegex(courtPath)}`),
      })
      .exec();
  }

  async getDay(
    year: number,
    month: number,
    day: number,
    courtPath: string,
  ): Promise<CauseList[]> {
    return this.causeListModel
      .find({
        'header.date': getDateOnlyISOFromParts(year, month, day),
        parentPath: new RegExp(`^${escapeForRegex(courtPath)}`),
      })
      .exec();
  }

  async daysInAMonth(
    year: number,
    month: number,
    courtPath: string,
  ): Promise<string[]> {
    return this.causeListModel
      .distinct('header.date', {
        'header.date': new RegExp(`^${getMonthOnlyISOFromParts(year, month)}`),
        parentPath: new RegExp(`^${escapeForRegex(courtPath)}`),
      })
      .exec();
  }

  async search(text: string) {
    const causeList = await this.causeListModel
      .find(
        { $text: { $search: `"${text}"` } },
        { score: { $meta: 'textScore' } },
      )
      .sort({ score: { $meta: 'textScore' } })
      .exec();
    const unassignedMattersList = await this.unassignedMattersModel
      .find(
        { $text: { $search: `"${text}"` } },
        { score: { $meta: 'textScore' } },
      )
      .sort({ score: { $meta: 'textScore' } })
      .exec();
    const partialList: ISearchResult[] = [];
    const textLower = text.toLowerCase();
    for (const doc of causeList) {
      const pre = {
        _id: doc._id.toString(),
        type: doc.type,
        date: doc.header?.date,
        judge: doc.header?.judge,
      };
      for (
        let sectionIdx = 0;
        sectionIdx < doc.causeLists.length;
        sectionIdx++
      ) {
        const section = doc.causeLists[sectionIdx];
        const sec = {
          ...pre,
          typeOfCause: section.typeOfCause,
        };
        for (let lineIdx = 0; lineIdx < section.cases.length; lineIdx++) {
          const line = section.cases[lineIdx];
          for (const k of CASE_FIELDS) {
            const v = line[k];
            if (typeof v === 'string' && v.toLowerCase().includes(textLower)) {
              partialList.push({
                ...sec,
                case: line,
                casePosition: [sectionIdx, lineIdx],
              });
              break;
            }
          }
        }
      }
    }
    for (const doc of unassignedMattersList) {
      const pre = {
        _id: doc._id.toString(),
        type: doc.type,
        date: doc.header?.date,
      };
      for (let lineIdx = 0; lineIdx < doc.cases.length; lineIdx++) {
        const line = doc.cases[lineIdx];
        for (const k of CASE_FIELDS) {
          const v = line[k];
          if (typeof v === 'string' && v.toLowerCase().includes(textLower)) {
            partialList.push({
              ...pre,
              case: line,
              typeOfCause: line.typeOfCause,
              casePosition: [lineIdx, -1],
            });
            break;
          }
        }
      }
    }

    return partialList;
  }

  async getRandomDay(): Promise<RandomCourtData> {
    const courtPath =
      RANDOM_COURTS[Math.floor(Math.random() * RANDOM_COURTS.length)];
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const reV =
      month === 1
        ? `${getMonthOnlyISOFromParts(year, month)}|${getMonthOnlyISOFromParts(
            year - 1,
            12,
          )}`
        : `${getMonthOnlyISOFromParts(year, month)}|${getMonthOnlyISOFromParts(
            year,
            month - 1,
          )}`;

    const daysWithCauselist = await this.causeListModel
      .aggregate([
        {
          $match: {
            'header.date': new RegExp(`^${reV}`),
            parentPath: new RegExp(`^${escapeForRegex(courtPath)}`),
          },
        },
        { $group: { _id: '$header.date', count: { $sum: 1 } } },
        //{ $sort: { _id: -1 } },
        { $sort: { count: -1, _id: -1 } },
      ])
      .exec();

    const court = await this.courtModel
      .findOne<ICourt>(
        {
          path: courtPath,
        },
        {
          name: 1,
          type: 1,
          path: 1,
          hasData: { $gt: ['$documentsCount', 0] },
        },
      )
      .exec();

    const days = daysWithCauselist.slice(0, 3).map((e) => e._id);

    if (!days?.length) {
      return {
        court,
        daysWithData: [],
        causelist: {},
      };
    }

    const causelist = await Promise.all(
      days.map((day) =>
        this.causeListModel
          .find({
            'header.date': day,
            parentPath: new RegExp(`^${escapeForRegex(courtPath)}`),
          })
          .exec(),
      ),
    ).then((r) =>
      r.reduce((acc, v) => ({ ...acc, [v[0].header.date]: v }), {}),
    );

    const daysWithData = await this.causeListModel
      .distinct('header.date', {
        'header.date': new RegExp(`^${days[0].replace(/-\d+$/, '')}`),
        parentPath: new RegExp(`^${escapeForRegex(courtPath)}`),
      })
      .exec();

    return {
      daysWithData,
      court,
      causelist,
    };
  }

  async getCourtsStats(): Promise<ICourtStats[]> {
    const courts = await this.courtModel.find().exec();
    const courtsWithData = await Promise.all(
      courts.map(async (c) => {
        const s = await this.infoFileModel
          .aggregate([
            {
              $match: {
                parentPath: new RegExp('^' + escapeForRegex(c.path)),
              },
            },
            {
              $group: {
                _id: {
                  path: c.path,
                  hint: '$overrideDocumentType',
                },
                count: { $sum: 1 },
                createdAt: { $max: '$createdAt' },
                parsedAt: { $max: '$parsedAt' },
                unparsedCount: {
                  $sum: {
                    $switch: {
                      branches: [
                        {
                          case: { $lte: ['$parsedAt', null] },
                          then: 1,
                        },
                      ],
                      default: 0,
                    },
                  },
                },
              },
            },
          ])
          .exec();
        let documentsCount = 0,
          unparsedCount = 0,
          noticeCount = 0,
          ignoredCount = 0,
          lastImportedDocumentTime,
          lastParsedDocumentTime;
        for (const row of s) {
          documentsCount += row.count;
          switch (row._id.hint) {
            case 'NOTICE':
              noticeCount += row.count;
              break;
            case 'IGNORE':
              ignoredCount += row.count;
              break;
            default:
              unparsedCount += row.unparsedCount;
              break;
          }
          if (
            !lastImportedDocumentTime ||
            lastImportedDocumentTime < row.createdAt
          ) {
            lastImportedDocumentTime = row.createdAt;
          }
          if (
            !lastParsedDocumentTime ||
            lastParsedDocumentTime < row.parsedAt
          ) {
            lastParsedDocumentTime = row.parsedAt;
          }
        }
        return {
          id: c._id.toHexString(),
          name: c.name,
          type: c.type,
          path: c.path,
          documentsCount,
          unparsedCount,
          noticeCount,
          ignoredCount,
          totalIgnoreCount: noticeCount + ignoredCount,
          lastImportedDocumentTime,
          lastParsedDocumentTime,
        };
      }),
    );
    return courtsWithData;
  }
}
