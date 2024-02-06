import { Module } from '@nestjs/common';
import { InfoFilesController } from './info-files.controller.js';
import { InfoFilesService } from './info-files.service.js';
import { MongooseModule } from '@nestjs/mongoose';
import { CauseList, CauseListSchema } from '../schemas/causelist.schema.js';
import { Court, CourtSchema } from '../schemas/court.schema.js';
import { InfoFile, InfoFileSchema } from '../schemas/info-file.schema.js';
import { DataImporterModule } from '../data-importer/data-importer.module.js';
import {
  UnassignedMatters,
  UnassignedMattersSchema,
} from '../schemas/unassigned-matters.schema.js';
import { S3Module } from '../s3/s3.module.js';

@Module({
  imports: [
    DataImporterModule,
    S3Module,
    MongooseModule.forFeature([
      { name: CauseList.name, schema: CauseListSchema },
      { name: UnassignedMatters.name, schema: UnassignedMattersSchema },
      { name: Court.name, schema: CourtSchema },
      { name: InfoFile.name, schema: InfoFileSchema },
    ]),
  ],
  controllers: [InfoFilesController],
  providers: [InfoFilesService],
})
export class InfoFilesModule {}
