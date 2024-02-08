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
IN THE SUPREME COURT OF KENYA
AT NAIROBI
CAUSE LIST


FRIDAY 12TH JANUARY 2024
BEFORE: HON. NELLY W. KARIUKI (DR) VIRTUAL COURT
LINK: https://cutt.ly/ownd79yL
 09:00 AM
MENTION
1.    SCPT/6/2014	Fredrick Otieno Outa vs Independent Electoral and Boundaries Commission & Another
2.    SCPT/E015/2023	County Assembly Of Migori vs Isaac Aluochier & 2 Others
3.    SCAPPL/E033/2023 	Kennedy Ithongo Thindiu vs Harry Kinuthia Ithongo
4.    SCAPPL/E048/2023	Joseph Sombo & 4 Others vs Nyari Investments (1998) Limited & 5 Others

MONDAY, 15TH JANUARY 2024
BEFORE: 	HON. BERNARD KASAVULI (DR) VIRTUAL COURT
LINK: https://cutt.ly/YZjVHAl
09:00 AM
MENTION
1.    SCPT/E034/2022   		Modern Holdings vs Kenya Ports Authority

MONDAY, 22ND JANUARY 2024
BEFORE: 	HON. BERNARD KASAVULI (DR) VIRTUAL COURT
LINK: https://cutt.ly/YZjVHAl
09:00 AM
MENTION
1.    SCPT/E018/2023			The Republic vs Joshua Gichuki Mwangi & Others
2.    SCPT/E023/2023	Symon Wairobi Gatuma vs Kenya Breweries Limited & 3 Others
3.    SCPT/E030/2023			Goddick Simiyu Wanga vs The Republic
4.    SCPT/E032/2023			Ruth Wanjiku Kamande vs  The Republic
5.    SCPT/E033/2023	Harcharan Singh Sehmi & Another vs Tarabana Company Limited & 5 Others
6.    SCAPPL/E047/2023	Zara Properties Limited (CPR/2010/24490) vs Zara Properties Limited (C.106174) & Another

TAXATION
7.    SCPT/E024/2023	Nairobi Bottlers Limited vs Mark Ndumia Ndung'u & Another
8.    SCAPPL/E030/2023	Nairobi Bottlers Ltd vs Mark Ndumia Ndung'u & Another
9.    SCAPPL/E034/2023	Mark Ndumia Ndungu vs Nairobi Bottlers Limited &Another
10.    SCAPPL/E038/2023	Nairobi Bottlers Limited vs Mark Ndumia Ndungu & Another

TUESDAY, 23RD JANUARY 2024
BEFORE: KOOME, CJ & P, MWILU, DCJ & VP, IBRAHIM, WANJALA, NJOKI, LENAOLA & OUKO, SCJJ
LINK: https://cutt.ly/vEq1QNk
09:00 AM
HEARING
1.    SCPT/E021 /2022	Zehrabanu Janmohamed & Another vs Nathaniel K. Lagat & 3 Others
2.    SCAO/E001/2022       	In the matter of an Application by the Hon. Attorney General on behalf of the National Government for an Advisory Opinion

BEFORE: 	HON. BERNARD KASAVULI (DR) VIRTUAL COURT
LINK: https://cutt.ly/YZjVHAl
09:00 AM
MENTION
3.    SCPT/E031/2023	Alex Otuke Ondimu & Another vs Commissioner Of Police & 3 Others

WEDNESDAY 24TH JANUARY 2024
BEFORE: MWILU, DCJ & VP, IBRAHIM, WANJALA, NJOKI & LENAOLA, SCJJ
LINK: https://cutt.ly/vEq1QNk
09:00 AM
HEARING
1.    SCAO/E001/2023	In the matter of an Application by Kituo Cha Sheria for an Advisory Opinion
2.    SCPT/E035/2022	Kampala International University vs Housing Finance Ltd & Another

THURSDAY 25TH JANUARY 2024
BEFORE: KOOME, CJ & P, MWILU, DCJ & VP, IBRAHIM, WANJALA & NJOKI, SCJJ
LINK: https://cutt.ly/vEq1QNk
09:00 AM
HEARING
1.    SCPT/E005/2023			Stanbic Bank Limited vs Santowels Limited

BEFORE: MWILU, DCJ & VP, IBRAHIM, WANJALA, LENAOLA & OUKO, SCJJ
LINK: https://cutt.ly/vEq1QNk

2.    SCPT/E014/2023	Ashmi Investment Limited vs Riakina Limited & Another





FRIDAY, 26TH JANUARY 2024
BEFORE: 	HON. BERNARD KASAVULI (DR) VIRTUAL COURT
LINK: https://cutt.ly/YZjVHAl
1.    SCPT/E026/2023	Ahmed Boray Arale vs Independent Electoral and Boundaries Commission & 4 Others

MONDAY, 29TH JANUARY 2024
BEFORE: 	HON. BERNARD KASAVULI (DR) VIRTUAL COURT
LINK: https://cutt.ly/YZjVHAl
09:00 AM
MENTION
1.    SCPT/E012/2023	Dari Limited & 5 Others vs East African Development Bank
2.    SCPT/E019/2023 	Export Processing Zones Authority vs Kelvin Musyoka & 16 Others
3.    SCPT/E021/2023 	Kelvin Musyoka & 9 Others vs National Enviroment Management Authority & 7 Others
4.    SCAPPL/E041/2023	The Republic vs Julius Kitsao Manyeso

FRIDAY, 15TH MARCH 2024
BEFORE: 	HON. BERNARD KASAVULI (DR) VIRTUAL COURT
LINK: https://cutt.ly/YZjVHAl
09:00 AM
MENTION
1.    SCPT/E027/2021	The Senate of the Republic of Kenya & 3 Others vs The Speaker of the National Assembly & 10 Others








MONDAY, 29TH APRIL 2024
BEFORE: 	HON. BERNARD KASAVULI (DR) VIRTUAL COURT
LINK: https://cutt.ly/YZjVHAl
09:00 AM
MENTION
1.    SCAPPL/E033/2023	Kenya Marine Fisheries & Research Institute vs Ezekiel Nyangoya Okemwa


DATED 3RD JANUARY, 2024




DEPUTY REGISTRAR
SUPREME COURT OF KENYA

`;

describe('causelist-parser', () => {
  let file1: FileLines;
  beforeEach(() => {
    file1 = new FileLines(text1);
  });
  describe('CauselistMultiDocumentParser', () => {
    it('should match 1 document', () => {
      const fileLines = new FileLines(text1);
      const parser = new CauselistMultiDocumentParser(fileLines);
      parser.tryParse();
      // We must have consumed all text
      expect(parser.file.end()).toBe(true);
    });
  });
});
