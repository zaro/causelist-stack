import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  MatchStringsSequence,
  Matcher,
  MatchersListAny,
} from './multi-line-matcher.js';

const configPaths = [
  'src/data-importer/parser/config/',
  'dist/data-importer/parser/config/',
];

let courtNamesMatcher: Matcher;

function makeCourtNameMatcher() {
  let courtNamesArray: string[][];
  for (const cfgPath of configPaths) {
    const f = path.join(cfgPath, 'courtNames.json');
    if (fs.existsSync(f)) {
      courtNamesArray = JSON.parse(fs.readFileSync(f).toString());
    }
  }

  courtNamesMatcher = new MatchersListAny(
    courtNamesArray.map((c) => new MatchStringsSequence(c)),
    {
      forceFullLineMatches: true,
    },
  );

  return courtNamesMatcher;
}

export function getCourtNameMatcher() {
  if (!courtNamesMatcher) {
    makeCourtNameMatcher();
  }
  return courtNamesMatcher;
}
