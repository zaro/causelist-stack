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
MILIMANI HIGH COURT
HIGH COURT CRIMINAL
CAUSE LIST
MONDAY, 12 FEBRUARY 2024
HON. LADY JUSTICE LILIAN MUTENDE
https://cutt.ly/njPf8mP

09:00 AM
MENTION
    1. HCCRMISCAPPL/E156/2021	Joseph Kitija Mbatha   Vs  The Republic
    2. HCCRREV/E060/2022 		Arsalan Laloui    Vs  Lopez And National
Police Service Commission (npsc)  & 2
Others
    3. HCCRA/E116/2022     		Fredrick Vigedi Kivisi   Vs  Republic
    4. HCCRA/E083/2022     		Shadrack Mwendwa   Vs  The Republic
    5. HCCRMISCAPPL/E364/2022	Douglas Ontita Nyakundi   Vs  Phylis
Barasa And Milimani Childrens Court  And 1 Others
    6. HCCRREV/E174/2022 		Republic   Vs  Charles Mwangi Thuo
And Phillip Njuguna Kimani  & 1 Others
    7.  HCCRREV/E277/2022 		Teddy Karire Odero   Vs  Republic
    8. HCCRMISCAPPL/E467/2023	Whitepath Company Limited And Zhang
Shiqi  And 2 Others  Vs  Director Fo Criminal Investigations And Kenya Revenue Authority  And 4 Others
    9.  HCCRA/E173/2023     		Abraham Aluta Mutsoli   Vs  Republic
    10. HCCRMISCAPPL/E025/2023	Biotech Organics Limited   Vs  Stanbic
Bank Kenya Limited And Odpp  And 1
Others
    11.  HCCRMISCAPPL/E476/2023	Abdullahi Issack Mohamed   Vs  Director
Of Criminal Investigations And Director Of Public Prosecutions
    12.  HCCRREV/E098/2023 		Saidi Jaharan Mohamed   Vs  Republic
    13. HCCRREV/E098/2022 		The Republic   Vs  Mohammed Kasim
Salat And Abdirashid Abdullahi Omar
And 1 Others
    14. HCCRREV/E848/2023		Erick Osoro Onchombo Vs Republic
    15. HCCRREV/E846/2023		Mercyline Namachanja Vs Republic
    16. HCCRREV/E847/2023		Michael Majani Ibado Vs Republic
    17. HCCRREV/E849/2023		Samuel King’ori Nyakieni Vs Republic
    18.  HCCRMISCAPPL/E035/2024	Clement Mwangi Njeri Vs Republic
    19. HCCRMISCAPPL/E037/2024	Racheal Ndinda Vs Republic
HEARING OF APPLICATIONS
    20.  HCCRMISCAPPL/E033/2024	Astarico Omariba Omoriasi Vs  Republic
    21. HCCRMISCAPPL/E044/2024	Abraham Mwangi Nguyo Vs Republic

`;

const text2 = `
36. MCCC/E012/2023      Chacha Samson Mwita (minor Suing Through Next Friend And
  Father Of Gloria Boke Vs Kamongo Waste Paper (k) Ltd
                        KEHANCHA MAGISTRATE COURT
                             MAGISTRATE COURT
                                  CAUSE LIST
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
