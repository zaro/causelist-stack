import { Module } from '@nestjs/common';
import { CourtsController } from './courts.controller.js';
import { CourtsService } from './courts.service.js';
import { MongooseModule } from '@nestjs/mongoose';
import { CauseList, CauseListSchema } from '../schemas/causelist.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CauseList.name, schema: CauseListSchema },
    ]),
  ],
  controllers: [CourtsController],
  providers: [CourtsService],
})
export class CourtsModule {}
