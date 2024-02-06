import { Test, TestingModule } from '@nestjs/testing';
import { K8sJobsController } from './k8s-jobs.controller';

describe('K8sJobsController', () => {
  let controller: K8sJobsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [K8sJobsController],
    }).compile();

    controller = module.get<K8sJobsController>(K8sJobsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
