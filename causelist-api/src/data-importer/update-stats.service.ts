import { InjectModel } from '@nestjs/mongoose';
import { Injectable, Logger } from '@nestjs/common';
import { MenuEntry } from '../schemas/menu-entry.schema.js';
import { InfoFile } from '../schemas/info-file.schema.js';

import { S3Service } from '../s3/s3.service.js';
import { Model } from 'mongoose';
import { Court, CourtDocument } from '../schemas/court.schema.js';

import { CauseList } from '../schemas/causelist.schema.js';

@Injectable()
export class UpdateStatsService {
  private readonly log = new Logger(UpdateStatsService.name);

  constructor(
    @InjectModel(Court.name)
    protected courtModel: Model<Court>,
    @InjectModel(CauseList.name)
    protected causeListModel: Model<CauseList>,
  ) {}

  async updateCourtsStats() {
    const courts = await this.courtModel.find().exec();
    const toSave: CourtDocument[] = [];
    for (const court of courts) {
      const clCount = await this.causeListModel
        .count({
          parentPath: new RegExp(`^${court.path}`),
        })
        .exec();
      if (clCount != court.documentsCount) {
        court.documentsCount = clCount;
        toSave.push(court);
      }
    }
    const r = await Promise.all(
      toSave.map((c) => {
        return c.save();
      }),
    );

    this.log.log(`Updated ${r.length} courts`);
  }
}
