import assert from "node:assert/strict";
import { expansionUiLayout } from "../src/ui/expansionUi.js";
import { stationUiLayout } from "../src/ui/stationUi.js";
import { campaignUiLayout, campaignResultLayout } from "../src/ui/campaignUi.js";
import { abilityUiLayout } from "../src/ui/abilityUi.js";
import { commandUiLayout } from "../src/ui/commandUi.js";
import { TEAM } from "../src/core/constants.js";
import { STORAGE_KEYS } from "../src/experiment.js";

export const checkActOne = async ({ evaluate, tap, capture, send, delay, waitReady }) => {
  const read = expression => evaluate(`(() => {const g=window.__lastShipyard,d=g.match;return (${expression});})()`);
  const run = body => evaluate(`(() => {const g=window.__lastShipyard,d=g.match;${body}})()`);
  const old = await evaluate(`localStorage.getItem(${JSON.stringify(STORAGE_KEYS.progress)})`);
  let height = await read("g.transform.designHeight"), ui = expansionUiLayout(height);
  await tap(ui.entry); await tap(ui.campaign); await capture("act-one-locked-overview.png");
  await tap(ui.missions[1]); await tap(ui.start); assert.equal(await read("d.state"), "TITLE");
  await tap(ui.back); await tap(ui.missions[0]);
  const alpha = await run("const a=g.loader.get('homeport-stations'),c=document.createElement('canvas');c.width=a.naturalWidth;c.height=a.naturalHeight;const x=c.getContext('2d');x.drawImage(a,0,0);return {width:c.width,height:c.height,corner:x.getImageData(0,0,1,1).data[3],gate:x.getImageData(Math.floor(c.width*.75),Math.floor(c.height*.5),1,1).data[3]}");
  assert.equal(alpha.width, alpha.height * 2); assert.equal(alpha.corner, 0); assert.equal(alpha.gate, 0);
  for (let number = 1; number <= 4; number++) {
    await evaluate("(window.__lastShipyard.levelLoadPromise ?? Promise.resolve()).then(()=>true)");
    assert.equal(await read("g.expansion.canStart(g.selectedExpansionId)"), true);
    await capture(`act-one-m${number}-briefing.png`); await tap(ui.start);
    assert.equal(await read("d.mission.number"), number); assert.equal(await read("g.expansionRunMode"), "campaign");
    if (number === 3) {
      const station = stationUiLayout(height, 2);
      for (const rect of station.pads) { await tap(rect); await tap(station.action); }
      assert.equal(await read("[...d.simulation.state.structures.values()].filter(s=>s.padId).length"), 2);
      await tap(station.objective); await capture("act-one-harbor-two-builds.png"); await tap(station.close);
    }
    const lanes = await read("d.mapDefinition.lanes.map(l=>l.id)");
    const rules = await read("d.config.rules");
    const dock = commandUiLayout(height, lanes, false);
    await tap(dock.command);
    await capture(`act-one-m${number}-fleet.png`);
    await tap(commandUiLayout(height, lanes, true, "units", rules).units[number === 3 ? 1 : 0]);
    await run("g.setCommandDockOpen(false)");
    if (number === 4) {
      const station = stationUiLayout(height);
      await tap(station.objective); await tap(abilityUiLayout().aegis);
      assert.equal(await read("d.aegis.protects(d.simulation.state.structures.get('evacuation-gate'))"), true);
      await capture("act-one-gate-aegis.png"); await tap(station.close);
    }
    const outcome = await run(`let bought=0;for(let frame=0;frame<240*60&&d.state==='LIVE_MATCH';frame++){
      if(frame%60===0){
        if(d.mission.number===4&&frame>=8*60)d.executeCommand({type:'START_PROJECT',team:'${TEAM.PLAYER}',stationId:'evacuation-gate'});
        const lane=d.mapDefinition.lanes[d.mission.number===4?bought%2:0].id;
        const type=d.mission.number===3?['fighter','bomber','fighter'][bought%3]:'fighter';
        if(d.executeCommand({type:'DEPLOY_UNIT',team:'${TEAM.PLAYER}',laneId:lane,unitType:type}).ok)bought++;
      }d.advanceLive(1/60);
    }g.syncMatchState();return {state:d.state,seconds:d.activeMatchSeconds,completed:g.expansion.data.completed,unlocks:g.expansion.snapshot().unlocks};`);
    assert.equal(outcome.state, "VICTORY", `Act I mission ${number}`); assert.equal(outcome.completed.length, number);
    assert.deepEqual(outcome.unlocks, ["bastion", "bomber", "aegis", "frigate"].slice(0, number));
    await delay(80); await capture(`act-one-m${number}-victory.png`);
    if (number < 4) { await tap(campaignResultLayout(height).next); assert.equal(await read("g.menuScreen"), "expansion-map"); }
    else await tap(campaignResultLayout(height).menu);
  }
  assert.equal(await read("g.expansion.snapshot().harborActive"), true);
  await capture("act-one-harbor-active.png");
  for (const [width, h] of [[360, 640], [390, 844]]) {
    await send("Emulation.setDeviceMetricsOverride", { width, height: h, deviceScaleFactor: 1, mobile: true });
    await delay(100); await capture(`act-one-overview-${width}x${h}.png`);
  }
  await send("Emulation.setDeviceMetricsOverride", { width: 360, height: 800, deviceScaleFactor: 1, mobile: true }); await delay(100);
  height = await read("g.transform.designHeight"); ui = expansionUiLayout(height);
  await tap(ui.pilots); assert.deepEqual(await read("g.expansion.data.pilotCompleted"), []);
  assert.equal(await read("g.expansion.canStart('v2-last-ferry')"), true);
  await tap(ui.campaign); await tap(ui.missions[7]);
  assert.equal(await evaluate(`localStorage.getItem(${JSON.stringify(STORAGE_KEYS.progress)})`), old);
  await send("Page.reload", { ignoreCache: true }); await delay(100); await waitReady();
  assert.equal(await read("g.expansion.data.completed.length"), 4);
  assert.equal(await read("g.expansion.snapshot().harborActive"), true);
  assert.deepEqual(await read("g.expansion.data.pilotCompleted"), []);
  await tap(campaignUiLayout(height).campaign);
};
