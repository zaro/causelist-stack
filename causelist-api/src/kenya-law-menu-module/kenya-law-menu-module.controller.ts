import { Controller, Get } from '@nestjs/common';
import { KenyaLawMenuModuleService } from './kenya-law-menu-module.service.js';

@Controller('kenya-law-menu-module')
export class KenyaLawMenuModuleController {
  constructor(protected service: KenyaLawMenuModuleService) {}
  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('latest-root')
  findLatestRoot() {
    return this.service.findLatestRoot('_root');
  }
}
