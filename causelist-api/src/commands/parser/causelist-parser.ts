import { FileLines } from './file-lines.js';
import {
  escapeForRegex,
  isWhiteSpaceEquivalent,
  peekForPhrase,
  phraseToRegex,
  phrasesToRegex,
} from './util.js';
import {
  ExtractMultiStringField,
  ExtractDateField,
  ExtractStringField,
  ExtractStringListField,
  ExtractTimeField,
  ExtractedFieldsContainer,
  ExtractMultiStringListField,
} from './extracted-field.js';
import {
  MultiParser,
  ParserArray,
  ParserBase,
  ParserInterface,
} from './parser-base.js';
import {
  CauselistHeaderParsed,
  CauselistHeaderParser,
  CauselistHeaderParserBase,
} from './causelist-header-parser.js';

const SECTION_NAMES = [
  'MENTION',
  'MENTIONS',
  'MENTION DATE FOR COMPLIANCE',
  'JUDGMENT',
  'SUBMISSIONS',
  'SUBMISSION',
  'COMMERCIAL SUIT DIVISION',
  'DEFENSE HEARING',
  'DIRECTIONS',
  'PLEA',
  'SUMMONS FOR CONFIRMATION',
  'PART HEARD HEARING',
  'RECTIFICATION OF GRANT',
  'HEARING- APPLICATION',
  'RULING',
  'FORMAL PROOF HEARING',
  'CHILDREN’S SERVICE MONTH',
  'ASSESSMENT OF COSTS',
  'HEARING',
  'MITIGATION',
  'CASE MANAGEMENT CONFERENCE',
  'CERTIFICATE OF URGENCY',
  'INTER PARTE HEARING',
  'PLEA AND DUTY COURT',
  'SENTENCING',
  'DISMISSAL FOR WANT OF PROSECUTIONS',
  'DISMISSAL',
  'REGISTRATION/FILING',
  'SUMMONS',
  'HEARINGS',
  'TAXATION',
  'MENTION DATE FOR COMPLIANCE',
  'MEDIATION ADOPTION',
  'GAZETTEMENT',
  'FRESH HEARING',
  'CHILDREN CASES FOR DIRECTION',
  'WITHDRAWAL',
  'SCENE VISITS',
  'ENTRY OF CONSENTS',
  'PRE-TRIAL CONFERENCE',
  'PART HEARD HEARING',
  'INTERLOCUTORY APPLICATION',
  'DEFENSE HEARING',
  'NOTICE TO SHOW CAUSE',
  'NOTICE OF MOTION',
  'RULINGS AND JUDGEMENTS',
  'ORDERS',
  'SITE VISIT',
  'SETTLEMENT OF TERMS',
  'ENTERING INTERLOCUTORY JUDGMENTS',
  'FILING DEFENCE',
  'RULINGS',
  'PRELIMINARY OBJECTION',
  'TRIAL',
  'DIRECTIONS',
];

const JUDGE_HON_RE = /^\s*HON\.\s*.*/i;

const CAUSE_LIST_RE = [
  /^\s*(?<num>\d+)\s*\.?\s*(?:\.\s*)?(?:(?<additionalNumber>\w+)\s+)?(?<caseNumber>[\w\.&]+(:?\s*\/\s*|\s+)[\w()]+\s*\/\s*[21][09][0126789][0123456789])\s*(?<partyA>.*?)\s+(?:Vs\.?|Versus)\s+(?<partyB>.*?)\s*$/i,
  /^\s*(?<num>\d+)\s*\.?\s*(?:\.\s*)?(?:(?<additionalNumber>\w+)\s+)?(?<caseNumber>[\w\.&]+(:?\s*\/\s*|\s+)[\w()]+\s*\/\s*[21][09][0126789][0123456789])\s*(?<description>.*?)\s*$/,
  /^\s*(?<num>\d+)\s*\.?\s*(?:\.\s*)?(?<partyA>.*?)\s+(?:Vs\.?|Versus)\s+(?<partyB>.*?)\s*$/i,
  /^\s*(?<num>\d+)\s*\.?\s*(?:\.\s*)?(?<description>In\s+The\s+Estate\s+Of.*?)\s*$/,
];

export type CauselistLineParsed = {
  caseNumber: string;
  num: string;
  additionalNumber?: string;
} & ({ partyA: string; partyB: string } | { description: string });

export class CauselistLineParser extends ParserBase {
  lines = new ExtractMultiStringListField(10, CAUSE_LIST_RE);
  newSectionRegex = phrasesToRegex(SECTION_NAMES).concat([JUDGE_HON_RE]);
  PEEK_FORWARD = 6;

  isSectionEnd(nextLine: string) {
    if (nextLine.match(/\bcourt|UNASSIGNED\s+MATTERS\b/i)) {
      // console.log('>>>> new section court');
      return true;
    }
    for (const re of this.newSectionRegex) {
      if (re.test(nextLine)) {
        // console.log('>>>> new section', nextLine);
        return true;
      }
    }
  }

  heuristicSectionEnd(file: FileLines): boolean {
    if (file.end()) return true;
    const nextLine = file.peekNext();
    if (this.isSectionEnd(nextLine)) {
      return true;
    }
    const nextFewLines = file.peek(this.PEEK_FORWARD);
    if (
      nextFewLines.length < this.PEEK_FORWARD &&
      nextFewLines.every((l) => /^\s*$/.test(l))
    ) {
      // file end
      return true;
    }

    return false;
  }

  tryParse(): void {
    if (!this.file.skipEmptyLines()) return;
    while (!this.file.end()) {
      let s: boolean = true;
      do {
        while (!this.file.end() && (s = this.lines.tryParseAndAdd(this.file))) {
          // this.file.move();
        }
        let nextLine = this.file.peekNext();
        const afterNextFile = this.file.clone();
        afterNextFile.move();
        if (
          isWhiteSpaceEquivalent(nextLine) &&
          this.lines.match(afterNextFile).ok()
        ) {
          this.file.move();
          s = true;
        }
      } while (!this.file.end() && s);

      if (s === false) {
        // Big fat heuristic for joining lines
        const file = this.file.clone();
        if (!this.heuristicSectionEnd(file)) {
          let joinUntil = 0;
          file.move();
          const clonedFile = file.clone();
          for (let i = 1; i < this.PEEK_FORWARD; ++i) {
            const nextLine = clonedFile.getNext();
            // console.log('>>> nl', nextLine);
            if (
              nextLine &&
              (this.lines.match(clonedFile) || this.isSectionEnd(nextLine))
            ) {
              joinUntil = i;
              break;
            }
            if (this.heuristicSectionEnd(clonedFile)) {
              joinUntil = i + 1;
              break;
            }
          }
          if (joinUntil > 0) {
            const toAppend = this.file
              .peek(joinUntil)
              .filter((l) => !isWhiteSpaceEquivalent(l));
            if (toAppend.length) {
              const joinedLine = [this.file.prev(), ...toAppend].join(' ');
              // console.log('>>>> at', this.file.peek(joinUntil));
              // console.log('>>> replacing', this.lines.get());
              // console.log('>>> with |' + joinedLine + '|');
              // console.log('    >>> ', toAppend);
              s = this.lines.tryParseAndReplace(new FileLines(joinedLine));
              if (s) {
                this.file.move(joinUntil);
              }
            }
          }
        }
      }
      if (!s) {
        break;
      }
    }
  }

  getParsed(): CauselistLineParsed[] {
    return this.lines.get() as unknown as CauselistLineParsed[];
  }
}

export interface CauselistSectionParsed {
  dateTime: Date;
  section: string;
  causelist: CauselistLineParsed[];
}
export class CauseListSectionParser extends ParserBase {
  dateTime: ExtractTimeField;
  section = new ExtractStringField(-10, phrasesToRegex(SECTION_NAMES));
  // causelist = new ExtractMultiStringListField(10, CAUSE_LIST_RE);
  causelist: CauselistLineParser;
  constructor(
    file: FileLines,
    public readonly parent: CauselistHeaderParserBase,
  ) {
    super(file, parent);
    this.dateTime = new ExtractTimeField(-10, parent.date);
    this.causelist = new CauselistLineParser(this.file);
  }

  tryParse() {
    this.dateTime.tryParse(this.file);

    this.section.tryParse(this.file);
    // this.causelist.tryParse(this.file);
    this.causelist.tryParse();
  }

  getParsed(): CauselistSectionParsed {
    return {
      dateTime: this.dateTime.get(),
      section: this.section.get(),
      causelist: this.causelist.getParsed(),
    };
  }
}

export interface CauseListDocumentParsed {
  type: 'CAUSE LIST' | 'UNASSIGNED MATTERS';
  header: CauselistHeaderParsed;
  sections: CauselistSectionParsed[];
}

export abstract class CauseListParseBase extends ParserBase {
  sections: ParserArray<CauseListSectionParser, CauselistHeaderParserBase>;

  _tryParse(parent: ParserInterface) {
    this.sections = new ParserArray<
      CauseListSectionParser,
      CauselistHeaderParserBase
    >(this.file, CauseListSectionParser, parent);
    while (true) {
      const section = this.sections.newParser();
      section.tryParse();
      // console.log('section v =', section.allValid(), section.getParsed());
      if (section.allValid()) {
        this.sections.push(section);
      } else {
        break;
      }
    }
  }

  getParsed() {
    return {
      sections: this.sections.getParsed(),
    };
  }
}

export class CauselistParser extends CauseListParseBase {
  header: CauselistHeaderParser;

  tryParse() {
    this.header = new CauselistHeaderParser(this.file);
    this.header.tryParse();
    if (!this.header.goodEnough()) {
      return;
    }
    this._tryParse(this.header.selected);
  }

  getParsed() {
    return {
      ...super.getParsed(),
      header: this.header.getParsed(),
      type: 'CAUSE LIST',
    };
  }
}

export class UnassignedMattersParser extends CauseListParseBase {
  date = new ExtractDateField(10);

  tryParse() {
    this.file.skipEmptyLines();
    if (!peekForPhrase(this.file, 'UNASSIGNED MATTERS')) {
      return;
    }
    this.file.move();
    this.file.skipEmptyLines();
    this.date.tryParse(this.file);
    this.file.skipEmptyLines();
    this._tryParse(this);
  }
  getParsed() {
    return {
      ...super.getParsed(),
      type: 'UNASSIGNED MATTERS',
    };
  }
}

export class DocumentParser extends MultiParser<CauseListDocumentParsed> {
  constructor(file: FileLines) {
    super(file, [CauselistParser, UnassignedMattersParser]);
  }
}

export interface CauselistMultiDocumentParsed {
  documents: CauseListDocumentParsed[];
}

const IGNORE_BETWEEN_DOCUMENTS = [
  'Prepared and Signed by',
  'PRINCIPAL MAGISTRATE',
  'DATED AT',
  'PREPARED BY',
  'CHECKED BY',
  'N/B:',
  'CIVIL REGISTRY',
  'END',
  'FOR',
  /\d{1,2}\/\d{1,2}\/\d{4}/,
];

export class CauselistMultiDocumentParser extends ParserBase {
  documents: ParserArray<DocumentParser>;

  tryParse(): void {
    this.documents = new ParserArray(this.file, DocumentParser);
    new DocumentParser(this.file);
    let document = this.documents.appendNewParser();
    document.tryParse();
    while (!this.file.end()) {
      this.file.skipEmptyLines();
      const ignorePhrases = [...IGNORE_BETWEEN_DOCUMENTS, JUDGE_HON_RE];
      this.skipLinesContainingPhrase(ignorePhrases);
      document = this.documents.newParser();
      document.tryParse();
      if (document.goodEnough()) {
        this.documents.push(document);
      } else {
        break;
      }
    }
  }
  getParsed(): CauselistMultiDocumentParsed {
    return {
      documents: this.documents.map((d) => d.getParsed()),
    };
  }
}
