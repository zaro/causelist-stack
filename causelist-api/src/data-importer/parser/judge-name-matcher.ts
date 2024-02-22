import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  MatchRegExAny,
  MatchRegExSequence,
  MatchStringsSequence,
  Matcher,
  MatchersListAny,
} from './multi-line-matcher.js';

export function getJudgeNameMatcher() {
  return new MatchersListAny([
    new MatchRegExAny([
      /^BEFORE: (?<judge>.*)/,
      /^(?<judge>DR\..*)/,
      /(?<judge>(?:HON\.?\s+)?.*)\s+(:?\(?(?:SRM|CM|DR|SPM|PM)\)?\s+)?(?<courtRoom>COURT\s+(?:ROOM\s+)?(?:NO\.?\s+)?(?:ONE\s*|TWO\s*|THREE\s*)?\[?\d+\]?)/i,
      /(?<judge>(?:HON\.?\s+)?.*)\s+(?<courtRoom>\d+)/i,
      /(?<judge>(?:(?:BEFORE )?HON\.?\s+)?.*)\s+(?<courtRoom>(?:MAGISTRATE\s+COURT)|(?:COURTROOM))/i,
      /(?<judge>(?:HON\.?\s+)?.*)\s*[,-]?\s*\(?(?:SRM|CM|DR|SPM|PM)\)?/i,
      /(?<judge>(?:HON[\.\:]\s*).*)/i,
      /^(?<judge>(?:[a-z][a-z\.]+\s*)+)\s+(?<courtRoom>COURT\s+\d+)$/i,
    ]),
    new MatchRegExSequence([
      /(?<judge>(?:HON\.|WAMAE)\s+.*)/i,
      /(?<courtRoom>COURTROOM\s+\d+)/i,
    ]),
  ]);
}
