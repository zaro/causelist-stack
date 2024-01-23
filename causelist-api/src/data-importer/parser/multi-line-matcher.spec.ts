import * as fs from 'node:fs';
import * as path from 'node:path';
import { FileLines } from './file-lines.js';
import {
  MatchRegExAny,
  MatchRegExSequence,
  MatchStrings,
} from './multi-line-matcher.js';

const fixturesDir = 'src/commands/parser/__fixtures__/data';

const text1 = `
1.
SECTION
NUM/88/2023
PartyA VS PartyB

2.
FRESH HEARING
NUM/99/2023
PartyC VS PartyD

`;

const textNegative1 = `
1.
UNKNOWN
NUM/88/2023
PartyA VS PartyB

2.
FRESH HEARING
NUM/99/2023
PartyC VS PartyD

`;

const text2 = `
SECTION
FRESH HEARING
`;

const text3 = `
SECTION
FRESH HEARING
SECTION
FRESH HEARING
`;

describe('multi-line-matcher', () => {
  let file1: FileLines;
  let fileNegative1: FileLines;
  let file2: FileLines;
  let file3: FileLines;
  let seqMatcher: MatchRegExSequence;
  beforeEach(() => {
    file1 = new FileLines(text1);
    fileNegative1 = new FileLines(textNegative1);
    file2 = new FileLines(text2);
    file3 = new FileLines(text3);
    seqMatcher = new MatchRegExSequence([
      /^(?<num>\d+)\.$/,
      /^(?<type>SECTION|FRESH HEARING)$/,
      /^(?<caseNumber>[\w\.&]+(:?\s*\/\s*|\s+)[\w()]+\s*\/\s*[21][09][0126789][0123456789])$/,
      /^(?<partyA>.*?)\s+(?:Vs\.?|Versus)\s+(?<partyB>.*?)$/i,
    ]);
  });
  describe('MatchSequence', () => {
    it('should match 1 time', () => {
      const mr = seqMatcher.match(file1);

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

    it('should match multiple times', () => {
      seqMatcher.setMax(10);
      const mr = seqMatcher.match(file1);
      const expectedData = [
        {
          num: '1',
          type: 'SECTION',
          caseNumber: 'NUM/88/2023',
          partyA: 'PartyA',
          partyB: 'PartyB',
        },
        {
          num: '2',
          type: 'FRESH HEARING',
          caseNumber: 'NUM/99/2023',
          partyA: 'PartyC',
          partyB: 'PartyD',
        },
      ];
      expect(mr.ok()).toBe(true);
      expect(mr.allAsObjectArray()).toEqual(
        expect.arrayContaining(
          expectedData.map((e) => expect.objectContaining(e)),
        ),
      );
      expect(mr.nextAsObject()).toMatchObject(expectedData[0]);

      expect(mr.nextAsObject()).toMatchObject(expectedData[1]);

      expect(mr.next()).toBeUndefined();
    });

    it('should not match 1', () => {
      const mr = seqMatcher.match(fileNegative1);
      expect(mr.ok()).toBe(false);
      expect(mr.next()).toBeUndefined();
    });
  });

  describe('MatchAny', () => {
    it('should match 1 time', () => {
      const m = new MatchRegExAny([/^SECTION$/, /^FRESH HEARING$/]);

      const mr = m.match(file2);

      expect(mr.ok()).toBe(true);
      expect(mr.nextAsArray()).toEqual(['SECTION']);
      expect(mr.next()).toBeUndefined();
    });

    it('should match multiple times', () => {
      const m = new MatchRegExAny([/^SECTION$/, /^FRESH HEARING$/], {
        maxTimes: 10,
      });

      const mr = m.match(file2);

      expect(mr.ok()).toBe(true);
      const exp = ['SECTION', 'FRESH HEARING'];
      expect(mr.allAsFlatArray()).toEqual(exp);
      expect(mr.nextAsArray()).toEqual(exp.slice(0, 1));
      expect(mr.nextAsArray()).toEqual(exp.slice(1, 2));
      // expect(mr.nextAsArray()).toEqual([]);
      expect(mr.next()).toBeUndefined();
    });

    it('should not match ', () => {
      const m = new MatchRegExAny([/^SECTION1$/, /^FRESHER HEARING$/]);

      const mr = m.match(file2);

      expect(mr.ok()).toBe(false);
      expect(mr.next()).toBeUndefined();
    });
  });

  describe('MatchStrings', () => {
    it('should match 1 time (any)', () => {
      const m = new MatchStrings(['SECTION', 'FRESH HEARING'], false);

      const mr = m.match(file3);

      expect(mr.ok()).toBe(true);
      expect(mr.nextAsArray()).toEqual(['SECTION']);
      expect(mr.next()).toBeUndefined();
    });

    it('should match 1 time (sequence)', () => {
      const m = new MatchStrings(['SECTION', 'FRESH HEARING'], true);

      const mr = m.match(file3);

      expect(mr.ok()).toBe(true);
      expect(mr.nextAsArray()).toEqual(['SECTION', 'FRESH HEARING']);
      expect(mr.next()).toBeUndefined();
    });

    it('should match multiple times (any)', () => {
      const m = new MatchStrings(['SECTION', 'FRESH HEARING'], false, {
        maxTimes: 10,
      });

      const mr = m.match(file3);
      expect(mr.ok()).toBe(true);
      expect(mr.nextAsArray()).toEqual(['SECTION']);
      expect(mr.nextAsArray()).toEqual(['FRESH HEARING']);
      expect(mr.nextAsArray()).toEqual(['SECTION']);
      expect(mr.nextAsArray()).toEqual(['FRESH HEARING']);
      expect(mr.next()).toBeUndefined();
    });

    it('should match multiple times (sequence)', () => {
      const m = new MatchStrings(['SECTION', 'FRESH HEARING'], true, {
        maxTimes: 10,
      });

      const mr = m.match(file3);
      expect(mr.ok()).toBe(true);
      expect(mr.nextAsArray()).toEqual(['SECTION', 'FRESH HEARING']);
      expect(mr.nextAsArray()).toEqual(['SECTION', 'FRESH HEARING']);
      expect(mr.next()).toBeUndefined();
    });

    it('should not match (any)', () => {
      const m = new MatchStrings(['SECTION1', 'FRESHER HEARING']);

      const mr = m.match(file3);

      expect(mr.ok()).toBe(false);
      expect(mr.next()).toBeUndefined();
    });
  });
});
