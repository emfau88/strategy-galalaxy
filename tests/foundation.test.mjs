import assert from "node:assert/strict";
import { GameClock } from "../src/core/clock.js";
import { MATCH_STATE } from "../src/core/constants.js";
import { SeededRng } from "../src/core/rng.js";
import { computeViewportTransform, toDesignPoint } from "../src/core/viewport.js";
import { AssetLoader } from "../src/rendering/assetLoader.js";

const timing = { fixedStepSeconds: 1 / 60, maxFrameDeltaSeconds: 0.1, maxCatchUpSteps: 6 };
const targetViewports = [[360, 800], [390, 844], [393, 852], [412, 915], [420, 760]];
for (const [viewportWidth, viewportHeight] of targetViewports) {
  const transform = computeViewportTransform({ viewportWidth, viewportHeight, designWidth: 420, designHeight: 760, devicePixelRatio: 2, maxDevicePixelRatio: 1.5 });
  assert.ok(transform.scale > 0, `${viewportWidth}x${viewportHeight} receives a positive scale`);
  assert.ok(transform.contentWidth <= viewportWidth + 0.001);
  assert.ok(transform.contentHeight <= viewportHeight + 0.001);
  const center = toDesignPoint(transform.offsetX + 210 * transform.scale, transform.offsetY + 380 * transform.scale, { left: 0, top: 0 }, transform);
  assert.ok(Math.abs(center.x - 210) < 0.0001);
  assert.ok(Math.abs(center.y - 380) < 0.0001);
}

const clock = new GameClock(timing);
clock.advance(1, MATCH_STATE.COMMAND);
assert.equal(clock.phaseElapsed, 0.1);
assert.equal(clock.simulationTime, 0);
clock.advance(0.05, MATCH_STATE.BATTLE);
assert.equal(clock.simulationTime, 0.05);
const frozenSimulation = clock.simulationTime;
const frozenPhase = clock.phaseElapsed;
clock.advance(0.05, MATCH_STATE.PAUSED);
assert.equal(clock.simulationTime, frozenSimulation);
assert.equal(clock.phaseElapsed, frozenPhase);
assert.equal(clock.frameTime, 0.2);

const first = new SeededRng(77);
const second = new SeededRng(77);
assert.deepEqual([first.next(), first.next(), first.next()], [second.next(), second.next(), second.next()]);

const loader = await new AssetLoader(Object.freeze({})).load();
assert.equal(loader.progress, 1);
assert.equal(loader.isSettled, true);

console.log(`Foundation checks passed for ${targetViewports.length} target viewports.`);
