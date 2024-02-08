import { InjectModel } from '@nestjs/mongoose';
import { Injectable, Logger } from '@nestjs/common';
import { InfoFile } from '../schemas/info-file.schema.js';

import { S3Service } from '../s3/s3.service.js';
import { Model } from 'mongoose';
import { Court, CourtDocument } from '../schemas/court.schema.js';

import { CauseList } from '../schemas/causelist.schema.js';
import { escapeForRegex } from './parser/util.js';

@Injectable()
export class UpdateStatsService {
  private readonly log = new Logger(UpdateStatsService.name);

  constructor(
    @InjectModel(Court.name)
    protected courtModel: Model<Court>,
    @InjectModel(CauseList.name)
    protected causeListModel: Model<CauseList>,
  ) {}

  async getAllCourts(): Promise<CourtDocument[]> {
    const courts = await this.courtModel.find().exec();
    return courts;
  }

  async updateCourtDocumentCounts(courts: CourtDocument[]) {
    const toSave: CourtDocument[] = [];
    for (const court of courts) {
      const clCount = await this.causeListModel
        .count({
          parentPath: new RegExp(`^${escapeForRegex(court.path)}`),
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

  async updateCourtsStats() {
    const courts = await this.getAllCourts();
    return this.updateCourtDocumentCounts(courts);
  }

  async buildCourtNamesForMatching() {
    const courtsDocuments = await this.causeListModel
      .find({}, { 'header.court': 1 })
      .exec();

    let courtsFromDocuments = courtsDocuments.map((doc) => doc.header.court);
    // // Remove courts which are single item and are found, at index 1+ in other court names
    // let courtsToRemove = courtsFromDocuments.filter((c) => c.length == 1);
    // courtsToRemove = courtsToRemove.filter((c1) =>
    //   courtsFromDocuments.some((c) => c.length > 1 && c.indexOf(c1[0]) > 0),
    // );

    // courtsFromDocuments = courtsFromDocuments.filter(
    //   (c) => !courtsToRemove.includes(c),
    // );

    const courtNamesForMatching: Record<string, string[]> = {};
    for (const c of courtsFromDocuments) {
      const key = c.join(',');
      if (!courtNamesForMatching[key]) {
        courtNamesForMatching[key] = c;
      }
    }

    const result: string[][] = [];
    for (const key of Object.keys(courtNamesForMatching).toSorted((a, b) => {
      const as =
        courtNamesForMatching[b].length - courtNamesForMatching[a].length;
      if (as != 0) {
        return as;
      }
      return a.localeCompare(b);
    })) {
      result.push(courtNamesForMatching[key]);
    }

    return result;
  }
}
