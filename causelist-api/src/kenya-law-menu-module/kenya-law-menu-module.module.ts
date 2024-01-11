import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
// import { MenuEntry, MenuEntrySchema } from '../schemas/menu-entry.schema.js';
import { KenyaLawMenuModuleService } from './kenya-law-menu-module.service.js';
import { KenyaLawMenuModuleController } from './kenya-law-menu-module.controller.js';

@Module({
  imports: [
    // MongooseModule.forFeature([
    //   { name: MenuEntry.name, schema: MenuEntrySchema },
    // ]),
  ],
  providers: [KenyaLawMenuModuleService],
  controllers: [KenyaLawMenuModuleController],
})
export class KenyaLawMenuModuleModule {}
