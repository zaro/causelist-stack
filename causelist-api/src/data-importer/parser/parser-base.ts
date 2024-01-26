import assert, { match } from 'assert';
import { ExtractedField, ExtractedFieldsContainer } from './extracted-field.js';
import { FileLines } from './file-lines.js';
import { peekForPhrase } from './util.js';
import { MatchResult, Matcher } from './multi-line-matcher.js';

export abstract class ParserInterface extends ExtractedFieldsContainer {
  constructor(
    public readonly file: FileLines,
    public readonly parent?: ParserInterface,
  ) {
    super();
  }

  abstract matchScore(): number;
  abstract minValidScore(): number;
  goodEnough() {
    return this.matchScore() >= this.minValidScore();
  }
  abstract allFieldsValid(ignoreOptional: boolean): boolean;
  abstract allValid(ignoreOptional: boolean): boolean;
  abstract tryParse(): void;
  abstract getParsed(): any;
}

export abstract class ParserBase extends ParserInterface {
  abstract tryParse(): void;
  abstract getParsed(): any;

  matchScore() {
    let score = this.getSubParsers().reduce((acc, f) => {
      return acc + this[f].matchScore();
    }, 0);
    for (const p of this.getExtractedFields()) {
      score += this[p].valid() ? this[p].score : 0;
    }
    return score;
  }

  minValidScore() {
    let score = this.getSubParsers().reduce(
      (acc, f) => acc + this[f].minValidScore(),
      0,
    );
    for (const p of this.getExtractedFields()) {
      score += (this[p] as ExtractedField<any>).optional
        ? 0
        : (this[p] as ExtractedField<any>).score;
    }
    return score;
  }

  skipLinesContainingPhrase(phrases: (string | RegExp) | (string | RegExp)[]) {
    if (!Array.isArray(phrases)) {
      phrases = [phrases];
    }
    let skipped;
    do {
      skipped = 0;
      for (const p of phrases) {
        while (peekForPhrase(this.file, p, 1)) {
          this.file.move(1);
          skipped++;
        }
      }
    } while (skipped > 0);
  }

  skipLinesWithMatchers(matchers: Matcher[]) {
    let skipped;
    do {
      skipped = 0;
      for (const matcher of matchers) {
        let mr: MatchResult;
        while (true) {
          mr = matcher.match(this.file);
          if (!mr.ok()) {
            break;
          }
          // console.log('>>>m', matcher);
          // console.log('>>>mi', mr.allAsFlatArray());
          skipped++;
        }
      }
    } while (skipped > 0);
  }

  skipLinesUntilMatch(
    matcher: Matcher,
    opts?: {
      maxLines?: number;
      matchOnEnd?: boolean;
    },
  ) {
    const { maxLines, matchOnEnd } = {
      maxLines: Number.MAX_SAFE_INTEGER,
      matchOnEnd: false,
      ...opts,
    };
    let skipped = 0;
    let workFile = this.file.clone();
    do {
      let mr = matcher.match(workFile.clone());
      if (mr.ok()) {
        this.file.catchUpWithClone(workFile);
        return true;
      }
      workFile.move(1);
      skipped++;
    } while (skipped < maxLines);
    if (matchOnEnd && workFile.end()) {
      this.file.catchUpWithClone(workFile);
      return true;
    }
    return false;
  }

  skipUntilPhrase(phrases: string | string[]) {
    if (!Array.isArray(phrases)) {
      phrases = [phrases];
    }
    let skipped;
    do {
      skipped = 0;
      for (const p of phrases) {
        let file = this.file.clone();
        let found;
        while (!(found = peekForPhrase(file, p, 1)) && !file.end()) {
          file.move(1);
          skipped++;
        }
        if (found) {
          this.file.catchUpWithClone(file);
          break;
        }
      }
    } while (skipped > 0);
  }

  skipUntilLines(lines: string[]): boolean {
    let line = lines[0];
    if (!line) {
      return false;
    }
    let found;
    const fileB = this.file.clone();
    while (!fileB.end() && !(found = fileB.peekNext().trim() === line)) {
      fileB.move(1);
    }
    if (fileB.end()) {
      return false;
    }
    const fileN = fileB.clone();
    for (let i = 1; i < lines.length; i++) {
      fileN.move();
      if (fileN.peekNext().trim() !== lines[i]) {
        return false;
      }
    }
    this.file.catchUpWithClone(fileB);
    return true;
  }

  allFieldsValid(ignoreOptional: boolean = true) {
    return this.getExtractedFields().reduce(
      (r, f) => r && ((ignoreOptional && this[f].optional) || this[f].valid()),
      true,
    );
  }

  allValid(ignoreOptional: boolean = true) {
    const subParserValid = this.getSubParsers().reduce(
      (r, f) => r && this[f].allValid(ignoreOptional),
      true,
    );
    return subParserValid && this.allFieldsValid(ignoreOptional);
  }

  getEmptyFields(): string[] {
    const r = [];
    for (const f of this.getExtractedFields()) {
      if (!this[f].valid()) {
        r.push(f);
      }
    }
    return r;
  }

  getSubParsers(): string[] {
    const l = Object.keys(this).filter(
      (k) =>
        k !== 'parent' &&
        (this[k] instanceof ParserInterface || this[k] instanceof ParserArray),
    );
    return l;
  }

  tryParseUnparsed() {
    let success, emptyFields: string[];
    do {
      success = false;
      emptyFields = this.getEmptyFields();
      for (const f of emptyFields) {
        success ||= this[f].tryParse(this.file);
      }
    } while (success);
    return emptyFields.length === 0;
  }
}

export type ParserConstructor<
  T,
  P extends ParserInterface = ParserInterface,
> = new (file: FileLines, parent?: P) => T;

export class ParserArray<
    T extends ParserInterface,
    P extends ParserInterface = ParserInterface,
  >
  extends Array<T>
  implements ParserInterface
{
  constructor(
    public readonly file: FileLines,
    protected readonly parserClass: ParserConstructor<T, P>,
    public readonly parent?: ParserInterface,
  ) {
    super();
  }

  newParser(): T {
    return new this.parserClass(this.file, this.parent as P);
  }

  appendNewParser(): T {
    const p = new this.parserClass(this.file, this.parent as P);
    this.push(p);
    return p;
  }

  getExtractedFields(): string[] {
    throw new Error('[ParserArray]getExtractedFields not implemented.');
  }

  matchScore() {
    return this.reduce((a, e) => e.matchScore(), 0);
  }

  minValidScore() {
    if (this.length < 1) {
      return Number.MAX_SAFE_INTEGER;
    }
    return this[0].minValidScore();
  }

  goodEnough(): boolean {
    return this.matchScore() >= this.minValidScore();
  }

  allFieldsValid(ignoreOptional: boolean) {
    return this.reduce((r, e) => r && e.allFieldsValid(ignoreOptional), true);
  }

  allValid(ignoreOptional: boolean): boolean {
    return this.reduce((r, e) => r && e.allValid(ignoreOptional), true);
  }

  tryParse(): void {
    for (const p of this) {
      p.tryParse();
    }
  }

  getParsed(): ReturnType<T['getParsed']>[] {
    return Array.from(this).map((e) => e.getParsed());
  }
}

export class MultiParser<ParsedT> extends ParserInterface {
  selected: ParserInterface;
  constructor(
    file: FileLines,
    protected parserClasses: ParserConstructor<ParserInterface>[],
  ) {
    super(file);
    assert(parserClasses.length > 0);
  }

  matchScore(): number {
    return this.selected?.matchScore() ?? 0;
  }

  minValidScore(): number {
    if (!this.selected) {
      return Number.MAX_SAFE_INTEGER;
    }
    return this.selected.minValidScore();
  }

  allFieldsValid(ignoreOptional: boolean): boolean {
    return this.selected?.allFieldsValid(ignoreOptional) ?? false;
  }

  allValid(ignoreOptional: boolean): boolean {
    return this.selected?.allValid(ignoreOptional) ?? false;
  }

  tryParse() {
    const parsed: ParserInterface[] = [];
    for (const klass of this.parserClasses) {
      const c = new klass(this.file.clone());
      c.tryParse();
      parsed.push(c);
      if (c.matchScore() === c.minValidScore()) {
        break;
      }
    }
    parsed.sort((a, b) => b.matchScore() - a.matchScore());
    // console.log(parsed.map((p) => [p.constructor.name, p.matchScore()]));
    // console.dir(
    //   parsed.map((p) => [p.constructor.name, p.getParsed()]),
    //   { depth: null },
    // );
    assert(parsed.length > 0);
    this.selected = parsed[0];
    this.file.catchUpWithClone(this.selected.file);
  }

  getParsed(): ParsedT {
    return this.selected?.getParsed();
  }
}
