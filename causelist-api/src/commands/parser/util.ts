import { FileLines } from './file-lines.js';

const WS_RE = /^[\.…\s]*$/;
export function isWhiteSpaceEquivalent(s: string): boolean {
  return WS_RE.test(s);
}

export function peekForRe(file: FileLines, re: RegExp, lines: number = 10) {
  const f = file.clone();
  if (!f.skipEmptyLines()) {
    return false;
  }
  while (lines--) {
    if (f.getNext()?.match(re)) {
      return true;
    }
  }
  return false;
}

export function peekForWord(file: FileLines, word: string, lines: number = 10) {
  return peekForRe(file, new RegExp(`\\b${word}\\b`, 'i'), lines);
}

export function peekForPhrase(
  file: FileLines,
  phrase: string | RegExp,
  lines: number = 10,
) {
  return peekForRe(file, phraseToRegex(phrase), lines);
}

export function normalizeWhitespace(str: string) {
  return str.replaceAll(/\s{2,}/g, ' ');
}

export function escapeForRegex(s: string): string {
  return s.replace(/[-[\]{}()*+?.,\\^$|#]/g, '\\$&');
}

export function trimObjectValues(o: { [key: string]: string }) {
  return Object.fromEntries(
    Object.entries(o)
      .filter(([k, v]) => v !== undefined)
      .map(([k, v]) => [k, v ? v.trim() : v]),
  );
}

export function phraseToRegex(phrase: string | RegExp): RegExp {
  if (phrase instanceof RegExp) {
    return phrase;
  }
  let reS = phrase.split(/\s+/).join('\\s+');
  if (!phrase.match(/[^a-zA-Z0-9\s]/)) {
    reS = `\\b${reS}\\b`;
  }
  return new RegExp(reS, 'i');
}

export function phrasesToRegex(phrases: (string | RegExp)[]) {
  return phrases.map(phraseToRegex);
}

export function phrasesToRegexOrdered(phrases: string[]) {
  const phrasesAsList = phrases.map((p) => p.split(/\s+/));
  phrasesAsList.sort((a, b) => {
    if (a.length < b.length) {
      if (a.some((e) => b.includes(e))) {
        return -1;
      }
    }
    if (b.length < a.length) {
      if (b.some((e) => a.includes(e))) {
        return 1;
      }
    }
    return 0;
  });

  return phrases.map((phrase) => {
    let reS = phrase.split(/\s+/).join('\\s+');
    if (!phrase.match(/[^a-zA-Z0-9\s]/)) {
      reS = `\\b${reS}\\b`;
    }
    return new RegExp(reS, 'i');
  });
}
