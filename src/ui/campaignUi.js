import { containsPoint } from "./commandUi.js";
import { MISSIONS } from "../data/campaign.js";

export const campaignUiLayout = (height = 760) => {
  const offset = height / 2 - 380;
  const rect = (x, y, width, h) => ({ x, y: y + offset, width, height: h });
  return {
    panel: rect(36, 288, 348, 290),
    campaign: rect(60, 365, 300, 52),
    skirmish: rect(60, 429, 300, 48),
    settings: rect(60, 489, 300, 48),
    missions: MISSIONS.map((mission, index) => ({ ...rect(32, 208 + index * 106, 356, 92), missionId: mission.id })),
    back: rect(60, 622, 300, 46),
    start: rect(60, 558, 300, 50),
    sound: rect(60, 365, 300, 52),
  };
};

export const campaignActionAt = (point, screen, height = 760) => {
  const ui = campaignUiLayout(height);
  if (screen !== "main" && containsPoint(ui.back, point)) return { type: "MENU_BACK" };
  if (screen === "main") {
    if (containsPoint(ui.campaign, point)) return { type: "OPEN_CAMPAIGN" };
    if (containsPoint(ui.skirmish, point)) return { type: "OPEN_SKIRMISH" };
    if (containsPoint(ui.settings, point)) return { type: "OPEN_SETTINGS" };
  }
  if (screen === "missions") {
    const mission = ui.missions.find((rect) => containsPoint(rect, point));
    if (mission) return { type: "SELECT_MISSION", missionId: mission.missionId };
  }
  if (screen === "briefing" && containsPoint(ui.start, point)) return { type: "START_MISSION" };
  if (screen === "settings" && containsPoint(ui.sound, point)) return { type: "TOGGLE_SOUND" };
  return null;
};
