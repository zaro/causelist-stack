// For more information, see https://crawlee.dev/
import { CheerioCrawler, ProxyConfiguration } from "crawlee";

import { router } from "./routes.js";
import { DOWNLOAD_MIME_TYPES } from "./file-types.js";

const startUrls = [
  "http://kenyalaw.org/kl/index.php?id=11965",
  // "http://kenyalaw.org/kl/index.php?id=8281"
];

const crawler = new CheerioCrawler({
  proxyConfiguration: new ProxyConfiguration({
    proxyUrls: ["http://127.0.0.1:3128"],
  }),
  requestHandler: router,
  maxConcurrency: 50,
  navigationTimeoutSecs: 120,
  additionalMimeTypes: Array.from(DOWNLOAD_MIME_TYPES),
  // Comment this option to scrape the full website.
  //maxRequestsPerCrawl: 5,
});

await crawler.run(startUrls);
