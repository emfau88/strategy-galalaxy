import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, writeFile, rm } from "node:fs/promises";
import { createServer as createNetServer } from "node:net";
import { resolve, sep } from "node:path";
import { createExperimentServer, experimentRoot } from "./dev-server.mjs";
import { campaignUiLayout } from "../src/ui/campaignUi.js";
import { commandUiLayout, overlayUiLayout, COMMAND_UI } from "../src/ui/commandUi.js";
import { STORAGE_KEYS } from "../src/experiment.js";
import { TEAM } from "../src/core/constants.js";

const browser = (process.platform === "win32"
  ? ["C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"]
  : ["/usr/bin/google-chrome", "/usr/bin/chromium"]).find(existsSync);
assert.ok(browser, "Chrome or Edge required for this short browser check");
const live = process.argv.includes("--live");
const siteMode = live || process.argv.includes("--site");
const output = resolve(experimentRoot, `../../tmp/last-shipyard-${live ? "live" : siteMode ? "bulk1" : "standalone"}`);
await mkdir(output, { recursive: true });
const profile = await mkdtemp(resolve(output, "profile-"));
assert.ok(profile.startsWith(output + sep));
const prefix = "/strategy-galalaxy/experiments/last-shipyard/";
const server = live ? null : siteMode ? (await import("../../../scripts/dev-server.mjs")).createSiteServer() : createExperimentServer({ prefix });
if (server) await new Promise(done => server.listen(0, "127.0.0.1", done));
const origin = live ? "https://emfau88.github.io" : `http://127.0.0.1:${server.address().port}`;
const probe = createNetServer();
await new Promise(done => probe.listen(0, "127.0.0.1", done));
const debugPort = probe.address().port;
await new Promise(done => probe.close(done));
const processHandle = spawn(browser, ["--headless=new", "--disable-quic", "--disable-http2", "--disable-crash-reporter", "--no-first-run", "--hide-scrollbars", "--disable-gpu-shader-disk-cache", `--remote-debugging-port=${debugPort}`, "--remote-allow-origins=*", `--user-data-dir=${profile}`, "about:blank"], { stdio: "ignore", windowsHide: true });
const delay = ms => new Promise(done => setTimeout(done, ms));
let socket;
let id = 0;
const pending = new Map();
const failures = [];
const requests = new Set();
const send = (method, params = {}) => new Promise((done, reject) => {
  const messageId = ++id;
  const timer = setTimeout(() => { pending.delete(messageId); reject(new Error(`Timeout: ${method}`)); }, live ? 30000 : 10000);
  pending.set(messageId, { done: value => { clearTimeout(timer); done(value); }, reject: error => { clearTimeout(timer); reject(error); } });
  socket.send(JSON.stringify({ id: messageId, method, params }));
});
const evaluate = async expression => {
  const result = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  assert.equal(result.exceptionDetails, undefined, `Browser expression failed: ${expression}`);
  return result.result.value;
};
const waitReady = async () => {
  for (let attempt = 0; attempt < (live ? 600 : 200); attempt++) {
    if (await evaluate("Boolean(window.__lastShipyard?.running && window.__lastShipyard.assetsReady && window.__lastShipyard.loader.isSettled)")) return;
    await delay(50);
  }
  throw new Error("Experiment did not load");
};
const capture = async name => {
  const result = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  await writeFile(resolve(output, name), Buffer.from(result.data, "base64"));
};
try {
  let targets;
  for (let attempt = 0; attempt < 80; attempt++) {
    try { targets = await (await fetch(`http://127.0.0.1:${debugPort}/json`, { signal: AbortSignal.timeout(500) })).json(); break; } catch { await delay(100); }
  }
  const target = targets?.find(page => page.type === "page");
  assert.ok(target?.webSocketDebuggerUrl);
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((done, reject) => { socket.onopen = done; socket.onerror = reject; });
  socket.onmessage = ({ data }) => {
    const message = JSON.parse(data);
    if (message.id) {
      const handler = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) handler?.reject(new Error(message.error.message)); else handler?.done(message.result);
    } else if (message.method === "Runtime.exceptionThrown") failures.push(message.params.exceptionDetails.text);
    else if (message.method === "Log.entryAdded" && message.params.entry.level === "error" && !message.params.entry.url?.endsWith("/favicon.ico")) failures.push(message.params.entry.text);
    else if (message.method === "Network.loadingFailed" && !message.params.canceled) failures.push(message.params.errorText);
    else if (message.method === "Network.responseReceived") {
      const response = message.params.response;
      requests.add(response.url);
      if (response.status >= 400 && !response.url.endsWith("/favicon.ico")) failures.push(`HTTP ${response.status}: ${response.url}`);
    }
  };
  await Promise.all([send("Runtime.enable"), send("Log.enable"), send("Network.enable"), send("Page.enable")]);
  await send("Emulation.setDeviceMetricsOverride", { width: 360, height: 800, deviceScaleFactor: 1, mobile: true });
  await send("Emulation.setTouchEmulationEnabled", { enabled: true });
  if (siteMode) {
    await send("Page.navigate", { url: origin + "/strategy-galalaxy/?debug=1" });
    let ready = false;
    for (let attempt = 0; attempt < (live ? 600 : 200); attempt++) {
      ready = await evaluate("Boolean(window.__strategyGalalaxy?.running && window.__strategyGalalaxy.assetsReady && window.__strategyGalalaxy.loader.isSettled)");
      if (ready) break;
      await delay(50);
    }
    if (!ready) console.error(JSON.stringify({ failures, responses: [...requests], page: await evaluate("({href:location.href,title:document.title,ready:document.readyState,game:typeof window.__strategyGalalaxy})") }, null, 2));
    assert.ok(ready, "Classic starts from the common artifact");
    assert.equal(await evaluate("document.title"), "Strategy Galalaxy");
    assert.equal(await evaluate("window.__strategyGalalaxy.match.state"), "TITLE");
    assert.deepEqual(await evaluate("[...window.__strategyGalalaxy.loader.errors]"), []);
    await capture("classic-360x800.png");
    requests.clear();
  }
  const url = origin + prefix + "?debug=1&seed=1180";
  await send("Page.navigate", { url });
  await waitReady();
  assert.equal(await evaluate("document.title"), "Die letzte Werft · Testkampagne");
  assert.equal(await evaluate("window.__lastShipyard.menuScreen"), "main");
  assert.equal(await evaluate("typeof window.__strategyGalalaxy"), "undefined");
  assert.deepEqual(await evaluate("[...window.__lastShipyard.loader.errors]"), []);
  await capture("main-360x800.png");
  const classic = { "strategy-galalaxy-campaign-v1": '{"version":1,"completed":["classic-sentinel"]}', "strategy-galalaxy-sound-muted": "false" };
  await evaluate(`Object.entries(${JSON.stringify(classic)}).forEach(([k,v])=>localStorage.setItem(k,v))`);
  const transform = await evaluate("window.__lastShipyard.transform");
  const tap = async rect => {
    const x = transform.offsetX + (rect.x + rect.width / 2) * transform.scale;
    const y = transform.offsetY + (rect.y + rect.height / 2) * transform.scale;
    await send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
    await send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await delay(75);
  };
  const ui = campaignUiLayout(transform.designHeight);
  await tap(ui.settings);
  assert.equal(await evaluate("window.__lastShipyard.menuScreen"), "settings");
  await tap(ui.sound);
  assert.equal(await evaluate(`localStorage.getItem(${JSON.stringify(STORAGE_KEYS.soundMuted)})`), "true");
  await tap(ui.back);
  await tap(ui.campaign);
  assert.equal(await evaluate("window.__lastShipyard.menuScreen"), "missions");
  await tap(ui.missions[0]);
  assert.equal(await evaluate("window.__lastShipyard.menuScreen"), "briefing");
  await capture("briefing-360x800.png");
  await tap(ui.start);
  assert.equal(await evaluate("window.__lastShipyard.state"), "LIVE_MATCH");
  const lane = await evaluate("window.__lastShipyard.selectedLaneId");
  const dock = commandUiLayout(transform.designHeight, [lane], false);
  await tap(dock.command);
  assert.equal(await evaluate("window.__lastShipyard.commandDockOpen"), true);
  const expanded = commandUiLayout(transform.designHeight, [lane], true, "units", { units: ["scout", "fighter"], upgrades: [] });
  const before = await evaluate(`window.__lastShipyard.match.economy.get(${JSON.stringify(TEAM.PLAYER)}).energy`);
  await tap(expanded.units[0]);
  const after = await evaluate(`window.__lastShipyard.match.economy.get(${JSON.stringify(TEAM.PLAYER)}).energy`);
  assert.ok(after < before, "Touch purchase spends energy");
  assert.ok(await evaluate(`window.__lastShipyard.match.simulation.state.lanes.get(${JSON.stringify(lane)}).unitIds.get(${JSON.stringify(TEAM.PLAYER)}).length > 0`), "Touch purchase launches ships");
  await tap(COMMAND_UI.pause);
  assert.equal(await evaluate("window.__lastShipyard.match.state"), "PAUSED");
  await capture("paused-360x800.png");
  await tap(overlayUiLayout(transform.designHeight).pauseMenu);
  assert.equal(await evaluate("window.__lastShipyard.menuScreen"), "main");
  assert.equal(await evaluate("window.__lastShipyard.match.state"), "TITLE");
  // Exercise persistence directly, without playing or simulating a balance run to victory.
  assert.equal(await evaluate("window.__lastShipyard.campaign.complete('first-contact')"), true);
  await send("Page.reload", { ignoreCache: true });
  await delay(150);
  await waitReady();
  assert.deepEqual(await evaluate("window.__lastShipyard.campaign.data.completed"), ["first-contact"]);
  assert.equal(await evaluate("window.__lastShipyard.sound.muted"), true);
  for (const [key, value] of Object.entries(classic)) assert.equal(await evaluate(`localStorage.getItem(${JSON.stringify(key)})`), value, "Classic storage unchanged");
  assert.ok([...requests].every(address => address.startsWith(origin + prefix) || address === origin + "/favicon.ico"), "All runtime requests stay in experiment subpath");
  assert.equal(await evaluate("window.__lastShipyard.campaign.reset()"), true);
  assert.equal(await evaluate(`localStorage.getItem(${JSON.stringify(STORAGE_KEYS.progress)})`), null);
  await send("Page.reload", { ignoreCache: true });
  await delay(150);
  await waitReady();
  assert.deepEqual(await evaluate("window.__lastShipyard.campaign.data.completed"), []);
  assert.equal(await evaluate("window.__lastShipyard.sound.muted"), true, "Progress reset leaves sound intact");
  for (const [key, value] of Object.entries(classic)) assert.equal(await evaluate(`localStorage.getItem(${JSON.stringify(key)})`), value, "Classic storage survives reset");
  if (siteMode) {
    await send("Page.navigate", { url: origin + "/strategy-galalaxy/?debug=1" });
    let ready = false;
    for (let attempt = 0; attempt < (live ? 600 : 200); attempt++) {
      ready = await evaluate("Boolean(window.__strategyGalalaxy?.assetsReady && window.__strategyGalalaxy.loader.isSettled)");
      if (ready) break;
      await delay(50);
    }
    assert.ok(ready, "Classic still starts after experiment reset");
    assert.equal(await evaluate("window.__strategyGalalaxy.sound.muted"), false);
    assert.equal(await evaluate(`localStorage.getItem(${JSON.stringify(STORAGE_KEYS.soundMuted)})`), "true");
  }
  assert.deepEqual(failures, []);
  const report = { result: "PASS", mode: live ? "public" : siteMode ? "built-site" : "standalone", classicStarts: siteMode, viewport: "360x800", prefix, runtimeRequests: requests.size, checks: ["own menu identity", "active assets", "touch start and purchase", "pause and return", "own progress and sound reload", "Classic sentinel unchanged", "no requests outside experiment", "own progress reset", "Classic after reset"], completedVia: "persistence API; no simulated mission victory", failures };
  await writeFile(resolve(output, "report.json"), JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify(report, null, 2));
} finally {
  try { if (socket?.readyState === WebSocket.OPEN) await send("Browser.close"); } catch {}
  socket?.close();
  if (process.platform === "win32" && processHandle.pid) spawnSync("taskkill.exe", ["/PID", String(processHandle.pid), "/T", "/F"], { stdio: "ignore", windowsHide: true });
  else processHandle.kill();
  if (server) await new Promise(done => server.close(done));
  assert.ok(profile.startsWith(output + sep));
  await rm(profile, { recursive: true, force: true, maxRetries: 4, retryDelay: 125 }).catch(() => {});
}
