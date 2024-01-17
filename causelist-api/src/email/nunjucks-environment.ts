import * as nunjucks from 'nunjucks';
import { format, utcToZonedTime } from 'date-fns-tz';
import enIN from 'date-fns/locale/en-IN/index.js';

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

export const timeZone = 'Africa/Nairobi';
export const timeZoneCode = 'EAT';
const locale = enIN;

export function makeNunjucksEnv(paths: string | string[]) {
  const development = process.env.NEXT_PUBLIC_ENVIRONMENT === 'development';
  const env = new nunjucks.Environment(
    new nunjucks.FileSystemLoader(paths, { noCache: development }),
  );

  env.addFilter('date', function (date: string | Date, formatSpecifier) {
    const zonedDate = utcToZonedTime(date, timeZone);
    return format(zonedDate, formatSpecifier ?? 'P', {
      timeZone,
      locale,
    });
  });

  env.addFilter('dateTime', function (date: string | Date, formatSpecifier) {
    const zonedDate = utcToZonedTime(date, timeZone);
    return format(zonedDate, formatSpecifier ?? `P p '(${timeZoneCode})'`, {
      timeZone,
      locale,
    });
  });

  return env;
}
