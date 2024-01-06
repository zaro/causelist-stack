import { CauselistLineParsed } from './index.js';

export interface ICourt {
  name: string;
  type: string;
  path: string;
}

export interface ISearchResult {
  _id: string;
  date: string;
  judge: string;
  typeOfCause: string;
  case: CauselistLineParsed;
  casePosition: [number, number];
}
