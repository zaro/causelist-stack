import * as fs from "node:fs";
import * as path from "node:path";
import * as util from "node:util";

import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
  _Object,
} from "@aws-sdk/client-s3";
import { ConfiguredRetryStrategy } from "@aws-sdk/util-retry";
import objectHash from "object-hash";

import { log } from "crawlee";
import { CaseMetadata } from "./interfaces/crawler.js";

export class CasesStore {
  s3: S3Client;
  bucket: string;
  constructor(protected casesPrefix: string, protected logsPrefix: string) {
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
    if (!this.casesPrefix.endsWith("/")) {
      this.casesPrefix += "/";
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

  async hasCaseRecord(caseId: string): Promise<boolean> {
    const command = new HeadObjectCommand({
      Bucket: this.bucket,
      Key: this.casesPrefix + caseId + "/meta.json",
    });

    try {
      const response = await this.s3.send(command);
      const result = await response;
      return true;
    } catch (e: any) {
      if (e.$metadata.httpStatusCode != 404) {
        this.logError(`getCaseRecord(${caseId}):`, e);
      }
      return false;
    }
  }

  async getCaseRecord(caseId: string): Promise<CaseMetadata | null> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: this.casesPrefix + caseId + "/meta.json",
    });

    try {
      const response = await this.s3.send(command);
      const str = await response.Body?.transformToString();
      if (!str) {
        log.error(`${caseId} has no body`);
        return null;
      }
      return JSON.parse(str);
    } catch (e: any) {
      if (e.Code != "NoSuchKey") {
        this.logError(`getCaseRecord(${caseId}):`, e);
      }
      return null;
    }
  }

  async putCaseRecord(record: CaseMetadata) {
    const Key = this.casesPrefix + record.caseId + "/meta.json";
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
    record: CaseMetadata,
    key: string,
    body: Buffer | string | fs.ReadStream,
    contentType: string | undefined
  ) {
    const Key = this.casesPrefix + record.caseId + "/" + key;

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
      this.logError(`putFileContent(${Key}):`, e);
      return false;
    }
  }

  async getFileContent(
    record: CaseMetadata,
    key: string,
    writeAsFile?: string
  ) {
    const Key = this.casesPrefix + record.caseId + "/" + key;

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
      this.logError(`getFileContent(${Key}):`, e);
      return false;
    }
  }

  async putFileAsFileContent(
    record: CaseMetadata,
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

  async lastCaseId() {
    const command = new ListObjectsV2Command({
      Bucket: this.bucket,
      Prefix: this.casesPrefix,
    });
    let maxCaseId = 0;

    const getMax = (entries: _Object[] | undefined) => {
      if (!entries) return;
      for (const e of entries) {
        const [_, sid] = e.Key?.match(/\/(\d+)\//) ?? [];
        if (!sid) continue;
        const id = parseInt(sid, 10);
        if (id && id > maxCaseId) {
          maxCaseId = id;
        }
      }
    };
    let result = await this.s3.send(command).then((result) => ({
      entries: result.Contents,
      isTruncated: result.IsTruncated,
      NextContinuationToken: result.NextContinuationToken,
      prefix: result.Prefix,
    }));
    getMax(result.entries);
    while (result.NextContinuationToken) {
      const nextCommand = new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: this.casesPrefix,
        ContinuationToken: result.NextContinuationToken,
      });
      result = await this.s3.send(nextCommand).then((result) => ({
        entries: result.Contents,
        isTruncated: result.IsTruncated,
        NextContinuationToken: result.NextContinuationToken,
        prefix: result.Prefix,
      }));
      getMax(result.entries);
    }
    return maxCaseId;
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
