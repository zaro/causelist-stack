import { Test, TestingModule } from '@nestjs/testing';
import { CourtsController } from './courts.controller.js';
import { CacheModule } from '@nestjs/cache-manager';
import { DataImporterModule } from '../data-importer/data-importer.module.js';
import { MongooseModule } from '@nestjs/mongoose';
import { CauseList, CauseListSchema } from '../schemas/causelist.schema.js';
import { Court, CourtSchema } from '../schemas/court.schema.js';
import { InfoFile, InfoFileSchema } from '../schemas/info-file.schema.js';

describe('CourtsController', () => {
  let controller: CourtsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        CacheModule.register(),
        DataImporterModule,
        MongooseModule.forFeature([
          { name: CauseList.name, schema: CauseListSchema },
          { name: Court.name, schema: CourtSchema },
          { name: InfoFile.name, schema: InfoFileSchema },
        ]),
      ],
      controllers: [CourtsController],
    }).compile();

    controller = module.get<CourtsController>(CourtsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
