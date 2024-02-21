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
import { InjectQueue } from '@nestjs/bull';
import {
  PROCESS_CORRECTION_JOB_QUEUE_NAME,
  ProcessCorrectionJobParams,
} from '../k8s-jobs/process-correction.processor.js';
import type { Queue } from 'bull';
import { Roles } from '../auth/roles.decorator.js';
import { UserRole } from '../interfaces/users.js';
import { ParsingDebugService } from '../data-importer/parsing-debug.service.js';
import { DocumentTypeHint } from '../interfaces/index.js';

const HINTS: (DocumentTypeHint | 'ANY')[] = ['AUTO', 'NOTICE', 'IGNORE'];
export class GetInfoFilesForCourt {
  @IsString()
  @IsNotEmpty()
  courtPath: string;

  @IsNotEmpty()
  @IsIn(['ANY', 'PARSED', ...HINTS])
  documentType: string;

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
  @IsIn(HINTS)
  overrideDocumentType: string;
}

@Controller('info-files')
export class InfoFilesController {
  constructor(
    protected infoFilesService: InfoFilesService,
    protected s3Service: S3Service,
    protected parseDebugService: ParsingDebugService,
    @InjectQueue(PROCESS_CORRECTION_JOB_QUEUE_NAME)
    private processCorrectionQueue: Queue<ProcessCorrectionJobParams>,
  ) {}

  @CacheTTL(1)
  @Get('for-court/:courtPath/:documentType/:parsedAfter?')
  getForCourt(@Param() params: GetInfoFilesForCourt) {
    return this.infoFilesService.listForCourt(
      params.courtPath,
      params.documentType,
      params.parsedAfter,
    );
  }

  @CacheTTL(1)
  @Roles([UserRole.Admin])
  @Get('recognized-court-names')
  getRecognizedCourtNames() {
    const { html } = this.parseDebugService.courtNamesHtml();
    return html;
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
    await this.processCorrectionQueue.add({
      correctionTime: new Date().toISOString(),
      sha1: infoFile.sha1,
    });
    return true;
  }

  @Post('remove-correction/:infoFileId')
  @UseInterceptors(FileInterceptor('corrected'))
  async removeCorrection(
    @UploadedFile() file: Express.Multer.File,
    @Param() params: UpdateDocumentTypeParams,
  ) {
    const infoFile = await this.infoFilesService.get(params.infoFileId);
    // TODO: maybe delete actual files and update
    infoFile.hasCorrection = false;
    await infoFile.save();
    return true;
  }
}
