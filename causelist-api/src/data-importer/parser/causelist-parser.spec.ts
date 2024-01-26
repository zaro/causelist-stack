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
MALINDI ENVIRONMENT AND LAND COURT
CAUSE LIST
MONDAY, 15 JANUARY 2024
HON. JUSTICE E.K. MAKORI  ELC COURT NO. 2
https://shorturl.at/svzP7

09:00 AM
MENTION
1.    ELC/203/2017           Kupata Ngare   Vs  Abdul Hussein Hamzaali Dossajee
2.    ELCLC/E020/2023     Abraham Birundu Nyangoto   Vs  Joseph Ponda Kahindi And Hans Joachim Paulpolzon  And 1 Others
PRE-TRIAL CONFERENCE
3.    ELCC/E032/2023       Peter Kimaru   Vs  County Government Of Kilifi And National Land Commission  And 2 Others
DEPUTY REGISTRAR
ENVIRONMENT AND LAND COURT
MALINDI`;

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
