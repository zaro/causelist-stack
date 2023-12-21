import { Command } from 'nestjs-command/dist/index.js';
import { Injectable, Logger } from '@nestjs/common';
import * as util from 'node:util';
import * as child_process from 'node:child_process';

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema.js';

@Injectable()
export class DbCommand {
  private readonly log = new Logger(DbCommand.name);

  constructor(
    @InjectModel(User.name)
    protected userModel: Model<User>,
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
      },
      { upsert: true },
    );
    this.log.log(`Created : id=${user.id}, phone=${user.phone}`);
    user = await this.userModel.findOneAndUpdate(
      {
        phone: '+254799880299',
      },
      {
        firstName: 'Robinson',
        lastName: 'Kemwamu',
      },
      { upsert: true },
    );
    this.log.log(`Created : id=${user.id}, phone=${user.phone}`);

    this.log.log(`Done!`);
  }
}
