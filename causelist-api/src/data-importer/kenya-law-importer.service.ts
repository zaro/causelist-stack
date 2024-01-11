import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { InfoFile, InfoFileDocument } from '../schemas/info-file.schema.js';

import { Injectable, Logger } from '@nestjs/common';
import { S3Service } from '../s3/s3.service.js';
import { fileKey, getTimedKey, menuEntryKey } from './const.js';

export interface MenuEntry {
  name: string;

  url: string;

  path: string;

  children: MenuEntry[];
}

@Injectable()
export class KenyaLawImporterService {
  private readonly log = new Logger(KenyaLawImporterService.name);

  constructor(
    protected s3Service: S3Service,
    @InjectModel(InfoFile.name)
    protected infoFileModel: Model<InfoFile>,
  ) {}

  protected insertMenuEntry(root: MenuEntry, data: any) {
    let node = root;
    if (data.parent) {
      node = this.insertMenuEntry(node, data.parent);
    }
    const name = data.text.trim();

    const existingNode = node.children?.find(
      (n) => n.url === data.url && n.name === name,
    );
    if (existingNode) {
      return existingNode;
    }
    const entry: MenuEntry = {
      name,
      url: data.url,
      path: data.pathArray.join(':'),
      children: [],
    };
    node.children.push(entry);
    return entry;
  }

  protected findMenuEntryByPath(
    root: MenuEntry,
    path: string,
  ): MenuEntry | undefined {
    if (root.path === path) {
      return root;
    }
    for (const child of root.children) {
      const found = this.findMenuEntryByPath(child, path);
      if (found) {
        return found;
      }
    }
  }

  protected findMenuEntryByName(root: MenuEntry, name: string) {
    if (root.name === name) {
      return root;
    }
    for (const c of root.children) {
      const cc = this.findMenuEntryByName(c, name);
      if (cc) {
        return cc;
      }
    }
  }

  async saveMenuEntry(root: MenuEntry, crawlTime: string): Promise<void> {
    await this.s3Service.uploadFile({
      key: getTimedKey(crawlTime, 'menu'),
      content: JSON.stringify(root, null, 2),
      mimeType: 'application/json',
    });
  }

  async processMenu(crawlTime: string) {
    this.log.log('Loading dataset...');
    const { dataAsObject } = await this.s3Service.downloadFile({
      key: getTimedKey(crawlTime, 'index'),
      parseJson: true,
    });
    if (!dataAsObject?.length) {
      this.log.error(`Index ${crawlTime} is empty`);
      return;
    }
    const keys: string[] = dataAsObject;
    const dataset = await this.s3Service
      .downloadMultipleFiles(
        keys.map((key) => ({
          key: menuEntryKey(key),
          parseJson: true,
        })),
      )
      .then((results) => results.map((r) => r.dataAsObject));
    this.log.log(`Loaded ${dataset.length} records`);
    const root: MenuEntry = {
      name: '_root',
      url: '_root',
      path: null,
      children: [],
    };

    this.log.log(`Building menu...`);
    for (const d of dataset) {
      // if (d.text === 'Civil Division') {
      //   console.log('>>>');
      // }

      const r = this.insertMenuEntry(root, d);
      // if (d.parent?.text === 'Milimani Law Courts') {
      //   console.log(d.text, '>>>', r);
      //   const f = this.findMenuEntryByName(root, 'Milimani Law Courts');
      //   console.log('&&&', f);
      //   if (f === undefined) {
      //     console.log('rootMenu', JSON.stringify(root));
      //   }
      // }
    }
    this.log.log(`Saving menu...`);
    // console.log('rootMenu', JSON.stringify(root));
    await this.saveMenuEntry(root, crawlTime);
    this.log.log(`Done`);
  }

  async importFiles() {
    const fileKeys = (
      await this.s3Service.listFilesAll({
        prefix: fileKey(''),
      })
    ).entries
      .filter((e) => e.Key.endsWith('/meta.json'))
      .map((e) => e.Key);

    this.log.log('Loading files...');
    const saves = [];
    for (const fileKey of fileKeys) {
      const { dataAsObject: datasetFile } = await this.s3Service.downloadFile({
        key: fileKey,
        parseJson: true,
      });
      const {
        url,
        fileName,
        sha1,
        mimeType,
        error: conversionError,
        parentUrl,
        parentPath,
        parentName,
      } = datasetFile;

      if (conversionError) {
        this.log.debug(
          `Ignoring ${fileName}, had conversionError: ${conversionError}`,
        );
        continue;
      }

      const existingFile: InfoFileDocument = await this.infoFileModel
        .findOne({
          sha1,
          fileName,
          parentPath,
        })
        .exec();
      if (existingFile) {
        this.log.debug(`Skip ${fileName}, already imported`);
        continue;
      }
      const file: InfoFileDocument = new this.infoFileModel({
        fileName,
        fileUrl: url,
        sha1,
        mimeType,
        parentUrl,
        parentPath,
        parentName,
        fullyParsed: false,
      });
      this.log.log(`Importing ${fileName}`);
      saves.push(file.save());
    }
    this.log.log(`Waiting for ${saves.length}  documents to be saved!`);
    await Promise.all(saves);
    this.log.log(`Done!`);
  }
}
