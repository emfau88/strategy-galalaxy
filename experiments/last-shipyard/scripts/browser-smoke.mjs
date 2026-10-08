import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, writeFile, rm } from "node:fs/promises";
import { createServer as createNetServer } from "node:net";
import { resolve, sep } from "node:path";
import { createExperimentServer, experimentRoot } from "./dev-server.mjs";
import { campaignUiLayout } from "../src/ui/campaignUi.js";
import { commandUiLayout, overlayUiLayout, COMMAND_UI } from "../src/ui/commandUi.js";
import { STORAGE_KEYS, EXPERIMENT } from "../src/experiment.js";
import { MISSIONS } from "../src/data/campaign.js";
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
  console.error(JSON.stringify({ failures, responses: [...requests], page: await evaluate("({title:document.title,ready:document.readyState,game:typeof window.__lastShipyard,progress:window.__lastShipyard?.loader.progress,errors:window.__lastShipyard?.loader.errors})") }, null, 2));
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
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await delay(150); await capture("main-390x844.png");
  await send("Emulation.setDeviceMetricsOverride", { width: 360, height: 800, deviceScaleFactor: 1, mobile: true });
  await delay(150);
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
  if (!live && !process.argv.includes("--latest")) {
    // Verify the actual result -> next briefing -> second mission flow with legal purchases.
    const play = async () => {
      const result = await evaluate(`(() => {
        const g = window.__lastShipyard, d = g.match;
        const recipe = d.mission.id === 'first-contact' ? ['scout','fighter','fighter'] : ['fighter','bomber','scout','bomber','fighter'];
        let choice = 0, nextBuy = 0;
        while (d.state === 'LIVE_MATCH' && d.activeBattleSeconds < 420) {
          if (d.activeBattleSeconds >= nextBuy) {
            const bought = d.executeCommand({type:'DEPLOY_UNIT',team:'TEAM_PLAYER',laneId:d.mapDefinition.lanes[0].id,unitType:recipe[choice % recipe.length]});
            if (bought.ok) choice++; nextBuy = d.activeBattleSeconds + 2;
          }
          d.advanceLive(1/60);
        }
        g.syncMatchState(); return {state:g.state,completed:g.campaign.data.completed};
      })()`);
      assert.equal(result.state, 'VICTORY'); await delay(150); return result;
    };
    await tap(ui.campaign); await tap(ui.missions[0]); await tap(ui.start);
    await play(); await capture('mission1-unlock-360x800.png');
    const { campaignResultLayout } = await import('../src/ui/campaignUi.js');
    await tap(campaignResultLayout(transform.designHeight).next);
    assert.equal(await evaluate('window.__lastShipyard.selectedMissionId'), 'heavy-resistance');
    assert.equal(await evaluate('window.__lastShipyard.menuScreen'), 'briefing');
    await capture('mission2-briefing-360x800.png'); await tap(ui.start);
    await play(); await capture('mission2-unlock-360x800.png');
    assert.deepEqual(await evaluate('window.__lastShipyard.campaign.data.completed'), ['first-contact','heavy-resistance']);
    await tap(campaignResultLayout(transform.designHeight).next);
    assert.equal(await evaluate('window.__lastShipyard.selectedMissionId'), 'harbor-fire');
    assert.equal(await evaluate('window.__lastShipyard.campaign.data.equipment.ability'), 'aegis');
    await tap(ui.equipment);
    assert.equal(await evaluate('window.__lastShipyard.campaign.data.equipment.ability'), null);
    await tap(ui.equipment);
    await send('Page.reload', {ignoreCache:true}); await delay(150); await waitReady();
    assert.equal(await evaluate('window.__lastShipyard.campaign.data.equipment.ability'), 'aegis');
    // Last mission remains mission 2 until mission 3 actually starts; select 3 explicitly after reload.
    await tap(ui.campaign); await tap(ui.missions[2]);
    await capture('mission3-briefing-360x800.png');
    await send('Emulation.setDeviceMetricsOverride', {width:390,height:844,deviceScaleFactor:1,mobile:true}); await delay(150);
    await capture('mission3-briefing-390x844.png');
    await send('Emulation.setDeviceMetricsOverride', {width:360,height:800,deviceScaleFactor:1,mobile:true}); await delay(150);
    await tap(ui.start);
    const {abilityUiLayout} = await import('../src/ui/abilityUi.js');
    const abilityUi = abilityUiLayout();
    await tap(abilityUi.aegis);
    assert.ok(await evaluate('window.__lastShipyard.match.aegis.activeRemaining > 0'));
    await capture('aegis-active-360x800.png');
    await tap(COMMAND_UI.pause);
    const held = await evaluate('window.__lastShipyard.match.aegis.activeRemaining');
    await delay(200); assert.equal(await evaluate('window.__lastShipyard.match.aegis.activeRemaining'), held);
    await tap(overlayUiLayout(transform.designHeight).pauseResume);
    await play(); await capture('chapter1-result-360x800.png');
    assert.deepEqual(await evaluate('window.__lastShipyard.campaign.data.completed'), ['first-contact','heavy-resistance','harbor-fire']);
    await tap(campaignResultLayout(transform.designHeight).menu); await tap(ui.back);
    await capture('shipyard-revived-360x800.png');
    await send('Page.reload', {ignoreCache:true}); await delay(150); await waitReady();
    assert.deepEqual(await evaluate('window.__lastShipyard.campaign.data.completed'), ['first-contact','heavy-resistance','harbor-fire']);
    // Existing persistence assertions below intentionally start with a one-mission save.
    await evaluate('window.__lastShipyard.campaign.reset()');
  }
  if (!live && process.argv.includes('--latest')) {
    await evaluate("['first-contact','heavy-resistance','harbor-fire'].forEach(id=>window.__lastShipyard.campaign.complete(id))");
    await tap(ui.shipyard); assert.equal(await evaluate('window.__lastShipyard.menuScreen'),'shipyard');
    await capture('shipyard-loadout-360x800.png'); await tap(ui.back);
    await tap(ui.campaign); await tap(ui.missions[3]); await capture('mission4-briefing-360x800.png'); await tap(ui.start);
    const twoLanes = await evaluate('window.__lastShipyard.match.mapDefinition.lanes.map(l=>l.id)');
    await tap(commandUiLayout(transform.designHeight,twoLanes,false).command);
    const fleet = commandUiLayout(transform.designHeight,twoLanes,true,'units',{units:['scout','fighter','bomber','frigate'],upgrades:[]});
    await tap(fleet.lanes[1]); assert.equal(await evaluate('window.__lastShipyard.selectedLaneId'),twoLanes[1]);
    await tap(fleet.undo); assert.equal(await evaluate('window.__lastShipyard.match.simulation.state.laneStances.get(window.__lastShipyard.selectedLaneId)'),'hold');
    await tap(fleet.undo); await tap(fleet.units[2]); await capture('mission4-two-lanes-360x800.png');
    const playLatest = async () => {
      const result=await evaluate(`(() => {
        const g=window.__lastShipyard,d=g.match,lanes=d.mapDefinition.lanes.map(l=>l.id);
        const recipe=d.mission.id==='split-front'?[['frigate',0],['fighter',1],['bomber',1],['scout',0],['bomber',1],['fighter',1]]:[['frigate',0],['fighter',0],['bomber',0],['bomber',0],['fighter',0]];
        let choice=0,nextBuy=d.activeBattleSeconds,switched=false;
        while(d.state==='LIVE_MATCH'&&d.activeBattleSeconds<480){
          if(d.mission.id==='the-window'&&d.missionRuntime.phase==='recovery'&&!switched){d.executeCommand({type:'SET_LANE_STANCE',team:'TEAM_PLAYER',laneId:lanes[0],stance:'push'});switched=true;}
          if(d.activeBattleSeconds>=nextBuy){const [unitType,lane]=recipe[choice%recipe.length];if(d.executeCommand({type:'DEPLOY_UNIT',team:'TEAM_PLAYER',laneId:lanes[lane],unitType}).ok)choice++;nextBuy=d.activeBattleSeconds+2;}
          d.advanceLive(1/60);
        }
        g.syncMatchState();return d.state;
      })()`);
      assert.equal(result,'VICTORY');await delay(150);
    };
    await playLatest(); await capture('ion-bomber-unlock-360x800.png');
    const {campaignResultLayout}=await import('../src/ui/campaignUi.js');
    await tap(campaignResultLayout(transform.designHeight).menu); await tap(ui.back); await tap(ui.shipyard); await tap(ui.bomber);
    assert.equal(await evaluate('window.__lastShipyard.campaign.data.equipment.bomberVariant'),'ion');
    await capture('ion-loadout-360x800.png'); await tap(ui.back); await tap(ui.campaign); await tap(ui.missions[4]); await tap(ui.start);
    assert.equal(await evaluate('window.__lastShipyard.match.config.rules.bomberVariant'),'ion');
    await playLatest(); await capture('disruption-unlock-360x800.png');
    await tap(campaignResultLayout(transform.designHeight).menu);await tap(ui.back);await tap(ui.shipyard);await tap(ui.ability);
    assert.equal(await evaluate('window.__lastShipyard.campaign.data.equipment.ability'),'disrupt');
    await send('Page.reload',{ignoreCache:true});await delay(150);await waitReady();
    assert.equal(await evaluate('window.__lastShipyard.campaign.data.equipment.ability'),'disrupt');
    assert.equal(await evaluate('window.__lastShipyard.campaign.data.equipment.bomberVariant'),'ion');
    await tap(ui.campaign);await tap(ui.missions[4]);await tap(ui.start);
    await evaluate('for(let i=0;i<17*60;i++)window.__lastShipyard.match.advanceLive(1/60)');
    const {abilityUiLayout}=await import('../src/ui/abilityUi.js');await tap(abilityUiLayout().aegis);
    assert.ok(await evaluate('window.__lastShipyard.match.disrupt.activeRemaining>0'));
    await evaluate("window.__lastShipyard.camera.reset('enemy')");await delay(100);await capture('disruption-active-360x800.png');
    await tap(COMMAND_UI.pause);await tap(overlayUiLayout(transform.designHeight).pauseMenu);
    await evaluate('window.__lastShipyard.campaign.reset()');
  }
  // A direct API check also exercises storage isolation without repeating battle simulations publicly.
  assert.equal(await evaluate("window.__lastShipyard.campaign.complete('first-contact')"), true);
  await send("Page.reload", { ignoreCache: true });
  await delay(150);
  await waitReady();
  assert.deepEqual(await evaluate("window.__lastShipyard.campaign.data.completed"), ["first-contact"]);
  assert.equal(await evaluate("window.__lastShipyard.sound.muted"), true);
  for (const [key, value] of Object.entries(classic)) assert.equal(await evaluate(`localStorage.getItem(${JSON.stringify(key)})`), value, "Classic storage unchanged");
  assert.ok([...requests].every(address => address.startsWith(origin + prefix) || address === origin + "/favicon.ico"), "All runtime requests stay in experiment subpath");
  if (live) {
    const metadata = await evaluate("fetch('version.json?acceptance=bulk3').then(response=>response.json())");
    assert.equal(metadata.version, EXPERIMENT.version);
    assert.deepEqual(metadata.playableMissions, MISSIONS.filter(m => m.available).map(m => m.id));
    assert.equal(await evaluate("window.__lastShipyard.campaign.complete('heavy-resistance')"), true);
    await tap(ui.campaign); await tap(ui.missions[2]); await tap(ui.start);
    assert.equal(await evaluate('window.__lastShipyard.match.mission.id'), 'harbor-fire');
    const {abilityUiLayout} = await import('../src/ui/abilityUi.js');
    await tap(abilityUiLayout().aegis);
    assert.ok(await evaluate('window.__lastShipyard.match.aegis.activeRemaining > 0'));
    await capture('public-aegis-360x800.png');
    await tap(COMMAND_UI.pause); await tap(overlayUiLayout(transform.designHeight).pauseMenu);
    await send('Page.reload', {ignoreCache:true}); await delay(150); await waitReady();
    assert.equal(await evaluate('window.__lastShipyard.campaign.data.equipment.ability'), 'aegis');
  }
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
  const report = { result: "PASS", mode: live ? "public" : siteMode ? "built-site" : "standalone", classicStarts: siteMode, viewport: "360x800", prefix, runtimeRequests: requests.size, checks: ["own menu identity", "active assets", "touch start and purchase", "pause and return", "own progress and sound reload", "Classic sentinel unchanged", "no requests outside experiment", "own progress reset", "Classic after reset", ...(live ? ["published campaign version", "unlocked harbor start and Aegis touch", "equipment reload"] : (process.argv.includes("--latest") ? ["two-lane stance and purchase", "mission4/5 victories", "ion/ability loadout reload", "disruption touch"] : ["three mission victories", "equipment toggle and reload", "Aegis touch and pause", "chapter reward"]))], completedVia: live ? "persistence API; public smoke avoids repeating balance runs" : `${process.argv.includes("--latest") ? "missions 4 and 5" : "missions 1 to 3"} through legal purchases; real result/unlock/equipment flow`, failures };
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
