import type { Metadata, Viewport } from "next";

import "./app.css";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import ProvideTheme from "./provide-theme.tsx";
import sharedMetadata from "../_common/metadata.ts";

export const metadata: Metadata = sharedMetadata;

export const viewport: Viewport = {
  //viewport: "initial-scale=1, width=device-width",
  initialScale: 1,
  width: "device-width",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ProvideTheme>{children}</ProvideTheme>
      </body>
    </html>
  );
}
