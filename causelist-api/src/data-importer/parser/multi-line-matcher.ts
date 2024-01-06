import { FileLines } from './file-lines.js';

export interface MatcherOptions {
  skipEmptyLines?: boolean;
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

  _toObject(ma: RegExpMatchArray[]) {
    let o = {};
    for (const m of ma) {
      o = {
        ...o,
        ...m.groups,
      };
    }
    return o;
  }
  _toArray(ma: RegExpMatchArray[]) {
    return ma.map((m) => m[0]);
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
  constructor(
    protected minTimes: number = 1,
    protected maxTimes: number = 1,
    options: MatcherOptions = {},
  ) {
    this.options = {
      skipEmptyLines: true,
      ...options,
    };
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

export class MatchAny extends Matcher {
  constructor(
    protected regExes: RegExp[],
    minTimes: number = 1,
    maxTimes: number = 1,
    options?: MatcherOptions,
  ) {
    super(minTimes, maxTimes, options);
  }

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

export class MatchSequence extends Matcher {
  constructor(
    protected regExes: RegExp[],
    minTimes: number = 1,
    maxTimes: number = 1,
    options?: MatcherOptions,
  ) {
    super(minTimes, maxTimes, options);
  }

  doMatch(file: FileLines): RegExpMatchArray[] {
    const matches: RegExpMatchArray[] = [];
    for (const r of this.regExes) {
      this.skipEmptyLines(file);
      if (file.end()) break;
      const m = file.peekNext().match(r);
      if (m) {
        file.move();
        matches.push(m);
      } else {
        break;
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
