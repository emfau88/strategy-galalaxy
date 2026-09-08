import { renderBackground, renderBattlefieldLayer, renderEffectsLayer, renderEntityLayer } from "./battlefieldRenderer.js";
import { renderUiLayer } from "./uiRenderer.js";

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
    renderBackground(ctx, transform.designWidth, transform.designHeight, model.frameTime, model.assets);
    if (model.state === "TITLE" && model.mapDefinition?.visualTheme === "orbital_garden") {
      const garden = model.assets?.get("background-orbital-garden");
      if (garden) {
        ctx.save();
        ctx.globalAlpha = 0.9;
        ctx.drawImage(garden, 0, 0, transform.designWidth, transform.designHeight);
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
    renderBattlefieldLayer(ctx, sceneModel);
    renderEntityLayer(ctx, sceneModel);
    renderEffectsLayer(ctx, sceneModel);
    ctx.restore();
    renderUiLayer(ctx, sceneModel);
  }
}
