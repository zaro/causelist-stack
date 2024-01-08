import { MetadataRoute } from "next";
import {
  themeColor,
  title,
  shortName,
  description,
} from "../_common/metadata.ts";

export const dynamic = "force-dynamic";

const env = process.env.NEXT_PUBLIC_ENVIRONMENT ?? "dev";
const envTitle = env !== "production" ? `[${env.toUpperCase()}] ` : "";

function manifest(): MetadataRoute.Manifest {
  return {
    name: envTitle + title,
    short_name: envTitle + shortName,
    description,
    start_url: "/home?pwa=1",
    display: "standalone",
    background_color: themeColor,
    theme_color: themeColor,
    icons: [
      {
        src: "/icon-192.png",
        type: "image/png",
        sizes: "192x192",
      },
      {
        src: "/icon-512.png",
        type: "image/png",
        sizes: "512x512",
      },
    ],
    screenshots: [
      {
        src: "screenshot1.png",
        sizes: "1280x800",
        type: "image/png",
      },
    ],
  };
}

const data = manifest();
export async function GET(request: Request) {
  return Response.json(data);
}
