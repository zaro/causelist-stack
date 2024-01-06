import * as fs from 'node:fs';
import * as path from 'node:path';
import { FileLines } from './file-lines.js';
import { MatchAny, MatchSequence } from './multi-line-matcher.js';

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

const text2 = `
SECTION
FRESH HEARING
`;

describe('multi-line-matcher', () => {
  let file1: FileLines;
  let file2: FileLines;
  beforeEach(() => {
    file1 = new FileLines(text1);
    file2 = new FileLines(text2);
  });
  describe('MatchSequence', () => {
    it('should match 1 time', () => {
      const m = new MatchSequence([
        /^(?<num>\d+)\.$/,
        /^(?<type>[\w\s]+)$/,
        /^(?<caseNumber>[\w\.&]+(:?\s*\/\s*|\s+)[\w()]+\s*\/\s*[21][09][0126789][0123456789])$/,
        /^(?<partyA>.*?)\s+(?:Vs\.?|Versus)\s+(?<partyB>.*?)$/i,
      ]);

      const mr = m.match(file1);

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
      const m = new MatchSequence(
        [
          /^(?<num>\d+)\.$/,
          /^(?<type>[\w\s]+)$/,
          /^(?<caseNumber>[\w\.&]+(:?\s*\/\s*|\s+)[\w()]+\s*\/\s*[21][09][0126789][0123456789])$/,
          /^(?<partyA>.*?)\s+(?:Vs\.?|Versus)\s+(?<partyB>.*?)$/i,
        ],
        1,
        10,
      );

      const mr = m.match(file1);

      expect(mr.ok()).toBe(true);
      expect(mr.nextAsObject()).toMatchObject({
        num: '1',
        type: 'SECTION',
        caseNumber: 'NUM/88/2023',
        partyA: 'PartyA',
        partyB: 'PartyB',
      });

      expect(mr.nextAsObject()).toMatchObject({
        num: '2',
        type: 'FRESH HEARING',
        caseNumber: 'NUM/99/2023',
        partyA: 'PartyC',
        partyB: 'PartyD',
      });

      expect(mr.next()).toBeUndefined();
    });
  });

  describe('MatchAny', () => {
    it('should match 1 time', () => {
      const m = new MatchAny([/^SECTION$/, /^FRESH HEARING$/]);

      const mr = m.match(file2);

      expect(mr.ok()).toBe(true);
      expect(mr.nextAsArray()).toEqual(['SECTION']);
      expect(mr.next()).toBeUndefined();
    });

    it('should match multiple times', () => {
      const m = new MatchAny([/^SECTION$/, /^FRESH HEARING$/], 1, 10);

      const mr = m.match(file2);

      expect(mr.ok()).toBe(true);
      expect(mr.nextAsArray()).toEqual(['SECTION', 'FRESH HEARING']);
      // expect(mr.nextAsArray()).toEqual([]);
      expect(mr.next()).toBeUndefined();
    });
  });
});
