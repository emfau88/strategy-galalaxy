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
    renderBattlefieldLayer(ctx, transform.designWidth, transform.designHeight);
    renderEntityLayer(ctx, sceneModel);
    renderEffectsLayer(ctx, sceneModel);
    renderUiLayer(ctx, sceneModel);
  }
}
