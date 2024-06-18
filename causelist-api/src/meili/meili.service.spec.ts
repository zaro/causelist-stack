import { Test, TestingModule } from '@nestjs/testing';
import { MeiliService } from './meili.service';

describe('MeiliService', () => {
  let service: MeiliService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MeiliService],
    }).compile();

    service = module.get<MeiliService>(MeiliService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
