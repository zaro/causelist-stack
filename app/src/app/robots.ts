import { MetadataRoute } from "next";

const env = process.env.NEXT_PUBLIC_ENVIRONMENT ?? "development";

export default function robots(): MetadataRoute.Robots {
  return env === "production"
    ? {
        rules: {
          userAgent: "*",
          allow: "/",
          disallow: ["/sign-in", "/sign-up", "/check-otp"],
        },
      }
    : {
        rules: {
          userAgent: "*",
          disallow: "/",
        },
      };
}
