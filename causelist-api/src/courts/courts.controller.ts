import { Controller, Get, Param, UseInterceptors } from '@nestjs/common';
import { CourtsService } from './courts.service.js';
import { InternalRoute, Public } from '../auth/public.decorator.js';

import {
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsNumberString,
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

  @Get('causelist/:id')
  getCauselist(@Param() params: GetCauseListParams) {
    return this.service.getCauseList(params.id);
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
  @Get('causelist/debug/:id')
  async getCauselistDebug(@Param() params: GetCauseListParams) {
    return this.service.getCauseListDebug(params.id);
  }
}
