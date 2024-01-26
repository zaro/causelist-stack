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
import { CAUSE_LIST_RE } from './regexes.js';

const fixturesDir = 'src/commands/parser/__fixtures__/data';

const texts = [
  `
6.   HCC(O.S) 55/2017 Nancy Wanjiru Kibui -vs- Benson Kibui Githinji
7.   HCFMISC/E185/2023 Bernard Njuguna Karanja Vs Victoria Wangari Muthusi
`,
  `
15. HC.P & A/1333/2009In The Estate Of Maingimargaret Bnyambura
16. HC.P & A/1419/2014In The Estate Of Mwaurageorge Mmbugwa`,
];
const expected = [
  [
    {
      num: '6',
      partyA: 'HCC(O.S) 55/2017 Nancy Wanjiru Kibui',
      partyB: 'Benson Kibui Githinji',
    },
    {
      caseNumber: 'HCFMISC/E185/2023',
      num: '7',
      partyA: 'Bernard Njuguna Karanja',
      partyB: 'Victoria Wangari Muthusi',
    },
  ],
  [
    {
      additionalNumber: undefined,
      caseNumber: 'HC.P & A/1333/2009',
      description: 'In The Estate Of Maingimargaret Bnyambura',
      num: '15',
    },
    {
      additionalNumber: undefined,
      caseNumber: 'HC.P & A/1419/2014',
      description: 'In The Estate Of Mwaurageorge Mmbugwa',
      num: '16',
    },
  ],
];

const t = 1;

describe('regexes', () => {
  let file1: FileLines;
  let caseMatcher: Matcher;
  beforeEach(() => {
    file1 = new FileLines(texts[t]);
    caseMatcher = new MatchRegExAny(CAUSE_LIST_RE, { maxTimes: 10 });
  });
  describe('case re', () => {
    it('should match 1 time', () => {
      const mr = caseMatcher.match(file1);

      expect(mr.ok()).toBe(true);
      const a = mr.allAsObjectArray();
      expect(a).toEqual(
        expect.arrayContaining(
          expected[t].map((e) => expect.objectContaining(e)),
        ),
      );

      expect(a.length).toBe(expected[t].length);
    });
  });
});
