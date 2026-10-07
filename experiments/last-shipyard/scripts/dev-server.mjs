import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, sep, extname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const experimentRoot = fileURLToPath(new URL("../", import.meta.url));
const mime = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json", ".png": "image/png" };

export const createExperimentServer = ({ prefix = "/" } = {}) => {
  if (!prefix.startsWith("/") || !prefix.endsWith("/")) throw new Error("Prefix must have leading and trailing slashes");
  const root = resolve(experimentRoot);
  return createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, "http://127.0.0.1").pathname);
      if (pathname === "/favicon.ico") { response.writeHead(204).end(); return; }
      if (pathname === prefix.slice(0, -1) && prefix !== "/") {
        response.writeHead(308, { Location: prefix }).end(); return;
      }
      if (!pathname.startsWith(prefix)) { response.writeHead(404).end(); return; }
      const relative = pathname.slice(prefix.length) || "index.html";
      if (relative.split(/[\\/]/).some(part => part.startsWith("."))) { response.writeHead(403).end(); return; }
      const path = resolve(root, relative);
      if (!path.startsWith(root + sep)) { response.writeHead(403).end(); return; }
      const body = await readFile(path);
      response.writeHead(200, { "Content-Type": mime[extname(path)] ?? "application/octet-stream", "Cache-Control": "no-store" }).end(body);
    } catch {
      response.writeHead(404).end();
    }
  });
};

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const port = Number(process.env.PORT ?? 7101);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Invalid PORT");
  const server = createExperimentServer();
  server.on("error", error => { console.error(error.message); process.exitCode = 1; });
  server.listen(port, "127.0.0.1", () => console.log(`Die letzte Werft: http://127.0.0.1:${port}/`));
}
