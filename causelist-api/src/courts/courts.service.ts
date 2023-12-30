import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CauseList } from '../schemas/causelist.schema.js';
import { Model } from 'mongoose';
import { Court } from '../schemas/court.schema.js';
import { ICourt } from '../interfaces/courts.js';

@Injectable()
export class CourtsService {
  constructor(
    @InjectModel(Court.name) private courtModel: Model<Court>,
    @InjectModel(CauseList.name) private causeListModel: Model<CauseList>,
  ) {}
  header;

  async findAll(): Promise<ICourt[]> {
    const courts = await this.courtModel
      .find(
        {},
        {
          name: 1,
          type: 1,
          path: 1,
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
}
