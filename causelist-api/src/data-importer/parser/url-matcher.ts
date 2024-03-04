import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  MatchRegExAny,
  MatchRegExSequence,
  MatchResult,
  MatchStringsSequence,
  Matcher,
  MatchersListAny,
  MatchersListSequence,
} from './multi-line-matcher.js';
import { FileLines } from './file-lines.js';

export const URL_RE = [
  /(https?:\/\/)[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/i,
  /(?:shorturl.at|bit.ly|cutt.ly|t.ly)\/\w+/i,
];

export class UrlMatcher extends MatchersListAny {
  constructor() {
    super([
      new MatchersListSequence([
        new MatchRegExAny([/^https:\/\/teams.microsoft.com\S+/]),
        new MatchRegExAny([/.*[?\/%"}{].*/], { maxTimes: 4 }),
      ]),
      new MatchRegExAny(URL_RE),
    ]);
  }
  match(file: FileLines): MatchResult {
    const mr = super.match(file);
    if (mr.ok()) {
      return new MatchResult([[mr.getAsArray().join('')]]);
    }
    return mr;
  }
}

export function getURLMatcher() {
  return new UrlMatcher();
}
