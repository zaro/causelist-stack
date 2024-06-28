import { Command, Positional, Option } from 'nestjs-command/dist/index.js';
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
    const stats: { html: number; text: number; meta: number; pdf: number } = {
      html: 0,
      text: 0,
      pdf: 0,
      meta: 0,
    };
    const start = Date.now();
    const re = /\/(\d+)\/([^\/]+)/;
    await this.s3Service.eachFile(
      { prefix: 'cases/files/' },
      (o) => {
        const [_, caseId, file] = re.exec(o.Key);
        if (caseId) {
          switch (file) {
            case 'html':
              stats.html++;
              break;
            case 'text':
              stats.text++;
              break;
            case 'meta.json':
              stats.meta++;
              break;
            case 'pdf':
              stats.pdf++;
              break;
          }
        }
      },
      true,
    );
    const end = Date.now();
    this.log.log(`Case files stats:`);
    this.log.log(`Meta files: ${stats.meta}`);
    this.log.log(`Html files: ${stats.html}`);
    this.log.log(`Text files: ${stats.text}`);
    this.log.log(`Pdf  files: ${stats.pdf}`);
    this.log.log(`Took: ${(end - start) / 1000} s`);
  }

  @Command({
    command: 'db:fix-pdfs [caseId]',
    describe: 'Fix pdf files incorrectly uploaded as original ',
  })
  async fixPdf(
    @Positional({
      name: 'caseId',
      describe: 'Single case id to check/fix',
      type: 'string',
    })
    caseId: string,
    @Option({
      name: 'print-only',
      describe: 'Only print the case ids with missing pdfs',
      type: 'boolean',
    })
    printOnly: boolean,
  ) {
    const keyPairs: Record<
      string,
      {
        metaKey?: string;
        htmlKey?: string;
        textKey?: string;
        pdf?: string;
        original?: string;
      }
    > = {};
    this.log.log('Start loading s3 data...');
    let prefix = 'cases/files/';
    if (caseId) {
      prefix += caseId + '/';
    }
    await this.s3Service.eachFile(
      { prefix },
      (o) => {
        const [_, caseId, file] = o.Key?.match(/\/(\d+)\/([^\/]+)/);
        if (caseId) {
          if (!keyPairs[caseId]) {
            keyPairs[caseId] = {};
          }
          if (file === 'html') {
            keyPairs[caseId].htmlKey = o.Key;
          }
          if (file === 'text') {
            keyPairs[caseId].textKey = o.Key;
          }
          if (file === 'meta.json') {
            keyPairs[caseId].metaKey = o.Key;
          }
          if (file === 'pdf') {
            keyPairs[caseId].pdf = o.Key;
          }
          if (file === 'original') {
            keyPairs[caseId].original = o.Key;
          }
        }
      },
      true,
    );
    this.log.log('Done loading s3 data!');
    const casesWithNoPdf = Object.entries(keyPairs).filter(([caseId, d]) => {
      return !d.pdf;
    });
    this.log.log(`${casesWithNoPdf.length} cases with no pdf!`);
    if (printOnly) {
      this.log.log(
        `The following caseId have missing pdf (the first 100 result only)`,
      );
      for (const [caseId, keys] of casesWithNoPdf.slice(0, 100)) {
        this.log.log(`  case : ${caseId}, got : ${JSON.stringify(keys)}`);
      }
      return;
    }
    for (const [caseId, keys] of casesWithNoPdf) {
      const contentType = await this.s3Service.getFileMimeType(keys.original);
      if (contentType == 'application/pdf') {
        const newKey = keys.original.replace(/\/original$/, '/pdf');
        this.log.log(`Rename ${keys.original} -> ${newKey}`);
        await this.s3Service.renameKey(keys.original, newKey);
      }
    }
  }
}
