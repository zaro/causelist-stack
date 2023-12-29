import { Command, Positional } from 'nestjs-command/dist/index.js';
import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as util from 'node:util';
import * as child_process from 'node:child_process';
import { createHash } from 'node:crypto';

import { InjectModel } from '@nestjs/mongoose';
import { MenuEntry, MenuEntryDocument } from '../schemas/menu-entry.schema.js';
import { InfoFile, InfoFileDocument } from '../schemas/info-file.schema.js';
import { Model } from 'mongoose';

const exec = util.promisify(child_process.exec);

@Injectable()
export class ImportCommand {
  private readonly log = new Logger(ImportCommand.name);

  constructor(
    @InjectModel(MenuEntry.name)
    protected menuEntryModel: Model<MenuEntry>,
    @InjectModel(InfoFile.name)
    protected infoFileModel: Model<InfoFile>,
  ) {}

  findMenuEntryByName(root: MenuEntry, name: string) {
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

  insertMenuEntry(root: MenuEntry, data: any) {
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
      path: data.path,
      children: [],
    };
    node.children.push(entry);
    return entry;
  }

  async saveMenuEntry(root: MenuEntry): Promise<MenuEntryDocument> {
    const r = await Promise.all(
      root.children.map((child) =>
        this.saveMenuEntry(child as MenuEntryDocument),
      ),
    );
    root.children = r;
    return new this.menuEntryModel(root).save();
  }

  findMenuEntryByPath(root: MenuEntry, path: string): MenuEntry | undefined {
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
  fileMd5(fileName: string) {
    return createHash('md5').update(fs.readFileSync(fileName)).digest('hex');
  }

  async convertFileToTxt(fileName: string, convertedDir: string) {
    let { stderr: mimeTypeError, stdout: mimeType } = await exec(
      `file --brief --mime-type ${fileName}`,
    );
    mimeType = mimeType.trim();
    mimeTypeError = mimeTypeError.trim();
    if (mimeTypeError) {
      return {
        error: mimeTypeError,
      };
    }
    let outFileName = path.join(
      convertedDir,
      path.basename(fileName).replace(/\.\w+$/, '.txt'),
    );
    let cmd,
      textContentType = 'text';
    switch (true) {
      case mimeType === 'application/pdf':
        cmd = `pdftotext -layout ${fileName} ${outFileName}`;
        break;
      case mimeType === 'image/png' || mimeType === 'image/jpeg':
        cmd = `tesseract ${fileName} ${outFileName.replace(/\.txt$/, '')}`;
        break;
      case mimeType ===
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
        cmd = `libreoffice --convert-to csv --outdir ${convertedDir} ${fileName}`;
        outFileName = outFileName.replace(/\.txt$/, '.csv');
        textContentType = 'csv';
        break;
      default:
        cmd = `libreoffice --convert-to "txt:Text (encoded):UTF8" --outdir ${convertedDir} ${fileName}`;
    }
    const { stderr } = await exec(cmd);
    if (stderr) {
      return {
        error: stderr,
      };
    }
    try {
      return {
        textContent: fs.readFileSync(outFileName).toString(),
        textContentType,
        mimeType,
      };
    } catch (e) {
      return {
        error: e.toString(),
      };
    }
  }

  @Command({
    command: 'import:menu <storage_dir>',
    describe: 'Import menu from crawl data',
  })
  async importMenu(
    @Positional({
      name: 'storage_dir',
      describe: 'dir with crawl storage',
      type: 'string',
    })
    storageDir: string,
  ) {
    this.log.log('Loading dataset...');
    const dataset = fs
      .readdirSync(path.join(storageDir, 'datasets', 'default'))
      .map((file) =>
        JSON.parse(
          fs
            .readFileSync(path.join(storageDir, 'datasets', 'default', file))
            .toString(),
        ),
      );
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
    console.log('rootMenu', JSON.stringify(root));
    await this.saveMenuEntry(root);
    this.log.log(`Done`);
  }

  @Command({
    command: 'import:all <storage_dir>',
    describe: 'Import menu and files from crawl data',
  })
  async create(
    @Positional({
      name: 'storage_dir',
      describe: 'dir with crawl storage',
      type: 'string',
    })
    storageDir: string,
  ) {
    await this.importMenu(storageDir);

    const convertedDir = path.join(storageDir, 'converted/');
    const filesDir = path.join(storageDir, 'key_value_stores', 'default');
    fs.mkdirSync(convertedDir, { recursive: true });

    this.log.log('Loading files...');
    const datasetFiles = fs
      .readdirSync(path.join(storageDir, 'datasets', 'files'))
      .map((file) =>
        JSON.parse(
          fs
            .readFileSync(path.join(storageDir, 'datasets', 'files', file))
            .toString(),
        ),
      );
    const saves = [];
    for (const datasetFile of datasetFiles) {
      const { parent, fileName, statusCode } = datasetFile;
      if (statusCode !== 200) {
        this.log.warn(`Ignoring ${fileName}, status code ${statusCode}`);
        continue;
      }
      // workaround for problem with crawler
      // const fileName = key.replace(/(\.\w+)$/, '$1$1');

      const filePath = path.join(filesDir, fileName);
      const md5 = this.fileMd5(filePath);
      if (!parent?.path) {
        console.error(`Parent path is missing! for file ${fileName}`);
        continue;
      }
      const existingFile: InfoFileDocument = await this.infoFileModel
        .findOne({
          md5,
          fileName,
          parentPath: parent.path,
        })
        .exec();
      if (existingFile && !existingFile.error) {
        this.log.log(`Skip ${fileName}, already parsed w/o errors`);
        continue;
      }
      this.log.log(`Converting ${fileName} ...`);
      const { textContent, textContentType, mimeType, error } =
        await this.convertFileToTxt(filePath, convertedDir);
      if (error) {
        this.log.warn(`Failed to parse ${filePath} : ${error}`);
      }
      const file: InfoFileDocument = new this.infoFileModel({
        fileName,
        md5,
        mimeType,
        textContent,
        textContentType,
        error,
        parentUrl: parent.url,
        parentPath: parent.path,
      });
      saves.push(file.save());
    }
    this.log.log(`Waiting for data to be saved!`);
    await Promise.all(saves);
    this.log.log(`Done!`);
  }
}
