// For more information, see https://crawlee.dev/
import { CheerioCrawler, ProxyConfiguration } from "crawlee";

import { router } from "./routes-causelist.js";
import { DOWNLOAD_MIME_TYPES } from "./file-types.js";

const startUrls = [
  // Start at: Licensed process servers / Process Servers
  "http://kenyalaw.org/kl/index.php?id=10977",
  // "http://kenyalaw.org/kl/index.php?id=8281"
  //  "http://kenyalaw.org/kl/index.php?id=11965",
];

const proxyConfiguration = process.env.PROXY_URL
  ? new ProxyConfiguration({
      proxyUrls: [process.env.PROXY_URL],
    })
  : undefined;
const crawler = new CheerioCrawler({
  proxyConfiguration,
  requestHandler: router,
  maxConcurrency: 50,
  navigationTimeoutSecs: 120,
  additionalMimeTypes: Array.from(DOWNLOAD_MIME_TYPES),
  // Comment this option to scrape the full website.
  //maxRequestsPerCrawl: 5,
});

await crawler.run(startUrls);
