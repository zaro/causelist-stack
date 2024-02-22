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
﻿MILIMANI MAGISTRATE COURT
MAGISTRATE COURT CRIMINAL
CAUSE LIST
TUESDAY, 16 JANUARY 2024
HON. L.O.ONYINA (CM)  COURT 1
http://shorturl.at/pKS25

09:00 AM
MENTION
1.    MCCR/708/2018         Rep Vs  Naftary Mwangi Maina
2.    MCCR/E802/2021       Republic Vs Galot Mohan  And London Distillers Kenya Ltd
3.    MCCR/E999/2022       Republic Vs Christopher  Muriithi
4.    MCCR/E1039/2023     Republic Vs Mercy Kirigo Jane
PART HEARD HEARING
5.    MCCR/1703/2018       Rep   Vs  Antony Muriithi Njogu
6.    MCCR/E3914/2020     Republic Vs Ndanu Munyoki And 6 Other(s)
7.    MCCR/E398/2022       Republic Vs Ouma Barasa Kennedy
FRESH HEARING
8.    MCCR/E3416/2020     Republic Vs Gadafi Otieno Calvince

MILIMANI MAGISTRATE COURT
MAGISTRATE COURT CRIMINAL
CAUSE LIST
TUESDAY, 16 JANUARY 2024
HON. SUSAN SHITUBI - C.M  COURT 2
https://bit.ly/3BEDAek

09:00 AM
MENTION
1.    MCCR/1163/2017       Rep Vs Mohammed Zafrullah Khan & 7 Others
2.    MCCR/1891/2018       Rep   Vs  Paminus Kiage Gwaro And Collins Rogers Magak
3.    MCCR/E620/2023       Republic Vs Dan  Okemwa
4.    MCCR/E037/2024       Republic Vs Amos  M'anampiu
5.    MCCR/E002/2024       Republic Vs Hillary  Samoei
6.    MCCR/E043/2024       Republic Vs Millcent  Rachilo And Sharon  Angara
PRE-TRIAL CONFERENCE
7.    MCCR/E007/2024       Republic Vs Robert Kipngetich Alias Raphael Bet
PART HEARD HEARING
8.    MCCR/E438/2022       Republic Vs Nduati Kamau Ernest S.
FRESH HEARING
9.    MCCR/E1284/2021     Republic Vs Kamau Ephantus
10.  MCCR/E672/2022       Republic Vs Anthony  Irungu
























NOTE:  KINDLY TAKE NOTICE THAT COURT NO.2 MATTERS LISTED FOR 25TH AND 26TH JANUARY 2024 WILL BE MENTIONED ON THURSDAY 1ST FEBRUARY 2024 FOR DIRECTIONS.

MILIMANI MAGISTRATE COURT
MAGISTRATE COURT CRIMINAL
CAUSE LIST
TUESDAY, 16 JANUARY 2024
BERNARD OCHOI  COURT 3
 https://shorturl.at/jlvxS

09:00 AM
DIRECTIONS
1.    MCSO/44/2017           Rep Vs George Morara Juma
2.    MCCR/1183/2019       Rep Vs  Michael Onduru Kula And George Chemaket
`;

const text2 = `
4. MCCC/E3574/2022 Anthony Kutima Wanjala Vs Samuel Ogechi And Faith Ndindi
Mbai
5. MCCC/E5273/2022 Godfrey Apollo Maina (minor Suing Through Next Friend And
Father) Joseph Maina Njoroge Vs Directline Assurance Company Limited
6. MCCC/E3481/2022 Victor Ochieng Otiende Vs David Njenga Njuguna
RULING
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
