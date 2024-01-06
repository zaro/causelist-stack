import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { S3Service } from './s3.service.js';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule, HttpModule],
  providers: [S3Service],
  exports: [S3Service],
})
export class S3Module {}
