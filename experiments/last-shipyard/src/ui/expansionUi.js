import { EXPANSION_MISSIONS } from "../data/campaignExpansion.js";
import { containsPoint } from "./commandUi.js";

export const expansionUiLayout = (height = 760) => {
  const offset = height / 2 - 380;
  const rect = (x, y, width, h) => ({ x, y: y + offset, width, height: h });
  return {
    entry: rect(28, 169, 364, 44), back: rect(44, 684, 332, 46),
    previous: rect(28, 622, 174, 44), next: rect(218, 622, 174, 44),
    map: rect(28, 223, 164, 350),
    start: rect(210, 526, 182, 47),
    campaign: rect(28, 154, 174, 44), pilots: rect(218, 154, 174, 44),
    missions: EXPANSION_MISSIONS.map((mission, index) => ({ ...rect(28, 210 + index * 56, 364, 52), missionId: mission.id })),
  };
};
export const expansionActionAt = (point, screen, height) => {
  const ui = expansionUiLayout(height);
  if (screen === "missions" && containsPoint(ui.entry, point)) return { type: "OPEN_EXPANSION" };
  if (screen !== "expansion" && screen !== "expansion-map") return null;
  if (containsPoint(ui.back, point)) return { type: "EXPANSION_BACK" };
  if (screen === "expansion-map") {
    if (containsPoint(ui.start, point)) return { type: "START_EXPANSION" };
    if (containsPoint(ui.previous, point)) return { type: "BROWSE_EXPANSION", delta: -1 };
    if (containsPoint(ui.next, point)) return { type: "BROWSE_EXPANSION", delta: 1 };
  } else {
    if (containsPoint(ui.campaign, point)) return { type: "SET_EXPANSION_MODE", mode: "campaign" };
    if (containsPoint(ui.pilots, point)) return { type: "SET_EXPANSION_MODE", mode: "pilots" };
    const selected = ui.missions.find(rect => containsPoint(rect, point));
    if (selected) return { type: "SELECT_EXPANSION_MISSION", missionId: selected.missionId };
  }
  return null;
};
