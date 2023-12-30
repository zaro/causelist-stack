import { Module } from '@nestjs/common';
import { CourtsController } from './courts.controller.js';
import { CourtsService } from './courts.service.js';
import { MongooseModule } from '@nestjs/mongoose';
import { CauseList, CauseListSchema } from '../schemas/causelist.schema.js';
import { Court, CourtSchema } from '../schemas/court.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CauseList.name, schema: CauseListSchema },
      { name: Court.name, schema: CourtSchema },
    ]),
  ],
  controllers: [CourtsController],
  providers: [CourtsService],
})
export class CourtsModule {}
