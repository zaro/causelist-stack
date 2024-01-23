import { Command, Option, Positional } from 'nestjs-command/dist/index.js';
import { Injectable, Logger } from '@nestjs/common';
import * as util from 'node:util';
import * as child_process from 'node:child_process';

import { UpdateStatsService } from '../data-importer/update-stats.service.js';
import { InjectModel } from '@nestjs/mongoose';
import { CauseList } from '../schemas/causelist.schema.js';
import { Model } from 'mongoose';

const fixturesDir = 'src/commands/parser/__fixtures__/data';

const exec = util.promisify(child_process.exec);

@Injectable()
export class FixCommand {
  protected log = new Logger(FixCommand.name);
  constructor(
    @InjectModel(CauseList.name)
    protected causeListModel: Model<CauseList>,
  ) {}

  @Command({
    command: 'fix:remove-from-courts-names <stringToMatch>',
    describe: 'Remove element from court names',
  })
  async updateCourtsNames(
    @Positional({
      name: 'stringToMatch',
      describe: 'string to match in element to remove',
      type: 'string',
    })
    stringToMatch: string,
    @Option({
      name: 'write',
      describe: 'Write to database',
      type: 'boolean',
      required: false,
    })
    write: boolean,
  ) {
    const re = new RegExp(stringToMatch);
    const matchingDocuments = await this.causeListModel.find({
      'header.court': re,
    });
    this.log.warn(`${matchingDocuments.length} match!`);
    this.log.warn(`Will alter the following documents court:`);
    for (const d of matchingDocuments) {
      this.log.log(`OLD  ${d._id} =>  ${d.header.court}`);
      d.header.court = d.header.court.filter((e) => !re.test(e));
      this.log.warn(`NEW  ${d._id} =>  ${d.header.court}`);
      if (write) {
        await d.save();
        this.log.log('Saved!');
      }
    }
  }
}
