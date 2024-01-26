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

const fixturesDir = 'src/commands/parser/__fixtures__/data';

const text1 = `
LOKICHOGIO MOBILE COURT UNDER
KAKUMA MAGISTRATE COURT
MAGISTRATE COURT
`;

describe('court-name-matcher', () => {
  let file1: FileLines;
  let cnMatcher: Matcher;
  beforeEach(() => {
    file1 = new FileLines(text1);
    cnMatcher = getCourtNameMatcher();
  });
  describe('CourtNameMatcher', () => {
    it('should match 1 time', () => {
      const mr = cnMatcher.match(file1);

      expect(mr.ok()).toBe(true);
      expect(mr.nextAsObject()).toMatchObject({
        num: '1',
        type: 'SECTION',
        caseNumber: 'NUM/88/2023',
        partyA: 'PartyA',
        partyB: 'PartyB',
      });
      expect(mr.next()).toBeUndefined();
    });
  });
});
