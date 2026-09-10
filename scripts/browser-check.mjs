import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createReadStream, existsSync } from "node:fs";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { createServer as createNetServer } from "node:net";
import { extname, normalize, resolve } from "node:path";
import { runtimeAssetManifestForLevel } from "../src/assets.js";

const root = resolve(new URL("../", import.meta.url).pathname.replace(/^\/(.:)/, "$1"));
const siteRoot = process.argv.includes("--dist") ? resolve(root, "dist") : root;
const output = resolve(root, "tmp", "browser-qa");
const viewports = [[360, 800], [390, 844], [393, 852], [412, 915], [420, 760]];
const mime = { ".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".png": "image/png", ".gif": "image/gif", ".txt": "text/plain", ".md": "text/markdown" };

const browserCandidates = process.platform === "win32"
  ? ["C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe", "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe"]
  : ["/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"];
const browser = browserCandidates.find(existsSync);
assert.ok(browser, "A local Chromium or Edge executable is required for browser QA");

const staticServer = createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, "http://127.0.0.1").pathname);
  if (pathname === "/favicon.ico") { response.writeHead(204).end(); return; }
  const requested = resolve(siteRoot, `.${pathname === "/" ? "/index.html" : pathname}`);
  if (!requested.startsWith(siteRoot)) { response.writeHead(403).end(); return; }
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
const browserProfile = await mkdtemp(resolve(output, "profile-"));

const browserProcess = spawn(browser, [
  "--headless=new", "--disable-crash-reporter", "--no-first-run", "--hide-scrollbars",
  "--disable-gpu-shader-disk-cache", "--disk-cache-size=1048576", "--media-cache-size=1048576",
  `--remote-debugging-port=${debugPort}`, "--remote-allow-origins=*", `--user-data-dir=${browserProfile}`,
  "about:blank",
], { stdio: "ignore" });

const delay = (ms) => new Promise((resolveDelay) => setTimeout(resolveDelay, ms));
const waitForJson = async (url) => {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(500) });
      if (response.ok) return response.json();
    } catch {}
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
  const timer = setTimeout(() => {
    pending.delete(id);
    rejectSend(new Error(`Timed out waiting for browser command ${method}`));
  }, 10000);
  pending.set(id, {
    resolve: (value) => { clearTimeout(timer); resolveSend(value); },
    reject: (error) => { clearTimeout(timer); rejectSend(error); },
  });
  socket.send(JSON.stringify({ id, method, params }));
});

try {
  await waitForJson(`http://127.0.0.1:${debugPort}/json/version`);
  const targets = await waitForJson(`http://127.0.0.1:${debugPort}/json`);
  const page = targets.find((target) => target.type === "page");
  assert.ok(page?.webSocketDebuggerUrl, "Browser page target is available");
  socket = new WebSocket(page.webSocketDebuggerUrl);
  await Promise.race([
    new Promise((resolveOpen, rejectOpen) => { socket.onopen = resolveOpen; socket.onerror = rejectOpen; }),
    delay(5000).then(() => { throw new Error("Timed out opening browser debugging socket"); }),
  ]);
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

  const touch = async (x, y) => {
    await send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
    await send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await delay(40);
  };
  const drag = async (x, fromY, toY) => {
    await send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y: fromY }] });
    for (let step = 1; step <= 5; step += 1) {
      const y = fromY + (toY - fromY) * step / 5;
      await send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y }] });
      await delay(16);
    }
    await send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await delay(80);
  };
  const waitForGame = async () => {
    for (let attempt = 0; attempt < 100; attempt += 1) {
      const ready = await send("Runtime.evaluate", { expression: "Boolean(window.__strategyGalalaxy?.running && window.__strategyGalalaxy?.assetsReady && window.__strategyGalalaxy?.loader?.isSettled)", returnByValue: true });
      if (ready.result.value) return;
      await delay(50);
    }
    throw new Error("Game did not finish loading");
  };

  const assertRuntimeAssetsLoaded = async (level) => {
    const keys = Object.keys(runtimeAssetManifestForLevel(level));
    const result = await send("Runtime.evaluate", {
      expression: `(() => { const loader = window.__strategyGalalaxy.loader; const keys = ${JSON.stringify(keys)}; return { missing: keys.filter((key) => !loader.get(key)?.naturalWidth), errors: [...loader.errors] }; })()`,
      returnByValue: true,
    });
    assert.deepEqual(result.result.value, { missing: [], errors: [] }, `level ${level} loads every active runtime asset`);
  };

  await send("Emulation.setDeviceMetricsOverride", { width: 420, height: 760, deviceScaleFactor: 1, mobile: true, screenWidth: 420, screenHeight: 760 });
  let loaded = waitEvent("Page.loadEventFired");
  await send("Page.navigate", { url: `http://127.0.0.1:${serverPort}/?debug=1&seed=1180` });
  await loaded;
  await waitForGame();
  await assertRuntimeAssetsLoaded(1);
  let titleState = await send("Runtime.evaluate", { expression: "({ state: window.__strategyGalalaxy.state, difficulty: window.__strategyGalalaxy.match.aiProfile, level: window.__strategyGalalaxy.match.mapDefinition.level })", returnByValue: true });
  assert.deepEqual(titleState.result.value, { state: "TITLE", difficulty: "tactician", level: 1 });
  const titleScreenshot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  await writeFile(resolve(output, "title-420x760.png"), Buffer.from(titleScreenshot.data, "base64"));
  await touch(210, 454);
  titleState = await send("Runtime.evaluate", { expression: "window.__strategyGalalaxy.match.aiProfile", returnByValue: true });
  assert.equal(titleState.result.value, "admiral", "difficulty selector is touch-operable");
  await touch(210, 497);
  titleState = await send("Runtime.evaluate", { expression: "window.__strategyGalalaxy.state", returnByValue: true });
  assert.equal(titleState.result.value, "LIVE_MATCH", "start button begins a live match");
  await touch(323, 29);
  titleState = await send("Runtime.evaluate", { expression: "window.__strategyGalalaxy.state", returnByValue: true });
  assert.equal(titleState.result.value, "PAUSED", "pause button opens the in-match menu");
  const pauseScreenshot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  await writeFile(resolve(output, "pause-menu-420x760.png"), Buffer.from(pauseScreenshot.data, "base64"));
  await touch(274, 407);
  titleState = await send("Runtime.evaluate", { expression: "window.__strategyGalalaxy.state", returnByValue: true });
  assert.equal(titleState.result.value, "TITLE", "the pause menu returns to the main menu");

  loaded = waitEvent("Page.loadEventFired");
  await send("Page.navigate", { url: `http://127.0.0.1:${serverPort}/?test=match&debug=1&level=1&seed=640` });
  await loaded;
  await waitForGame();
  await assertRuntimeAssetsLoaded(1);
  const gardenState = await send("Runtime.evaluate", {
    expression: `(() => { const g = window.__strategyGalalaxy; const state = g.match.simulation.state; return { map: state.map.id, lanes: [...state.lanes.keys()], worldHeight: g.getCameraSnapshot().worldHeight, playerUnits: state.lanes.get('LANE_CENTER').unitIds.get('TEAM_PLAYER').length, nodes: state.nodes.size, turrets: [...state.structures.values()].filter((value) => value.structureType === 'turret').length, carriers: [...state.structures.values()].filter((value) => value.structureType === 'hq').map((value) => value.y), assetFailures: g.loader.errors.length }; })()`,
    returnByValue: true,
  });
  assert.deepEqual(gardenState.result.value, { map: "orbital_garden", lanes: ["LANE_CENTER"], worldHeight: 1180, playerUnits: 2, nodes: 0, turrets: 0, carriers: [1168, 12], assetFailures: 0 });
  const gardenPlayerScreenshot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  await writeFile(resolve(output, "level-1-player-sector-420x760.png"), Buffer.from(gardenPlayerScreenshot.data, "base64"));
  const playerHqTap = await send("Runtime.evaluate", { expression: "(() => { const g = window.__strategyGalalaxy; const h = g.match.simulation.state.structures.get('player-hq'); return { x: h.x, y: g.camera.worldToScreenY(h.y) }; })()", returnByValue: true });
  await touch(playerHqTap.result.value.x, playerHqTap.result.value.y);
  const hqOpened = await send("Runtime.evaluate", { expression: "window.__strategyGalalaxy.commandDockOpen", returnByValue: true });
  assert.equal(hqOpened.result.value, true, "tapping the player HQ opens its command console");
  const commandScreenshot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  await writeFile(resolve(output, "hq-command-expanded-420x760.png"), Buffer.from(commandScreenshot.data, "base64"));
  await touch(70, 619);
  const gardenUnits = await send("Runtime.evaluate", { expression: "window.__strategyGalalaxy.match.simulation.state.lanes.get('LANE_CENTER').unitIds.get('TEAM_PLAYER').length", returnByValue: true });
  assert.equal(gardenUnits.result.value, 5, "Orbital Garden main-lane Scout Wing deployment is touch-operable");
  await touch(206, 565);
  await send("Runtime.evaluate", { expression: "(() => { const g = window.__strategyGalalaxy; for (let step = 0; step < 60 * 36 && g.state === 'LIVE_MATCH'; step += 1) g.match.advanceLive(1 / 60); g.camera.jumpToWorld(640); })()" });
  await delay(100);
  const gardenScreenshot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  await writeFile(resolve(output, "level-1-orbital-garden-420x760.png"), Buffer.from(gardenScreenshot.data, "base64"));

  loaded = waitEvent("Page.loadEventFired");
  await send("Page.navigate", { url: `http://127.0.0.1:${serverPort}/?test=match&debug=1&level=2&seed=842` });
  await loaded;
  await waitForGame();
  await assertRuntimeAssetsLoaded(2);
  const levelTwoState = await send("Runtime.evaluate", {
    expression: `(() => { const g = window.__strategyGalalaxy; const state = g.match.simulation.state; return { map: state.map.id, theme: state.map.visualTheme, lanes: [...state.lanes.keys()], worldHeight: g.getCameraSnapshot().worldHeight, nodes: state.nodes.size, turrets: [...state.structures.values()].filter((value) => value.structureType === 'turret').length, assetFailures: g.loader.errors.length }; })()`,
    returnByValue: true,
  });
  assert.deepEqual(levelTwoState.result.value, { map: "classic_lanes", theme: "twin_foundries", lanes: ["LANE_LEFT", "LANE_RIGHT"], worldHeight: 1180, nodes: 0, turrets: 0, assetFailures: 0 });
  for (const [region, worldY] of [["player", 1090], ["center", 590], ["rival", 90]]) {
    await send("Runtime.evaluate", { expression: `window.__strategyGalalaxy.camera.jumpToWorld(${worldY})` });
    await delay(60);
    const levelTwoScreenshot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
    await writeFile(resolve(output, `level-2-${region}-sector-420x760.png`), Buffer.from(levelTwoScreenshot.data, "base64"));
  }
  const droneQa = await send("Runtime.evaluate", {
    expression: `(() => {
      const g = window.__strategyGalalaxy;
      const simulation = g.match.simulation;
      const state = simulation.state;
      state.units.clear(); state.projectiles.clear(); simulation.squads.clear();
      for (const lane of state.lanes.values()) {
        lane.unitIds.set('TEAM_PLAYER', []); lane.unitIds.set('TEAM_ENEMY', []); lane.projectileIds = [];
      }
      for (const [x, slot] of [[76, -29], [134, 29]]) {
        simulation.spawnUnit('TEAM_PLAYER', 'LANE_LEFT', 'drone', { x, y: 624, slotOffsetX: slot, spawnCycle: 901 });
        simulation.spawnUnit('TEAM_ENEMY', 'LANE_LEFT', 'drone', { x, y: 556, slotOffsetX: slot, spawnCycle: 902 });
      }
      for (let step = 0; step < 89; step += 1) simulation.step(1 / 60);
      g.camera.jumpToWorld(590);
      return { units: state.units.size, projectiles: state.projectiles.size };
    })()`,
    returnByValue: true,
  });
  assert.equal(droneQa.result.value.units, 4, "deterministic drone readability scene contains both pairs");
  assert.ok(droneQa.result.value.projectiles > 0, "deterministic drone readability scene captures live pulses");
  await delay(60);
  const droneQaScreenshot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  await writeFile(resolve(output, "level-2-qa-drone-duel-420x760.png"), Buffer.from(droneQaScreenshot.data, "base64"));

  const mixedQa = await send("Runtime.evaluate", {
    expression: `(() => {
      const g = window.__strategyGalalaxy;
      const simulation = g.match.simulation;
      const state = simulation.state;
      state.units.clear(); state.projectiles.clear(); simulation.squads.clear();
      for (const lane of state.lanes.values()) {
        lane.unitIds.set('TEAM_PLAYER', []); lane.unitIds.set('TEAM_ENEMY', []); lane.projectileIds = [];
      }
      const spawn = (team, lane, type, x, y, slot, cycle) => simulation.spawnUnit(team, lane, type, { x, y, slotOffsetX: slot, spawnCycle: cycle });
      spawn('TEAM_PLAYER', 'LANE_LEFT', 'fighter', 78, 666, -27, 911);
      spawn('TEAM_PLAYER', 'LANE_LEFT', 'bomber', 132, 690, 27, 911);
      spawn('TEAM_ENEMY', 'LANE_LEFT', 'fighter', 78, 522, -27, 912);
      spawn('TEAM_ENEMY', 'LANE_LEFT', 'bomber', 132, 500, 27, 912);
      spawn('TEAM_PLAYER', 'LANE_RIGHT', 'frigate', 286, 660, -29, 913);
      spawn('TEAM_PLAYER', 'LANE_RIGHT', 'scout', 344, 678, 29, 913);
      spawn('TEAM_ENEMY', 'LANE_RIGHT', 'frigate', 286, 520, -29, 914);
      spawn('TEAM_ENEMY', 'LANE_RIGHT', 'scout', 344, 502, 29, 914);
      for (let step = 0; step < 120; step += 1) simulation.step(1 / 60);
      for (const unit of state.units.values()) unit.fireCooldown = 0;
      simulation.step(1 / 60);
      g.camera.jumpToWorld(590);
      return { units: state.units.size, projectileTypes: [...new Set([...state.projectiles.values()].map((projectile) => projectile.projectileType))] };
    })()`,
    returnByValue: true,
  });
  assert.ok(mixedQa.result.value.units >= 6, "deterministic mixed-fleet scene retains readable combatants");
  assert.ok(mixedQa.result.value.projectileTypes.length >= 2, "deterministic mixed-fleet scene displays multiple weapon families");
  await delay(60);
  const mixedQaScreenshot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  await writeFile(resolve(output, "level-2-qa-mixed-combat-420x760.png"), Buffer.from(mixedQaScreenshot.data, "base64"));

  for (const [team, y, direction] of [['TEAM_PLAYER', 610, -1], ['TEAM_ENEMY', 535, 1]]) {
    await send("Runtime.evaluate", {
      expression: `(() => {
        const g = window.__strategyGalalaxy;
        const simulation = g.match.simulation;
        const state = simulation.state;
        state.units.clear(); state.projectiles.clear(); state.events.length = 0; simulation.squads.clear(); g.effects.reset();
        for (const lane of state.lanes.values()) {
          lane.unitIds.set('TEAM_PLAYER', []); lane.unitIds.set('TEAM_ENEMY', []); lane.projectileIds = [];
        }
        ['drone', 'scout', 'fighter', 'bomber', 'frigate'].forEach((type, index) => {
          const unit = simulation.spawnUnit('${team}', index < 3 ? 'LANE_LEFT' : 'LANE_RIGHT', type, { x: 52 + index * 78, y: ${y}, spawnCycle: 940 + index });
          unit.launching = false; unit.heading = ${direction} < 0 ? -Math.PI / 2 : Math.PI / 2;
          unit.vx = 0; unit.vy = (${direction}) * 28; unit.state = 'ADVANCING'; unit.fireCooldown = 99; unit.lastDamagedAt = -999;
        });
        g.camera.jumpToWorld(580);
      })()`,
    });
    await delay(80);
    const engineScreenshot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
    await writeFile(resolve(output, `level-2-qa-${team === 'TEAM_PLAYER' ? 'player' : 'enemy'}-engines-420x760.png`), Buffer.from(engineScreenshot.data, "base64"));
  }

  const destructionQa = await send("Runtime.evaluate", {
    expression: `(() => {
      const g = window.__strategyGalalaxy;
      const simulation = g.match.simulation;
      const state = simulation.state;
      state.units.clear(); state.projectiles.clear(); simulation.squads.clear();
      for (const lane of state.lanes.values()) {
        lane.unitIds.set('TEAM_PLAYER', []); lane.unitIds.set('TEAM_ENEMY', []); lane.projectileIds = [];
      }
      const attacker = simulation.spawnUnit('TEAM_PLAYER', 'LANE_LEFT', 'frigate', { x: 82, y: 635, slotOffsetX: -23, spawnCycle: 921 });
      const fighter = simulation.spawnUnit('TEAM_ENEMY', 'LANE_LEFT', 'fighter', { x: 94, y: 532, slotOffsetX: -11, spawnCycle: 922 });
      const bomber = simulation.spawnUnit('TEAM_ENEMY', 'LANE_LEFT', 'bomber', { x: 133, y: 548, slotOffsetX: 28, spawnCycle: 922 });
      fighter.hp = 1; bomber.hp = 1; attacker.fireCooldown = 0;
      for (let step = 0; step < 150 && !state.events.some((event) => event.type === 'destroyed' && event.time > state.time - 2); step += 1) simulation.step(1 / 60);
      g.effects.observe(state.events);
      g.camera.jumpToWorld(590);
      return { destroyed: state.events.filter((event) => event.type === 'destroyed').slice(-2).map((event) => event.entityType), effects: g.effects.effects.filter((effect) => effect.type === 'destroyed').length };
    })()`,
    returnByValue: true,
  });
  assert.ok(destructionQa.result.value.destroyed.length > 0, "deterministic destruction scene kills at least one ship");
  assert.ok(destructionQa.result.value.effects > 0, "destruction events create authored presentation effects");
  await delay(180);
  const destructionQaScreenshot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  await writeFile(resolve(output, "level-2-qa-destruction-420x760.png"), Buffer.from(destructionQaScreenshot.data, "base64"));

  const reports = [];
  for (const [width, height] of viewports) {
    await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: true, screenWidth: width, screenHeight: height });
    loaded = waitEvent("Page.loadEventFired");
    await send("Page.navigate", { url: `http://127.0.0.1:${serverPort}/?test=match&debug=1&seed=${width + height}` });
    await loaded;
    await waitForGame();

    const snapshotResult = await send("Runtime.evaluate", {
      expression: `(() => { const g = window.__strategyGalalaxy; const r = g.canvas.getBoundingClientRect(); return { innerWidth, innerHeight, state: g.state, transform: g.getViewportSnapshot(), camera: g.getCameraSnapshot(), canvas: { x: r.x, y: r.y, width: r.width, height: r.height }, assetFailures: g.loader.errors.length, playerUnits: [...g.match.simulation.state.lanes.values()].flatMap((lane) => lane.unitIds.get('TEAM_PLAYER')).length }; })()`,
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
    assert.equal(snapshot.camera.worldHeight, 1180);
    assert.ok(Math.abs(snapshot.camera.y - snapshot.camera.maximumY) < 0.01, "match begins focused on the player sector");

    const designHeight = snapshot.transform.designHeight;
    const touchX = 70 * snapshot.transform.scale;
    await touch(touchX, (designHeight - 42) * snapshot.transform.scale);
    const openResult = await send("Runtime.evaluate", { expression: "window.__strategyGalalaxy.commandDockOpen", returnByValue: true });
    assert.equal(openResult.result.value, true, `${width}x${height} compact command dock expands`);
    await touch(touchX, (designHeight - 141) * snapshot.transform.scale);
    const deploymentResult = await send("Runtime.evaluate", { expression: "[...window.__strategyGalalaxy.match.simulation.state.lanes.values()].flatMap((lane) => lane.unitIds.get('TEAM_PLAYER')).length", returnByValue: true });
    assert.equal(deploymentResult.result.value, snapshot.playerUnits + 3, `${width}x${height} touch immediately launches a three-ship Scout Wing`);
    await touch(206 * snapshot.transform.scale, (designHeight - 195) * snapshot.transform.scale);

    const panX = 210 * snapshot.transform.scale;
    const panFromY = (snapshot.camera.viewport.y + 110) * snapshot.transform.scale;
    const panToY = (snapshot.camera.viewport.y + Math.min(snapshot.camera.viewport.height - 50, 330)) * snapshot.transform.scale;
    await drag(panX, panFromY, panToY);
    const panned = await send("Runtime.evaluate", { expression: "window.__strategyGalalaxy.getCameraSnapshot()", returnByValue: true });
    assert.ok(panned.result.value.y < snapshot.camera.y - 80, `${width}x${height} direct drag pans the camera toward the rival sector`);

    const navigatorY = (snapshot.camera.viewport.y + snapshot.camera.viewport.height / 2) * snapshot.transform.scale;
    await touch(405 * snapshot.transform.scale, navigatorY);
    const centered = await send("Runtime.evaluate", { expression: "window.__strategyGalalaxy.getCameraSnapshot()", returnByValue: true });
    assert.ok(Math.abs(centered.result.value.y - centered.result.value.maximumY / 2) < 2, `${width}x${height} strategic navigator centers the battlefield`);

    if (width === 420 && height === 760) {
      await touch(323, 29);
      let utilityState = await send("Runtime.evaluate", { expression: "window.__strategyGalalaxy.state", returnByValue: true });
      assert.equal(utilityState.result.value, "PAUSED", "pause control freezes the live match");
      await touch(323, 29);
      utilityState = await send("Runtime.evaluate", { expression: "window.__strategyGalalaxy.state", returnByValue: true });
      assert.equal(utilityState.result.value, "LIVE_MATCH", "pause control resumes the match");
      const soundBefore = await send("Runtime.evaluate", { expression: "window.__strategyGalalaxy.sound.enabled", returnByValue: true });
      await touch(358, 29);
      const soundMuted = await send("Runtime.evaluate", { expression: "window.__strategyGalalaxy.sound.enabled", returnByValue: true });
      assert.equal(soundMuted.result.value, !soundBefore.result.value, "sound control toggles audio");
      await touch(358, 29);
      const soundRestored = await send("Runtime.evaluate", { expression: "window.__strategyGalalaxy.sound.enabled", returnByValue: true });
      assert.equal(soundRestored.result.value, soundBefore.result.value, "sound control restores its prior state");
      await touch(70, 718);
      await touch(300, 565);
      const upgradeMenu = await send("Runtime.evaluate", { expression: "window.__strategyGalalaxy.commandMenu", returnByValue: true });
      assert.equal(upgradeMenu.result.value, "upgrades", "upgrade projects are touch-operable");
      await send("Runtime.evaluate", { expression: "window.__strategyGalalaxy.match.economy.get('TEAM_PLAYER').energy = 300" });
      await touch(82, 619);
      const activeUpgrade = await send("Runtime.evaluate", { expression: "window.__strategyGalalaxy.match.economy.get('TEAM_PLAYER').economyLevel", returnByValue: true });
      assert.equal(activeUpgrade.result.value, 1, "upgrade activates immediately during the live match");
      await touch(405, centered.result.value.viewport.y + centered.result.value.viewport.height - 14);
      await delay(60);
      const activeScreenshot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
      await writeFile(resolve(output, "upgrades-active-420x760.png"), Buffer.from(activeScreenshot.data, "base64"));
      await touch(206, 565);
    }

    const screenshot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
    await writeFile(resolve(output, `match-${width}x${height}.png`), Buffer.from(screenshot.data, "base64"));
    if (width === 420 && height === 760) {
      await delay(1400);
      const cameraState = centered.result.value;
      await touch(405 * snapshot.transform.scale, (cameraState.viewport.y + cameraState.viewport.height - 14) * snapshot.transform.scale);
      const damageResult = await send("Runtime.evaluate", {
        expression: `(() => { const structure = window.__strategyGalalaxy.match.simulation.state.structures.get('player-hq'); structure.hp = structure.maxHp * 0.25; return window.__strategyGalalaxy.match.lastDeploymentAt; })()`,
        returnByValue: true,
      });
      assert.ok(Number.isFinite(damageResult.result.value), "latest deployment timestamp remains available for HQ door animation");
      await delay(80);
      const damageScreenshot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
      await writeFile(resolve(output, "structures-closed-damaged-420x760.png"), Buffer.from(damageScreenshot.data, "base64"));
      const combatState = await send("Runtime.evaluate", {
        expression: `(() => { const g = window.__strategyGalalaxy; for (const structure of g.match.simulation.state.structures.values()) structure.hp = structure.maxHp; for (let step = 0; step < 60 * 60 && g.state === 'LIVE_MATCH'; step += 1) g.match.advanceLive(1 / 60); g.camera.jumpToWorld(590); const units = [...g.match.simulation.state.units.values()]; return { state: g.state, units: units.length, moving: units.filter((unit) => Math.hypot(unit.vx, unit.vy) > 1).length, headings: units.every((unit) => Number.isFinite(unit.heading)) }; })()`,
        returnByValue: true,
      });
      assert.equal(combatState.result.value.state, "LIVE_MATCH", "formation QA point remains inside an active match");
      assert.ok(combatState.result.value.units >= 8, "formation QA point contains a readable fleet");
      assert.ok(combatState.result.value.moving > 0 && combatState.result.value.headings, "ships expose authoritative eased movement and headings");
      await delay(80);
      const combatScreenshot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
      await writeFile(resolve(output, "combat-formations-420x760.png"), Buffer.from(combatScreenshot.data, "base64"));
    }
    reports.push({ width, height, designHeight: Math.round(designHeight * 10) / 10, scale: Math.round(snapshot.transform.scale * 1000) / 1000, camera: "passed", touch: "passed" });
  }
  assert.deepEqual(failures, []);
  console.log(JSON.stringify({ browser, reports, failures }, null, 2));
} finally {
  try { if (socket?.readyState === WebSocket.OPEN) await send("Browser.close"); } catch {}
  socket?.close();
  browserProcess.kill();
  staticServer.close();
  await rm(browserProfile, { recursive: true, force: true, maxRetries: 4, retryDelay: 125 }).catch(() => {});
}
