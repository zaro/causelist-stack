export function getDateOnlyISOFromDate(d: Date) {
  return d.toISOString().split('T')[0];
}

export function getDateOnlyISOFromParts(
  year: number,
  month: number,
  day: number,
) {
  return `${year}-${month.toString().padStart(2, '0')}-${day
    .toString()
    .padStart(2, '0')}`;
}

export function getMonthOnlyISOFromParts(year: number, month: number) {
  return `${year}-${month.toString().padStart(2, '0')}`;
}
