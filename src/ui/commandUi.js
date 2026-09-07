import { LANE } from "../core/constants.js";

export const COMMAND_UI = Object.freeze({
  fullscreen: Object.freeze({ x: 378, y: 12, width: 34, height: 34 }),
  lanes: Object.freeze([
    Object.freeze({ laneId: LANE.LEFT, x: 8, y: 64, width: 196, height: 82 }),
    Object.freeze({ laneId: LANE.RIGHT, x: 216, y: 64, width: 196, height: 82 }),
  ]),
  undo: Object.freeze({ x: 172, y: 612, width: 112, height: 34 }),
  menu: Object.freeze({ x: 292, y: 612, width: 112, height: 34 }),
  units: Object.freeze([
    Object.freeze({ unitType: "scout", x: 16, y: 654, width: 132, height: 42 }),
    Object.freeze({ unitType: "fighter", x: 154, y: 654, width: 132, height: 42 }),
    Object.freeze({ unitType: "bomber", x: 16, y: 702, width: 132, height: 42 }),
    Object.freeze({ unitType: "frigate", x: 154, y: 702, width: 132, height: 42 }),
  ]),
  upgrades: Object.freeze([
    Object.freeze({ upgradeId: "economy", x: 16, y: 654, width: 132, height: 42 }),
    Object.freeze({ upgradeId: "turret", x: 154, y: 654, width: 132, height: 42 }),
  ]),
  deploy: Object.freeze({ x: 294, y: 654, width: 110, height: 90 }),
});

const shiftVertically = (rect, offsetY) => Object.freeze({ ...rect, y: rect.y + offsetY });

export const commandUiLayout = (height = 760) => {
  const lowerOffset = Math.max(0, height - 760);
  return Object.freeze({
    fullscreen: COMMAND_UI.fullscreen,
    lanes: COMMAND_UI.lanes,
    panel: Object.freeze({ x: 8, y: 602 + lowerOffset, width: 404, height: 150 }),
    feedbackY: 588 + lowerOffset,
    pressure: Object.freeze({ x: 52, y: 562 + lowerOffset, width: 316, height: 32 }),
    debugY: 550 + lowerOffset,
    undo: shiftVertically(COMMAND_UI.undo, lowerOffset),
    menu: shiftVertically(COMMAND_UI.menu, lowerOffset),
    units: Object.freeze(COMMAND_UI.units.map((rect) => shiftVertically(rect, lowerOffset))),
    upgrades: Object.freeze(COMMAND_UI.upgrades.map((rect) => shiftVertically(rect, lowerOffset))),
    deploy: shiftVertically(COMMAND_UI.deploy, lowerOffset),
  });
};

export const containsPoint = (rect, point) => point.x >= rect.x && point.x <= rect.x + rect.width && point.y >= rect.y && point.y <= rect.y + rect.height;

export const commandActionAt = (point, menu = "units", height = 760) => {
  const layout = commandUiLayout(height);
  const lane = layout.lanes.find((rect) => containsPoint(rect, point));
  if (lane) return { type: "SELECT_LANE", laneId: lane.laneId };
  if (menu === "units") {
    const unit = layout.units.find((rect) => containsPoint(rect, point));
    if (unit) return { type: "QUEUE_UNIT", unitType: unit.unitType };
  } else {
    const upgrade = layout.upgrades.find((rect) => containsPoint(rect, point));
    if (upgrade) return { type: "BUY_UPGRADE", upgradeId: upgrade.upgradeId };
  }
  if (containsPoint(layout.undo, point)) return { type: "REMOVE_LAST_UNIT" };
  if (containsPoint(layout.menu, point)) return { type: "TOGGLE_MENU" };
  if (containsPoint(layout.deploy, point)) return { type: "DEPLOY" };
  return null;
};

export const fullscreenActionAt = (point) => (containsPoint(COMMAND_UI.fullscreen, point) ? { type: "TOGGLE_FULLSCREEN" } : null);
