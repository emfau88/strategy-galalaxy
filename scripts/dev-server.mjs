import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { dirname, resolve, sep, extname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const mime = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json", ".png": "image/png" };
export const createSiteServer = ({ siteRoot = resolve(repositoryRoot, "dist"), prefix = "/strategy-galalaxy/" } = {}) => {
  const root = resolve(siteRoot);
  if (!prefix.startsWith("/") || !prefix.endsWith("/")) throw new Error("Invalid site prefix");
  return createServer(async (request, response) => {
    try {
      const url = new URL(request.url, "http://127.0.0.1");
      const path = decodeURIComponent(url.pathname);
      if (path === "/favicon.ico") { response.writeHead(204).end(); return; }
      if (path === "/" || path === prefix.slice(0, -1)) { response.writeHead(308, { Location: prefix + url.search }).end(); return; }
      if (!path.startsWith(prefix)) { response.writeHead(404).end(); return; }
      const relative = path.slice(prefix.length);
      if (relative.split(/[\\/]/).some(part => part.startsWith("."))) { response.writeHead(403).end(); return; }
      let file = resolve(root, relative);
      if (file !== root && !file.startsWith(root + sep)) { response.writeHead(403).end(); return; }
      if ((await stat(file)).isDirectory()) {
        if (!path.endsWith("/")) { response.writeHead(308, { Location: path + "/" + url.search }).end(); return; }
        file = resolve(file, "index.html");
      }
      const body = await readFile(file);
      response.writeHead(200, { "Content-Type": mime[extname(file)] ?? "application/octet-stream", "Cache-Control": "no-store" }).end(body);
    } catch { response.writeHead(404).end(); }
  });
};
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const port = Number(process.env.PORT ?? 7102);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Invalid PORT");
  const server = createSiteServer();
  server.on("error", error => { console.error(error.message); process.exitCode = 1; });
  server.listen(port, "127.0.0.1", () => console.log(`Classic: http://127.0.0.1:${port}/strategy-galalaxy/\nDie letzte Werft: http://127.0.0.1:${port}/strategy-galalaxy/experiments/last-shipyard/`));
}
