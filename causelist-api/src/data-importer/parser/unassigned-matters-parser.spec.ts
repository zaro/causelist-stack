import { FileLines } from './file-lines.js';
import { UnassignedMattersParser } from './unassigned-matters-parser.js';

const text1 = `
UNASSIGNED MATTERS
Wednesday, 24 January 2024
1.
MENTION
MCCRMISC/E027/2024
THE REPUBLIC    VS  PETER KEMBOI
2.
MENTION
MCCR/1069/2020
THE REPUBLIC    VS  WILSON KIPCHIRCHIR MITEI
3.
HEARING
MCCR/E1665/2022
THE REPUBLIC    VS  CHARLES MUIRURI
4.
HEARING
MCSO/139/2019
THE REPUBLIC    VS  ALLAN GICHONI NDERITU
5.
HEARING
MCSO/E094/2023
THE REPUBLIC    VS  STEPHEN MULONGO KHAMALA
`;

const expected1 = expect.arrayContaining(
  [
    {
      num: '1',
      typeOfCause: 'MENTION',
      caseNumber: 'MCCRMISC/E027/2024',
      partyA: 'THE REPUBLIC',
      partyB: 'PETER KEMBOI',
    },
    {
      num: '2',
      typeOfCause: 'MENTION',
      caseNumber: 'MCCR/1069/2020',
      partyA: 'THE REPUBLIC',
      partyB: 'WILSON KIPCHIRCHIR MITEI',
    },
    {
      num: '3',
      typeOfCause: 'HEARING',
      caseNumber: 'MCCR/E1665/2022',
      partyA: 'THE REPUBLIC',
      partyB: 'CHARLES MUIRURI',
    },
    {
      num: '4',
      typeOfCause: 'HEARING',
      caseNumber: 'MCSO/139/2019',
      partyA: 'THE REPUBLIC',
      partyB: 'ALLAN GICHONI NDERITU',
    },
    {
      num: '5',
      typeOfCause: 'HEARING',
      caseNumber: 'MCSO/E094/2023',
      partyA: 'THE REPUBLIC',
      partyB: 'STEPHEN MULONGO KHAMALA',
    },
  ].map((e) => expect.objectContaining(e)),
);

describe('unassigned-matters-parser', () => {
  let file1: FileLines;
  beforeEach(() => {
    file1 = new FileLines(text1);
  });
  describe('UnassignedMattersParser', () => {
    it('should parse', () => {
      const parser = new UnassignedMattersParser(file1);
      parser.tryParse();
      const parsed = parser.getParsed();
      expect(parsed.header.date).toEqual('2024-01-24');
      expect(parsed.cases).toEqual(expected1);
    });
  });
});
