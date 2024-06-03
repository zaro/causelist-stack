import { FileLines } from './file-lines.js';
import {
  ExtractMultiStringField,
  ExtractDateField,
  ExtractStringField,
  ExtractStringListField,
  ExtractTimeField,
} from './extracted-field.js';
import { MultiParser, ParserBase } from './parser-base.js';
import { CauselistHeaderParsed } from '../../interfaces/index.js';
import { getDateOnlyISOFromDate } from '../../interfaces/util.js';
import { getCourtNameMatcher } from './court-name-matcher.js';
import { EMAIL_RE, PHONE_RE } from './regexes.js';
import { getJudgeNameMatcher } from './judge-name-matcher.js';
import { getURLMatcher } from './url-matcher.js';

export abstract class CauselistHeaderParserBase extends ParserBase {
  court = new ExtractStringListField(10, getCourtNameMatcher());
  title = new ExtractStringListField(10, [
    /(?:virtual|SUPPLEMENTARY|CHILDREN|SUCCESSION|CIVIL\s+)?cause\s+list/i,
  ]);

  date = new ExtractDateField(10);
  judge = new ExtractMultiStringField(-10, getJudgeNameMatcher());
  url = new ExtractStringField(-1, getURLMatcher());
  email = new ExtractStringField(-1, [EMAIL_RE]);
  phone = new ExtractStringField(-1, [PHONE_RE]);

  constructor(file: FileLines) {
    super(file);
  }

  getParsed(): CauselistHeaderParsed {
    const d = this.date.get();
    if (!d) {
      return;
    }
    return {
      court: this.court.get(),
      date: getDateOnlyISOFromDate(d),
      judge: this.judge.get()?.judge,
      courtRoom: this.judge.get()?.courtRoom,
      url: this.url.get(),
      email: this.email.get(),
      phone: this.phone.get(),
    };
  }
}

export const COURT_ADMIN = ['COURT ADMIN', 'C/A:'];
const IGNORE_PHRASES = [
  'cause list',
  'ADDENDUM CAUSELIST',
  'ADDENDUM',
  'CIVIL CASES',
  'CRIMINAL CASES',
  'Virtual Link',
  'LINK',
  'TO BE MENTIONED',
  'PUBLIC HOLIDAY',
  'SERVICE WEEK MATTERS',
  'SERVICE MONTH',
  'ENTERING INTERLOCUTORY JUDGMENTS',
  'DUTY COURT',
  /^NOTE[;:]/,
  /^N\/B:/,
  ...COURT_ADMIN,
];

export class CauselistHeaderParser1 extends CauselistHeaderParserBase {
  tryParse() {
    this.court.tryParse(this.file);
    this.title.tryParse(this.file);
    this.date.tryParse(this.file);
    this.judge.tryParse(this.file);
    this.url.tryParse(this.file);
    this.skipLinesContainingPhrase(COURT_ADMIN);
    this.email.tryParse(this.file);
    this.skipLinesContainingPhrase(COURT_ADMIN);
    this.phone.tryParse(this.file);
    this.skipLinesContainingPhrase(COURT_ADMIN);

    this.tryParseUnparsed();
    this.skipLinesContainingPhrase(IGNORE_PHRASES);
    this.tryParseUnparsed();
  }
}

export class CauselistHeaderParser extends MultiParser<CauselistHeaderParsed> {
  constructor(file: FileLines) {
    super(file, [CauselistHeaderParser1]);
  }
}
