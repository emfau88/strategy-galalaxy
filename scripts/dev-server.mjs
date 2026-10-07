import { createReadStream, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

// Adapted from local commit 36b43be; fileURLToPath also supports spaces in paths.
const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const args = process.argv.slice(2);
const root = resolve(projectRoot, args.includes("--dist") ? "dist" : ".");
const option = (name, fallback) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] ?? fallback : fallback;
};
const host = option("host", process.env.HOST ?? "127.0.0.1");
const port = Number(option("port", process.env.PORT ?? "7100"));
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8", ".json": "application/json", ".png": "image/png", ".gif": "image/gif", ".css": "text/css", ".ogg": "audio/ogg" };
const server = createServer((request, response) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname); }
  catch { response.writeHead(400).end(); return; }
  if (pathname.split("/").some((segment) => segment.startsWith("."))) { response.writeHead(403).end(); return; }
  if (pathname === "/favicon.ico") { response.writeHead(204).end(); return; }
  const requested = resolve(root, `.${pathname === "/" ? "/index.html" : pathname}`);
  if (!requested.startsWith(resolve(root) + sep)) { response.writeHead(403).end(); return; }
  try { if (!statSync(requested).isFile()) { response.writeHead(404).end(); return; } }
  catch { response.writeHead(404).end(); return; }
  response.setHeader("Content-Type", types[extname(requested)] ?? "application/octet-stream");
  response.setHeader("Cache-Control", "no-cache");
  createReadStream(requested).on("error", () => response.destroy()).pipe(response);
});
server.listen(port, host, () => console.log(`Strategy Galalaxy: http://${host}:${port}/`));
