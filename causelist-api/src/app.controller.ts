import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('iframe-resizer-child.js')
  getHello(): string {
    return this.appService.getHello();
  }
}
