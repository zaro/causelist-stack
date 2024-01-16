import * as nunjucks from 'nunjucks';
import { format } from 'date-fns';

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

export function moduleRelativePath(
  moduleMeta: ImportMeta,
  paths: string | string[],
) {
  const __dirname = dirname(fileURLToPath(moduleMeta.url));
  if (Array.isArray(paths)) {
    return paths.map((p) => join(__dirname, p));
  }
  return join(__dirname, paths);
}

export function makeNunjucksEnv(paths: string | string[]) {
  const env = new nunjucks.Environment(new nunjucks.FileSystemLoader(paths));

  env.addFilter('date', function (date: string | Date, formatSpecifier) {
    if (typeof date === 'string') {
      date = new Date(date);
    }
    return format(date, formatSpecifier ?? 'yyyy-MM-dd');
  });

  env.addFilter('dateTime', function (date: string | Date, formatSpecifier) {
    if (typeof date === 'string') {
      date = new Date(date);
    }
    return format(date, formatSpecifier ?? 'yyyy-MM-dd HH:mm');
  });

  return env;
}
