import type { Metadata, Viewport } from "next";
import { Suspense } from "react";

import "./app.css";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import ProvideTheme from "./provide-theme.tsx";
import { PHProvider, PostHogPageview } from "../providers";
import sharedMetadata, { themeColor } from "../_common/metadata.ts";

export const metadata: Metadata = sharedMetadata;

export const viewport: Viewport = {
  initialScale: 1,
  width: "device-width",
  themeColor,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <Suspense>
        <PostHogPageview />
      </Suspense>
      <PHProvider>
        <body>
          <ProvideTheme>{children}</ProvideTheme>
        </body>
      </PHProvider>
    </html>
  );
}
