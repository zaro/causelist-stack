import * as fs from "node:fs";
import * as path from "node:path";
import * as util from "node:util";
import * as child_process from "node:child_process";
import objectHash from "object-hash";
import { createHash } from "node:crypto";

import { log } from "crawlee";
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { ConfiguredRetryStrategy } from "@aws-sdk/util-retry";
import { ProcessedFile } from "./interfaces/crawler.js";

const exec = util.promisify(child_process.exec);

async function convertFileToTxt(fileName: string, convertedDir: string) {
  let { stderr: mimeTypeError, stdout: mimeType } = await exec(
    `file --brief --mime-type ${fileName}`
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
    path.basename(fileName).replace(/\.\w+$/, ".txt")
  );
  let cmd,
    textContentType = "text";
  switch (true) {
    case mimeType === "application/pdf":
      cmd = `pdftotext -layout ${fileName} ${outFileName}`;
      break;
    case mimeType === "image/png" || mimeType === "image/jpeg":
      cmd = `tesseract ${fileName} ${outFileName.replace(/\.txt$/, "")}`;
      break;
    case mimeType ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
      cmd = `libreoffice --convert-to csv --outdir ${convertedDir} ${fileName}`;
      outFileName = outFileName.replace(/\.txt$/, ".csv");
      textContentType = "csv";
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
  } catch (e: any) {
    return {
      error: e.toString(),
    };
  }
}

function fileSha1(fileName: string) {
  return createHash("SHA1").update(fs.readFileSync(fileName)).digest("hex");
}

function textSha1(text: string) {
  return createHash("SHA1").update(text).digest("hex");
}

function textMd5(text: string) {
  return createHash("MD5").update(text).digest("hex");
}

function getCrawlTime(storageDir: string) {
  if (process.env.FORCE_CRAWL_TIME) {
    const forced = new Date(process.env.FORCE_CRAWL_TIME);
    if (isNaN(forced.getTime())) {
      log.error(`Invalid FORCE_CRAWL_TIME: ${process.env.FORCE_CRAWL_TIME}`);
      process.exit(1);
    }
    return forced;
  }
  const reqDir = path.join(storageDir, "request_queues", "default");
  const fileTimes = fs
    .readdirSync(reqDir)
    .map((e) => fs.statSync(path.join(reqDir, e)).mtime);
  return fileTimes.toSorted().at(-1);
}

class SimpleS3 {
  s3: S3Client;
  bucket: string;
  constructor(
    protected filesPrefix: string,
    protected menuEntryPrefix: string,
    protected logsPrefix: string
  ) {
    this.s3 = new S3Client({
      forcePathStyle: true,
      endpoint: process.env.S3_ENDPOINT,
      region: process.env.S3_REGION,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY ?? "invalid",
        secretAccessKey: process.env.S3_SECRET ?? "invalid",
      },
      retryStrategy: new ConfiguredRetryStrategy(
        3, // max attempts.
        (attempt: number) => 1000 + attempt * 2000 // backoff function.
      ),
    });
    this.bucket = process.env.S3_CRAWLER_BUCKET ?? "invalid";
    if (!this.filesPrefix.endsWith("/")) {
      this.filesPrefix += "/";
    }
    if (!this.menuEntryPrefix.endsWith("/")) {
      this.menuEntryPrefix += "/";
    }
    if (!this.logsPrefix.endsWith("/")) {
      this.logsPrefix += "/";
    }
  }

  logError(msg: string, e: any) {
    if (e.constructor?.name) {
      msg += "[" + e.constructor.name + "]";
    }
    log.error(msg, e);
  }

  async putMenuEntryIndex(
    keyList: string[],
    crawlTime: Date
  ): Promise<string | null> {
    const time = crawlTime.toISOString();
    const Body = JSON.stringify(keyList, null, 2);
    const Key = this.menuEntryPrefix + `index.${time}.json`;
    const commands = [
      new PutObjectCommand({
        Bucket: this.bucket,
        Key,
        Body,
        ContentType: "application/json",
      }),
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: this.menuEntryPrefix + `index.json`,
        Body,
        ContentType: "application/json",
      }),
    ];

    try {
      await Promise.all(commands.map((command) => this.s3.send(command)));
      return Key;
    } catch (e: any) {
      this.logError(`putFileRecord(index.json):`, e);
    }
    return null;
  }

  async putMenuEntry(menuEntryRecord: any): Promise<string | null> {
    const key = objectHash(menuEntryRecord, { algorithm: "sha1" });

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: this.menuEntryPrefix + key,
      Body: JSON.stringify(menuEntryRecord, null, 2),
      ContentType: "application/json",
    });

    try {
      await this.s3.send(command);
      return key;
    } catch (e: any) {
      this.logError(`putFileRecord(${key}):`, e);
    }
    return null;
  }

  async getFileRecord(fileSha1: string): Promise<ProcessedFile | null> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: this.filesPrefix + fileSha1 + "/meta.json",
    });

    try {
      const response = await this.s3.send(command);
      const str = await response.Body?.transformToString();
      if (!str) {
        log.error(`${fileSha1} has no body`);
        return null;
      }
      return JSON.parse(str);
    } catch (e: any) {
      if (e.Code != "NoSuchKey") {
        this.logError(`getFileRecord(${fileSha1}):`, e);
      }
      return null;
    }
  }

  async putFileRecord(record: ProcessedFile) {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: this.filesPrefix + record.sha1 + "/meta.json",
      Body: JSON.stringify(record, null, 2),
      ContentType: "application/json",
    });

    try {
      await this.s3.send(command);
      return true;
    } catch (e: any) {
      this.logError(`putFileRecord(${fileSha1}):`, e);
      return false;
    }
  }

  async putFileContent(
    record: ProcessedFile,
    key: string,
    body: Buffer | string | fs.ReadStream,
    contentType: string | undefined
  ) {
    const Key = this.filesPrefix + record.sha1 + "/" + key;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key,
      Body: body,
      ContentType: contentType,
    });

    try {
      await this.s3.send(command);
      return true;
    } catch (e: any) {
      this.logError(`putFileRecord(${fileSha1}):`, e);
      return false;
    }
  }

  async getFileContent(
    record: ProcessedFile,
    key: string,
    writeAsFile?: string
  ) {
    const Key = this.filesPrefix + record.sha1 + "/" + key;

    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key,
    });

    try {
      const response = await this.s3.send(command);
      const body = await response.Body?.transformToByteArray();
      if (!body) {
        log.error(`${Key} has no body`);
        return null;
      }
      if (writeAsFile) {
        fs.writeFileSync(writeAsFile, body);
      }
      return body;
    } catch (e: any) {
      this.logError(`getFileContent(${fileSha1}):`, e);
      return false;
    }
  }

  async putFileAsFileContent(
    record: ProcessedFile,
    key: string,
    fileName: string,
    contentType: string | undefined
  ) {
    return this.putFileContent(
      record,
      key,
      fs.readFileSync(fileName),
      contentType
    );
  }

  async uploadLogFile(fileName: string, key: string, crawlTime: Date) {
    const time = crawlTime.toISOString();
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: this.logsPrefix + time + "/" + key,
      Body: fs.readFileSync(fileName),
      ContentType: "text/plain",
    });

    try {
      await this.s3.send(command);
      return true;
    } catch (e: any) {
      this.logError(`uploadLogFile(${fileName}):`, e);
      return false;
    }
  }
}

async function processFiles(
  s3: SimpleS3,
  storageDir: string,
  convertedDir: string
) {
  const filesDir = path.join(storageDir, "key_value_stores", "default");

  const datasetFiles = fs
    .readdirSync(path.join(storageDir, "datasets", "files"))
    .map((file) =>
      JSON.parse(
        fs
          .readFileSync(path.join(storageDir, "datasets", "files", file))
          .toString()
      )
    );

  for (const datasetFile of datasetFiles) {
    const { parent, fileName, statusCode, url } = datasetFile;
    if (statusCode !== 200) {
      log.warning(`Ignoring ${fileName}, status code ${statusCode}`);
      continue;
    }
    // workaround for problem with crawler
    // const fileName = key.replace(/(\.\w+)$/, '$1$1');

    const filePath = path.join(filesDir, fileName);
    const sha1 = fileSha1(filePath);
    if (!parent?.path?.length) {
      log.error(`Parent path Array is missing! for file ${fileName}`);
      continue;
    }
    const parentPath = parent.pathArray.join(":");
    const existingFile: ProcessedFile | null = await s3.getFileRecord(sha1);
    if (existingFile && !existingFile.error) {
      log.debug(`Skip ${fileName}, already parsed w/o errors`);
      continue;
    }
    log.info(`Converting ${fileName} ...`);
    const { textContent, textContentType, mimeType, error } =
      await convertFileToTxt(filePath, convertedDir);
    if (error) {
      log.warning(`Failed to parse ${filePath} : ${error}`);
    }

    if (!textContent || !textContent.trim().length) {
      log.warning(`Empty content for ${filePath} skipping`);
      continue;
    }

    const file: ProcessedFile = {
      url,
      statusCode,
      fileName,
      sha1,
      mimeType,
      textContentType,
      textContentSha1: textSha1(textContent),
      textContentMd5: textMd5(textContent),
      error,
      parentUrl: parent.url,
      parentPath,
      parentName: parent.text,
      datasetFile,
    };

    await Promise.all([
      s3.putFileAsFileContent(
        file,
        "original",
        path.join(filesDir, fileName),
        mimeType
      ),
      s3.putFileContent(file, "text", textContent, "text/plain"),
    ]);
    await s3.putFileRecord(file);
  }
}

async function processMenuEntries(
  s3: SimpleS3,
  storageDir: string,
  crawlTime: Date
) {
  const dataset = fs
    .readdirSync(path.join(storageDir, "datasets", "default"))
    .map((file) =>
      JSON.parse(
        fs
          .readFileSync(path.join(storageDir, "datasets", "default", file))
          .toString()
      )
    );
  const keys: (string | null)[] = [];
  for (const e of dataset) {
    const key = await s3.putMenuEntry(e);
    keys.push(key);
  }
  if (keys.some((v) => v === null)) {
    throw new Error("Some menuEntries failed to save");
  }
  const r = await s3.putMenuEntryIndex(keys as string[], crawlTime);
  log.info(`Saved menuEntires as ${r}`);
}

async function processData(
  storageDir: string,
  crawlTime: Date,
  ...additionalArgs: string[]
) {
  const s3 = new SimpleS3("files/", "menu-entries/", "logs/");
  const convertedDir = path.join(storageDir, "converted/");
  fs.mkdirSync(convertedDir, { recursive: true });
  await processFiles(s3, storageDir, convertedDir);
  await processMenuEntries(s3, storageDir, crawlTime);
  return true;
}

async function uploadLogs(
  storageDir: string,
  crawlTime: Date,
  ...additionalArgs: string[]
) {
  const s3 = new SimpleS3("files/", "menu-entries/", "logs");
  const logsFiles = fs
    .readdirSync(storageDir)
    .filter((e) => e.endsWith(".txt"));
  let allFileUploaded = true;
  for (const logFile of logsFiles) {
    allFileUploaded &&= await s3.uploadLogFile(
      path.join(storageDir, logFile),
      logFile,
      crawlTime
    );
  }
  if (allFileUploaded) {
    log.info(`Uploaded ${logsFiles.length} log files`);
  } else {
    log.error(`Failed to upload all log files`);
  }
  return allFileUploaded;
}

async function processCorrection(
  storageDir: string,
  crawlTime: Date,
  ...additionalArgs: string[]
) {
  const sha1WithCorrection =
    process.env.PROCESS_CORRECTION_FOR_SHA1 ?? additionalArgs[0];
  if (!sha1WithCorrection) {
    log.error(`PROCESS_CORRECTION_FOR_SHA1 is missing`);
    return false;
  }
  const s3 = new SimpleS3("files/", "menu-entries/", "logs");
  const convertedDir = path.join(storageDir, "converted/");

  const existingFile: ProcessedFile | null = await s3.getFileRecord(
    sha1WithCorrection
  );
  if (!existingFile) {
    log.error(`${sha1WithCorrection}, not found`);
    return false;
  }
  const dlDir = path.join(storageDir, "downloaded");
  fs.mkdirSync(dlDir, { recursive: true });
  const localFile = path.join(dlDir, "CORRECTED-" + existingFile.fileName);
  await s3.getFileContent(existingFile, "corrected", localFile);

  log.info(`Converting ${localFile} ...`);
  const { textContent, textContentType, mimeType, error } =
    await convertFileToTxt(localFile, convertedDir);
  if (error) {
    log.warning(`Failed to parse ${localFile} : ${error}`);
  }

  if (!textContent || !textContent.trim().length) {
    log.warning(`Empty content for ${localFile} skipping`);
    return false;
  }

  await s3.putFileContent(
    existingFile,
    "textCorrected",
    textContent,
    "text/plain"
  );
  existingFile.hasCorrection = true;
  existingFile.correctedTextContentSha1 = textSha1(textContent);
  existingFile.correctedTextContentType = textContentType;
  await s3.putFileRecord(existingFile);
  return true;
}

const allowedCommands = [processData, uploadLogs, processCorrection];
const command = process.argv[2];
const storageDir = process.argv[3];
const cmd = allowedCommands.find((f) => f.name === command);

if (!cmd) {
  log.error(
    "Must specify command, one of:",
    allowedCommands.map((f) => f.name)
  );
  process.exit(1);
}
if (!storageDir) {
  log.error("Must specify storage dir!");
  process.exit(1);
}

const crawlTime = getCrawlTime(storageDir);
if (!crawlTime) {
  log.error("Invalid or empty crawl directory");
  process.exit(1);
}
log.info(`Detected crawTime: ${crawlTime.toISOString()}`);

cmd(storageDir, crawlTime, ...process.argv.slice(4))
  .then((r) => {
    if (!r) {
      log.error("Command finished unsuccessfully!");
      process.exit(1);
    }
  })
  .catch((e) => {
    log.error(`Error while processing : ${storageDir}`);
    log.error(e);
    process.exit(1);
  });
