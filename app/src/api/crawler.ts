export interface ProcessedFile {
  url: string;
  statusCode: number;
  fileName: string;
  sha1: string;
  mimeType: string | undefined;
  textContentType: string;
  textContentSha1: string;
  textContentMd5: string;
  hasCorrection?: boolean;
  correctedTextContentType?: string;
  correctedTextContentSha1?: string;
  error: any;
  parentUrl: string;
  parentPath: string;
  parentName: string;
  datasetFile: any;
}

export interface ProcessedFilesStats {
  totalFilesCount: number;
  non200: number;
  alreadyProcessed: number;
  failedToConvert: number;
  processed: number;
  processedSha1: string[];
  countByHttpStatus: {
    [key: string]: number;
  };
}
