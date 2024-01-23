import { peekForPhrase } from './util.js';
import {
  ExtractDateField,
  ExtractMultiStringListField,
} from './extracted-field.js';
import { ParserBase } from './parser-base.js';
import {
  UnassignedMattersLineParsed,
  UnassignedMattersParsed,
} from '../../interfaces/index.js';
import { MatchSequence } from './multi-line-matcher.js';
import { getDateOnlyISOFromDate } from '../../interfaces/util.js';
import {
  CAUSE_LIST_CASE_NUMBER_RE,
  CAUSE_LIST_DESCRIPTION_RE,
  CAUSE_LIST_NUM_RE,
  CAUSE_LIST_PARTIES_RE,
  SECTION_NAMES_AS_GROUP,
} from './regexes.js';

export class UnassignedMattersLineParser1 extends ParserBase {
  lines = new ExtractMultiStringListField(
    10,
    new MatchSequence(
      [
        CAUSE_LIST_NUM_RE,
        SECTION_NAMES_AS_GROUP,
        CAUSE_LIST_CASE_NUMBER_RE,
        CAUSE_LIST_PARTIES_RE,
      ],
      {
        forceFullLineMatches: true,
      },
    ),
  );

  tryParse(): void {
    this.lines.tryParse(this.file);
  }
  getParsed(): UnassignedMattersLineParsed[] {
    return this.lines.get() as UnassignedMattersLineParsed[];
  }
}
export class UnassignedMattersLineParser2 extends ParserBase {
  lines = new ExtractMultiStringListField(10, [
    new RegExp(
      `^\\s*${CAUSE_LIST_NUM_RE.source}(?<typeOfCause>${SECTION_NAMES_AS_GROUP.source})\\s+${CAUSE_LIST_PARTIES_RE.source}\\s*$`,
      'i',
    ),
    new RegExp(
      `^\\s*${CAUSE_LIST_NUM_RE.source}(?<typeOfCause>${SECTION_NAMES_AS_GROUP.source})\\s+${CAUSE_LIST_DESCRIPTION_RE.source}\\s*$`,
      'i',
    ),
  ]);

  tryParse(): void {
    this.lines.tryParse(this.file);
  }
  getParsed(): UnassignedMattersLineParsed[] {
    return this.lines.get() as UnassignedMattersLineParsed[];
  }
}

export class UnassignedMattersParser extends ParserBase {
  date = new ExtractDateField(10);
  cases: UnassignedMattersLineParser1;
  tryParse() {
    this.file.skipEmptyLines();
    if (!peekForPhrase(this.file, 'UNASSIGNED MATTERS')) {
      return;
    }
    this.cases = new UnassignedMattersLineParser1(this.file);
    this.file.move();
    this.file.skipEmptyLines();
    this.date.tryParse(this.file);
    this.file.skipEmptyLines();
    this.cases.tryParse();
  }
  getParsed(): UnassignedMattersParsed {
    return {
      type: 'UNASSIGNED MATTERS',
      header: {
        date: getDateOnlyISOFromDate(this.date.get()),
      },
      cases: this.cases.getParsed(),
    };
  }
}
