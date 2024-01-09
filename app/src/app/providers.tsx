// app/providers.tsx
"use client";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { environment } from "@/utils/client-environment.ts";

if (typeof window !== "undefined") {
  const phKey =
    environment !== "development"
      ? (process.env.NEXT_PUBLIC_POSTHOG_KEY as string)
      : "xxx";
  posthog.init(phKey, {
    capture_pageview: false, // Disable automatic pageview capture, as we capture manually
    // Capture only in production
    ...(environment !== "production"
      ? {
          autocapture: false,
          loaded: function (ph) {
            ph.opt_out_capturing();
          },
        }
      : {
          api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
        }),
  });
  if (environment !== "production") {
    posthog.opt_out_capturing();
  }
}

export function PostHogPageview(): JSX.Element {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname) {
      let url = window.origin + pathname;
      if (searchParams && searchParams.toString()) {
        url = url + `?${searchParams.toString()}`;
      }
      posthog.capture("$pageview", {
        $current_url: url,
      });
    }
  }, [pathname, searchParams]);

  return <></>;
}

export function PHProvider({ children }: { children: React.ReactNode }) {
  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
