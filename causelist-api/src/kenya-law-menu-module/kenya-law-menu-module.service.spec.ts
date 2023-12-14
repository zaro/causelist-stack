import { Test, TestingModule } from '@nestjs/testing';
import { KenyaLawMenuModuleService } from './kenya-law-menu-module.service';

describe('KenyaLawMenuModuleService', () => {
  let service: KenyaLawMenuModuleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [KenyaLawMenuModuleService],
    }).compile();

    service = module.get<KenyaLawMenuModuleService>(KenyaLawMenuModuleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
