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
HOMABAY HIGH COURT
HIGH COURT DIV
CAUSE LIST
MONDAY, 29 JANUARY 2024
HON. JOY SHIUNDU WESONGA (PM)(DR)  COURT 1

09:00 AM
TAXATION
1.
HCCA/E054/2021
Barrack Owino Owaga And Stephen Bunde   Vs


HOMABAY HIGH COURT
HIGH COURT DIV
CAUSE LIST
THURSDAY, 01 FEBRUARY 2024
HON JUSTICE W. KIARIE  COURT 1

09:00 AM
MENTION
1.
HC.P & A/443/2015
Petitioner Vs Respondent

`;

describe('court-name-matcher', () => {
  let file1: FileLines;
  beforeEach(() => {
    file1 = new FileLines(text1);
  });
  describe('CourtNameMatcher', () => {
    it('should match 1 time', () => {
      const fileLines = new FileLines(text1);
      const parser = new CauselistMultiDocumentParser(fileLines);
      parser.tryParse();
      // We must have consumed all text
      expect(parser.file.end()).toBe(true);
    });
  });
});
