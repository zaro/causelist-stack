import { Test, TestingModule } from '@nestjs/testing';
import { InfoFilesController } from './info-files.controller';

describe('InfoFilesController', () => {
  let controller: InfoFilesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InfoFilesController],
    }).compile();

    controller = module.get<InfoFilesController>(InfoFilesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
