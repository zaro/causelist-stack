import { Module } from '@nestjs/common';
import { S3Module } from '../s3/s3.module.js';
import { MongooseModule } from '@nestjs/mongoose';

import { MenuEntry, MenuEntrySchema } from '../schemas/menu-entry.schema.js';
import { InfoFile, InfoFileSchema } from '../schemas/info-file.schema.js';
import { CauseList, CauseListSchema } from '../schemas/causelist.schema.js';
import { User, UserSchema } from '../schemas/user.schema.js';
import { Court, CourtSchema } from '../schemas/court.schema.js';
import { UpdateStatsService } from './update-stats.service.js';
import { KenyaLawImporterService } from './kenya-law-importer.service.js';
import { KenyaLawParserService } from './kenya-law-parser.service.js';
import { BullModule } from '@nestjs/bull';
import {
  CRAWLER_JOB_QUEUE_NAME,
  CrawlerJobProcessor,
} from './crawler-job.processor.js';

@Module({
  imports: [
    S3Module,
    MongooseModule.forFeature([
      { name: MenuEntry.name, schema: MenuEntrySchema },
      { name: InfoFile.name, schema: InfoFileSchema },
      { name: CauseList.name, schema: CauseListSchema },
      { name: User.name, schema: UserSchema },
      { name: Court.name, schema: CourtSchema },
    ]),
    BullModule.registerQueue({
      name: CRAWLER_JOB_QUEUE_NAME,
    }),
  ],
  providers: [
    KenyaLawImporterService,
    KenyaLawParserService,
    UpdateStatsService,
    CrawlerJobProcessor,
  ],
  exports: [
    BullModule,
    KenyaLawImporterService,
    KenyaLawParserService,
    UpdateStatsService,
  ],
})
export class DataImporterModule {}
