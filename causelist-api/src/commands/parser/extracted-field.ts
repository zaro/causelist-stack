import { parse } from 'date-fns';
import { FileLines } from './file-lines.js';
import {
  normalizeWhitespace,
  phrasesToRegex,
  trimObjectValues,
} from './util.js';
import { MatchAny, MatchResult, Matcher } from './multi-line-matcher.js';

export abstract class ExtractedField<T> {
  protected v: T;
  public readonly score: number;
  public readonly optional: boolean;

  constructor(score: number) {
    this.optional = score <= 0;
    this.score = Math.abs(score);
  }

  valid(): boolean {
    const v = this.v;
    if (v === undefined || v === null) return false;
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === 'string') return v.length > 0;
    if (typeof v === 'number') return true;
    if (v instanceof Date) return !Number.isNaN(v.valueOf());
    return false;
  }

  setFrom(_: string): boolean {
    throw new Error('setFrom: Not implemented');
  }

  tryParse(file: FileLines): boolean {
    if (!file.skipEmptyLines()) return false;
    const r = this.setFrom(file.peekNext().trim());
    if (r) {
      file.move();
    }
    return r;
  }

  set(v: T) {
    this.v = v;
  }

  get(): T {
    return this.v;
  }
}

const DATE_FORMATS = [
  'EEEE, d MMMM yyyy',
  'EEEE, do MMMM yyyy',
  'EEEE, do MMMM, yyyy',
];
export class ExtractDateField extends ExtractedField<Date> {
  setFrom(dateString: string) {
    dateString = normalizeWhitespace(dateString);
    dateString = dateString.replace(/^FOR\s+/i, '');
    for (const dateFormat of DATE_FORMATS) {
      try {
        const date = parse(dateString, dateFormat, 0);
        if (!Number.isNaN(date.valueOf())) {
          this.set(date);
          return true;
        }
      } catch {}
    }
    return false;
  }

  valid(): boolean {
    const v = this.v;
    if (v instanceof Date) return !Number.isNaN(v.valueOf());
    return false;
  }
}

const HOUR_FORMATS = ['hh:mm aa', 'hh.mm aa', 'hh:mmaa', 'h.mmaa', 'hh:mm'];
export class ExtractTimeField extends ExtractedField<Date> {
  constructor(
    score: number,
    protected date: ExtractDateField,
  ) {
    super(score);
  }

  setFrom(timeString: string) {
    if (!this.date.valid()) {
      return false;
    }
    const dateTime = this.matchTime(timeString, this.date.get());
    if (dateTime) {
      this.set(dateTime);
      return true;
    }
    return false;
  }

  matchTime(timeString: string, referenceDate: number | Date) {
    timeString = normalizeWhitespace(timeString);
    timeString = timeString.replace(/^TIME\s+/i, '');

    for (const timeFormat of HOUR_FORMATS) {
      try {
        const dateTime = parse(timeString, timeFormat, referenceDate);
        if (!Number.isNaN(dateTime.valueOf())) {
          return dateTime;
        }
      } catch {}
    }
  }

  valid(): boolean {
    const v = this.v;
    if (v instanceof Date) return !Number.isNaN(v.valueOf());
    return false;
  }
}

export abstract class ExtractWithRegexField<T> extends ExtractedField<T> {
  protected readonly matcher: Matcher;
  constructor(score: number, regExes: RegExp[]) {
    super(score);
    this.matcher = new MatchAny(regExes);
  }
  protected abstract _setFrom(_: MatchResult): void;

  tryParse(file: FileLines): boolean {
    const r = this.matcher.match(file);
    if (r.ok()) {
      this._setFrom(r);
    }
    return r.ok();
  }

  match(file: FileLines) {
    return this.matcher.match(file);
  }
}

export class ExtractStringField extends ExtractWithRegexField<string> {
  _setFrom(matched: MatchResult) {
    this.set(matched.getAsArray()[0]);
  }

  valid(): boolean {
    const v = this.v;
    if (typeof v === 'string') return v.length > 0;
    return false;
  }
}

export class ExtractMultiStringField extends ExtractWithRegexField<{
  [key: string]: string;
}> {
  _setFrom(matched: MatchResult) {
    this.set({
      ...trimObjectValues(matched.getAsObject()),
    });
  }

  valid(): boolean {
    if (this.v) return Object.keys(this.v).length > 0;
    return false;
  }
}

export abstract class ExtractListWithRegexField<
  T,
> extends ExtractWithRegexField<T[]> {
  protected abstract _addFrom(_: MatchResult): void;
  protected abstract _replaceFrom(_1: MatchResult, _2: number): void;

  constructor(score: number, regExes: RegExp[]) {
    super(score, regExes);
    this.matcher.setMax(Number.MAX_SAFE_INTEGER);
  }

  tryParse(file: FileLines): boolean {
    let r = this.matcher.match(file);
    while (r.ok()) {
      this._addFrom(r);
      r = this.matcher.match(file);
    }
    return r.ok();
  }

  tryParseAndAdd(file: FileLines): boolean {
    const r = this.matcher.match(file);
    if (r.ok()) {
      this._addFrom(r);
    }
    return r.ok();
  }

  tryParseAndReplace(file: FileLines, index: number = -1) {
    const r = this.matcher.match(file);
    if (r.ok()) {
      this._replaceFrom(r, index);
      return true;
    }
    return false;
  }

  valid(): boolean {
    return this.v?.length > 0;
  }
}

export class ExtractStringListField extends ExtractListWithRegexField<string> {
  constructor(score: number, regExesOrStrings: (string | RegExp)[]) {
    super(score, phrasesToRegex(regExesOrStrings));
  }
  _setFrom(matched: MatchResult) {
    this.set(matched.getAsArray());
  }

  _addFrom(matched: MatchResult) {
    const v = matched.getAsArray()[0].trim();
    this.set(this.v ? [...this.v, v] : [v]);
  }

  _replaceFrom(matched: MatchResult, index: number) {
    if (!this.v || index >= this.v.length) {
      this._addFrom(matched);
    } else {
      if (index < 0) {
        index = this.v.length + index;
      }
      const copy = [...this.v];
      copy[index] = matched.getAsArray()[0].trim();
      this.set(copy);
    }
  }
}

export class ExtractMultiStringListField extends ExtractListWithRegexField<{
  [key: string]: string;
}> {
  _setFrom(matched: MatchResult) {
    this.set([
      {
        ...trimObjectValues(matched.getAsObject()),
      },
    ]);
  }

  _addFrom(matched: MatchResult) {
    const o = {
      ...trimObjectValues(matched.getAsObject()),
    };

    this.set(this.v ? [...this.v, o] : [o]);
  }

  _replaceFrom(matched: MatchResult, index: number) {
    if (!this.v || index >= this.v.length) {
      this._addFrom(matched);
    } else {
      if (index < 0) {
        index = this.v.length + index;
      }
      const copy = [...this.v];
      copy[index] = {
        ...trimObjectValues(matched.getAsObject()),
      };
      this.set(copy);
    }
  }
}

export class ExtractedFieldsContainer {
  getExtractedFields() {
    return Object.keys(this).filter((k) => this[k] instanceof ExtractedField);
  }
}
