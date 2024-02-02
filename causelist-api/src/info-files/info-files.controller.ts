import { Controller, Get, Param } from '@nestjs/common';
import {
  IsDate,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { InfoFilesService } from './info-files.service.js';
import { CacheTTL } from '@nestjs/cache-manager';
import { Transform } from 'class-transformer';

export class GetInfoFilesForCourt {
  @IsString()
  @IsNotEmpty()
  courtPath: string;

  @IsDate()
  @IsOptional()
  @Transform(({ value }) => (value ? new Date(value) : value))
  parsedAfter: Date;
}

@Controller('info-files')
export class InfoFilesController {
  constructor(protected infoFilesService: InfoFilesService) {}

  @CacheTTL(1)
  @Get('for-court/:courtPath/:parsedAfter?')
  getForCourt(@Param() params: GetInfoFilesForCourt) {
    return this.infoFilesService.listForCourt(
      params.courtPath,
      params.parsedAfter,
    );
  }
}
