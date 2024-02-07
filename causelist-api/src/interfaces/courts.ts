import {
  CauseListParsed,
  CauselistLineParsed,
  UnassignedMattersParsed,
} from './index.js';

export interface ICourt {
  name: string;
  type: string;
  path: string;
  hasData: boolean;
}

export interface ISearchResult {
  _id: string;
  type: CauseListParsed['type'] | UnassignedMattersParsed['type'];
  date: string;
  judge?: string;
  typeOfCause: string;
  case: CauselistLineParsed;
  casePosition: [number, number];
}

export interface ICourtStats {
  id: string;
  name: string;
  type: string;
  path: string;
  documentsCount: number;
  unparsedCount: number;
  unparsedNoticeCount: number;
  lastImportedDocumentTime: string;
  lastParsedDocumentTime: string;
}
