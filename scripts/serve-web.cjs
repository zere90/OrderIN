#!/usr/bin/env node
// Zero-dependency static server for the exported web build (`npm run build:web`).
// Unlike a plain file server it resolves Expo Router's dynamic pages
// (e.g. /chat/abc → chat/[id].html), so reloading any screen works during a demo.
// Usage: node scripts/serve-web.cjs [dir=dist] [port=8080]
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(process.argv[2] || "dist");
const port = Number(process.argv[3] || process.env.PORT || 8080);
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
  ".ttf": "font/ttf",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

if (!fs.existsSync(path.join(root, "index.html"))) {
  console.error(`No build found in ${root}. Run "npm run build:web" first.`);
  process.exit(1);
}

const isFile = (f) => fs.existsSync(f) && fs.statSync(f).isFile();

function resolve(urlPath) {
  const clean = path.normalize(decodeURIComponent(urlPath)).replace(/^(\.\.[/\\])+/, "");
  for (const candidate of [clean, `${clean}.html`, path.join(clean, "index.html")]) {
    const file = path.join(root, candidate);
    if (file.startsWith(root) && isFile(file)) return { file, status: 200 };
  }
  const dir = path.join(root, path.dirname(clean));
  if (dir.startsWith(root) && fs.existsSync(dir)) {
    const dynamic = fs.readdirSync(dir).find((n) => /^\[[^\]]+\]\.html$/.test(n));
    if (dynamic) return { file: path.join(dir, dynamic), status: 200 };
  }
  const notFound = path.join(root, "+not-found.html");
  return { file: isFile(notFound) ? notFound : path.join(root, "index.html"), status: 404 };
}

http
  .createServer((req, res) => {
    try {
      const { file, status } = resolve((req.url || "/").split("?")[0]);
      res.writeHead(status, {
        "Content-Type": types[path.extname(file)] || "application/octet-stream",
      });
      fs.createReadStream(file).pipe(res);
    } catch {
      res.writeHead(500);
      res.end("Server error");
    }
  })
  .listen(port, () => {
    console.log(`OrderIN web build: http://localhost:${port}`);
  });
