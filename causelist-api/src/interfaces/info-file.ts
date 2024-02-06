import { DocumentTypeHint } from './index.js';

export interface IInfoFile {
  id: string;
  fileName: string;
  fileUrl: string;
  sha1: string;
  mimeType: string;
  fullyParsed: boolean;
  parseError: boolean;
  parentUrl: string;
  parentPath: string;
  parentName: string;
  parsedAt?: Date;
  overrideDocumentType?: DocumentTypeHint;
  hasCorrection?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
