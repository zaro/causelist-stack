import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MenuEntry, MenuEntrySchema } from '../schemas/menu-entry.schema.js';
import { InfoFile, InfoFileSchema } from '../schemas/info-file.schema.js';
import { CommandModule } from 'nestjs-command/dist/index.js';
import { ImportCommand } from './import.command.js';
import { ParseCommand } from './parse.command.js';
import { TestsCommand } from './tests.command.js';
import { CauseList, CauseListSchema } from '../schemas/causelist.schema.js';
import { User, UserSchema } from '../schemas/user.schema.js';
import { DbCommand } from './db.command.js';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://causelist:causelist@localhost/causelist'),
    MongooseModule.forFeature([
      { name: MenuEntry.name, schema: MenuEntrySchema },
      { name: InfoFile.name, schema: InfoFileSchema },
      { name: CauseList.name, schema: CauseListSchema },
      { name: User.name, schema: UserSchema },
    ]),
    CommandModule,
  ],
  controllers: [],
  providers: [ImportCommand, ParseCommand, TestsCommand, DbCommand],
})
export class CommandsModule {}
