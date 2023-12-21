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

const URL_RE =
  /(https?:\/\/)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;

const EMAIL_RE =
  /(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/;

const PHONE_RE = /^(:?TEL:|TELEPHONE\s+NO\.)?\s*[\d\s-]+\s*$/;

const JUDGE_RE = [
  /(?<judge>(?:HON\.?\s+)?.*)\s+(:?\(?(?:SRM|CM|DR|SPM|PM)\)?\s+)?(?<courtRoom>COURT\s+(?:ROOM\s+)?(?:NO\.?\s+)?\d+)/i,
  /(?<judge>(?:HON\.?\s+)?.*)\s+(?<courtRoom>\d+)/i,
  /(?<judge>(?:(?:BEFORE )?HON\.?\s+)?.*)\s+(?<courtRoom>(?:MAGISTRATE\s+COURT)|(?:COURTROOM))/i,
  /(?<judge>(?:HON\.?\s+)?.*)\s*[,-]?\s*\(?(?:SRM|CM|DR|SPM|PM)\)?/i,
  /(?<judge>(?:HON\.\s+).*)/i,
];

export abstract class CauselistHeaderParserBase extends ParserBase {
  court = new ExtractStringListField(10, [/^.*\bcourt\b.*$/i]);
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
      date: `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`,
      judge: this.judge.get()?.judge,
      courtRoom: this.judge.get()?.courtRoom,
      url: this.url.get(),
      email: this.email.get(),
      phone: this.phone.get(),
    };
  }
}

const COURT_ADMIN = ['COURT ADMIN:', 'C/A:'];
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
