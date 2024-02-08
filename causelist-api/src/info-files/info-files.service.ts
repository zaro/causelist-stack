import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CauseList } from '../schemas/causelist.schema.js';
import { FilterQuery, Model } from 'mongoose';
import { Court } from '../schemas/court.schema.js';
import { InfoFile } from '../schemas/info-file.schema.js';
import { ParsingDebugService } from '../data-importer/parsing-debug.service.js';
import { UpdateDocumentBody } from './info-files.controller.js';
import { escapeForRegex } from '../data-importer/parser/util.js';

@Injectable()
export class InfoFilesService {
  constructor(
    @InjectModel(Court.name) private courtModel: Model<Court>,
    @InjectModel(InfoFile.name) private infoFileModel: Model<InfoFile>,
    protected parsingDebugService: ParsingDebugService,
  ) {}

  async listForCourt(courtPath: string, parsedAfter?: Date) {
    const q: FilterQuery<InfoFile> = {
      parentPath: new RegExp(`^${escapeForRegex(courtPath)}`),
    };
    if (parsedAfter) {
      q.parsedAt = { $gte: parsedAfter };
    } else {
      q.parsedAt = { $exists: false };
    }
    return this.infoFileModel.find(q);
  }

  async get(id: string) {
    const doc = await this.infoFileModel.findById(id);
    if (!doc) {
      throw new NotFoundException(`Invalid InfoFIle id ${id}`);
    }
    return doc;
  }

  async updateInfoFile(id: string, body: UpdateDocumentBody) {
    const doc = await this.infoFileModel.findById(id);
    for (const [k, v] of Object.entries(body)) {
      doc[k] = v;
    }
    return doc.save();
  }
}
