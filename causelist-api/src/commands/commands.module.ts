import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
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
import {
  CRAWLER_JOB_DEFAULT_OPTIONS,
  CRAWLER_JOB_QUEUE_NAME,
} from '../k8s-jobs/crawler-job.processor.js';
import {
  PARSE_CRAWLED_JOB_DEFAULT_OPTIONS,
  PARSE_CRAWLED_JOB_QUEUE_NAME,
} from '../k8s-jobs/parse-crawled-job.processor.js';
import {
  CRAWLER_CRON_DEFAULT_OPTIONS,
  CRAWLER_CRON_QUEUE_NAME,
} from '../k8s-jobs/crawler-cron.processor.js';
import {
  UnassignedMatters,
  UnassignedMattersSchema,
} from '../schemas/unassigned-matters.schema.js';
import { FixCommand } from './fix.command.js';
import { IpayCommand } from './ipay.command.js';
import { PaymentsModule } from '../payments/payments.module.js';
import {
  PaymentTransaction,
  PaymentTransactionSchema,
} from '../schemas/payment-transaction.schema.js';

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
      { name: InfoFile.name, schema: InfoFileSchema },
      { name: CauseList.name, schema: CauseListSchema },
      { name: UnassignedMatters.name, schema: UnassignedMattersSchema },
      { name: User.name, schema: UserSchema },
      { name: Court.name, schema: CourtSchema },
      { name: PaymentTransaction.name, schema: PaymentTransactionSchema },
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
    BullModule.registerQueue(
      {
        name: CRAWLER_CRON_QUEUE_NAME,
        defaultJobOptions: CRAWLER_CRON_DEFAULT_OPTIONS,
      },
      {
        name: CRAWLER_JOB_QUEUE_NAME,
        defaultJobOptions: CRAWLER_JOB_DEFAULT_OPTIONS,
      },
      {
        name: PARSE_CRAWLED_JOB_QUEUE_NAME,
        defaultJobOptions: PARSE_CRAWLED_JOB_DEFAULT_OPTIONS,
      },
    ),
    DataImporterModule,
    PaymentsModule,
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
    FixCommand,
    IpayCommand,
  ],
})
export class CommandsModule {}
