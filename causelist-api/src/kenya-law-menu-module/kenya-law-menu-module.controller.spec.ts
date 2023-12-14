import { Test, TestingModule } from '@nestjs/testing';
import { KenyaLawMenuModuleController } from './kenya-law-menu-module.controller';

describe('KenyaLawMenuModuleController', () => {
  let controller: KenyaLawMenuModuleController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [KenyaLawMenuModuleController],
    }).compile();

    controller = module.get<KenyaLawMenuModuleController>(KenyaLawMenuModuleController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
