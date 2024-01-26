import { getCourtNameMatcher } from './court-name-matcher.js';
import { ExtractStringField } from './extracted-field.js';
import { MatchRegExAny } from './multi-line-matcher.js';
import { ParserBase } from './parser-base.js';

export class NoticeParser extends ParserBase {
  title = new ExtractStringField(
    10,
    new MatchRegExAny([/PUBLIC\s+NOTICE/, /NOTICE/], {
      forceFullLineMatches: true,
    }),
  );
  rawText: string[];
  courtNameMatcher = getCourtNameMatcher();

  tryParse() {
    this.title.tryParse(this.file);
    if (!this.title.valid()) {
      return;
    }
    const start = this.file.clone();
    this.skipLinesUntilMatch(this.courtNameMatcher, { matchOnEnd: true });
    this.rawText = start.peek(
      this.file.getCurrentLine() - start.getCurrentLine(),
    );
  }

  getParsed() {
    return {
      title: this.title.get(),
    };
  }
}
