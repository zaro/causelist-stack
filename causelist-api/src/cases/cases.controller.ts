import {
  Controller,
  Get,
  Logger,
  NotFoundException,
  Param,
  Query,
  Response,
} from '@nestjs/common';
import { ManticoreService } from '../manticore/manticore.service.js';
import { Public } from '../auth/public.decorator.js';
import { MeiliService } from '../meili/meili.service.js';
import { S3Service } from '../s3/s3.service.js';
import { Readable } from 'stream';

@Controller('cases')
export class CasesController {
  log = new Logger(CasesController.name);
  constructor(
    protected meiliService: MeiliService,
    protected s3Service: S3Service,
  ) {}

  @Public()
  @Get('fts/:queryString')
  async search(
    @Param('queryString')
    queryString: string,
    @Query('offset')
    offsetParam: string,
    @Query('sort')
    sort: string,
  ) {
    if (!queryString) {
      return null;
    }
    const sortByDate = sort === 'time' ? 'desc' : undefined;
    const offset = offsetParam ? parseInt(offsetParam, 10) : undefined;
    return this.meiliService.searchCases(queryString, { offset, sortByDate });
  }

  @Public()
  @Get('load/:caseId/:hl?')
  async load(
    @Param('caseId')
    caseId: string,
    @Param('hl')
    hl?: string,
  ) {
    if (!caseId) {
      return null;
    }
    return this.meiliService.getByIdWithHighlight(caseId, hl ?? '');
  }

  @Public()
  @Get('pdf/:caseId/:hl?')
  async getPdf(
    @Response()
    response,
    @Param('caseId')
    caseId: string,
    @Param('hl')
    hl?: string,
  ) {
    if (!caseId) {
      throw new NotFoundException();
    }
    try {
      const r = await this.s3Service.downloadFile({
        key: `cases/files/${caseId}/pdf`,
        asStream: true,
      });
      (r.data as Readable).pipe(response);
    } catch (err: any) {
      this.log.error(err);
      if (err.$metadata?.httpStatusCode === 404) {
        throw new NotFoundException();
      } else {
        throw err;
      }
    }
  }
}
