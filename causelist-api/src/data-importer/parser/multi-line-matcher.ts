import { FileLines } from './file-lines.js';
import { asFullLineRe, trimObjectValues } from './util.js';

export interface MatcherOptions {
  minTimes?: number;
  maxTimes?: number;
  skipEmptyLines?: boolean;
  forceFullLineMatches?: boolean;
}

export class MatchResult {
  _result: RegExpMatchArray[][];
  protected current: number;
  constructor(match?: RegExpMatchArray[]) {
    this._result = match && match.length ? [match] : [];
    this.current = -1;
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
  protected _toArray(ma: RegExpMatchArray[]) {
    return ma.map((m) => m[0]);
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
    this.minTimes = this.options.minTimes ?? 1;
    this.maxTimes = this.options.maxTimes ?? 1;
  }

  setMin(min: number) {
    this.minTimes = min;
  }

  setMax(max: number) {
    this.maxTimes - max;
  }

  abstract match(file: FileLines): MatchResult;

  skipEmptyLines(file: FileLines) {
    if (this.options.skipEmptyLines) {
      file.skipEmptyLines();
    }
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

export class MatchAny extends RegExMatcher {
  doMatch(file: FileLines): RegExpMatchArray {
    const matches = [];
    for (const r of this.regExes) {
      this.skipEmptyLines(file);
      if (file.end()) break;
      const m = file.peekNext().match(r);
      if (m) {
        file.move();
        return m;
      }
    }
  }

  match(file: FileLines): MatchResult {
    const matches: RegExpMatchArray[] = [];

    for (let i = this.minTimes; i <= this.maxTimes; ++i) {
      const m = this.doMatch(file);
      if (m) {
        matches.push(m);
      } else {
        break;
      }
    }
    return new MatchResult(matches);
  }
}

export class MatchSequence extends RegExMatcher {
  doMatch(file: FileLines): RegExpMatchArray[] | undefined {
    const matches: RegExpMatchArray[] = [];
    for (const r of this.regExes) {
      this.skipEmptyLines(file);
      if (file.end()) break;
      const m = file.peekNext().match(r);
      if (m) {
        file.move();
        matches.push(m);
      } else {
        return;
      }
    }
    return matches;
  }

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
}
