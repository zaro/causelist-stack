import { Controller, Get, Param } from '@nestjs/common';
import { DirectoryListing } from '../schemas/directory-listing.schema.js';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Public } from '../auth/public.decorator.js';

@Controller('directory')
export class DirectoryController {
  constructor(
    @InjectModel(DirectoryListing.name)
    protected directoryListingModel: Model<DirectoryListing>,
  ) {}

  @Public()
  @Get('cities')
  async cities() {
    return this.directoryListingModel.aggregate([
      { $group: { _id: '$city', county: { $last: '$county' } } },
      { $project: { _id: 0, city: '$_id', county: 1 } },
    ]);
  }

  @Public()
  @Get('for-city/:city')
  async forCity(@Param('city') city: string) {
    const result = await this.directoryListingModel.find({ city });

    const shuffled = result
      .map((value) => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => ({
        name: value.name,
        city: value.city,
        county: value.county,
      }))
      .slice(0, 10);
    return shuffled;
  }
}
