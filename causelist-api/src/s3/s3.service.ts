import * as stream from 'stream';
import * as path from 'path';
import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Readable } from 'node:stream';
import {
  S3Client,
  HeadObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
  CopyObjectCommand,
  _Object,
  ListObjectsV2CommandOutput,
} from '@aws-sdk/client-s3';
import { ConfiguredRetryStrategy } from '@aws-sdk/util-retry';

import { lastValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';

type KeyGeneratorFunction = () => string;

interface S3Key {
  key: string | KeyGeneratorFunction;
}

export interface S3ListRequest {
  maxKeys?: number;
  prefix?: string;
  continuationToken?: string;
}

interface S3DownloadOptions {
  asStream?: boolean;
  asBase64?: boolean;
  parseJson?: boolean;
}

export interface S3UploadRequest extends S3Key {
  content: Buffer | string | stream.Readable;
  mimeType: string;
  base64Encoded?: boolean;
  public?: boolean;
}

export interface S3ListResult {
  entries: Array<{
    ETag?: string;
    Key?: string;
    LastModified?: Date;
    Size?: number;
    StorageClass?: string;
  }>;
  isTruncated: boolean;
  NextContinuationToken: string;
  prefix: string;
}

export interface S3UploadResult {
  eTag: string;
  bucket: string;
  key: string;
}

export interface S3DownloadRequest extends S3Key, S3DownloadOptions {}

export interface S3DownloadResult {
  key: string;
  fileName: string;
  data: Buffer | string | Uint8Array | Readable;
  dataAsObject?: any;
  status: number;
  mimeType: string;
  headers: {
    [key: string]: any;
  };
}

const DATA_URL_REGEX = /^data:(?<mimeType>[^;,]+)(?:;(?<encoding>base64))?,/;

@Injectable()
export class S3Service {
  protected log = new Logger(S3Service.name);
  public readonly bucket: string;
  public readonly endpoint: string;
  public readonly region: string;
  public readonly accessKey: string;
  public readonly secretKey: string;

  public readonly s3: S3Client;

  constructor(
    configService: ConfigService,
    protected httpService: HttpService,
  ) {
    this.bucket = configService.getOrThrow('S3_CRAWLER_BUCKET');
    this.endpoint = configService.getOrThrow('S3_ENDPOINT');
    this.region = configService.getOrThrow('S3_REGION');
    this.accessKey = configService.getOrThrow('S3_ACCESS_KEY');
    this.secretKey = configService.getOrThrow('S3_SECRET');
    const debugLog = configService.get('S3_DEBUG_LOG');
    const debugLogger = (level: string, content: any[]) => {
      if (level === 'ERROR') {
        console.error('[ERROR] ', ...content);
      } else if (level === 'WARN') {
        console.warn('[WARN] ', ...content);
      } else {
        console.log(`[${level}] `, ...content);
      }
    };

    this.s3 = new S3Client({
      forcePathStyle: true,
      endpoint: this.endpoint,
      region: this.region,
      credentials: {
        accessKeyId: this.accessKey,
        secretAccessKey: this.secretKey,
      },
      retryStrategy: new ConfiguredRetryStrategy(
        3, // max attempts.
        (attempt: number) => 1000 + attempt * 2000, // backoff function.
      ),
      logger: debugLog
        ? {
            debug: (...content: any[]) => debugLogger('DEBUG', content),
            info: (...content: any[]) => debugLogger('INFO', content),
            warn: (...content: any[]) => debugLogger('WARN', content),
            error: (...content: any[]) => debugLogger('ERROR', content),
          }
        : undefined,
    });
  }

  getKeyFromRequest(req: S3Key) {
    return typeof req.key === 'function' ? req.key() : req.key;
  }

  async listFiles(req: S3ListRequest): Promise<S3ListResult> {
    const command = new ListObjectsV2Command({
      Bucket: this.bucket,
      MaxKeys: req.maxKeys,
      Prefix: req.prefix,
      ContinuationToken: req.continuationToken,
    });
    return this.s3.send(command).then((result) => ({
      entries: result.Contents,
      isTruncated: result.IsTruncated,
      NextContinuationToken: result.NextContinuationToken,
      prefix: result.Prefix,
    }));
  }

  async eachFile(
    req: S3ListRequest,
    handler: (o: _Object) => void,
    responseHandler?: true | ((o: ListObjectsV2CommandOutput) => void),
  ): Promise<void> {
    const command = new ListObjectsV2Command({
      Bucket: this.bucket,
      MaxKeys: req.maxKeys,
      Prefix: req.prefix,
    });
    let result = await this.s3.send(command);
    if (responseHandler === true) {
      let count = 0;
      responseHandler = process.stdout.isTTY
        ? (listPage: ListObjectsV2CommandOutput) => {
            count += listPage.KeyCount;
            if (listPage.IsTruncated) {
              process.stdout.write(`\r[S3.eachFile] Received ${count} keys...`);
            } else {
              process.stdout.write('\r');
            }
          }
        : undefined;
    }
    if (responseHandler) {
      responseHandler(result);
    }
    for (const e of result.Contents) {
      handler(e);
    }
    while (result.NextContinuationToken) {
      const nextCommand = new ListObjectsV2Command({
        Bucket: this.bucket,
        MaxKeys: req.maxKeys,
        Prefix: req.prefix,
        ContinuationToken: result.NextContinuationToken,
      });
      result = await this.s3.send(nextCommand);
      if (responseHandler) {
        responseHandler(result);
      }
      for (const e of result.Contents) {
        handler(e);
      }
    }
  }

  async listFilesAll(
    req: S3ListRequest,
    contentFilter?: (o: _Object, index: number) => boolean,
  ): Promise<S3ListResult> {
    const result: _Object[] = [];
    let index = 0;
    await this.eachFile(req, (o) => {
      if (!contentFilter || contentFilter(o, index++)) {
        result.push(o);
      }
    });
    return {
      entries: result,
      isTruncated: false,
      NextContinuationToken: null,
      prefix: req.prefix,
    };
  }

  async uploadFile(req: S3UploadRequest): Promise<S3UploadResult> {
    let Body;
    if (req.base64Encoded && typeof req.content === 'string') {
      Body = Buffer.from(req.content, 'base64');
    } else {
      Body = req.content;
    }
    const Key = this.getKeyFromRequest(req);
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key,
      Body,
      ContentType: req.mimeType,
    });
    return this.s3.send(command).then((result) => ({
      eTag: result.ETag,
      bucket: this.bucket,
      key: Key,
    }));
  }

  async uploadMultipleFiles(
    requests: S3UploadRequest[],
  ): Promise<S3UploadResult[]> {
    return Promise.all(requests.map((req) => this.uploadFile(req)));
  }

  /**
   * Size of file in bytes
   */
  async getFileSize(key: string) {
    const command = new HeadObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    const fileMeta = await await this.s3.send(command);
    return fileMeta.ContentLength;
  }

  /**
   * Mime type of a file
   */
  async getFileMimeType(key: string) {
    const command = new HeadObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    const fileMeta = await await this.s3.send(command);
    return fileMeta.ContentType;
  }

  async removeKey(key: string): Promise<Boolean> {
    const deleteCommand = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    await this.s3.send(deleteCommand);
    return true;
  }

  async renameKey(key: string, newKey: string): Promise<Boolean> {
    const copyCommand = new CopyObjectCommand({
      CopySource: `${this.bucket}/${key}`,
      Bucket: this.bucket,
      Key: newKey,
    });
    await this.s3.send(copyCommand);
    const deleteCommand = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    await this.s3.send(deleteCommand);
    return true;
  }

  async downloadFile(req: S3DownloadRequest): Promise<S3DownloadResult> {
    const key = this.getKeyFromRequest(req);
    const response: S3DownloadResult = {
      key,
    } as unknown as S3DownloadResult;
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    if (req.asStream) {
      const headCommand = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });
      return this.s3.send(headCommand).then(async (headers) => {
        response.headers = Object.fromEntries(
          Object.entries(headers).filter(([k, v]) => !k.startsWith('$')),
        );
        const r = await this.s3.send(command);
        if (!(r.Body instanceof Readable)) {
          // never encountered this error, but you never know
          throw new Error(`unsupported data representation: ${r.Body}`);
        }

        response.data = r.Body;

        return response;
      });
    }

    return this.s3.send(command).then(async (result) => {
      const { $metadata, Body, Metadata, ...headers } = result;
      let data = req.asBase64
        ? Buffer.from(await Body.transformToByteArray()).toString('base64')
        : await Body.transformToString();
      const dataAsObject =
        !req.asBase64 && req.parseJson ? JSON.parse(data) : undefined;
      return {
        key,
        fileName: path.basename(key),
        data,
        dataAsObject,
        status: result.$metadata.httpStatusCode,
        headers,
        mimeType: result.ContentType,
      };
    });
  }

  async downloadMultipleFiles(
    requests: S3DownloadRequest[],
  ): Promise<S3DownloadResult[]> {
    return Promise.all(requests.map((req) => this.downloadFile(req)));
  }

  parseDataUrl(uri: string, options: S3DownloadOptions = {}): S3DownloadResult {
    const m = uri.match(DATA_URL_REGEX);
    if (!m) {
      throw Error(`[parseDataUrl] argument not a data url`);
    }
    let data: string | Buffer | Readable = uri.slice(m[0].length);
    const dataIsBase64 = m.groups.encoding === 'base64';
    if (!dataIsBase64 && options.asBase64) {
      data = Buffer.from(data).toString('base64');
    }
    if (dataIsBase64 && !options.asBase64) {
      data = Buffer.from(data, 'base64');
    }
    if (options.asStream) {
      data = Readable.from([data]);
    }
    return {
      key: 'data:',
      fileName: 'inline',
      data,
      status: 200,
      headers: {},
      mimeType: m.groups.mimeType,
    };
  }

  async downloadUrl(
    uri: string,
    downloadOptions: S3DownloadOptions = {},
  ): Promise<S3DownloadResult> {
    if (uri.startsWith('s3-key://')) {
      return this.downloadFile({
        key: uri.slice(9),
        ...downloadOptions,
      });
    } else if (uri.startsWith('data:')) {
      return Promise.resolve(this.parseDataUrl(uri, downloadOptions));
    } else {
      const responseType = downloadOptions.asStream ? 'stream' : 'arraybuffer';
      return lastValueFrom(this.httpService.get(uri, { responseType })).then(
        (response) => {
          let data = response.data;
          if (downloadOptions.asBase64 && !(data instanceof Readable)) {
            data = Buffer.from(data).toString('base64');
          }
          const url = new URL(uri);
          return {
            key: uri,
            fileName: path.basename(url.pathname) || uri,
            data,
            status: response.status,
            headers: response.headers,
            mimeType: response.headers['content-type'],
          };
        },
      );
    }
  }

  async downloadMultipleUrls(
    uris: string[],
    downloadOptions: S3DownloadOptions = {},
  ): Promise<S3DownloadResult[]> {
    return Promise.all(
      uris.map((uri) => this.downloadUrl(uri, downloadOptions)),
    );
  }
}
