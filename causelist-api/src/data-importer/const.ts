export const CRAWLER_BUCKET_MENU_ENTRIES_PREFIX = 'menu-entries/';
export const CRAWLER_BUCKET_FILES_PREFIX = 'files/';

export function menuEntryKey(key: string) {
  return CRAWLER_BUCKET_MENU_ENTRIES_PREFIX + key;
}

export function fileKey(key: string) {
  return CRAWLER_BUCKET_FILES_PREFIX + key;
}
