import { MetadataRoute } from "next";

const env = process.env.NEXT_PUBLIC_ENVIRONMENT ?? "dev";
const envTitle = env !== "production" ? `[${env.toUpperCase()}] ` : "";

function manifest(): MetadataRoute.Manifest {
  return {
    name: envTitle + "Causelist App",
    short_name: envTitle + "Causelist",
    description: "Kenya Causelists made easy",
    start_url: "/home?pwa=1",
    display: "standalone",
    background_color: "#fff",
    theme_color: "#fff",
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
  };
}

const data = manifest();
export async function GET(request: Request) {
  return Response.json(data);
}
