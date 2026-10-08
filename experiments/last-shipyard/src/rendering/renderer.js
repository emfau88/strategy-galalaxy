import { renderBackground, renderBattlefieldLayer, renderEffectsLayer, renderEntityLayer } from "./battlefieldRenderer.js";
import { renderAegisField, renderDefenseLine } from "./abilityRenderer.js";
import { renderUiLayer } from "./uiRenderer.js";

const drawCover = (ctx, image, width, height, verticalAnchor = 0.5) => {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const sourceWidth = width / scale;
  const sourceHeight = height / scale;
  const sourceX = (image.naturalWidth - sourceWidth) / 2;
  const sourceY = (image.naturalHeight - sourceHeight) * verticalAnchor;
  ctx.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, width, height);
};

// An independent menu scene: no map art, combat objects or battlefield camera.
const renderMenuBackground = (ctx, width, height) => {
  ctx.fillStyle = "#080f1c";
  ctx.fillRect(0, 0, width, height);
  const glow = ctx.createRadialGradient(width * 0.86, height * 0.12, 0, width * 0.86, height * 0.12, width * 0.95);
  glow.addColorStop(0, "rgba(48,112,133,0.28)");
  glow.addColorStop(1, "rgba(8,15,28,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);
  ctx.save();
  ctx.strokeStyle = "rgba(131,192,211,0.12)";
  ctx.lineWidth = 1;
  for (const radius of [180, 202, 260]) {
    ctx.beginPath();
    ctx.arc(width + 72, 12, radius, 0, Math.PI * 2);
    ctx.stroke();
  }
  // Deterministic stars stay peripheral so title and navigation remain calm.
  for (let index = 0; index < 42; index += 1) {
    const x = (index * 137 + 23) % width;
    const y = (index * 211 + 41) % height;
    if (x > 42 && x < width - 42 && y > height * 0.2 && y < height * 0.85) continue;
    ctx.fillStyle = index % 5 === 0 ? "rgba(185,220,235,0.45)" : "rgba(185,220,235,0.2)";
    ctx.fillRect(x, y, index % 5 === 0 ? 1.5 : 1, 1);
  }
  ctx.restore();
};

export class Renderer {
  constructor(canvas, context) {
    this.canvas = canvas;
    this.ctx = context;
  }

  resize(transform) {
    this.transform = transform;
    this.canvas.width = Math.max(1, Math.round(transform.viewportWidth * transform.devicePixelRatio));
    this.canvas.height = Math.max(1, Math.round(transform.viewportHeight * transform.devicePixelRatio));
  }

  render(model) {
    const { ctx, transform } = this;
    if (!transform) return;
    ctx.setTransform(transform.devicePixelRatio, 0, 0, transform.devicePixelRatio, 0, 0);
    ctx.fillStyle = "#101d35";
    ctx.fillRect(0, 0, transform.viewportWidth, transform.viewportHeight);
    ctx.translate(transform.offsetX, transform.offsetY);
    ctx.scale(transform.scale, transform.scale);
    const sceneModel = { ...model, width: transform.designWidth, height: transform.designHeight };
    const menuScene = model.state === "LOADING" || (model.state === "TITLE" && model.menuScreen !== "skirmish");
    if (menuScene) {
      renderMenuBackground(ctx, transform.designWidth, transform.designHeight);
      const art = model.assets?.get("shipyard-keyart");
      if (art) drawCover(ctx, art, transform.designWidth, transform.designHeight, 0.48);
      const shade = ctx.createLinearGradient(0, 0, 0, transform.designHeight);
      shade.addColorStop(0, "rgba(4,12,23,.25)"); shade.addColorStop(.42, "rgba(4,12,23,0)"); shade.addColorStop(1, "rgba(4,12,23,.9)");
      ctx.fillStyle = shade; ctx.fillRect(0, 0, transform.designWidth, transform.designHeight);
      if (model.menuScreen !== "main") { ctx.fillStyle = "rgba(4,12,23,.87)"; ctx.fillRect(0, 0, transform.designWidth, transform.designHeight); }
    }
    else renderBackground(ctx, transform.designWidth, transform.designHeight, model.frameTime, model.assets);
    if (!menuScene && model.state === "TITLE" && model.mapDefinition?.visualTheme === "orbital_garden") {
      const garden = model.assets?.get("background-orbital-garden-player") ?? model.assets?.get("background-orbital-garden");
      if (garden) {
        ctx.save();
        ctx.globalAlpha = 0.92;
        drawCover(ctx, garden, transform.designWidth, transform.designHeight, 0.72);
        const shade = ctx.createLinearGradient(0, 0, 0, transform.designHeight);
        shade.addColorStop(0, "rgba(5,14,30,0.12)");
        shade.addColorStop(0.48, "rgba(5,14,30,0.42)");
        shade.addColorStop(1, "rgba(5,14,30,0.66)");
        ctx.fillStyle = shade;
        ctx.fillRect(0, 0, transform.designWidth, transform.designHeight);
        ctx.restore();
      }
    }
    ctx.save();
    if (sceneModel.camera?.viewport) {
      const view = sceneModel.camera.viewport;
      ctx.beginPath();
      ctx.rect(view.x, view.y, view.width, view.height);
      ctx.clip();
    }
    if (!menuScene) {
      renderBattlefieldLayer(ctx, sceneModel);
      renderDefenseLine(ctx, sceneModel);
      renderEntityLayer(ctx, sceneModel);
      renderAegisField(ctx, sceneModel);
      renderEffectsLayer(ctx, sceneModel);
    }
    ctx.restore();
    renderUiLayer(ctx, sceneModel);
  }
}
