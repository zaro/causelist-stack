import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  MatchRegExAny,
  MatchRegExSequence,
  MatchStringsSequence,
  Matcher,
  MatchersListAny,
} from './multi-line-matcher.js';

export const JUDGE_RE = [
  /^BEFORE: (?<judge>.*)/,
  /^(?<judge>DR\..*)/,
  /(?<judge>(?:HON\.?\s+)?.*)\s+(:?\(?(?:SRM|CM|DR|SPM|PM|RM)\)?\s+)?(?<courtRoom>COURT\s+(?:ROOM\s+)?(?:NO\.?\s+)?(?:ONE\s*|TWO\s*|THREE\s*)?\[?\d+\]?)/i,
  /(?<judge>(?:HON\.?\s+)?.*)\s+(?<courtRoom>\d+)/i,
  /(?<judge>(?:(?:BEFORE )?HON\.?\s+)?.*)\s+(?<courtRoom>(?:MAGISTRATE\s+COURT)|(?:COURTROOM))/i,
  /(?<judge>(?:HON\.?\s+)?.*)\s*[,-]?\s*\(?(?:SRM|CM|DR|SPM|PM)\)?/i,
  /(?<judge>(?:HON[\.\:]\s*).*)/i,
  /(?<judge>(?:HON\.?\s+JUSTICE\s+).*)/i,
  /^(?<judge>(?:[a-z][a-z\.]+)\s+(?:[a-z][a-z\.]+\s*){1,3})\s+(?<courtRoom>COURT\s+\d+)$/i,
  /(?<judge>.*(?:MEOLI|MAJANJA|MULWA|ONGERI|ONGERI|NYAGAH)\s+J)\b/i,
];

export function getJudgeNameMatcher() {
  return new MatchersListAny([
    new MatchRegExSequence([
      /(?<judge>(?:HON\.?|WAMAE)\s+.*)/i,
      /(?<courtRoom>(?:COURTROOM|CHAMBER)\s+\d+\s*.*)/i,
    ]),
    new MatchRegExAny(JUDGE_RE),
  ]);
}
