import { MISSIONS } from "../data/campaign.js";
import { containsPoint } from "./commandUi.js";

export const campaignUiLayout = (height = 760) => {
  const offset = height / 2 - 380;
  const rect = (x, y, width, h) => ({ x, y: y + offset, width, height: h });
  return { campaign: rect(44, 530, 332, 52), settings: rect(44, 594, 332, 46),
    panel: rect(28, 262, 364, 292), sound: rect(58, 365, 304, 48),
    equipment: rect(48, 535, 324, 44),
    back: rect(44, 684, 332, 46), start: rect(44, 614, 332, 52),
    missions: MISSIONS.map((mission, i) => ({ ...rect(28, 280 + i * 58, 364, 52), missionId: mission.id })) };
};
export const campaignActionAt = (point, screen, height = 760) => {
  const ui = campaignUiLayout(height);
  if (screen === "main") {
    if (containsPoint(ui.campaign, point)) return { type: "OPEN_CAMPAIGN" };
    if (containsPoint(ui.settings, point)) return { type: "OPEN_SETTINGS" };
  } else {
    if (containsPoint(ui.back, point)) return { type: "MENU_BACK" };
    if (screen === "settings" && containsPoint(ui.sound, point)) return { type: "TOGGLE_SOUND" };
    if (screen === "briefing" && containsPoint(ui.equipment, point)) return { type: "TOGGLE_AEGIS" };
    if (screen === "briefing" && containsPoint(ui.start, point)) return { type: "START_MISSION" };
    if (screen === "missions") {
      const mission = ui.missions.find(rect => containsPoint(rect, point));
      if (mission) return { type: "SELECT_MISSION", missionId: mission.missionId };
    }
  }
  return null;
};

export const campaignResultLayout = height => {
  const y = height / 2;
  return { next: { x: 52, y: y + 36, width: 316, height: 48 },
    retry: { x: 52, y: y + 96, width: 150, height: 44 },
    menu: { x: 218, y: y + 96, width: 150, height: 44 } };
};
export const campaignResultActionAt = (point, height, canContinue) => {
  const ui = campaignResultLayout(height);
  if (canContinue && containsPoint(ui.next, point)) return { type: "NEXT_MISSION" };
  if (containsPoint(ui.retry, point)) return { type: "RESTART_MATCH" };
  if (containsPoint(ui.menu, point)) return { type: "RETURN_TO_MISSIONS" };
  return null;
};
