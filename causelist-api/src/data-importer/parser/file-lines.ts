import { isWhiteSpaceEquivalent, normalizeChars } from './util.js';

export class FileLines {
  protected lines: string[];
  protected current: number;
  protected moved: number;
  constructor(textContentOrLines: string | FileLines) {
    if (typeof textContentOrLines === 'string') {
      this.lines = textContentOrLines
        .split('\n')
        .map((l) => normalizeChars(l.trim()));
      this.current = 0;
    } else {
      this.lines = textContentOrLines.lines;
      this.current = textContentOrLines.current;
    }
    this.moved = 0;
  }

  clone() {
    return new FileLines(this);
  }

  catchUpWithClone(clone: FileLines) {
    this.move(clone.moved);
  }

  end() {
    return this.current >= this.lines.length;
  }

  move(lines: number = 1) {
    this.current += lines;
    this.moved += lines;
    return this;
  }

  numConsumedLines() {
    return this.moved;
  }

  getCurrentLine() {
    return this.current;
  }

  hasAtLeast(n: number = 1) {
    return this.lines.length - this.current >= n;
  }

  skipEmptyLines() {
    let r = this.hasAtLeast(1);
    while (r) {
      const l = this.peekNext();
      let t: string;
      if (l && !isWhiteSpaceEquivalent(l)) {
        break;
      }
      r = this.move().hasAtLeast(1);
    }
    return r;
  }

  peek(maxLines: number = undefined) {
    return this.lines.slice(
      this.current,
      maxLines ? this.current + maxLines : -1,
    );
  }

  peekNext() {
    return this.lines[this.current];
  }

  peekOffset(offset: number = 0) {
    return this.lines[this.current + offset];
  }

  prev() {
    return this.lines[this.current - 1];
  }

  getNext() {
    return this.lines[this.current++];
  }
}
