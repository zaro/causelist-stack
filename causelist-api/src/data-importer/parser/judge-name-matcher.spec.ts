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
import { getJudgeNameMatcher } from './judge-name-matcher.js';

const texts = [
  `
WAMAE E.M. MUINDI
 COURTROOM 8
`,
  'DR. IUR FRED NYAGAKA, J  ELC COURT',
  'BERNARD OCHOI COURT 3',
  'HON: WACHIRA TRACY WANJIKU COURT NO.5',
];
const exps = [
  {
    courtRoom: 'COURTROOM 8',
    judge: 'WAMAE E.M. MUINDI',
  },
  {
    judge: 'DR. IUR FRED NYAGAKA, J  ELC COURT',
  },
  {
    courtRoom: 'COURT 3',
    judge: 'BERNARD OCHOI',
  },
  {
    judge: 'HON: WACHIRA TRACY WANJIKU COURT NO.5',
  },
];

describe('judge-name-matcher', () => {
  let files: FileLines[];
  let jnMatcher: Matcher;
  beforeEach(() => {
    files = texts.map((t) => new FileLines(t));
    jnMatcher = getJudgeNameMatcher();
  });
  describe('JudgeNameMatcher', () => {
    it('should match 1 time', () => {
      for (let i = 0; i < files.length; ++i) {
        const mr = jnMatcher.match(files[i]);

        expect(mr.ok()).toBe(true);
        expect(mr.nextAsObject()).toMatchObject(exps[i]);
        expect(mr.next()).toBeUndefined();
      }
    });
  });
});
