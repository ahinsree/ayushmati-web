// Builds the static demo for GitHub Pages into ./out.
//
// A static export can't contain the POST /api/chat route handler, so it is moved aside for
// the build and always restored afterwards. In the demo the assistant runs scripted replies
// (src/components/chat/demo-replies.ts) instead of calling Claude.
import { spawnSync } from "node:child_process";
import { existsSync, renameSync } from "node:fs";

const API_DIR = "src/app/api";
const STASH = ".pages-build-api";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "/ayushmati-web";

if (existsSync(STASH)) {
  console.error(`${STASH} exists from an interrupted build. Move it back to ${API_DIR} first.`);
  process.exit(1);
}

renameSync(API_DIR, STASH);
let status = 1;
try {
  const result = spawnSync("npx", ["next", "build"], {
    stdio: "inherit",
    env: {
      ...process.env,
      STATIC_EXPORT: "1",
      NEXT_PUBLIC_STATIC_DEMO: "1",
      NEXT_PUBLIC_BASE_PATH: basePath,
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? `https://ahinsree.github.io${basePath}`,
    },
  });
  status = result.status ?? 1;
} finally {
  renameSync(STASH, API_DIR);
}
process.exit(status);
