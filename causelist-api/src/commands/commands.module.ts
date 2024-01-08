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
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Court, CourtSchema } from '../schemas/court.schema.js';
import { UpdateCommand } from './update.command.js';
import { DataImporterModule } from '../data-importer/data-importer.module.js';
import { BullModule, BullRootModuleOptions } from '@nestjs/bull';
import { CrawlerCommand } from './crawler.command .js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get(
          'MONGO_URL',
          'mongodb://causelist:causelist@localhost/causelist',
        ),
        connectionFactory: (connection) => {
          function setRunValidators(this: any) {
            if ('runValidators' in this.getOptions()) {
              return;
            }
            this.setOptions({ runValidators: true });
          }
          connection.plugin((schema) => {
            schema.pre('findOneAndUpdate', setRunValidators);
            schema.pre('updateMany', setRunValidators);
            schema.pre('updateOne', setRunValidators);
            schema.pre('update', setRunValidators);
          });
          return connection;
        },
      }),
    }),

    MongooseModule.forFeature([
      { name: MenuEntry.name, schema: MenuEntrySchema },
      { name: InfoFile.name, schema: InfoFileSchema },
      { name: CauseList.name, schema: CauseListSchema },
      { name: User.name, schema: UserSchema },
      { name: Court.name, schema: CourtSchema },
    ]),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (
        configService: ConfigService,
      ): Promise<BullRootModuleOptions> => ({
        url: configService.getOrThrow('REDIS_URL'),
      }),
      inject: [ConfigService],
    }),
    DataImporterModule,
    CommandModule,
  ],
  controllers: [],
  providers: [
    ImportCommand,
    ParseCommand,
    TestsCommand,
    DbCommand,
    UpdateCommand,
    CrawlerCommand,
  ],
})
export class CommandsModule {}
