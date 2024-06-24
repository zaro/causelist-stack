import { Module } from '@nestjs/common';
import { DirectoryController } from './directory.controller.js';
import { MongooseModule } from '@nestjs/mongoose';
import {
  DirectoryListing,
  DirectoryListingSchema,
} from '../schemas/directory-listing.schema.js';

@Module({
  controllers: [DirectoryController],
  imports: [
    MongooseModule.forFeature([
      { name: DirectoryListing.name, schema: DirectoryListingSchema },
    ]),
  ],
})
export class DirectoryModule {}
