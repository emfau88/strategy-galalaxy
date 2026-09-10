import { containsPoint } from "./commandUi.js";

const clamp01 = (value) => Math.min(1, Math.max(0, value));

export const cameraNavigatorLayout = (viewport) => Object.freeze({
  hit: Object.freeze({ x: 374, y: viewport.y + 6, width: 46, height: Math.max(44, viewport.height - 12) }),
  track: Object.freeze({ x: 397, y: viewport.y + 12, width: 16, height: Math.max(32, viewport.height - 24) }),
});

export const cameraNavigatorRatioAt = (point, viewport) => {
  const layout = cameraNavigatorLayout(viewport);
  if (!containsPoint(layout.hit, point)) return null;
  return clamp01((point.y - layout.track.y) / layout.track.height);
};
