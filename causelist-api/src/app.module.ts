import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { AdminModule } from '@adminjs/nestjs';
import { KenyaLawMenuModuleModule } from './kenya-law-menu-module/kenya-law-menu-module.module.js';
import { MenuEntry, MenuEntrySchema } from './schemas/menu-entry.schema.js';
import * as AdminJSMongoose from '@adminjs/mongoose';
import AdminJS from 'adminjs';
import { Model } from 'mongoose';
import { SearchModule } from './search/search.module.js';
import { CourtsModule } from './courts/courts.module.js';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';

AdminJS.registerAdapter({
  Resource: AdminJSMongoose.Resource,
  Database: AdminJSMongoose.Database,
});

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://causelist:causelist@localhost/causelist'),
    AdminModule.createAdminAsync({
      inject: [getModelToken(MenuEntry.name)],
      imports: [
        MongooseModule.forFeature([
          { name: MenuEntry.name, schema: MenuEntrySchema },
        ]),
      ],
      useFactory: async (klModel: Model<MenuEntry>) => {
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
