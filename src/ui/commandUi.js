import { LANE } from "../core/constants.js";

export const COMMAND_UI = Object.freeze({
  lanes: Object.freeze([
    Object.freeze({ laneId: LANE.LEFT, x: 18, y: 106, width: 184, height: 44 }),
    Object.freeze({ laneId: LANE.RIGHT, x: 218, y: 106, width: 184, height: 44 }),
  ]),
  undo: Object.freeze({ x: 168, y: 512, width: 118, height: 44 }),
  units: Object.freeze([
    Object.freeze({ unitType: "scout", x: 16, y: 566, width: 132, height: 46 }),
    Object.freeze({ unitType: "fighter", x: 154, y: 566, width: 132, height: 46 }),
    Object.freeze({ unitType: "bomber", x: 16, y: 618, width: 132, height: 46 }),
    Object.freeze({ unitType: "frigate", x: 154, y: 618, width: 132, height: 46 }),
  ]),
  upgrades: Object.freeze([
    Object.freeze({ upgradeId: "economy", x: 16, y: 678, width: 132, height: 50 }),
    Object.freeze({ upgradeId: "turret", x: 154, y: 678, width: 132, height: 50 }),
  ]),
  deploy: Object.freeze({ x: 294, y: 566, width: 110, height: 162 }),
});

export const containsPoint = (rect, point) => point.x >= rect.x && point.x <= rect.x + rect.width && point.y >= rect.y && point.y <= rect.y + rect.height;

export const commandActionAt = (point) => {
  const lane = COMMAND_UI.lanes.find((rect) => containsPoint(rect, point));
  if (lane) return { type: "SELECT_LANE", laneId: lane.laneId };
  const unit = COMMAND_UI.units.find((rect) => containsPoint(rect, point));
  if (unit) return { type: "QUEUE_UNIT", unitType: unit.unitType };
  const upgrade = COMMAND_UI.upgrades.find((rect) => containsPoint(rect, point));
  if (upgrade) return { type: "BUY_UPGRADE", upgradeId: upgrade.upgradeId };
  if (containsPoint(COMMAND_UI.undo, point)) return { type: "REMOVE_LAST_UNIT" };
  if (containsPoint(COMMAND_UI.deploy, point)) return { type: "DEPLOY" };
  return null;
};
