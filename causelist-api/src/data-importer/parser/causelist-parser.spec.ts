import * as fs from 'node:fs';
import * as path from 'node:path';
import { FileLines } from './file-lines.js';
import {
  MatchRegExAny,
  MatchRegExSequence,
  MatchStrings,
  MatchStringsAny,
  Matcher,
  MatchersList,
} from './multi-line-matcher.js';
import { getCourtNameMatcher } from './court-name-matcher.js';
import { CauselistMultiDocumentParser } from './causelist-parser.js';

const text1 = `
NAKURU COURT OF APPEAL
MAGISTRATE COURT TRAFFIC
CAUSE LIST
MONDAY, 22 JANUARY 2024
HON. EUNICE KELLY AOMA  COURT 5
https://bit.ly/3mEqCoq

09:00 AM
MENTION
1.    MCTR/E644/2023       The Republic   Vs  Joseph Wainaina Gichui
FRESH HEARING
2.    MCTR/E648/2023       The Republic   Vs  Joseph Juma Ekesa

NAKURU COURT OF APPEAL
MAGISTRATE COURT TRAFFIC
CAUSE LIST
MONDAY, 22 JANUARY 2024
HON. J. NDENG'ERI (SRM)  COURT 3
https://bit.ly/3O2SGAh

09:00 AM
MENTION
1.    MCTR/26/2017           Republic   Vs  Peter Njuguna
HEARING
2.    MCTR/560/2018         Republic Vs  Eliud Maina Maraka
JUDGMENT
3.    MCTR/5/2017             Republic  Vs  Robert Kamau Njoki

NAKURU COURT OF APPEAL
MAGISTRATE COURT TRAFFIC
CAUSE LIST
MONDAY, 22 JANUARY 2024
HON. W. O. RADING, SRM   COURT 4
https://bit.ly/3FtwmOp

09:00 AM
HEARING
1.    MCTR/E710/2023       The Republic   Vs  Philip Sang


`;

describe('causelist-parser', () => {
  let file1: FileLines;
  beforeEach(() => {
    file1 = new FileLines(text1);
  });
  describe('CauselistMultiDocumentParser', () => {
    it('should match 1 document', () => {
      const fileLines = new FileLines(text1);
      const parser = new CauselistMultiDocumentParser(fileLines);
      parser.tryParse();
      // We must have consumed all text
      expect(parser.file.end()).toBe(true);
    });
  });
});
