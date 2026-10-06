// Portable local harness. Executes the same Worker fetch handler, not a replacement API.
import { build } from "esbuild";
import { createServer } from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
await fs.mkdir("tmp", { recursive: true });
await build({
  entryPoints: ["worker/index.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: "tmp/worker.mjs",
  packages: "external",
});
const { default: worker } = await import(
  pathToFileURL(path.resolve("tmp/worker.mjs")).href
);
const env = { APP_ENV: "development" };
try {
  for (const line of (await fs.readFile(".dev.vars", "utf8")).split("\n")) {
    if (!line.trim() || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i > 0)
      env[line.slice(0, i).trim()] = line
        .slice(i + 1)
        .trim()
        .replace(/^['"]|['"]$/g, "");
  }
} catch {}
let headerRules = [];
try {
  let rule;
  for (const line of (await fs.readFile("out/_headers", "utf8")).split("\n")) {
    if (line && !line.startsWith(" ")) {
      rule = { pattern: line, headers: {} };
      headerRules.push(rule);
    } else if (rule && line.includes(":")) {
      const i = line.indexOf(":");
      rule.headers[line.slice(0, i).trim()] = line.slice(i + 1).trim();
    }
  }
} catch {}
const staticHeaders = (pathname) => {
  const result = {};
  for (const rule of headerRules) {
    if (
      rule.pattern === pathname ||
      (rule.pattern.endsWith("*") &&
        pathname.startsWith(rule.pattern.slice(0, -1)))
    )
      Object.assign(result, rule.headers);
  }
  return result;
};
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".txt": "text/plain",
  ".xml": "application/xml",
  ".json": "application/json",
  ".ico": "image/x-icon",
};
env.ASSETS = {
  fetch: async (req) => {
    let file = decodeURIComponent(new URL(req.url).pathname);
    if (file.includes("..")) return new Response("Forbidden", { status: 403 });
    if (file.endsWith("/")) file += "index.html";
    if (!path.extname(file)) file += "/index.html";
    try {
      const bytes = await fs.readFile(path.join("out", file));
      return new Response(bytes, {
        headers: {
          ...staticHeaders(new URL(req.url).pathname),
          "Content-Type":
            types[path.extname(file)] || "application/octet-stream",
        },
      });
    } catch {
      return new Response(
        await fs.readFile("out/404.html").catch(() => "<h1>404</h1>"),
        { status: 404, headers: { "Content-Type": "text/html" } },
      );
    }
  },
};
const server = createServer(async (req, res) => {
  try {
    const chunks = [];
    let size = 0;
    for await (const chunk of req) {
      size += chunk.length;
      if (size > 3 * 1024 * 1024) {
        res.writeHead(413);
        res.end();
        return;
      }
      chunks.push(chunk);
    }
    const url = `http://localhost:${process.env.PORT || 8787}${req.url}`;
    const request = new Request(url, {
      method: req.method,
      headers: req.headers,
      body: ["GET", "HEAD"].includes(req.method)
        ? undefined
        : Buffer.concat(chunks),
    });
    const pending = [];
    const response = await worker.fetch(request, env, {
      waitUntil: (p) => pending.push(p),
      passThroughOnException: () => {},
    });
    const responseHeaders = Object.fromEntries(response.headers);
    if (response.headers.getSetCookie().length)
      responseHeaders["set-cookie"] = response.headers.getSetCookie();
    res.writeHead(response.status, responseHeaders);
    res.end(Buffer.from(await response.arrayBuffer()));
    await Promise.allSettled(pending);
  } catch (e) {
    console.error(e);
    res.writeHead(500);
    res.end("Local preview error");
  }
});
server.listen(Number(process.env.PORT || 8787), "127.0.0.1", () =>
  console.log(`TANTRE local: http://localhost:${process.env.PORT || 8787}`),
);
