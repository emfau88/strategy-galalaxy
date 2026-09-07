import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createReadStream, existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { createServer as createNetServer } from "node:net";
import { extname, normalize, resolve } from "node:path";

const root = resolve(new URL("../", import.meta.url).pathname.replace(/^\/(.:)/, "$1"));
const output = resolve(root, "tmp", "browser-qa");
const viewports = [[360, 800], [390, 844], [393, 852], [412, 915], [420, 760]];
const mime = { ".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".png": "image/png", ".gif": "image/gif", ".txt": "text/plain", ".md": "text/markdown" };

const browserCandidates = process.platform === "win32"
  ? ["C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"]
  : ["/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"];
const browser = browserCandidates.find(existsSync);
assert.ok(browser, "A local Chromium or Edge executable is required for browser QA");

const staticServer = createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, "http://127.0.0.1").pathname);
  if (pathname === "/favicon.ico") { response.writeHead(204).end(); return; }
  const requested = resolve(root, `.${pathname === "/" ? "/index.html" : pathname}`);
  if (!requested.startsWith(root)) { response.writeHead(403).end(); return; }
  const path = normalize(requested);
  const stream = createReadStream(path);
  stream.on("error", () => response.writeHead(404).end());
  response.setHeader("Content-Type", mime[extname(path)] ?? "application/octet-stream");
  stream.pipe(response);
});
await new Promise((resolveListen) => staticServer.listen(0, "127.0.0.1", resolveListen));
const serverPort = staticServer.address().port;
const portProbe = createNetServer();
await new Promise((resolveListen) => portProbe.listen(0, "127.0.0.1", resolveListen));
const debugPort = portProbe.address().port;
await new Promise((resolveClose) => portProbe.close(resolveClose));
await mkdir(output, { recursive: true });

const browserProcess = spawn(browser, [
  "--headless=new", "--disable-crash-reporter", "--no-first-run", "--hide-scrollbars",
  `--remote-debugging-port=${debugPort}`, "--remote-allow-origins=*", `--user-data-dir=${resolve(output, "profile")}`,
  "about:blank",
], { stdio: "ignore" });

const delay = (ms) => new Promise((resolveDelay) => setTimeout(resolveDelay, ms));
const waitForJson = async (url) => {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try { const response = await fetch(url); if (response.ok) return response.json(); } catch {}
    await delay(100);
  }
  throw new Error(`Browser debugging endpoint did not start: ${url}`);
};

let socket;
let messageId = 0;
const pending = new Map();
const persistentEvents = new Map();
const onceEvents = new Map();
const onEvent = (method, listener) => {
  const listeners = persistentEvents.get(method) ?? [];
  listeners.push(listener);
  persistentEvents.set(method, listeners);
};
const waitEvent = (method, timeoutMs = 10000) => new Promise((resolveEvent, rejectEvent) => {
  const timer = setTimeout(() => rejectEvent(new Error(`Timed out waiting for ${method}`)), timeoutMs);
  const listener = (params) => { clearTimeout(timer); resolveEvent(params); };
  onceEvents.set(method, listener);
});
const send = (method, params = {}) => new Promise((resolveSend, rejectSend) => {
  const id = ++messageId;
  pending.set(id, { resolve: resolveSend, reject: rejectSend });
  socket.send(JSON.stringify({ id, method, params }));
});

try {
  await waitForJson(`http://127.0.0.1:${debugPort}/json/version`);
  const targets = await waitForJson(`http://127.0.0.1:${debugPort}/json`);
  const page = targets.find((target) => target.type === "page");
  assert.ok(page?.webSocketDebuggerUrl, "Browser page target is available");
  socket = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolveOpen, rejectOpen) => { socket.onopen = resolveOpen; socket.onerror = rejectOpen; });
  socket.onmessage = ({ data }) => {
    const message = JSON.parse(data);
    if (message.id) {
      const request = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) request?.reject(new Error(message.error.message)); else request?.resolve(message.result);
      return;
    }
    for (const listener of persistentEvents.get(message.method) ?? []) listener(message.params);
    const once = onceEvents.get(message.method);
    if (once) { onceEvents.delete(message.method); once(message.params); }
  };

  const failures = [];
  onEvent("Runtime.exceptionThrown", ({ exceptionDetails }) => failures.push(`exception: ${exceptionDetails.text}`));
  onEvent("Log.entryAdded", ({ entry }) => { if (entry.level === "error") failures.push(`console: ${entry.text}`); });
  onEvent("Network.loadingFailed", ({ errorText, canceled }) => { if (!canceled) failures.push(`network: ${errorText}`); });
  onEvent("Network.responseReceived", ({ response }) => { if (response.status >= 400 && !response.url.endsWith("favicon.ico")) failures.push(`HTTP ${response.status}: ${response.url}`); });
  await Promise.all([send("Page.enable"), send("Runtime.enable"), send("Log.enable"), send("Network.enable")]);

  const reports = [];
  for (const [width, height] of viewports) {
    await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: true, screenWidth: width, screenHeight: height });
    const loaded = waitEvent("Page.loadEventFired");
    await send("Page.navigate", { url: `http://127.0.0.1:${serverPort}/?test=match&debug=1&seed=${width + height}` });
    await loaded;
    for (let attempt = 0; attempt < 100; attempt += 1) {
      const ready = await send("Runtime.evaluate", { expression: "Boolean(window.__strategyGalalaxy?.running && window.__strategyGalalaxy?.loader?.isSettled)", returnByValue: true });
      if (ready.result.value) break;
      await delay(50);
    }

    const snapshotResult = await send("Runtime.evaluate", {
      expression: `(() => { const g = window.__strategyGalalaxy; const r = g.canvas.getBoundingClientRect(); return { innerWidth, innerHeight, state: g.state, transform: g.getViewportSnapshot(), canvas: { x: r.x, y: r.y, width: r.width, height: r.height }, assetFailures: g.loader.errors.length, playerQueue: [...g.match.queuedWaves.get('TEAM_PLAYER').values()].flat().length }; })()`,
      returnByValue: true,
    });
    const snapshot = snapshotResult.result.value;
    assert.equal(snapshot.innerWidth, width);
    assert.equal(snapshot.innerHeight, height);
    assert.equal(snapshot.canvas.width, width);
    assert.equal(snapshot.canvas.height, height);
    assert.ok(Math.abs(snapshot.transform.contentWidth - width) < 0.01);
    assert.ok(Math.abs(snapshot.transform.contentHeight - height) < 0.01);
    assert.ok(Math.abs(snapshot.transform.offsetX) < 0.01);
    assert.ok(Math.abs(snapshot.transform.offsetY) < 0.01);
    assert.equal(snapshot.assetFailures, 0);
    assert.equal(snapshot.state, "LIVE_MATCH");

    const designHeight = snapshot.transform.designHeight;
    const lowerOffset = Math.max(0, designHeight - 760);
    const touchX = 70 * snapshot.transform.scale;
    const touchY = (675 + lowerOffset) * snapshot.transform.scale;
    await send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: touchX, y: touchY }] });
    await send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await delay(40);
    const queueResult = await send("Runtime.evaluate", { expression: "[...window.__strategyGalalaxy.match.queuedWaves.get('TEAM_PLAYER').values()].flat().length", returnByValue: true });
    assert.equal(queueResult.result.value, 1, `${width}x${height} touch reaches Scout control`);

    const screenshot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
    await writeFile(resolve(output, `match-${width}x${height}.png`), Buffer.from(screenshot.data, "base64"));
    if (width === 420 && height === 760) {
      await delay(1400);
      const damageResult = await send("Runtime.evaluate", {
        expression: `(() => { const structures = window.__strategyGalalaxy.match.simulation.state.structures; for (const id of ['player-hq', 'player-left-turret']) { const structure = structures.get(id); structure.hp = structure.maxHp * 0.25; } return window.__strategyGalalaxy.match.lastDeploymentAt; })()`,
        returnByValue: true,
      });
      assert.equal(damageResult.result.value, 0, "initial deployment timestamp remains available for HQ door animation");
      await delay(80);
      const damageScreenshot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
      await writeFile(resolve(output, "structures-closed-damaged-420x760.png"), Buffer.from(damageScreenshot.data, "base64"));
    }
    reports.push({ width, height, designHeight: Math.round(designHeight * 10) / 10, scale: Math.round(snapshot.transform.scale * 1000) / 1000, touch: "passed" });
  }
  assert.deepEqual(failures, []);
  console.log(JSON.stringify({ browser, reports, failures }, null, 2));
} finally {
  try { if (socket?.readyState === WebSocket.OPEN) await send("Browser.close"); } catch {}
  socket?.close();
  browserProcess.kill();
  staticServer.close();
}
