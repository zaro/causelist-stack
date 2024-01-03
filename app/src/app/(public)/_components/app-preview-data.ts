import { RandomCourtData } from "../../../api/ssr.ts";

export const APP_PREVIEW_PATH = "/api/courts/random";

export async function getAppPreviewData(
  input: Parameters<typeof fetch>[0],
  init?: Parameters<typeof fetch>[1]
): Promise<RandomCourtData> {
  const res = await fetch(input, init);
  // The return value is *not* serialized
  // You can return Date, Map, Set, etc.

  if (!res.ok) {
    // This will activate the closest `error.js` Error Boundary
    throw new Error(`Failed to fetch data: ${res.status}`);
  }

  return res.json();
}
