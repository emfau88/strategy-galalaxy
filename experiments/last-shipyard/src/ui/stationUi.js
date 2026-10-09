import { containsPoint } from "./commandUi.js";

export const stationUiLayout = (height = 760) => ({
  objective: { x: 12, y: height - 124, width: 192, height: 44 },
  pad: { x: 212, y: height - 124, width: 196, height: 44 },
  panel: { x: 12, y: height - 288, width: 396, height: 156 },
  close: { x: 358, y: height - 288, width: 50, height: 44 },
  action: { x: 26, y: height - 189, width: 368, height: 44 },
});

export const stationActionAt = (point, height, selectedSiteId, dockOpen) => {
  if (dockOpen) return null;
  const ui = stationUiLayout(height);
  if (containsPoint(ui.objective, point)) return { type: "FOCUS_SITE", site: "objective" };
  if (containsPoint(ui.pad, point)) return { type: "FOCUS_SITE", site: "pad" };
  if (!selectedSiteId) return null;
  if (containsPoint(ui.close, point)) return { type: "CLOSE_SITE" };
  if (containsPoint(ui.action, point)) return { type: "SITE_COMMAND" };
  if (containsPoint(ui.panel, point)) return { type: "SITE_PANEL" };
  return null;
};

export const worldSiteAt = (map, point) => [...map.buildPads, ...map.markers]
  .find(site => Math.hypot(site.x - point.x, site.y - point.y) <= (site.kind ? 44 : 34)) ?? null;
