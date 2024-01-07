import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Causelist App",
    short_name: "Causelist",
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
