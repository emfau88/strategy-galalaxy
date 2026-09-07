import { LANE } from "../core/constants.js";

export const COMMAND_UI = Object.freeze({
  fullscreen: Object.freeze({ x: 378, y: 12, width: 34, height: 34 }),
  pause: Object.freeze({ x: 308, y: 12, width: 30, height: 34 }),
  sound: Object.freeze({ x: 343, y: 12, width: 30, height: 34 }),
  lanes: Object.freeze([
    Object.freeze({ laneId: LANE.LEFT, x: 16, y: 586, width: 70, height: 44 }),
    Object.freeze({ laneId: LANE.RIGHT, x: 92, y: 586, width: 70, height: 44 }),
  ]),
  undo: Object.freeze({ x: 172, y: 586, width: 112, height: 44 }),
  menu: Object.freeze({ x: 292, y: 586, width: 112, height: 44 }),
  units: Object.freeze([
    Object.freeze({ unitType: "scout", x: 16, y: 638, width: 132, height: 50 }),
    Object.freeze({ unitType: "fighter", x: 154, y: 638, width: 132, height: 50 }),
    Object.freeze({ unitType: "bomber", x: 16, y: 696, width: 132, height: 50 }),
    Object.freeze({ unitType: "frigate", x: 154, y: 696, width: 132, height: 50 }),
  ]),
  upgrades: Object.freeze([
    Object.freeze({ upgradeId: "economy", x: 16, y: 638, width: 132, height: 50 }),
    Object.freeze({ upgradeId: "weapons", x: 154, y: 638, width: 132, height: 50 }),
    Object.freeze({ upgradeId: "turret", x: 16, y: 696, width: 132, height: 50 }),
    Object.freeze({ upgradeId: "logistics", x: 154, y: 696, width: 132, height: 50 }),
  ]),
  deploy: Object.freeze({ x: 294, y: 638, width: 110, height: 108 }),
  titleDifficulty: Object.freeze({ x: 104, y: 408, width: 212, height: 32 }),
  titleStart: Object.freeze({ x: 104, y: 448, width: 212, height: 38 }),
});

const shiftVertically = (rect, offsetY) => Object.freeze({ ...rect, y: rect.y + offsetY });

export const commandUiLayout = (height = 760) => {
  const lowerOffset = Math.max(0, height - 760);
  return Object.freeze({
    fullscreen: COMMAND_UI.fullscreen,
    lanes: Object.freeze(COMMAND_UI.lanes.map((rect) => shiftVertically(rect, lowerOffset))),
    panel: Object.freeze({ x: 8, y: 576 + lowerOffset, width: 404, height: 176 }),
    feedbackY: 566 + lowerOffset,
    debugY: 544 + lowerOffset,
    undo: shiftVertically(COMMAND_UI.undo, lowerOffset),
    menu: shiftVertically(COMMAND_UI.menu, lowerOffset),
    units: Object.freeze(COMMAND_UI.units.map((rect) => shiftVertically(rect, lowerOffset))),
    upgrades: Object.freeze(COMMAND_UI.upgrades.map((rect) => shiftVertically(rect, lowerOffset))),
    deploy: shiftVertically(COMMAND_UI.deploy, lowerOffset),
  });
};

export const containsPoint = (rect, point) => point.x >= rect.x && point.x <= rect.x + rect.width && point.y >= rect.y && point.y <= rect.y + rect.height;
const containsWithSlop = (rect, point, slop = 3) => containsPoint({ x: rect.x - slop, y: rect.y - slop, width: rect.width + slop * 2, height: rect.height + slop * 2 }, point);

export const commandActionAt = (point, menu = "units", height = 760) => {
  const layout = commandUiLayout(height);
  const lane = layout.lanes.find((rect) => containsWithSlop(rect, point));
  if (lane) return { type: "SELECT_LANE", laneId: lane.laneId };
  if (menu === "units") {
    const unit = layout.units.find((rect) => containsWithSlop(rect, point));
    if (unit) return { type: "QUEUE_UNIT", unitType: unit.unitType };
  } else {
    const upgrade = layout.upgrades.find((rect) => containsWithSlop(rect, point));
    if (upgrade) return { type: "BUY_UPGRADE", upgradeId: upgrade.upgradeId };
  }
  if (containsPoint(layout.undo, point)) return { type: "REMOVE_LAST_UNIT" };
  if (containsPoint(layout.menu, point)) return { type: "TOGGLE_MENU" };
  return null;
};

export const titleActionAt = (point, height = 760) => {
  const offsetY = height / 2 - 380;
  if (containsPoint({ ...COMMAND_UI.titleDifficulty, y: COMMAND_UI.titleDifficulty.y + offsetY }, point)) return { type: "CYCLE_DIFFICULTY" };
  if (containsPoint({ ...COMMAND_UI.titleStart, y: COMMAND_UI.titleStart.y + offsetY }, point)) return { type: "START_MATCH" };
  return null;
};

export const fullscreenActionAt = (point) => (containsPoint(COMMAND_UI.fullscreen, point) ? { type: "TOGGLE_FULLSCREEN" } : null);

export const utilityActionAt = (point) => {
  if (containsPoint(COMMAND_UI.pause, point)) return { type: "TOGGLE_PAUSE" };
  if (containsPoint(COMMAND_UI.sound, point)) return { type: "TOGGLE_SOUND" };
  return fullscreenActionAt(point);
};
