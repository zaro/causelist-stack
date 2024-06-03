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
import { ProcessedFile, ProcessedFilesStats } from "./interfaces/crawler.js";

const exec = util.promisify(child_process.exec);
const STATS_FILE = "process-files-stats.json";

async function convertFileToFormats(fileName: string, convertedDir: string) {
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
  let txtOutFileName = path.join(
    convertedDir,
    path.basename(fileName).replace(/\.\w+$/, ".txt")
  );
  let pdfOutFileName = path.join(
    convertedDir,
    path.basename(fileName).replace(/\.\w+$/, ".pdf")
  );
  let pngOutFileNamePrefix = path.join(
    convertedDir,
    path.basename(fileName).replace(/\.\w+$/, "-page")
  );
  let toTxtCmd,
    toPdfCmd,
    textContentType = "text";
  switch (true) {
    case mimeType === "application/pdf":
      toTxtCmd = `pdftotext -layout ${fileName} ${txtOutFileName}`;
      toPdfCmd = `cp ${fileName} ${pdfOutFileName}`;
      break;
    case mimeType === "image/png" || mimeType === "image/jpeg":
      toTxtCmd = `tesseract ${fileName} ${txtOutFileName.replace(
        /\.txt$/,
        ""
      )}`;
      toPdfCmd = `img2pdf -o ${pdfOutFileName} ${fileName} `;
      break;
    case mimeType ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
      toTxtCmd = `libreoffice --convert-to csv --outdir ${convertedDir} ${fileName}`;
      txtOutFileName = txtOutFileName.replace(/\.txt$/, ".csv");
      textContentType = "csv";
      toPdfCmd = `libreoffice --convert-to pdf --outdir ${convertedDir} ${fileName}`;
      break;
    default:
      toTxtCmd = `libreoffice --convert-to "txt:Text (encoded):UTF8" --outdir ${convertedDir} ${fileName}`;
      toPdfCmd = `libreoffice --convert-to pdf --outdir ${convertedDir} ${fileName}`;
  }
  let stderr;
  ({ stderr } = await exec(toTxtCmd));
  if (stderr) {
    return {
      error: stderr,
    };
  }
  // Convert to PDF
  ({ stderr } = await exec(toPdfCmd));
  if (stderr) {
    return {
      error: stderr,
    };
  }
  // Convert to PNG pages
  ({ stderr } = await exec(
    `pdftoppm -png ${pdfOutFileName} ${pngOutFileNamePrefix}`
  ));
  if (stderr) {
    return {
      error: stderr,
    };
  }
  let textContent = fs.readFileSync(txtOutFileName).toString();
  let pngPagesFiles: string[] = [];
  let page = 1;
  let f;
  while (fs.existsSync((f = `${pngOutFileNamePrefix}-${page}.png`))) {
    pngPagesFiles.push(f);
    page++;
  }
  if (textContent.trim().length < 3) {
    // Most probably the document is only a picture, try to OCR
    let pagesText = [];
    for (const f of pngPagesFiles) {
      log.info(`OCRing ${f}...`);
      const { stdout, stderr } = await exec(
        `tesseract  ${f}  stdout --oem 1 --psm 4`
      );
      if (stderr) {
        console.error(`Failed OCR of ${f} with:`);
        console.error(stderr);
        continue;
      }
      pagesText.push(stdout);
    }
    textContent = pagesText.join("".padStart(80, "*"));
  }

  try {
    return {
      textContent,
      textContentType,
      pdfContentFile: pdfOutFileName,
      pngPagesFiles,
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

function getCrawlTime(storageDir: string): Date {
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
  const crawlTime = fileTimes.toSorted().at(-1);
  if (!crawlTime) {
    log.error("Invalid or empty crawl directory");
    process.exit(1);
  }
  log.info(`Detected crawTime: ${crawlTime.toISOString()}`);
  return crawlTime;
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
    const Key = this.filesPrefix + record.sha1 + "/meta.json";
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key,
      Body: JSON.stringify(record, null, 2),
      ContentType: "application/json",
    });

    try {
      await this.s3.send(command);
      return true;
    } catch (e: any) {
      this.logError(`putFileRecord(${Key}):`, e);
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
      this.logError(`putFileRecord(${Key}):`, e);
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

async function convertAndUploadFile(
  s3: SimpleS3,
  file: ProcessedFile,
  filePath: string,
  convertedDir: string,
  stats: ProcessedFilesStats
) {
  log.info(`Converting ${filePath} ...`);
  const {
    textContent,
    textContentType,
    mimeType,
    pdfContentFile,
    pngPagesFiles,
    error,
  } = await convertFileToFormats(filePath, convertedDir);
  if (error) {
    log.warning(`Failed to parse ${filePath} : ${error}`);
  }

  if (!textContent || !textContent.trim().length) {
    stats.failedToConvert++;
    log.warning(`Empty content for ${filePath} skipping`);
    return {
      textContent,
      textContentType,
      error: error ?? "Empty content",
    };
  }

  log.info(`Uploading ${pngPagesFiles.length} png(s)...`);
  await Promise.all(
    [
      s3.putFileAsFileContent(file, "original", filePath, mimeType),
      s3.putFileContent(
        file,
        file.hasCorrection ? "textCorrected" : "text",
        textContent,
        "text/plain"
      ),
      s3.putFileAsFileContent(file, "pdf", pdfContentFile, "application/pdf"),
    ].concat(
      pngPagesFiles.map((filePath, index) =>
        s3.putFileAsFileContent(
          file,
          `pages/${index + 1}`,
          filePath,
          "image/png"
        )
      )
    )
  );
  return {
    textContent,
    textContentType,
    mimeType,
    pdfContentFile,
    pngPagesFiles,
    error,
  };
}

async function processFiles(
  s3: SimpleS3,
  storageDir: string,
  convertedDir: string
) {
  const filesDir = path.join(storageDir, "key_value_stores", "default");
  const stats: ProcessedFilesStats = {
    totalFilesCount: 0,
    non200: 0,
    alreadyProcessed: 0,
    failedToConvert: 0,
    processed: 0,
    processedSha1: [],
    countByHttpStatus: {},
  };

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
    stats.totalFilesCount++;
    const { parent, fileName, statusCode, url } = datasetFile;
    stats.countByHttpStatus[statusCode] =
      (stats.countByHttpStatus[statusCode] ?? 0) + 1;
    if (statusCode !== 200) {
      stats.non200++;
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
      stats.alreadyProcessed++;
      log.debug(`Skip ${fileName}, already parsed w/o errors`);
      continue;
    }
    const file: ProcessedFile = {
      url,
      statusCode,
      fileName,
      sha1,
      parentUrl: parent.url,
      parentPath,
      parentName: parent.text,
      datasetFile,
      mimeType: undefined,
      textContentType: undefined,
      textContentMd5: undefined,
      textContentSha1: undefined,
      error: undefined,
    };

    const {
      textContent,
      textContentType,
      mimeType,
      error,
      pdfContentFile,
      pngPagesFiles,
    } = await convertAndUploadFile(s3, file, filePath, convertedDir, stats);
    if (error) {
      log.warning(`Failed to parse ${filePath} : ${error}`);
    }

    if (!textContent || !textContent.trim().length) {
      stats.failedToConvert++;
      log.warning(`Empty content for ${filePath} skipping`);
      continue;
    }

    file.mimeType = mimeType;
    file.textContentType = textContentType;
    file.textContentSha1 = textSha1(textContent);
    file.textContentMd5 = textMd5(textContent);
    file.error = error;
    file.hasPdf = !!pdfContentFile;
    file.hasPages = !!pngPagesFiles?.length;

    await s3.putFileRecord(file);
    stats.processed++;
    stats.processedSha1.push(file.sha1);
  }

  fs.writeFileSync(
    path.join(storageDir, STATS_FILE),
    JSON.stringify(stats, null, 2)
  );
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

async function processData(storageDir: string, ..._additionalArgs: string[]) {
  const crawlTime = getCrawlTime(storageDir);

  const s3 = new SimpleS3("files/", "menu-entries/", "logs/");
  const convertedDir = path.join(storageDir, "converted/");
  fs.mkdirSync(convertedDir, { recursive: true });
  await processFiles(s3, storageDir, convertedDir);
  await processMenuEntries(s3, storageDir, crawlTime);
  return true;
}

async function uploadLogs(storageDir: string, ..._additionalArgs: string[]) {
  const crawlTime = getCrawlTime(storageDir);

  const s3 = new SimpleS3("files/", "menu-entries/", "logs");
  const logsFiles = fs
    .readdirSync(storageDir)
    .filter((e) => e.endsWith(".txt"));

  if (fs.existsSync(path.join(storageDir, STATS_FILE))) {
    logsFiles.push(STATS_FILE);
  }

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
    await convertFileToFormats(localFile, convertedDir);
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

async function reprocessFiles(storageDir: string, ...additionalArgs: string[]) {
  const reprocessSha1s = process.env.REPROCESS_SHA1 ?? additionalArgs[0];
  if (!reprocessSha1s) {
    log.error(`REPROCESS_SHA1 is missing`);
    return false;
  }
  const stats: ProcessedFilesStats = {
    totalFilesCount: 0,
    non200: 0,
    alreadyProcessed: 0,
    failedToConvert: 0,
    processed: 0,
    processedSha1: [],
    countByHttpStatus: {},
  };
  const dlDir = path.join(storageDir, "downloaded");
  fs.mkdirSync(dlDir, { recursive: true });
  const convertedDir = path.join(storageDir, "converted/");
  fs.mkdirSync(convertedDir, { recursive: true });

  for (const reprocessSha1 of reprocessSha1s.split(",")) {
    log.info(`Reprocessing SHA1 ${reprocessSha1}`);
    const s3 = new SimpleS3("files/", "menu-entries/", "logs");

    const existingFile: ProcessedFile | null = await s3.getFileRecord(
      reprocessSha1
    );
    if (!existingFile) {
      log.error(`${reprocessSha1}, not found`);
      continue;
    }

    const localFile = path.join(
      dlDir,
      (existingFile.hasCorrection ? "CORRECTED-" : "") + existingFile.fileName
    );
    await s3.getFileContent(
      existingFile,
      existingFile.hasCorrection ? "corrected" : "original",
      localFile
    );

    const file: ProcessedFile = {
      ...existingFile,
    };

    const {
      textContent,
      textContentType,
      mimeType,
      error,
      pdfContentFile,
      pngPagesFiles,
    } = await convertAndUploadFile(s3, file, localFile, convertedDir, stats);
    if (error) {
      log.warning(`Failed to parse ${localFile} : ${error}`);
    }

    if (!textContent || !textContent.trim().length) {
      stats.failedToConvert++;
      log.warning(`Empty content for ${localFile} skipping`);
    } else {
      file.mimeType = mimeType;
      file.textContentType = textContentType;
      file.textContentSha1 = textSha1(textContent);
      file.textContentMd5 = textMd5(textContent);
    }

    file.error = error;
    file.hasPdf = !!pdfContentFile;
    file.hasPages = !!pngPagesFiles?.length;

    await s3.putFileRecord(file);
    stats.processed++;
    stats.processedSha1.push(file.sha1);
  }
  fs.writeFileSync(
    path.join(storageDir, STATS_FILE),
    JSON.stringify(stats, null, 2)
  );
  return true;
}

const allowedCommands = [
  processData,
  uploadLogs,
  processCorrection,
  reprocessFiles,
];
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

cmd(storageDir, ...process.argv.slice(4))
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
