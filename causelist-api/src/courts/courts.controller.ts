import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Res,
  UseInterceptors,
} from '@nestjs/common';
import { CourtsService } from './courts.service.js';
import { InternalRoute, Public } from '../auth/public.decorator.js';

import {
  IsBoolean,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsNumberString,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { Roles } from '../auth/roles.decorator.js';
import { User } from '../schemas/user.schema.js';
import { UserRole } from '../interfaces/users.js';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { Response } from 'express';
import { stringify } from 'csv-stringify/sync';

export class SearchParams {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  text: string;
}

export class GetJudgesParams {
  @IsString()
  @IsNotEmpty()
  courtPath: string;
}

export class GetCauseListParams {
  @IsNotEmpty()
  @IsMongoId()
  id: string;
}

export class GetCauseListDebugParams extends GetCauseListParams {
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) =>
    ['true', 'false'].includes(value) ? value === 'true' : value,
  )
  useCorrection: boolean;
}

export class DaysInMonthParam {
  @IsNumber()
  @Min(2023)
  @Max(2030)
  @Transform(({ value }) => parseInt(value))
  year: number;

  @IsNumber()
  @Min(1)
  @Max(12)
  @Transform(({ value }) => parseInt(value))
  month: number;

  @IsString()
  @IsNotEmpty()
  courtPath: string;
}

export class GetDayParams extends DaysInMonthParam {
  @IsNumber()
  @Min(1)
  @Max(31)
  @Transform(({ value }) => parseInt(value))
  day: number;
}

@Controller('courts')
@UseInterceptors(CacheInterceptor)
export class CourtsController {
  constructor(protected service: CourtsService) {}
  @Get('all')
  findAll() {
    return this.service.findAll();
  }

  @Get('search/:text*')
  search(@Param() params: SearchParams) {
    return this.service.search(params.text);
  }

  @Public()
  @CacheTTL(8 * 3600 * 1000)
  @Get('random')
  random() {
    return this.service.getRandomDay();
  }

  @Roles([UserRole.Admin])
  @Get('admin/stats')
  adminStats() {
    return this.service.getCourtsStats();
  }

  @Roles([UserRole.Admin])
  @Get('admin/stats/export')
  async adminStatsExport(@Res() response: Response) {
    response.setHeader(
      'Content-Disposition',
      'attachment; filename="courts.csv"',
    );
    const rows = await this.service.getCourtsStats();
    response.end(
      stringify(rows, {
        header: true,
        columns: [
          'id',
          'name',
          'type',
          'path',
          'documentsCount',
          'unparsedCount',
          'lastImportedDocumentTime',
          'lastParsedDocumentTime',
        ],
        cast: {
          boolean: (value: boolean) => {
            return value.toString();
          },
          date: (value: Date) => {
            return value.toISOString();
          },
        },
      }),
    );
  }

  @Get('document/:id')
  async getDocument(@Param() params: GetCauseListParams) {
    const [cl, ua] = await Promise.all([
      this.service.getCauseList(params.id),
      this.service.getUnassignedMatters(params.id),
    ]);
    if (!cl && !ua) {
      throw new NotFoundException();
    }
    return cl || ua;
  }

  @Get('causelist/:id')
  async getCauselist(@Param() params: GetCauseListParams) {
    const doc = await this.service.getCauseList(params.id);
    if (!doc) {
      throw new NotFoundException();
    }
    return doc;
  }

  @Get('unassigned-matters/:id')
  async getUnassignedMatters(@Param() params: GetCauseListParams) {
    const doc = await this.service.getUnassignedMatters(params.id);
    if (!doc) {
      throw new NotFoundException();
    }
    return doc;
  }

  @Get(':courtPath/judges')
  getJudges(@Param() params: GetJudgesParams) {
    return this.service.findAllJudgesForCourt(params.courtPath);
  }

  @Get(':year/:month/:day/:courtPath/list')
  getDay(@Param() params: GetDayParams) {
    return this.service.getDay(
      params.year,
      params.month,
      params.day,
      params.courtPath,
    );
  }

  @Get(':year/:month/:courtPath/days')
  findDays(@Param() params: DaysInMonthParam) {
    return this.service.daysInAMonth(
      params.year,
      params.month,
      params.courtPath,
    );
  }

  @Roles([UserRole.Admin])
  @Get('causelist/debug/:id/:useCorrection?')
  async getCauselistDebug(@Param() params: GetCauseListDebugParams) {
    return this.service.getCauseListDebug(params.id, params.useCorrection);
  }
}
