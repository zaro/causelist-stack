import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  BullModule,
  BullRootModuleOptions,
  SharedBullAsyncConfiguration,
} from '@nestjs/bull';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { AdminModule } from '@adminjs/nestjs';
import { KenyaLawMenuModuleModule } from './kenya-law-menu-module/kenya-law-menu-module.module.js';
import * as AdminJSMongoose from '@adminjs/mongoose';
import AdminJS from 'adminjs';
import { Model } from 'mongoose';
import { SearchModule } from './search/search.module.js';
import { CourtsModule } from './courts/courts.module.js';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { HealthModule } from './health/health.module.js';
import { SmsApiModule } from './sms-api/sms-api.module.js';
import { DataImporterModule } from './data-importer/data-importer.module.js';
import { K8sJobsModule } from './k8s-jobs/k8s-jobs.module.js';
import { Court, CourtSchema } from './schemas/court.schema.js';

AdminJS.registerAdapter({
  Resource: AdminJSMongoose.Resource,
  Database: AdminJSMongoose.Database,
});

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
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (
        configService: ConfigService,
      ): Promise<BullRootModuleOptions> => ({
        url: configService.getOrThrow('REDIS_URL'),
        prefix: 'bullJob:',
      }),
      inject: [ConfigService],
    }),
    AdminModule.createAdminAsync({
      inject: [getModelToken(Court.name)],
      imports: [
        MongooseModule.forFeature([{ name: Court.name, schema: CourtSchema }]),
      ],
      useFactory: async (klModel: Model<Court>) => {
        return {
          adminJsOptions: {
            rootPath: '/admin',
            resources: [
              {
                resource: klModel,
                options: {
                  properties: {
                    menu: {
                      type: 'textarea11',
                    },
                  },
                },
              },
            ],
          },
          // auth: {
          //   authenticate: async (email, password) => {
          //     return { email };
          //   },
          //   cookiePassword: 'secret',
          //   cookieName: 'adminjs',
          // },
          // sessionOptions: {
          //   resave: true,
          //   saveUninitialized: true,
          //   secret: 'secret',
          // },
        };
      },
    }),
    KenyaLawMenuModuleModule,
    SearchModule,
    CourtsModule,
    AuthModule,
    UsersModule,
    HealthModule,
    SmsApiModule,
    DataImporterModule,
    K8sJobsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
