// For more information, see https://crawlee.dev/
import {
  CheerioCrawler,
  ProxyConfiguration,
  RequestOptions,
  log,
  LogLevel,
} from "crawlee";
import { CookieJar } from "tough-cookie";

import { ReqUserData, getCaseUrl, router, caseStore } from "./routes-cases.js";
import { DOWNLOAD_MIME_TYPES } from "./file-types.js";
import { url } from "inspector";

// This functionality is optional!
// log.setLevel(LogLevel.DEBUG);

const getStartRequest = async () => {
  let startId = process.env.CRAWL_START_ID;
  if (!startId) {
    const lastDownloadedCaseId = await caseStore.lastCaseId();
    console.log(lastDownloadedCaseId);
    startId = (lastDownloadedCaseId + 1).toString();
  }
  log.info(`>>> Starting download at case ${startId}`);
  return [
    {
      url: getCaseUrl(startId),
      label: "case",
      userData: {
        id: startId,
      },
    } as RequestOptions<ReqUserData>,
  ];
};

const proxyConfiguration = process.env.PROXY_URL
  ? new ProxyConfiguration({
      proxyUrls: [process.env.PROXY_URL],
    })
  : undefined;
const crawler = new CheerioCrawler({
  proxyConfiguration,
  requestHandler: router,
  maxConcurrency: 5,
  navigationTimeoutSecs: 240,
  additionalMimeTypes: Array.from(DOWNLOAD_MIME_TYPES),
  useSessionPool: true,
  persistCookiesPerSession: true,
  sessionPoolOptions: {
    sessionOptions: {
      cookieJar: new CookieJar(),
    },
  },
  // Comment this option to scrape the full website.
  //maxRequestsPerCrawl: 5,
});

await crawler.run(await getStartRequest());
