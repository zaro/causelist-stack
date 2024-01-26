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
  COURT_ADMIN,
  CauselistHeaderParser,
  CauselistHeaderParserBase,
} from './causelist-header-parser.js';
import {
  CauseListDocumentParsed,
  CauselistLineParsed,
  CauselistSectionParsed,
  UnassignedMattersLineParsed,
  UnassignedMattersParsed,
} from '../../interfaces/index.js';
import { MatchRegExSequence } from './multi-line-matcher.js';
import { getDateOnlyISOFromDate } from '../../interfaces/util.js';
import {
  CAUSE_LIST_CASE_NUMBER_RE,
  CAUSE_LIST_DESCRIPTION_RE,
  CAUSE_LIST_NUM_RE,
  CAUSE_LIST_PARTIES_RE,
  CAUSE_LIST_RE,
  JUDGE_HON_RE,
  JUDGE_RE,
  SECTION_NAMES_AS_GROUP,
} from './regexes.js';
import { UnassignedMattersParser } from './unassigned-matters-parser.js';
import { getCourtNameMatcher } from './court-name-matcher.js';

export abstract class CauselistLineParserBase extends ParserBase {
  abstract getParsed(): CauselistLineParsed[];
}

export class CauselistLineParser1 extends CauselistLineParserBase {
  lines = new ExtractMultiStringListField(10, CAUSE_LIST_RE);
  // newSectionRegex = phrasesToRegex(SECTION_NAMES).concat([JUDGE_HON_RE]);
  newSectionRegex = [SECTION_NAMES_AS_GROUP, JUDGE_HON_RE];
  courtNameMatcher = getCourtNameMatcher();
  PEEK_FORWARD = 6;

  isSectionEnd(nextLine: string) {
    if (nextLine.match(/\bcourt|UNASSIGNED\s+MATTERS|DEPUTY\s+REGISTRAR\b/i)) {
      // console.log('>>>> new section court');
      return true;
    }
    if (nextLine.match(/^FOR$/i)) {
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
    const mr = this.courtNameMatcher.match(file.clone());
    if (mr.ok()) {
      return true;
    }
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

export class CauselistLineParser2 extends CauselistLineParserBase {
  lines = new ExtractMultiStringListField(
    10,
    new MatchRegExSequence(
      [
        CAUSE_LIST_NUM_RE,
        CAUSE_LIST_CASE_NUMBER_RE,
        new RegExp(
          `^(?:${CAUSE_LIST_PARTIES_RE.source}|${CAUSE_LIST_DESCRIPTION_RE.source})$`,
          'i',
        ),
      ],
      {
        forceFullLineMatches: true,
      },
    ),
  );
  tryParse(): void {
    this.lines.tryParse(this.file);
  }

  getParsed(): CauselistLineParsed[] {
    return this.lines.get() as unknown as CauselistLineParsed[];
  }
}

export class CauselistLineParser extends MultiParser<CauselistLineParsed[]> {
  constructor(file: FileLines) {
    super(file, [CauselistLineParser1, CauselistLineParser2]);
  }
}

export class CauseListSectionParser extends ParserBase {
  dateTime: ExtractTimeField;
  causelistType = new ExtractStringField(-10, [
    /CIVIL\s*CAUSELIST/,
    /CRIMINAL\s*CAUSELIST/,
    /NAIROBI\s+ CAUSELIST/,
    /CIVIL\s+MATTER/,
    /MIGWANI MATTERS/,
    /All matters are handled virtual/,
    /[ab]\s*\.\s*(?:New|Old)/i,
  ]);
  section = new ExtractStringField(-10, [SECTION_NAMES_AS_GROUP]);
  causelistQualifier = new ExtractStringField(-10, [
    /[ab]\s*\.\s*(?:New|Old)/i,
  ]);
  cases: CauselistLineParser;
  constructor(
    file: FileLines,
    public readonly parent: CauselistHeaderParserBase,
  ) {
    super(file, parent);
    this.dateTime = new ExtractTimeField(-10, parent.date);
    this.cases = new CauselistLineParser(this.file);
  }

  tryParse() {
    this.dateTime.tryParse(this.file);
    this.causelistType.tryParse(this.file);

    this.section.tryParse(this.file);
    this.causelistQualifier.tryParse(this.file);
    // this.causelist.tryParse(this.file);
    this.cases.tryParse();
  }

  getParsed(): CauselistSectionParsed {
    return {
      dateTime: this.dateTime.get(),
      typeOfCause: this.section.get(),
      cases: this.cases.getParsed(),
    };
  }
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
      causeLists: this.sections ? this.sections.getParsed() : [],
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

export class DocumentParser extends MultiParser<CauseListDocumentParsed> {
  constructor(file: FileLines) {
    super(file, [CauselistParser, UnassignedMattersParser]);
  }
}

export interface CauselistMultiDocumentParsed {
  documents: CauseListDocumentParsed[];
}

const IGNORE_BETWEEN_DOCUMENTS = [
  ...COURT_ADMIN,
  'Prepared and Signed by',
  'DATED AT',
  'PREPARED BY',
  'CHECKED BY',
  'N/B:',
  'CIVIL REGISTRY',
  'END',
  /^MALINDI$/,
  /^NAROK$/,
  /^GATHIRIMU$/,
  /^KAPENGURIA$/,
  /^NYERI\.?$/,
  /^MAGISTRATE$/,
];

const MATCHERS_IGNORE_BETWEEN_DOCUMENTS = [
  new MatchRegExSequence([/COURT\s+ADMINISTRATOR/, /LAW\s+COURTS?$/]),
  new MatchRegExSequence([/PRINCIPAL\s+MAGISTRATE/, /LAW\s+COURTS?$/]),
  new MatchRegExSequence([/DEPUTY\s+REGISTRAR/, /(?:LAND|HIGH)\s+COURTS?$/]),
  new MatchRegExSequence([
    /FOR/,
    /PRINCIPAL\s+MAGISTRATE/,
    /\d{1,2}\/\d{1,2}\/\d{4}/,
  ]),
  new MatchRegExSequence([/FOR/, /S\s+COURT$/]),
  new MatchRegExSequence([
    /DUTY\s+COURT/,
    /COURT\s+NO/,
    /HON\./,
    /FOR ENQUIRIES CONTACT US ON/,
    /\d+\.\s+/,
    /\d+\.\s+/,
  ]),
  new MatchRegExSequence([
    /^(?:HON\.?\s+)?(?:\w[\w\.]*\s+)+\w+$/i, // name
    /COURT\s+(?:ADMINISTRATOR|ADMN|ADMIN)/,
    /LAW\s+COURTS?$/,
  ]),
  new MatchRegExSequence([
    /^(HON\.?\s+)?(\w[\w\.]*\s+)+\w+$/i, // name
    /PRINCIPAL\s+MAGISTRATE$/,
  ]),
  new MatchRegExSequence([
    /^(HON\.?\s+)?(\w[\w\.]*\s+)+\w+$/i, // name
    /KADHI$/,
  ]),
  new MatchRegExSequence([/^CAUSELIST\s+FOR/, /^DATED?\s+AT/]),
  new MatchRegExSequence([/TO\s+CHECKs+CASEs+STATUS/, /^SUBJECTs+TOs+CHANGES/]),
  new MatchRegExSequence([JUDGE_HON_RE]),
];

export class CauselistMultiDocumentParser extends ParserBase {
  documents: ParserArray<DocumentParser>;

  tryParse(): void {
    this.documents = new ParserArray(this.file, DocumentParser);
    // Skip up to 50 lines until a court name is found
    if (!this.skipLinesUntilMatch(getCourtNameMatcher(), { maxLines: 50 })) {
      return;
    }

    new DocumentParser(this.file);
    let document = this.documents.appendNewParser();
    document.tryParse();
    while (!this.file.end()) {
      this.file.skipEmptyLines();
      const ignorePhrases = [...IGNORE_BETWEEN_DOCUMENTS];
      this.skipLinesWithMatchers(MATCHERS_IGNORE_BETWEEN_DOCUMENTS);
      this.skipLinesContainingPhrase(ignorePhrases);
      this.skipLinesWithMatchers(MATCHERS_IGNORE_BETWEEN_DOCUMENTS);
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
