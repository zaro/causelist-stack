import { Test, TestingModule } from '@nestjs/testing';
import { SmsApiService } from './sms-api.service';

describe('SmsApiService', () => {
  let service: SmsApiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SmsApiService],
    }).compile();

    service = module.get<SmsApiService>(SmsApiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
