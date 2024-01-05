// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://c133c3c44c977267e406f0ddd22cd93c@o4506511401484288.ingest.sentry.io/4506511411052544",

  environment: process.env.NEXT_PUBLIC_ENVIRONMENT ?? "development",

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  enabled: process.env.DISABLE_SENTRY ? false : true,
});
