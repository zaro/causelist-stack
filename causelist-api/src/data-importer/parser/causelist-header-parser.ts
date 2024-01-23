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
import { EMAIL_RE, JUDGE_RE, PHONE_RE, URL_RE } from './regexes.js';

export abstract class CauselistHeaderParserBase extends ParserBase {
  // court = new ExtractStringListField(10, [/^.*\bcourt\b.*$/i]);
  court = new ExtractStringListField(10, getCourtNameMatcher());

  date = new ExtractDateField(10);
  judge = new ExtractMultiStringField(-10, JUDGE_RE);
  url = new ExtractStringField(-1, [URL_RE]);
  email = new ExtractStringField(-1, [EMAIL_RE]);
  phone = new ExtractStringField(-1, [PHONE_RE]);

  constructor(file: FileLines) {
    super(file);
  }

  getParsed(): CauselistHeaderParsed {
    const d = this.date.get();
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
  ...COURT_ADMIN,
];

export class CauselistHeaderParser1 extends CauselistHeaderParserBase {
  tryParse() {
    this.court.tryParse(this.file);
    this.skipLinesContainingPhrase(['cause list', 'CIVILCAUSE LIST']);
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

export class CauselistHeaderParser2 extends CauselistHeaderParserBase {
  tryParse() {
    this.court.tryParse(this.file);
    this.skipLinesContainingPhrase('cause list');
    this.court.tryParse(this.file);
    this.date.tryParse(this.file);
    this.judge.tryParse(this.file);
    this.url.tryParse(this.file);
    this.email.tryParse(this.file);
    this.phone.tryParse(this.file);

    this.tryParseUnparsed();
    this.skipLinesContainingPhrase(IGNORE_PHRASES);
    this.tryParseUnparsed();
  }
}

export class CauselistHeaderParser extends MultiParser<CauselistHeaderParsed> {
  constructor(file: FileLines) {
    super(file, [CauselistHeaderParser1, CauselistHeaderParser2]);
  }
}
