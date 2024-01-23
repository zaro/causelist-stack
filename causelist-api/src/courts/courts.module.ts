import { Module } from '@nestjs/common';
import { CourtsController } from './courts.controller.js';
import { CourtsService } from './courts.service.js';
import { MongooseModule } from '@nestjs/mongoose';
import { CauseList, CauseListSchema } from '../schemas/causelist.schema.js';
import { Court, CourtSchema } from '../schemas/court.schema.js';
import { InfoFile, InfoFileSchema } from '../schemas/info-file.schema.js';
import { DataImporterModule } from '../data-importer/data-importer.module.js';
import {
  UnassignedMatters,
  UnassignedMattersSchema,
} from '../schemas/unassigned-matters.schema.js';

@Module({
  imports: [
    DataImporterModule,
    MongooseModule.forFeature([
      { name: CauseList.name, schema: CauseListSchema },
      { name: UnassignedMatters.name, schema: UnassignedMattersSchema },
      { name: Court.name, schema: CourtSchema },
      { name: InfoFile.name, schema: InfoFileSchema },
    ]),
  ],
  controllers: [CourtsController],
  providers: [CourtsService],
})
export class CourtsModule {}
