import { containsPoint } from "./commandUi.js";
export const abilityUiLayout = () => ({ home: { x: 8, y: 128, width: 172, height: 46 }, aegis: { x: 188, y: 128, width: 224, height: 46 } });
export const abilityActionAt = point => {
  const ui = abilityUiLayout();
  if (containsPoint(ui.aegis, point)) return { type: "ACTIVATE_CARRIER" };
  if (containsPoint(ui.home, point)) return { type: "FOCUS_CARRIER" };
  return null;
};
