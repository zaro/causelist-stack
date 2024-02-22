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
import { getURLMatcher } from './url-matcher.js';

const texts = [
  `bit.ly/xxx`,
  `https://teams.microsoft.com/l/meetup-
  join/19%3ameeting_YzM5N2ExMTAtOGQ5Mi00Y2VmLTkzODUtYTQyZDljNWE2M2Q4%40thread.v2/
  0?context=%7b%22Tid%22%3a%225ff13f0d-11da-4208-8e80-
  7be43c9225f3%22%2c%22Oid%22%3a%22eb4f2c9d-bb90-4da2-8be9-9563c5b17be7%22%7d`,
];
const exps = [
  ['bit.ly/xxx'],
  [
    'https://teams.microsoft.com/l/meetup-join/19%3ameeting_YzM5N2ExMTAtOGQ5Mi00Y2VmLTkzODUtYTQyZDljNWE2M2Q4%40thread.v2/0?context=%7b%22Tid%22%3a%225ff13f0d-11da-4208-8e80-7be43c9225f3%22%2c%22Oid%22%3a%22eb4f2c9d-bb90-4da2-8be9-9563c5b17be7%22%7d',
  ],
];

describe('url-matcher', () => {
  let files: FileLines[];
  let urlMatcher: Matcher;
  beforeEach(() => {
    files = texts.map((t) => new FileLines(t));
    urlMatcher = getURLMatcher();
  });
  describe('URLMatcher', () => {
    it('should match 1 time', () => {
      for (let i = 0; i < files.length; ++i) {
        const mr = urlMatcher.match(files[i]);

        expect(mr.ok()).toBe(true);
        expect(mr.nextAsArray()).toMatchObject(exps[i]);
        expect(mr.next()).toBeUndefined();
      }
    });
  });
});
