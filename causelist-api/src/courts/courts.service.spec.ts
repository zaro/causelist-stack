import { Test, TestingModule } from '@nestjs/testing';
import { CourtsService } from './courts.service.js';
import { DataImporterModule } from '../data-importer/data-importer.module.js';
import { MongooseModule } from '@nestjs/mongoose';
import { CauseList, CauseListSchema } from '../schemas/causelist.schema.js';
import { Court, CourtSchema } from '../schemas/court.schema.js';
import { InfoFile, InfoFileSchema } from '../schemas/info-file.schema.js';

describe('CourtsService', () => {
  let service: CourtsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        DataImporterModule,
        MongooseModule.forFeature([
          { name: CauseList.name, schema: CauseListSchema },
          { name: Court.name, schema: CourtSchema },
          { name: InfoFile.name, schema: InfoFileSchema },
        ]),
      ],

      providers: [CourtsService],
    }).compile();

    service = module.get<CourtsService>(CourtsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
