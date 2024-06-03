import * as path from "node:path";
import * as mime from "mime-types";

import { createCheerioRouter, Dataset } from "crawlee";
import { CasesStore } from "./cases-store.js";
import { CaseMetadata } from "./interfaces/crawler.js";

const MAX_MISSING_TO_STOP = 100;
const baseUrl = "https://kenyalaw.org/caselaw/";
export const caseStore = new CasesStore("cases/files/", "cases/logs/");
export const router = createCheerioRouter();

export function getCaseUrl(id: string | number) {
  return `http://kenyalaw.org/caselaw/cases/view/${id}/`;
}

export interface ReqUserData {
  id: string;
  description: CaseMetadata;
  missingSequenceCount?: number;
}

router.addDefaultHandler<ReqUserData>(async ({ log, request }) => {
  log.error(`default: ${request.method} ${request.url}`);
});

router.addHandler<ReqUserData>(
  "case",
  async ({ request, response, $, log, enqueueLinks }) => {
    const { id, missingSequenceCount = 0 } = request.userData;

    const enqueueNext = (id: string, notFound: boolean = false) => {
      const nextId = parseInt(id, 10) + 1;
      return enqueueLinks({
        urls: [getCaseUrl(nextId)],
        label: "case",
        userData: {
          id: nextId,
          missingSequenceCount: notFound ? missingSequenceCount + 1 : 0,
        },
        baseUrl,
      });
    };

    if (response.url === "http://kenyalaw.org/caselaw/") {
      if (missingSequenceCount >= MAX_MISSING_TO_STOP) {
        // If we reached max Missing, consider end of scrape
        return;
      }
      // Case is missing, we were redirected to the search form
      log.warning(`Failed to find case ${id}`);
      await enqueueNext(id, true);
      return;
    }

    const exists = await caseStore.hasCaseRecord(id);
    if (exists) {
      log.warning(`Case ${id} already processed`);
      await enqueueNext(id);
      return;
    }

    const title = $("title").text();
    log.info(`${title}`, { url: request.loadedUrl });

    const flatMetadata: string[] = $("#case_meta tr td:not([colspan]),th")
      .toArray()
      .map((e) => $(e).text().replace(/:\s*/, ""));
    const metadata: Record<string, string> = {};
    for (let i = 0; i <= flatMetadata.length; i += 2) {
      metadata[flatMetadata[i]] = flatMetadata[i + 1];
    }

    const description: CaseMetadata = {
      title,
      url: request.url,
      caseId: path.basename(request.url),
      metadata,
    };

    const pdfLinkText = $("a.Pdf:first-child").text();
    const pdfLinksAttrs = $("a.Pdf:first-child").attr();
    let contentUrl;
    if (!pdfLinksAttrs.href.startsWith("javascript")) {
      contentUrl = pdfLinksAttrs.href;
    } else {
      if (pdfLinkText.includes("Original Source")) {
        contentUrl =
          "https://kenyalaw.org/caselaw/caselawreport/index_original.php?id=" +
          description.caseId;
        description.hasOriginal = true;
      } else {
        contentUrl =
          "https://kenyalaw.org/caselaw/caselawreport/?id=" +
          description.caseId;
        description.hasPdf = true;
      }
    }

    await enqueueLinks({
      urls: [contentUrl],
      label: "content",
      userData: {
        description,
      },
      baseUrl,
    });

    await enqueueNext(description.caseId);
  }
);

router.addHandler<ReqUserData>(
  "content",
  async ({ request, log, contentType, body }) => {
    const { description } = request.userData;
    const dataset = await Dataset.open("files");
    const url = request.url;

    let recordKey = description.caseId;
    try {
      log.info(
        `Saving ${url} as key ${recordKey} with contentType=${contentType.type}`
      );
      await caseStore.putFileContent(
        description,
        description.hasPdf ? "pdf" : "original",
        body,
        contentType.type
      );
      await caseStore.putCaseRecord(description);
    } catch (e) {
      log.error(`Failed to save ${url} as ${recordKey}`, {
        error: e,
        parent,
        contentType: contentType.type,
      });
    }
  }
);
