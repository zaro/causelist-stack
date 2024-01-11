import type { Metadata } from "next";

export const themeColor = "#fff";
export const title = "Causelist Kenya";
export const shortName = "Causelist";
export const description = "Access Kenya Causelists";

const metadata: Metadata = {
  title,
  description,
  manifest: "/manifest.webmanifest",
  applicationName: title,
  appleWebApp: true,
  formatDetection: {},
};

export default metadata;
