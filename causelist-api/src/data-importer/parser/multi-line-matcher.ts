import { FileLines } from './file-lines.js';
import { asFullLineRe, normalizeWhitespace, trimObjectValues } from './util.js';

export interface MatcherOptions {
  minTimes?: number;
  maxTimes?: number;
  skipEmptyLines?: boolean;
  forceFullLineMatches?: boolean;
}

export class MatchResult {
  protected _result: RegExpMatchArray[][];
  protected current: number;
  constructor(match?: RegExpMatchArray[]) {
    this._result = match && match.length ? [match] : [];
    this.current = -1;
  }

  getRawResults() {
    return this._result.flat();
  }

  push(result: RegExpMatchArray[]) {
    this._result.push(result);
  }

  ok() {
    return this._result.length >= 1;
  }

  count() {
    return this._result.length;
  }

  protected _toObject(ma: RegExpMatchArray[], trim = false) {
    let o = {};
    for (const m of ma) {
      o = {
        ...o,
        ...m.groups,
      };
    }
    return trim ? trimObjectValues(o) : o;
  }
  protected _toArray(ma: RegExpMatchArray[], trim = false) {
    return ma.map((m) => (trim ? m[0].trim() : m[0]));
  }

  protected _toObjectArray(ra: RegExpMatchArray[][], trim = false) {
    return ra.map((ma) => this._toObject(ma, trim));
  }

  get() {
    return this._result[0];
  }

  getAsArray() {
    const ma = this.get();
    if (ma) {
      return this._toArray(ma);
    }
  }

  getAsObject() {
    const ma = this.get();
    if (ma) {
      return this._toObject(ma);
    }
  }

  allAsObjectArray(trim = false) {
    if (this._result) {
      return this._toObjectArray(this._result, trim);
    }
  }

  allAsFlatArray(trim = false) {
    if (this._result) {
      return this._result.flatMap((r) => this._toArray(r, trim));
    }
  }

  allAsArrays(trim = false) {
    if (this._result) {
      return this._result.map((r) => this._toArray(r, trim));
    }
  }

  next() {
    return this._result[++this.current];
  }

  nextAsObject() {
    const ma = this.next();
    if (ma) {
      return this._toObject(ma);
    }
  }

  nextAsArray() {
    const ma = this.next();
    if (ma) {
      return this._toArray(ma);
    }
  }
}

export abstract class Matcher {
  public readonly options: MatcherOptions;
  public minTimes: number;
  public maxTimes: number;
  constructor(options: MatcherOptions = {}) {
    this.options = {
      skipEmptyLines: true,
      ...options,
    };
    this.setMin(this.options.minTimes ?? 1);
    this.setMax(this.options.maxTimes ?? 1);
  }

  setMin(min: number) {
    this.minTimes = min < 0 ? 0 : min;
  }

  setMax(max: number) {
    this.maxTimes = max < 0 ? Number.MAX_SAFE_INTEGER : max;
  }

  abstract doMatch(file: FileLines): RegExpMatchArray[] | undefined;

  match(file: FileLines): MatchResult {
    const mr = new MatchResult();
    for (let i = this.minTimes; i <= this.maxTimes; ++i) {
      const m = this.doMatch(file);
      if (m?.length) {
        mr.push(m);
      } else {
        break;
      }
    }
    return mr;
  }

  skipEmptyLines(file: FileLines) {
    if (this.options.skipEmptyLines) {
      file.skipEmptyLines();
    }
  }
}

export class MatchStrings extends Matcher {
  protected strings: string[];
  protected matchSequence: boolean;
  constructor(
    strings: string[],
    matchSequence?: boolean,
    options?: MatcherOptions,
  ) {
    super(options);
    this.strings = strings.map((s) => normalizeWhitespace(s));
    this.matchSequence = !!matchSequence;
  }

  doMatch(file: FileLines): RegExpMatchArray[] | undefined {
    const matches: RegExpMatchArray[] = [];
    let workingFile = file.clone();
    for (const r of this.strings) {
      this.skipEmptyLines(workingFile);
      if (workingFile.end()) break;
      const line = normalizeWhitespace(workingFile.peekNext());
      const m = this.options.forceFullLineMatches
        ? line === r
        : line.includes(r);
      if (m) {
        workingFile.move();
        matches.push([line]);
        if (!this.matchSequence) {
          file.catchUpWithClone(workingFile);
          return matches;
        }
      } else {
        if (this.matchSequence) {
          return;
        }
      }
    }
    file.catchUpWithClone(workingFile);
    return matches;
  }
}

export class MatchStringsAny extends MatchStrings {
  constructor(strings: string[], options?: MatcherOptions) {
    super(strings, false, options);
  }
}

export class MatchStringsSequence extends MatchStrings {
  constructor(strings: string[], options?: MatcherOptions) {
    super(strings, true, options);
  }
}

export abstract class RegExMatcher extends Matcher {
  protected regExes: RegExp[];
  constructor(regExes: RegExp[], options?: MatcherOptions) {
    super(options);
    this.regExes = this.options.forceFullLineMatches
      ? regExes.map((r) => asFullLineRe(r))
      : regExes;
  }
}

export class MatchRegExAny extends RegExMatcher {
  doMatch(file: FileLines): RegExpMatchArray[] | undefined {
    const matches = [];
    for (const r of this.regExes) {
      this.skipEmptyLines(file);
      if (file.end()) break;
      const m = file.peekNext().match(r);
      if (m) {
        file.move();
        return [m];
      }
    }
  }
}

export class MatchRegExSequence extends RegExMatcher {
  doMatch(file: FileLines): RegExpMatchArray[] | undefined {
    const matches: RegExpMatchArray[] = [];
    let workingFile = file.clone();
    for (const r of this.regExes) {
      this.skipEmptyLines(workingFile);
      if (workingFile.end()) break;
      const m = workingFile.peekNext().match(r);
      if (m) {
        workingFile.move();
        matches.push(m);
      } else {
        return;
      }
    }
    file.catchUpWithClone(workingFile);
    return matches;
  }
}

export class MatchersList extends Matcher {
  protected matchers: Matcher[];
  protected matchSequence: boolean;
  constructor(
    matchers: Matcher[],
    matchSequence?: boolean,
    options?: MatcherOptions,
  ) {
    super(options);
    this.matchers = matchers;
    this.matchSequence = !!matchSequence;
  }

  doMatch(file: FileLines): RegExpMatchArray[] | undefined {
    const matches: RegExpMatchArray[] = [];
    let workingFile = file.clone();
    for (const r of this.matchers) {
      if (workingFile.end()) break;
      const m = r.match(workingFile);
      if (m.ok()) {
        matches.push(...m.getRawResults());
        if (!this.matchSequence) {
          file.catchUpWithClone(workingFile);
          return matches;
        }
      } else {
        if (this.matchSequence) {
          return;
        }
      }
    }
    file.catchUpWithClone(workingFile);
    return matches;
  }
}

export class MatchersListAny extends MatchersList {
  constructor(matchers: Matcher[], options?: MatcherOptions) {
    super(matchers, false, options);
  }
}

export class MatchersListSequence extends MatchersList {
  constructor(matchers: Matcher[], options?: MatcherOptions) {
    super(matchers, true, options);
  }
}
