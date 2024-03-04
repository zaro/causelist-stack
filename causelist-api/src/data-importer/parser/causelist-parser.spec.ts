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
import { CauselistLineParser1 } from './causelist-parser-1.js';

const text1 = `
MURANGA MAGISTRATE COURT
MAGISTRATE COURT
CAUSE LIST
TUESDAY, 30 JANUARY 2024
HON. SUSAN N. MWANGI COURTROOM NO. 3
https://bit.ly/3PlPrVv

09:00 AM
HEARING- APPLICATION
    1.  MCSUCC/E139/2022   In The Estate Of Stephene Macharia Murai
`;

const text2 = `
36. MCCC/E012/2023      Chacha Samson Mwita (minor Suing Through Next Friend And
  Father Of Gloria Boke Vs Kamongo Waste Paper (k) Ltd
                        KEHANCHA MAGISTRATE COURT
                             MAGISTRATE COURT
                                  CAUSE LIST
`;

describe('causelist-parser', () => {
  describe('CauselistMultiDocumentParser', () => {
    let file1: FileLines;
    beforeEach(() => {
      file1 = new FileLines(text1);
    });
    it('should match 1 document', () => {
      const fileLines = new FileLines(text1);
      const parser = new CauselistMultiDocumentParser(fileLines);
      parser.tryParse();
      // We must have consumed all text
      console.log(parser.getParsed().documents[0]);
      expect(parser.file.end()).toBe(true);
    });
  });

  describe('CauselistLineParser1', () => {
    let file: FileLines;
    beforeEach(() => {
      file = new FileLines(text2);
    });
    it('should match 1 document', () => {
      const parser = new CauselistLineParser1(file);
      parser.tryParse();
      // We must have consumed all text
      console.log(parser.getParsed());
      expect(parser.file.end()).toBe(true);
    });
  });
});
