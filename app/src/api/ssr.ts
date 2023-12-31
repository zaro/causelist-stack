import { ICourt } from './courts.js';
import { CauseListDocumentParsed } from './index.js';

export interface RandomCourtData {
  daysWithData: string[];
  court: ICourt;
  causelist: {
    [key: string]: CauseListDocumentParsed[];
  };
}
