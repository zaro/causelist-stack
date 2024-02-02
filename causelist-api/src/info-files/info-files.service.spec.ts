import { Test, TestingModule } from '@nestjs/testing';
import { InfoFilesService } from './info-files.service';

describe('InfoFilesService', () => {
  let service: InfoFilesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InfoFilesService],
    }).compile();

    service = module.get<InfoFilesService>(InfoFilesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
