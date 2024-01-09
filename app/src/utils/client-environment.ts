export const environment =
  process.env.NEXT_PUBLIC_SENTRY_STAGING_DOMAIN === window.location.hostname
    ? "staging"
    : process.env.NEXT_PUBLIC_SENTRY_PRODUCTION_DOMAIN ===
      window.location.hostname
    ? "production"
    : "development";
