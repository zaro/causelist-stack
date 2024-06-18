import fs from "node:fs";
export const dynamic = "force-dynamic";

const env = process.env.NEXT_PUBLIC_ENVIRONMENT ?? "development";
const envTitle = env !== "production" ? `[${env.toUpperCase()}] ` : "";

export async function GET(request: Request) {
  const min = env === "production" ? ".min" : "";
  const data = fs
    .readFileSync(
      `node_modules/iframe-resizer/js/iframeResizer.contentWindow${min}.js`
    )
    .toString();
  return new Response(data);
}
