import { AppRouterCacheProvider } from "@mui/material-nextjs/v14-appRouter";
import type { Metadata } from "next";
import ThemeRegistry from "./_components/ThemeRegistry/ThemeRegistry";
import { Suspense } from "react";
import { WebVitals } from "./_components/web-vitals";
import "./index.css";

import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import App from "./app.tsx";
import { PHProvider, PostHogPageview } from "../providers";
import sharedMetadata from "../_common/metadata.ts";

export const metadata: Metadata = sharedMetadata;

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
          {/* <WebVitals /> */}
          <ThemeRegistry>
            <AppRouterCacheProvider>
              <App>{children}</App>
            </AppRouterCacheProvider>
          </ThemeRegistry>
        </body>
      </PHProvider>
    </html>
  );
}
