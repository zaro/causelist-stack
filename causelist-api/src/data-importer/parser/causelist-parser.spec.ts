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
KISII HIGH COURT
HIGH COURT CRIMINAL
CAUSE LIST
MONDAY, 29 JANUARY 2024
HON. LADY JUSTICE ODERA TERESA ACHIENG  COURT 1

09:00 AM
MENTION
S/NO
CASE NO
PARTIES
ADVOCATE
1.
HCCRA/19/2022
Hesbon Onduso Obara   Vs  The Republic
J.O.SOIRE & CO ADV
2.
HCCRC/E010/2022
The Republic    Vs  Henry Nyabuto Kenyanya
MR KEROSI ADV
3.
HCCRC/E045/2022
The Republic    Vs  Samwel Nyangau Omweno
MISS NYANDORO ADV
4.
HCCRC/56/2023
The Republic    Vs  Stephen Charles Wambura Alias Orengo
MR NYANG’ACHA ADV
5.
HCCRMISCAPPL/E075/2023
Henry Oruta Nyarang'o   Vs  The Republic
IN PERSON GK PRISON
6.
HCCRC/E016/2023
The Republic    Vs  Casmill Ombati Ayora
KHABURI ADV
7.
HCCRC/4/2021
The Republic Vs Julius Mayaka Ong’era and another
MISS NDUHUKIRE ADV
8.
HCCRC/E062/2023
The Republic Vs Francis Momanyi Ogori
MR MAGARA ADV
9.
HCCRC/E063/2023
The Republic Vs Josephat Nyandwaro Onacho
MR MAGARA ADV


HEARING OF APPLICATIONS
10.
HCCRMISCAPPL/E038/2023
Martin Omollo Odongo   Vs  The Republic
IN PERSON GK PRISON
11.
HCCRMISCAPPL/E036/2023
Joeph Ragira   Vs  The Republic
IN PERSON GK PRISON

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
