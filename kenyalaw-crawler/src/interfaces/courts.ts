import { CauselistLineParsed } from './index.js';

export interface ICourt {
  name: string;
  type: string;
  path: string;
  hasData: boolean;
}

export interface ISearchResult {
  _id: string;
  date: string;
  judge: string;
  typeOfCause: string;
  case: CauselistLineParsed;
  casePosition: [number, number];
}
