import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  IsDate,
  IsDateString,
  IsIn,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { InfoFilesService } from './info-files.service.js';
import { CacheTTL } from '@nestjs/cache-manager';
import { Transform } from 'class-transformer';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { S3Service } from '../s3/s3.service.js';
import { Readable } from 'node:stream';

export class GetInfoFilesForCourt {
  @IsString()
  @IsNotEmpty()
  courtPath: string;

  @IsDate()
  @IsOptional()
  @Transform(({ value }) => (value ? new Date(value) : value))
  parsedAfter: Date;
}

export class UpdateDocumentTypeParams {
  @IsNotEmpty()
  @IsMongoId()
  infoFileId: string;
}

export class UpdateDocumentBody {
  @IsNotEmpty()
  @IsIn(['AUTO', 'NOTICE'])
  overrideDocumentType: string;
}

@Controller('info-files')
export class InfoFilesController {
  constructor(
    protected infoFilesService: InfoFilesService,
    protected s3Service: S3Service,
  ) {}

  @CacheTTL(1)
  @Get('for-court/:courtPath/:parsedAfter?')
  getForCourt(@Param() params: GetInfoFilesForCourt) {
    return this.infoFilesService.listForCourt(
      params.courtPath,
      params.parsedAfter,
    );
  }

  @Patch(':infoFileId')
  updateDocument(
    @Param() params: UpdateDocumentTypeParams,
    @Body() doc: UpdateDocumentBody,
  ) {
    return this.infoFilesService.updateInfoFile(params.infoFileId, doc);
  }

  @Get('get-original-document/:infoFileId')
  async getOriginalDocument(
    @Param() params: UpdateDocumentTypeParams,
    @Res() res: Response,
  ) {
    const infoFile = await this.infoFilesService.get(params.infoFileId);
    const s3r = await this.s3Service.downloadFile({
      key: `files/${infoFile.sha1}/original`,
      asStream: true,
    });
    for (const [h, v] of Object.entries(s3r.headers)) {
      res.setHeader(h, v);
    }
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${infoFile.fileName}"`,
    );

    (s3r.data as Readable).pipe(res);
  }

  @Post('upload-correction/:infoFileId')
  @UseInterceptors(FileInterceptor('corrected'))
  async uploadCorrection(
    @UploadedFile() file: Express.Multer.File,
    @Param() params: UpdateDocumentTypeParams,
  ) {
    const infoFile = await this.infoFilesService.get(params.infoFileId);
    //
    this.s3Service.uploadFile({
      key: `files/${infoFile.sha1}/corrected`,
      content: file.buffer,
      mimeType: file.mimetype,
    });
    infoFile.hasCorrection = true;
    await infoFile.save();
    return true;
  }

  @Post('remove-correction/:infoFileId')
  @UseInterceptors(FileInterceptor('corrected'))
  async removeCorrection(
    @UploadedFile() file: Express.Multer.File,
    @Param() params: UpdateDocumentTypeParams,
  ) {
    const infoFile = await this.infoFilesService.get(params.infoFileId);
    //
    this.s3Service.removeKey(`files/${infoFile.sha1}/corrected`);
    infoFile.hasCorrection = false;
    await infoFile.save();
    return true;
  }
}
