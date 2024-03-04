import assert, { match } from 'assert';
import { ExtractedField, ExtractedFieldsContainer } from './extracted-field.js';
import { FileLines } from './file-lines.js';
import { peekForPhrase } from './util.js';
import { MatchResult, Matcher } from './multi-line-matcher.js';

interface ExtractFieldDebug {
  score: number;
  start?: number;
  end?: number;
  value?: string;
}

interface ParserDebug {}

interface MatchScoreTree
  extends Record<
    string,
    | ExtractFieldDebug
    | MatchScoreTree
    | MatchScoreTree[]
    | Record<number, string>
  > {
  skippedLines: Record<number, string>;
}

export class ParserException extends Error {
  constructor(
    msg: string,
    public readonly line: number,
    public readonly data: any,
  ) {
    super(msg);
  }
}

export class FailedToSelectParserException extends ParserException {
  constructor(
    public readonly line: number,
    public readonly data: any,
    public readonly parsers: ParserInterface[],
  ) {
    super('Failed to select parser', line, data);
  }
}

export abstract class ParserInterface extends ExtractedFieldsContainer {
  constructor(
    public readonly file: FileLines,
    public readonly parent?: ParserInterface,
  ) {
    super();
  }

  abstract matchScore(): number;
  abstract dumpDebugTree(): MatchScoreTree | MatchScoreTree[];
  abstract minValidScore(): number;
  goodEnough() {
    return this.matchScore() >= this.minValidScore();
  }
  abstract populateFieldsFrom(o: ExtractedFieldsContainer);
  abstract allFieldsValid(ignoreOptional: boolean): boolean;
  abstract allValid(ignoreOptional: boolean): boolean;
  abstract tryParse(): void;
  abstract getParsed(): any;
}

export abstract class ParserBase extends ParserInterface {
  protected skippedLines: Record<number, string> = {};
  abstract tryParse(): void;
  abstract getParsed(): any;

  populateFieldsFrom(o: ExtractedFieldsContainer) {
    for (const f of this.getSubParsers()) {
      if (f in o) {
        (this[f] as ParserInterface).populateFieldsFrom(o[f]);
      }
    }
    const v = o.getExtractedFieldsAsMap();
    for (const f of this.getExtractedFields()) {
      if (f in v) {
        (this[f] as ExtractedField<any>).cloneValueFrom(v[f]);
      }
    }
  }

  matchScore() {
    let score = this.getSubParsers().reduce((acc, f) => {
      return acc + this[f].matchScore();
    }, 0);
    for (const p of this.getExtractedFields()) {
      score += this[p].valid() ? this[p].score : 0;
    }
    return score;
  }

  dumpDebugTree(): MatchScoreTree {
    const result: MatchScoreTree = {
      skippedLines: this.skippedLines,
    };

    for (const f of this.getSubParsers()) {
      result[f] = this[f].dumpDebugTree();
    }

    for (const p of this.getExtractedFields()) {
      const o: ExtractFieldDebug = this[p].valid()
        ? {
            score: this[p].score,
            start: this[p].matchStartLine,
            end: this[p].matchEndLine,
            value: this[p].get(),
          }
        : {
            score: 0,
          };
      result[p] = o;
    }
    return result;
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
          this.skippedLines[this.file.getCurrentLine()] = 'phrase';
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
          const saved = this.file.clone();
          mr = matcher.match(this.file);
          if (!mr.ok()) {
            break;
          }
          this.skippedLines[saved.getCurrentLine()] = 'withMatch';
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
        for (
          let i = this.file.getCurrentLine();
          i < workFile.getCurrentLine();
          ++i
        ) {
          this.skippedLines[i] = 'untilMatch';
        }
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

export interface AppendParserOpts {
  clonedFile?: boolean;
}

export class ParserArray<
    T extends ParserInterface,
    P extends ParserInterface = ParserInterface,
  >
  extends Array<T>
  implements ParserInterface
{
  protected _populateFieldsFrom: ExtractedFieldsContainer;

  constructor(
    public readonly file: FileLines,
    protected readonly parserClass: ParserConstructor<T, P>,
    public readonly parent?: ParserInterface,
  ) {
    super();
  }

  newParser(opts?: AppendParserOpts): T {
    const file = opts?.clonedFile ? this.file.clone() : this.file;
    const parser = new this.parserClass(file, this.parent as P);
    if (this._populateFieldsFrom) {
      parser.populateFieldsFrom(this._populateFieldsFrom);
    }
    return parser;
  }

  appendNewParser(opts?: AppendParserOpts): T {
    const p = this.newParser(opts);
    this.push(p);
    return p;
  }

  getExtractedFields(): string[] {
    throw new Error('[ParserArray]getExtractedFields not implemented.');
  }

  getExtractedFieldsAsMap(): Record<string, ExtractedField<any>> {
    throw new Error('[ParserArray]getExtractedFields not implemented.');
  }

  populateFieldsFrom(o: ExtractedFieldsContainer) {
    this._populateFieldsFrom = o;
  }

  matchScore() {
    return this.reduce((a, e) => a + e.matchScore(), 0);
  }

  dumpDebugTree() {
    return this.map((e) => e.dumpDebugTree()) as MatchScoreTree[];
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

export interface MultiParserOpts {
  requireValidSelection?: boolean;
}
export class MultiParser<ParsedT> extends ParserInterface {
  protected _populateFieldsFrom: ExtractedFieldsContainer;
  protected parsed: ParserInterface[] = [];
  selected: ParserInterface;
  protected requireValidSelection: boolean;
  constructor(
    file: FileLines,
    protected parserClasses: ParserConstructor<ParserInterface>[],
    opts?: MultiParserOpts,
  ) {
    super(file);
    assert(parserClasses.length > 0);
    this.requireValidSelection = !!opts?.requireValidSelection;
  }

  matchScore(): number {
    return this.selected?.matchScore() ?? 0;
  }

  dumpDebugTree(): MatchScoreTree {
    const result: MatchScoreTree = {
      skippedLines: undefined,
    };
    for (const p of this.parsed) {
      const s = p === this.selected ? '>' : '#';
      result[`${s}${p.constructor.name}`] = p.dumpDebugTree();
    }
    return result;
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
    this.parsed = [];
    for (const klass of this.parserClasses) {
      const c = new klass(this.file.clone());
      if (this._populateFieldsFrom) {
        c.populateFieldsFrom(this._populateFieldsFrom);
      }
      c.tryParse();
      this.parsed.push(c);
    }
    let best = this.parsed.slice();
    if (this.requireValidSelection) {
      best = best.filter((p) => p.goodEnough());
    }
    best.sort((a, b) => b.matchScore() - a.matchScore());
    // console.log(parsed.map((p) => [p.constructor.name, p.matchScore()]));
    // console.dir(
    //   parsed.map((p) => [p.constructor.name, p.getParsed()]),
    //   { depth: null },
    // );
    if (best.length <= 0) {
      throw new FailedToSelectParserException(
        this.file.getCurrentLine(),
        this.dumpDebugTree(),
        this.parsed,
      );
    }
    this.selected = best[0];
    this.file.catchUpWithClone(this.selected.file);
  }

  getParsed(): ParsedT {
    return this.selected?.getParsed();
  }

  populateFieldsFrom(o: ExtractedFieldsContainer) {
    this._populateFieldsFrom = o;
  }
}

export class NullParser extends ParserBase {
  tryParse(): void {}
  getParsed() {
    return null;
  }
}
