import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CauseList } from '../schemas/causelist.schema.js';
import { Model } from 'mongoose';
import { Court } from '../schemas/court.schema.js';
import { ICourt, ISearchResult } from '../interfaces/courts.js';
import { RandomCourtData } from '../interfaces/ssr.js';
import { CauseListDocumentParsed } from '../interfaces/index.js';

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
  ) {}
  header;

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

  async findAllJudgesForCourt(courtPath: string): Promise<string[]> {
    return this.causeListModel
      .distinct('header.judge', {
        parentPath: new RegExp(`^${courtPath}`),
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
        'header.date': `${year}-${month}-${day}`,
        parentPath: new RegExp(`^${courtPath}`),
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
        'header.date': new RegExp(`^${year}-${month}`),
        parentPath: new RegExp(`^${courtPath}`),
      })
      .exec();
  }

  async search(text: string) {
    const list = await this.causeListModel
      .find(
        { $text: { $search: `"${text}"` } },
        { score: { $meta: 'textScore' } },
      )
      .sort({ score: { $meta: 'textScore' } })
      .exec();
    const partialList: ISearchResult[] = [];
    const textLower = text.toLowerCase();
    for (const doc of list) {
      const pre = {
        _id: doc._id.toString(),
        date: doc.header.date,
        judge: doc.header.judge,
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
        ? `${year}-${month.toString().padStart(2, '0')}|${year - 1}-12`
        : `${year}-(?:${month.toString().padStart(2, '0')}|${(month - 1)
            .toString()
            .padStart(2, '0')})`;

    const daysWithCauselist = await this.causeListModel
      .aggregate([
        {
          $match: {
            'header.date': new RegExp(`^${reV}`),
            parentPath: new RegExp(`^${courtPath}`),
          },
        },
        { $group: { _id: '$header.date', count: { $sum: 1 } } },
        //{ $sort: { _id: -1 } },
        { $sort: { count: -1 } },
      ])
      .exec();

    const days = daysWithCauselist.slice(0, 3).map((e) => e._id);

    const causelist = await Promise.all(
      days.map((day) =>
        this.causeListModel
          .find({
            'header.date': day,
            parentPath: new RegExp(`^${courtPath}`),
          })
          .exec(),
      ),
    ).then((r) =>
      r.reduce((acc, v) => ({ ...acc, [v[0].header.date]: v }), {}),
    );

    const daysWithData = await this.causeListModel
      .distinct('header.date', {
        'header.date': new RegExp(`^${days[0].replace(/-\d+$/, '')}`),
        parentPath: new RegExp(`^${courtPath}`),
      })
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

    return {
      daysWithData,
      court,
      causelist,
    };
  }
}
