import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CauseList } from '../schemas/causelist.schema.js';
import { Model } from 'mongoose';

@Injectable()
export class CourtsService {
  constructor(
    @InjectModel(CauseList.name) private causeListModel: Model<CauseList>,
  ) {}
  header;

  async findAll(): Promise<string[]> {
    return this.causeListModel.distinct('header.court').exec();
  }

  async getDay(
    year: number,
    month: number,
    day: number,
    court: string,
  ): Promise<CauseList[]> {
    return this.causeListModel
      .find({
        'header.date': `${year}-${month}-${day}`,
        'header.court': court,
      })
      .exec();
  }

  async daysInAMonth(
    year: number,
    month: number,
    court: string,
  ): Promise<string[]> {
    return this.causeListModel
      .distinct('header.date', {
        'header.date': new RegExp(`^${year}-${month}`),
        'header.court': court,
      })
      .exec();
  }
}
