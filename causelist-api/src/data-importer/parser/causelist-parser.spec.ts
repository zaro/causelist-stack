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
KIAMBU HIGH COURT
HIGH COURT DIV
CAUSE LIST
MONDAY, 15 JANUARY 2024
LADY JUSTICE MSHILA, ABIGAIL  HIGH COURT 1
https://tinyurl.com/a8zhyt5h

09:00 AM
SENTENCING
    1. HC.P & A/4/2019     In The Matter Of The Estate Of Michael Gichuhi Muiru
MENTION
    2. HCCHRPET/10/2022   Samuel  Njogu  Wainaina And Republic   Vs
    3. HC.CR.C/28/2017     The Republic    Vs  Monica Wanjiru Nyoro
    4. HCCOMM/E009/2023   Patrick Karanja Ngugi And Everton Enterprises Limited   Vs  Co-operative Bank Of Kenya Limited
    5. HCCC/E002/2023       Agnes Elizabeth Gathoni Waweru   Vs  Family Bank Limited
SUMMONS FOR CONFIRMATION
    6. HCFP&A/E101/2022   In The Estate Of Kahiga







                                                     DEPUTY REGISTRAR
HIGH COURT OF KENYA AT KIAMBU
N/B: For further assistance or and clarification, kindly contact the registry through the
Following email address kiambuhighcourt@court.go.ke; and Telephone number 0202690057 OR 0712796124
KIAMBU HIGH COURT

KIAMBU HIGH COURT
HIGH COURT DIV
CAUSE LIST
MONDAY, 15 JANUARY 2024
HON. LADY JUSTICE DORAH CHEPKWONY  HIGH COURT 2
https://tinyurl.com/2p8kvwjr

09:00 AM
PLEA
1.    HC.CR.C/4/2019       The Republic    Vs  Joseph Karichu Muhakia
MENTION DATE FOR COMPLIANCE
2.    HC.PET/5/2016         Isaiah Waweru Ngumi And Evason J.m.jomo  And 1 Others  Vs  Chair, National Land Commission And Director General,kenha
3.    HCCC/22/2019           Sebastian Chege Kamau And Jackson Kagimbi Kagina  And 1 Others  Vs  The County Government Of Kiambu And National Housing Corporation
4.    HCCRA/E090/2021     Joseph Kinyanjui Muthoni   Vs  The Republic
MENTION
5.    HC.CR.C/30/2017     The Republic    Vs  Cyrus Kamau Kinyanjui
6.    HC.CR.C/55/2018     The Republic    Vs  Brian Ntongai Kithinji
7.    HCCRA/E032/2021     Martin Njenga Ndung'u   Vs  Odpp
8.    HCCRC/E014/2021     The Republic    Vs  Alfred Nyabuto Atani Alias Baba Michelle
9.    HCCRA/E092/2021     Eric Ngugi Kimani   Vs  Republic
10.  HCCRA/E036/2022     Nicholas Nganga Gathogo   Vs
11.  HCCRMISCAPPL/E113/2023Peter Gichuru Wanjohi   Vs  Republic
12.  HCCRA/E066/2023     Lucy Muthoni Wambui   Vs  The Republic
13.  HCCRMISCAPPL/E104/2023Peter Thanga Kago   Vs  The Republic
DIRECTIONS
14.  HCCRMISCAPPL/3/2023Karren Jepkemo   Vs  The Republic
HEARING OF APPLICATIONS
15.  HCFP&A/E123/2023   In The Estate Of Janet Wanjiku Kabui


                                                     DEPUTY REGISTRAR
HIGH COURT OF KENYA AT KIAMBU
N/B: For further assistance or and clarification, kindly contact the registry through the
Following email address kiambuhighcourt@court.go.ke; and Telephone number 0202690057 OR 0712796124
KIAMBU HIGH COURT

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
