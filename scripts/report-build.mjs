import fs from "node:fs/promises";
import { gzipSync } from "node:zlib";
import assert from "node:assert/strict";
const html = await fs.readFile("out/index.html", "utf8");
const scripts = [
  ...new Set([...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((m) => m[1])),
];
let javascript = 0;
for (const script of scripts)
  javascript += gzipSync(
    await fs.readFile(`out${script.split("?")[0]}`),
  ).length;
const headers = (await fs.readFile("out/_headers", "utf8")).split("\n");
assert.ok(
  headers.every((line) => line.length <= 2000),
  "Cloudflare header line limit",
);
assert.ok(javascript < 450 * 1024, "Initial JS gzip exceeds 450 KiB budget");
const report = {
  generated_at: new Date().toISOString(),
  home_html_gzip_kib: Number((gzipSync(html).length / 1024).toFixed(1)),
  home_initial_js_gzip_kib: Number((javascript / 1024).toFixed(1)),
  initial_script_files: scripts.length,
  max_header_line: Math.max(...headers.map((l) => l.length)),
  note: "Build sizes, not field Core Web Vitals. Lazy chunks and content uploaded after deployment are not included.",
};
await fs.writeFile(
  "docs/BUILD-METRICS.json",
  JSON.stringify(report, null, 2) + "\n",
);
console.log(report);
