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
  MATCHERS_IGNORE_BETWEEN_DOCUMENTS,
} from './causelist-parser-1.js';
import { EMAIL_RE, JUDGE_RE, PHONE_RE, URL_RE } from './regexes.js';
import { getDateOnlyISOFromDate } from '../../interfaces/util.js';

export class CauselistHeader1Parser extends ParserBase {
  court = new ExtractStringListField(0, getCourtNameMatcher());
  title = new ExtractStringListField(0, [/cause\s+list/i]);
  judge = new ExtractMultiStringField(-10, [
    ...JUDGE_RE,
    /BEFORE: (?<judge>.*)/,
  ]);
  url = new ExtractStringField(-1, [URL_RE]);

  constructor(file: FileLines) {
    super(file);
  }

  tryParse() {
    this.court.tryParse(this.file);
    this.title.tryParse(this.file);
    this.judge.tryParse(this.file);
    this.url.tryParse(this.file);
  }

  getParsed(): CauselistHeaderParsed {
    throw new Error('Not to be used directly');
  }
}

const IGNORE_PHRASES_AFTER_HEADER = ['For any inquiries'];

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
    if (!this.judge.valid()) {
      this.judge.tryParse(this.file);
    }
    if (!this.url.valid()) {
      this.url.tryParse(this.file);
    }
    this.skipLinesContainingPhrase(IGNORE_PHRASES_AFTER_HEADER);
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

export class CauselistOneDocumentParser2 extends ParserBase {
  header: CauselistHeader1Parser = new CauselistHeader1Parser(this.file);
  documents: ParserArray<CauselistParser2> = new ParserArray(
    this.file,
    CauselistParser2,
  );

  tryParse() {
    this.header.tryParse();
    if (!this.header.allFieldsValid()) {
      return;
    }
    this.documents.populateFieldsFrom(this);

    let document = this.documents.newParser({ clonedFile: true });
    document.tryParse();
    if (document.goodEnough()) {
      this.documents.push(document);
      this.file.catchUpWithClone(document.file);
    } else {
      return;
    }
    while (!this.file.end()) {
      document = this.documents.newParser({ clonedFile: true });
      document.tryParse();
      if (document.goodEnough()) {
        this.documents.push(document);
        this.file.catchUpWithClone(document.file);
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

export class CauselistMultiDocumentParser2 extends ParserBase {
  docs: ParserArray<CauselistOneDocumentParser2> = new ParserArray(
    this.file,
    CauselistOneDocumentParser2,
  );

  tryParse() {
    let document = this.docs.appendNewParser();
    document.tryParse();
    while (!this.file.end()) {
      this.skipLinesWithMatchers(MATCHERS_IGNORE_BETWEEN_DOCUMENTS);
      document = this.docs.newParser();
      document.tryParse();
      if (document.goodEnough()) {
        this.docs.push(document);
      } else {
        break;
      }
    }
  }

  getParsed(): CauselistMultiDocumentParsed {
    return {
      documents: this.docs.flatMap((d) => d.getParsed().documents),
    };
  }
}
