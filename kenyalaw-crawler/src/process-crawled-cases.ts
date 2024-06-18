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
import { CasesStore } from "./cases-store.js";
import { caseStore } from "./routes-cases.js";
import {
  convertFileToFormats,
  convertFileToTextHtmlAndPossiblyPdf,
  tikaServerInfo,
  tikaServerStart,
  tikaServerStop,
} from "./convert.js";

const exec = util.promisify(child_process.exec);

async function convertCasesToText(
  storageDir: string,
  ..._additionalArgs: string[]
) {
  const store = new CasesStore("cases/", "logs/");
  const convertedDir = path.join(storageDir, "converted/");
  const downloadDir = path.join(storageDir, "download/");
  fs.mkdirSync(convertedDir, { recursive: true });
  fs.mkdirSync(downloadDir, { recursive: true });
  const cases: {
    [key: string]: Array<{
      key: string;
      lastModified?: Date;
    }>;
  } = {};
  const startCase = parseInt(_additionalArgs[0], 10);
  log.info(`Start case is ${startCase}`);
  const [tikaProc] = await Promise.all([
    tikaServerStart(),
    caseStore.eachKey((o) => {
      if (!o.Key) return;
      const match = o.Key.match(/\/(\d+)\//);
      if (!match) return;
      const caseId = match[1];
      if (!isNaN(startCase) && startCase < parseInt(caseId, 10)) {
        return;
      }
      if (!cases[caseId]) {
        cases[caseId] = [];
      }
      cases[caseId].push({
        key: path.basename(o.Key),
        lastModified: o.LastModified,
      });
    }),
  ]);

  log.info(`Processing ${Object.keys(cases).length} cases from S3`);
  for (const [caseId, objects] of Object.entries(cases)) {
    if (
      objects.some((o) => o.key === "text") &&
      objects.some((o) => o.key === "html")
    ) {
      continue;
    }
    const caseRecord = await caseStore.getCaseRecord(caseId);
    if (!caseRecord) {
      log.warning(`Case ${caseId} record is missing`);
      continue;
    }
    const sourceKey = caseRecord.hasPdf ? "pdf" : "original";
    const sourceFile = path.join(downloadDir, `${sourceKey}.dl`);
    await caseStore.getFileContent(caseRecord, sourceKey, sourceFile);
    log.info(`Converting case ${caseId}`);
    const { htmlContent, textContent, mimeType, pdfFileName, error } =
      await convertFileToTextHtmlAndPossiblyPdf(sourceFile, convertedDir);
    if (error) {
      log.error(`Failed: convertFileToFormats(${caseId}) error: ${error}`);
      continue;
    }
    if (!htmlContent) {
      log.error(`Failed: convertFileToFormats(${caseId}) textContent is empty`);
      continue;
    }
    await Promise.all([
      caseStore.putFileContent(caseRecord, "html", htmlContent, "text/html"),
      caseStore.putFileContent(caseRecord, "text", textContent, "text/plain"),
    ]);
    if (mimeType !== "application/pdf") {
      await caseStore.putFileAsFileContent(
        caseRecord,
        "pdf",
        pdfFileName,
        "application/pdf"
      );
    }
  }
  tikaServerStop(tikaProc);
  return true;
}

const allowedCommands = [convertCasesToText];
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
