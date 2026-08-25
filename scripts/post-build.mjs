// Finalize and verify the build output. Runs as the second half of `npm run build`.
//
//   1. copy dist/index.d.ts -> dist/index.d.cts   (require() consumers on node16 resolution)
//   2. assert both bundles carry the "use client" banner  (React Server Components)
//   3. assert bundle sizes stay inside the budget
//
// Deliberately dependency-free: a size-limit install costs more than these 40 lines.

import { copyFileSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const dist = resolve(fileURLToPath(new URL("..", import.meta.url)), "dist");

// Budget = current baseline + ~15% headroom. Raise deliberately, in the same PR that
// earns the bytes, and say why in CHANGELOG.
const BUDGET = {
  // 57.4 kB after #33/#35/#36/#37/#42/#43 (keyboard nav completion, batch paste,
  // dirty-tracker API, row-index cache) — see CHANGELOG [Unreleased].
  "index.js": 66_000,
  "index.cjs": 55_000,
  "style.css": 6_000,
};

const errors = [];

copyFileSync(resolve(dist, "index.d.ts"), resolve(dist, "index.d.cts"));

for (const file of ["index.js", "index.cjs"]) {
  const head = readFileSync(resolve(dist, file), "utf8").slice(0, 40);
  if (!head.includes("use client")) {
    errors.push(`${file}: missing "use client" banner`);
  }
}

const sizes = [];
for (const [file, max] of Object.entries(BUDGET)) {
  const { size } = statSync(resolve(dist, file));
  sizes.push(`${file} ${size.toLocaleString()} B / ${max.toLocaleString()} B`);
  if (size > max) {
    errors.push(`${file}: ${size} B exceeds the ${max} B budget`);
  }
}

console.log(`post-build: ${sizes.join(" · ")}`);

if (errors.length > 0) {
  console.error(`\npost-build failed:\n  ${errors.join("\n  ")}`);
  process.exit(1);
}
