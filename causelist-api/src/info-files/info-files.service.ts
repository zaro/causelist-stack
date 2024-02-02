import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CauseList } from '../schemas/causelist.schema.js';
import { FilterQuery, Model } from 'mongoose';
import { Court } from '../schemas/court.schema.js';
import { InfoFile } from '../schemas/info-file.schema.js';
import { ParsingDebugService } from '../data-importer/parsing-debug.service.js';

@Injectable()
export class InfoFilesService {
  constructor(
    @InjectModel(Court.name) private courtModel: Model<Court>,
    @InjectModel(InfoFile.name) private infoFileModel: Model<InfoFile>,
    protected parsingDebugService: ParsingDebugService,
  ) {}

  async listForCourt(courtPath: string, parsedAfter?: Date) {
    const q: FilterQuery<InfoFile> = {
      parentPath: new RegExp(`^${courtPath}`),
    };
    if (parsedAfter) {
      q.parsedAt = { $gte: parsedAfter };
    } else {
      q.parsedAt = { $exists: false };
    }
    return this.infoFileModel.find(q);
  }
}
