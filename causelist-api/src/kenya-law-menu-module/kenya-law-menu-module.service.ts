import { Injectable } from '@nestjs/common';
// import { MenuEntry } from '../schemas/menu-entry.schema.js';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class KenyaLawMenuModuleService {
  constructor() // @InjectModel(MenuEntry.name) private klMenuModel: Model<MenuEntry>,
  {}

  async findAll(): Promise<any> {
    // return this.klMenuModel.find().exec();
  }

  async findLatestRoot(name: string): Promise<any> {
    // return this.klMenuModel
    //   .findOne({ name })
    //   .sort({ updatedAt: 'desc' })
    //   .exec();
  }
}
