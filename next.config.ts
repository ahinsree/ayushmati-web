import type { NextConfig } from "next";

// `npm run build:pages` sets STATIC_EXPORT=1 to produce a static demo for GitHub Pages
// (see scripts/build-pages.mjs). Everything else is the full server build.
const staticExport = process.env.STATIC_EXPORT === "1";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || undefined;

const serverConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "i.ytimg.com" }],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

const staticExportConfig: NextConfig = {
  output: "export",
  basePath,
  trailingSlash: true, // /shop/ -> shop/index.html, which GitHub Pages serves directly
  images: { unoptimized: true },
};

export default staticExport ? staticExportConfig : serverConfig;
