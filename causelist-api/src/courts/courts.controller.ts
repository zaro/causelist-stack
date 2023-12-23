import { Controller, Get, Param } from '@nestjs/common';
import { CourtsService } from './courts.service.js';

import {
  IsNotEmpty,
  IsNumber,
  IsNumberString,
  IsString,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class GetJudgesParams {
  @IsString()
  @IsNotEmpty()
  court: string;
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
  court: string;
}

export class GetDayParams extends DaysInMonthParam {
  @IsNumber()
  @Min(1)
  @Max(31)
  @Transform(({ value }) => parseInt(value))
  day: number;
}

@Controller('courts')
export class CourtsController {
  constructor(protected service: CourtsService) {}
  @Get('all')
  findAll() {
    return this.service.findAll();
  }

  @Get(':court/judges')
  getJudges(@Param() params: GetJudgesParams) {
    return this.service.findAllJudgesForCourt(params.court);
  }

  @Get(':year/:month/:day/:court/list')
  getDay(@Param() params: GetDayParams) {
    return this.service.getDay(
      params.year,
      params.month,
      params.day,
      params.court,
    );
  }

  @Get(':year/:month/:court/days')
  findDays(@Param() params: DaysInMonthParam) {
    return this.service.daysInAMonth(params.year, params.month, params.court);
  }
}
