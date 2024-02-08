import { FileLines } from './file-lines.js';
import {
  ExtractDateField,
  ExtractMultiStringField,
  ExtractStringField,
  ExtractStringListField,
} from './extracted-field.js';
import { ParserArray, ParserBase } from './parser-base.js';
import {
  CauseListDocumentParsed,
  CauseListParsed,
  CauselistHeaderParsed,
} from '../../interfaces/index.js';
import { getCourtNameMatcher } from './court-name-matcher.js';
import {
  CauseListParseBase,
  CauselistMultiDocumentParsed,
  CauselistMultiDocumentParser1,
  DocumentParser,
} from './causelist-parser-1.js';
import { EMAIL_RE, JUDGE_RE, PHONE_RE, URL_RE } from './regexes.js';
import { getDateOnlyISOFromDate } from '../../interfaces/util.js';

export class CauselistHeader1Parser extends ParserBase {
  court = new ExtractStringListField(0, getCourtNameMatcher());
  title = new ExtractStringListField(0, [/cause\s+list/i]);

  constructor(file: FileLines) {
    super(file);
  }

  tryParse() {
    this.court.tryParse(this.file);
    this.title.tryParse(this.file);
  }

  getParsed(): CauselistHeaderParsed {
    throw new Error('Not to be used directly');
  }
}

export class CauselistHeader2Parser extends ParserBase {
  court = new ExtractStringListField(10, getCourtNameMatcher());
  title = new ExtractStringListField(10, [/cause\s+list/i]);

  date = new ExtractDateField(10);
  judge = new ExtractMultiStringField(-10, [
    ...JUDGE_RE,
    /BEFORE: (?<judge>.*)/,
  ]);
  url = new ExtractStringField(-1, [URL_RE]);
  email = new ExtractStringField(-1, [EMAIL_RE]);
  phone = new ExtractStringField(-1, [PHONE_RE]);

  constructor(file: FileLines) {
    super(file);
  }

  tryParse() {
    this.date.tryParse(this.file);
    this.judge.tryParse(this.file);
    this.url.tryParse(this.file);
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

export class CauselistParser2 extends CauseListParseBase {
  header: CauselistHeader2Parser = new CauselistHeader2Parser(this.file);

  tryParse() {
    this.header.tryParse();
    if (!this.header.goodEnough()) {
      return;
    }
    this._tryParse(this.header);
  }

  getParsed(): CauseListParsed {
    return {
      ...super.getParsed(),
      header: this.header.getParsed(),
      type: 'CAUSE LIST',
    };
  }
}

export class CauselistMultiDocumentParser2 extends ParserBase {
  header: CauselistHeader1Parser;
  documents: ParserArray<CauselistParser2>;

  tryParse() {
    this.header = new CauselistHeader1Parser(this.file);
    this.header.tryParse();
    if (!this.header.allFieldsValid()) {
      return;
    }
    this.documents = new ParserArray(this.file, CauselistParser2);
    this.documents.populateFieldsFrom(this);

    let document = this.documents.appendNewParser();
    document.tryParse();
    while (!this.file.end()) {
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
