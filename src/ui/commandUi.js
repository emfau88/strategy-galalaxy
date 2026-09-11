import { LANE } from "../core/constants.js";

export const COMMAND_UI = Object.freeze({
  fullscreen: Object.freeze({ x: 378, y: 12, width: 34, height: 34 }),
  pause: Object.freeze({ x: 308, y: 12, width: 30, height: 34 }),
  sound: Object.freeze({ x: 343, y: 12, width: 30, height: 34 }),
  titleLevel: Object.freeze({ x: 104, y: 398, width: 212, height: 32 }),
  titleDifficulty: Object.freeze({ x: 104, y: 438, width: 212, height: 32 }),
  titleStart: Object.freeze({ x: 104, y: 478, width: 212, height: 38 }),
});

const freezeRect = (rect) => Object.freeze(rect);

export const commandUiLayout = (height = 760, laneIds = [LANE.LEFT, LANE.RIGHT], expanded = false, menu = "units") => {
  if (!expanded) {
    const y = height - 66;
    return Object.freeze({
      expanded: false,
      fullscreen: COMMAND_UI.fullscreen,
      panel: freezeRect({ x: 8, y: height - 68, width: 404, height: 60 }),
      command: freezeRect({ x: 14, y, width: 126, height: 48 }),
      deploy: freezeRect({ x: 146, y, width: 150, height: 48 }),
      status: freezeRect({ x: 302, y, width: 104, height: 48 }),
      feedbackY: height - 80,
      debugY: height - 102,
      lanes: Object.freeze([]), units: Object.freeze([]), upgrades: Object.freeze([]),
    });
  }

  const upgradeMenu = menu === "upgrades";
  const panelHeight = upgradeMenu ? 274 : 218;
  const y = height - panelHeight - 8;
  const footerOffset = upgradeMenu ? 230 : 174;
  const laneWidth = laneIds.length === 1 ? 90 : 43;
  const lanes = laneIds.map((laneId, index) => freezeRect({ laneId, x: 16 + index * (laneWidth + 4), y: y + footerOffset, width: laneWidth, height: 36 }));
  const cards = (key, ids) => ids.map((id, index) => freezeRect({
    [key]: id,
    x: index % 2 ? 210 : 16,
    y: y + 60 + Math.floor(index / 2) * 56,
    width: index % 2 ? 194 : 188,
    height: 50,
  }));
  return Object.freeze({
    expanded: true,
    fullscreen: COMMAND_UI.fullscreen,
    panel: freezeRect({ x: 8, y, width: 404, height: panelHeight }),
    close: freezeRect({ x: 198, y: y + 11, width: 16, height: 40 }),
    fleetTab: freezeRect({ x: 16, y: y + 10, width: 186, height: 42 }),
    upgradeTab: freezeRect({ x: 210, y: y + 10, width: 194, height: 42 }),
    lanes: Object.freeze(lanes),
    undo: freezeRect({ x: 112, y: y + footerOffset, width: 58, height: 36 }),
    deploy: freezeRect({ x: 174, y: y + footerOffset, width: 126, height: 36 }),
    status: freezeRect({ x: 304, y: y + footerOffset, width: 100, height: 36 }),
    units: Object.freeze(cards("unitType", ["scout", "fighter", "bomber", "frigate"])),
    upgrades: Object.freeze(cards("upgradeId", ["economy", "weapons", "fireRate", "salvo", "shield"])),
    feedbackY: y - 20,
    debugY: y - 42,
  });
};

export const overlayUiLayout = (height = 760) => {
  const centerY = height / 2;
  return Object.freeze({
    pausePanel: freezeRect({ x: 68, y: centerY - 104, width: 284, height: 208 }),
    pauseResume: freezeRect({ x: 88, y: centerY + 4, width: 116, height: 46 }),
    pauseMenu: freezeRect({ x: 216, y: centerY + 4, width: 116, height: 46 }),
    endPanel: freezeRect({ x: 68, y: centerY - 100, width: 284, height: 200 }),
    endRestart: freezeRect({ x: 88, y: centerY + 16, width: 116, height: 46 }),
    endMenu: freezeRect({ x: 216, y: centerY + 16, width: 116, height: 46 }),
  });
};

export const containsPoint = (rect, point) => point.x >= rect.x && point.x <= rect.x + rect.width && point.y >= rect.y && point.y <= rect.y + rect.height;
const containsWithSlop = (rect, point, slop = 3) => containsPoint({ x: rect.x - slop, y: rect.y - slop, width: rect.width + slop * 2, height: rect.height + slop * 2 }, point);

export const commandActionAt = (point, menu = "units", height = 760, laneIds = [LANE.LEFT, LANE.RIGHT], expanded = false) => {
  const layout = commandUiLayout(height, laneIds, expanded, menu);
  if (!expanded) return containsPoint(layout.command, point) || containsPoint(layout.deploy, point) ? { type: "TOGGLE_COMMAND_DOCK" } : null;
  if (containsPoint(layout.close, point)) return { type: "TOGGLE_COMMAND_DOCK" };
  if (containsPoint(layout.fleetTab, point)) return { type: "SET_COMMAND_MENU", menu: "units" };
  if (containsPoint(layout.upgradeTab, point)) return { type: "SET_COMMAND_MENU", menu: "upgrades" };
  const lane = layout.lanes.find((rect) => containsWithSlop(rect, point));
  if (lane) return { type: "SELECT_LANE", laneId: lane.laneId };
  if (menu === "units") {
    const unit = layout.units.find((rect) => containsWithSlop(rect, point));
    if (unit) return { type: "DEPLOY_UNIT", unitType: unit.unitType };
  } else {
    const upgrade = layout.upgrades.find((rect) => containsWithSlop(rect, point));
    if (upgrade) return { type: "BUY_UPGRADE", upgradeId: upgrade.upgradeId };
  }
  return null;
};

export const titleActionAt = (point, height = 760) => {
  const offsetY = height / 2 - 380;
  if (containsPoint({ ...COMMAND_UI.titleLevel, y: COMMAND_UI.titleLevel.y + offsetY }, point)) return { type: "CYCLE_LEVEL" };
  if (containsPoint({ ...COMMAND_UI.titleDifficulty, y: COMMAND_UI.titleDifficulty.y + offsetY }, point)) return { type: "CYCLE_DIFFICULTY" };
  if (containsPoint({ ...COMMAND_UI.titleStart, y: COMMAND_UI.titleStart.y + offsetY }, point)) return { type: "START_MATCH" };
  return null;
};

export const pauseActionAt = (point, height = 760) => {
  const ui = overlayUiLayout(height);
  if (containsPoint(ui.pauseResume, point)) return { type: "RESUME_MATCH" };
  if (containsPoint(ui.pauseMenu, point)) return { type: "RETURN_TO_TITLE" };
  return null;
};

export const endActionAt = (point, height = 760) => {
  const ui = overlayUiLayout(height);
  if (containsPoint(ui.endRestart, point)) return { type: "RESTART_MATCH" };
  if (containsPoint(ui.endMenu, point)) return { type: "RETURN_TO_TITLE" };
  return null;
};

export const fullscreenActionAt = (point) => (containsPoint(COMMAND_UI.fullscreen, point) ? { type: "TOGGLE_FULLSCREEN" } : null);

export const utilityActionAt = (point) => {
  if (containsPoint(COMMAND_UI.pause, point)) return { type: "TOGGLE_PAUSE" };
  if (containsPoint(COMMAND_UI.sound, point)) return { type: "TOGGLE_SOUND" };
  return fullscreenActionAt(point);
};
