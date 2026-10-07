import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
// Static Next HTML uses per-page hashes, not unsafe-inline scripts or request SSR.
async function walk(dir) {
  return (
    await Promise.all(
      (await fs.readdir(dir, { withFileTypes: true })).map((e) =>
        e.isDirectory() ? walk(path.join(dir, e.name)) : path.join(dir, e.name),
      ),
    )
  ).flat();
}
const rows = [];
for (const file of (await walk("out")).filter((f) => f.endsWith(".html"))) {
  const html = await fs.readFile(file, "utf8");
  const hashes = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)]
    .filter((m) => m[1])
    .map(
      (m) =>
        `'sha256-${crypto.createHash("sha256").update(m[1]).digest("base64")}'`,
    );
  const route =
    file === "out/index.html"
      ? "/"
      : "/" +
        file
          .replace(/^out\//, "")
          .replace(/index\.html$/, "")
          .replace(/\.html$/, "");
  const csp = `default-src 'self'; script-src 'self' ${[...new Set(hashes)].join(" ")} https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://*.supabase.co; font-src 'self'; connect-src 'self' https://*.supabase.co https://*.posthog.com https://*.i.posthog.com https://*.ingest.sentry.io; frame-src https://challenges.cloudflare.com https://www.google.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests`;
  rows.push(`${route}\n  Content-Security-Policy: ${csp}`);
}
rows.push(
  "/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n  Strict-Transport-Security: max-age=31536000; includeSubDomains",
);
rows.push(
  "/_next/static/*\n  Cache-Control: public, max-age=31536000, immutable",
);
rows.push("/catalogo/*\n  X-Robots-Tag: noindex, follow");
rows.push(
  "/admin/*\n  X-Robots-Tag: noindex, nofollow\n  Cache-Control: no-store",
);
await fs.writeFile("out/_headers", rows.join("\n\n") + "\n");
console.log("Cloudflare headers generated with per-page script hashes.");
