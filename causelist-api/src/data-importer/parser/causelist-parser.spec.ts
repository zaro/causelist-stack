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

JKIA MAGISTRATE COURT
MAGISTRATE COURT
CAUSE LIST
MONDAY, 18 DECEMBER 2023
HON. NJERI THUKU (SPM) COURT ROOM 1
https://www.shorturl.at/wHLZ4

For any inquiries, please reach us on 0202328614 or jkiacourt@court.go.ke (all letters in lower case). You can also reach the JKIA prosecution office via their email address: jkia@odpp.go.ke

MENTION
1.
MCCR/E074/2021
REPUBLIC VS BIZU HALIMA
2.
MCCRMISC/E091/2023
REPUBLIC VS INT  JAN AND CHILD PROTECTION UNIT
HEARING
3.
MCCHCR/E010/2022
REPUBLIC VS ABDI ANYANGA ALIAS ABDI ALI AND JAIRUS MARTINE
4.
MCCR/E054/2023
REPUBLIC VS HARRISON  MWANIKI AND LUCK  ODHIAMBO AND 2 OTHER(S)
RULING
5.
MCCR/E116/2023
REPUBLIC VS ALABI LATEEF AND CHRISTINE KABIRU AND 2 OTHER(S)
JUDGMENT
6.
MCCR/85/2019
REPUBLIC VS SCOLA IMBITI NAMUNYU
 7.    MCCR/E069/2021                 REPUBLIC VS JOHN SULEIMAN FRANCO

SENTENCING
8.
MCCR/E018/2023
REPUBLIC VS EVANS ILLUVE








TUESDAY, 19 DECEMBER 2023
HON. NJERI THUKU (SPM) COURT ROOM 1
https://www.shorturl.at/wHLZ4

For any inquiries, please reach us on 0202328614 or jkiacourt@court.go.ke (all letters in lower case). You can also reach the JKIA prosecution office via their email address: jkia@odpp.go.ke

MENTION
    1. MCCR/E054/2023
REPUBLIC VS HARRISON  MWANIKI AND LUCK  ODHIAMBO AND 2 OTHER(S)





















JKIA MAGISTRATE COURT
MAGISTRATE COURT
CAUSE LIST
TUESDAY, 19 DECEMBER 2023
HON. R. KITAGWA (PM) COURT ROOM 2

For any inquiries, please reach us on 0202328614 or jkiacourt@court.go.ke (all letters in lower case). You can also reach the JKIA prosecution office via their email address: jkia@odpp.go.ke

RULING (VIRTUALLY)
1.
MCCR/E133/2023
REPUBLIC VS KENNEDY  AOMAH AND PETER  CHEPKURUI


JKIA MAGISTRATE COURT
MAGISTRATE COURT
CAUSE LIST
WEDNESDAY, 20 DECEMBER 2023
HON. NJERI THUKU (SPM) COURT ROOM 1
https://www.shorturl.at/wHLZ4

For any inquiries, please reach us on 0202328614 or jkiacourt@court.go.ke (all letters in lower case). You can also reach the JKIA prosecution office via their email address: jkia@odpp.go.ke

MENTION
1.
MCCHCR/E009/20  22
REPUBLIC VS PHILANDER CRAIG  AND MUHANDO DANIEL  AND 3 OTHER(S)
2.
MCCR/E130/2023
REPUBLIC VS TIMOTHY  OMANWA
3.
MCCR/36/2020
REPUBLIC VS MARTIN MUTANGALI MUKAU

PART HEARD HEARING
4.
MCSO/E002/2023
REPUBLIC VS DERICK  WANYONYI
HEARING
5.
MCCHCR/E004/2022
REPUBLIC VS OLINGA SHEILA

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
