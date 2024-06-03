export interface ProcessedFile {
  url: string;
  statusCode: number;
  fileName: string;
  sha1: string;
  mimeType: string | undefined;
  textContentType: string | undefined;
  textContentSha1: string | undefined;
  textContentMd5: string | undefined;
  hasCorrection?: boolean;
  correctedTextContentType?: string;
  correctedTextContentSha1?: string;
  hasPdf?: boolean;
  hasPages?: boolean;
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

export interface CaseMetadata {
  title: string;
  caseId: string;
  url: string;
  metadata: Record<string, String>;
  hasPdf?: boolean;
  hasOriginal?: boolean;
  error?: any;
}
