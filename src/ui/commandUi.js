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

export const containsPoint = (rect, point) => point.x >= rect.x && point.x <= rect.x + rect.width && point.y >= rect.y && point.y <= rect.y + rect.height;

export const commandActionAt = (point, menu = "units") => {
  const lane = COMMAND_UI.lanes.find((rect) => containsPoint(rect, point));
  if (lane) return { type: "SELECT_LANE", laneId: lane.laneId };
  if (menu === "units") {
    const unit = COMMAND_UI.units.find((rect) => containsPoint(rect, point));
    if (unit) return { type: "QUEUE_UNIT", unitType: unit.unitType };
  } else {
    const upgrade = COMMAND_UI.upgrades.find((rect) => containsPoint(rect, point));
    if (upgrade) return { type: "BUY_UPGRADE", upgradeId: upgrade.upgradeId };
  }
  if (containsPoint(COMMAND_UI.undo, point)) return { type: "REMOVE_LAST_UNIT" };
  if (containsPoint(COMMAND_UI.menu, point)) return { type: "TOGGLE_MENU" };
  if (containsPoint(COMMAND_UI.deploy, point)) return { type: "DEPLOY" };
  return null;
};

export const fullscreenActionAt = (point) => (containsPoint(COMMAND_UI.fullscreen, point) ? { type: "TOGGLE_FULLSCREEN" } : null);
