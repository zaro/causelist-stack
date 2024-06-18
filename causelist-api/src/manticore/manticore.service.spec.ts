import { Test, TestingModule } from '@nestjs/testing';
import { ManticoreService } from './manticore.service';

describe('ManticoreService', () => {
  let service: ManticoreService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ManticoreService],
    }).compile();

    service = module.get<ManticoreService>(ManticoreService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
