import { Command, Positional } from 'nestjs-command/dist/index.js';
import { Injectable, Logger } from '@nestjs/common';
import * as util from 'node:util';
import * as child_process from 'node:child_process';

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema.js';
import { UserRole } from '../interfaces/users.js';
import { S3Service } from '../s3/s3.service.js';

@Injectable()
export class DbCommand {
  private readonly log = new Logger(DbCommand.name);

  constructor(
    @InjectModel(User.name)
    protected userModel: Model<User>,
    protected s3Service: S3Service,
  ) {}

  @Command({
    command: 'db:init',
    describe: 'Initialize Database',
  })
  async init() {
    this.log.log('Inserting initial Data...');
    let user: User;
    user = await this.userModel.findOneAndUpdate(
      { phone: '+254768628673' },
      {
        firstName: 'Svetlozar',
        lastName: 'Argirov',
        role: UserRole.Admin,
        email: 'zaro@causelist.co.ke',
      },
      { upsert: true, new: true },
    );
    this.log.log(`Created : id=${user.id}, phone=${user.phone}`);
    user = await this.userModel.findOneAndUpdate(
      {
        phone: '+254799880299',
      },
      {
        firstName: 'Robinson',
        lastName: 'Kemwamu',
        role: UserRole.Admin,
        email: 'robin@causelist.co.ke',
      },
      { upsert: true, new: true },
    );
    this.log.log(`Created : id=${user.id}, phone=${user.phone}`);

    this.log.log(`Done!`);
  }

  @Command({
    command: 'db:set-admin <userPhoneOrEmail> <isAdmin>',
    describe: 'Set user admin status',
  })
  async setAdmin(
    @Positional({
      name: 'userPhoneOrEmail',
      describe: 'User Phone or Email',
      type: 'string',
    })
    userPhoneOrEmail: string,
    @Positional({
      name: 'isAdmin',
      describe: 'admin status',
      type: 'boolean',
    })
    isAdmin: boolean,
  ) {
    let user = await this.userModel.findOne({
      $or: [{ phone: userPhoneOrEmail }, { email: userPhoneOrEmail }],
    });

    user.role = isAdmin ? UserRole.Admin : UserRole.Lawyer;
    await user.save();
    this.log.log(`Done!`);
  }

  @Command({
    command: 'db:case-stats',
    describe: 'Show case files stats',
  })
  async caseStats() {
    const keyPairs: Record<
      string,
      { metaKey?: string; htmlKey?: string; textKey?: string; pdf?: string }
    > = {};
    const stats: { html: number; text: number; meta: number; pdf: number } = {
      html: 0,
      text: 0,
      pdf: 0,
      meta: 0,
    };
    const start = Date.now();
    await this.s3Service.eachFile({ prefix: 'cases/files/' }, (o) => {
      const [_, caseId, file] = o.Key?.match(/\/(\d+)\/([^\/]+)/);
      if (caseId) {
        if (!keyPairs[caseId]) {
          keyPairs[caseId] = {};
        }
        if (file === 'html') {
          keyPairs[caseId].htmlKey = o.Key;
          stats.html++;
        }
        if (file === 'text') {
          keyPairs[caseId].textKey = o.Key;
          stats.text++;
        }
        if (file === 'meta.json') {
          keyPairs[caseId].metaKey = o.Key;
          stats.meta++;
        }
        if (file === 'pdf') {
          keyPairs[caseId].pdf = o.Key;
          stats.pdf++;
        }
      }
    });
    const end = Date.now();
    this.log.log(`Case files stats:`);
    this.log.log(`Meta files: ${stats.meta}`);
    this.log.log(`Html files: ${stats.html}`);
    this.log.log(`Text files: ${stats.text}`);
    this.log.log(`Pdf  files: ${stats.pdf}`);
    this.log.log(`Took: ${(end - start) / 1000} s`);
  }
}
