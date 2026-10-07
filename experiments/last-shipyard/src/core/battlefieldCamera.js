const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));

export const battlefieldViewport = (designWidth, designHeight, config, bottomInset = config.battlefieldBottomInset) => Object.freeze({
  x: 0,
  y: config.battlefieldTopInset,
  width: designWidth,
  height: Math.max(120, designHeight - config.battlefieldTopInset - bottomInset),
});

/** Keeps the tall simulation world independent from fixed screen-space HUD. */
export class BattlefieldCamera {
  constructor({ worldHeight, designWidth, designHeight, config }) {
    this.config = config;
    this.designWidth = designWidth;
    this.designHeight = designHeight;
    this.bottomInset = config.battlefieldBottomInset;
    this.worldHeight = worldHeight;
    this.viewport = battlefieldViewport(designWidth, designHeight, config, this.bottomInset);
    this.y = 0;
    this.velocityY = 0;
    this.dragging = false;
    this.lastPointerY = 0;
    this.lastPointerTime = 0;
    this.reset("player");
  }

  get maximumY() {
    return Math.max(0, this.worldHeight - this.viewport.height);
  }

  resize(designWidth, designHeight) {
    const previousCenter = this.y + this.viewport.height / 2;
    this.designWidth = designWidth;
    this.designHeight = designHeight;
    this.viewport = battlefieldViewport(designWidth, designHeight, this.config, this.bottomInset);
    this.y = clamp(previousCenter - this.viewport.height / 2, 0, this.maximumY);
  }

  setBottomInset(bottomInset) {
    const nextInset = Math.max(0, bottomInset);
    if (nextInset === this.bottomInset) return;
    const previousBottom = this.y + this.viewport.height;
    this.bottomInset = nextInset;
    this.viewport = battlefieldViewport(this.designWidth, this.designHeight, this.config, this.bottomInset);
    this.y = clamp(previousBottom - this.viewport.height, 0, this.maximumY);
  }

  setWorldHeight(worldHeight) {
    this.worldHeight = Math.max(this.viewport.height, worldHeight);
    this.y = clamp(this.y, 0, this.maximumY);
  }

  reset(focus = "player") {
    this.velocityY = 0;
    this.dragging = false;
    this.y = focus === "enemy" ? 0 : focus === "center" ? this.maximumY / 2 : this.maximumY;
  }

  beginPan(pointerY, timeStamp = 0) {
    this.dragging = true;
    this.velocityY = 0;
    this.lastPointerY = pointerY;
    this.lastPointerTime = timeStamp;
  }

  panTo(pointerY, timeStamp = 0) {
    if (!this.dragging) this.beginPan(pointerY, timeStamp);
    const screenDelta = pointerY - this.lastPointerY;
    const nextY = clamp(this.y - screenDelta, 0, this.maximumY);
    const elapsed = Math.max(1 / 120, Math.min(0.1, (timeStamp - this.lastPointerTime) / 1000 || 1 / 60));
    const worldDelta = nextY - this.y;
    this.y = nextY;
    this.velocityY = clamp(worldDelta / elapsed, -this.config.maximumInertiaSpeed, this.config.maximumInertiaSpeed);
    this.lastPointerY = pointerY;
    this.lastPointerTime = timeStamp;
  }

  endPan() {
    this.dragging = false;
  }

  cancelPan() {
    this.dragging = false;
    this.velocityY = 0;
  }

  update(deltaSeconds) {
    if (this.dragging || deltaSeconds <= 0) return;
    const attemptedY = this.y + this.velocityY * deltaSeconds;
    this.y = clamp(attemptedY, 0, this.maximumY);
    const hitBoundary = this.y !== attemptedY;
    this.velocityY *= Math.exp(-this.config.inertiaDamping * deltaSeconds);
    if (Math.abs(this.velocityY) < 2 || hitBoundary) this.velocityY = 0;
  }

  jumpToWorld(worldY) {
    this.velocityY = 0;
    this.y = clamp(worldY - this.viewport.height / 2, 0, this.maximumY);
  }

  jumpToRatio(ratio) {
    this.jumpToWorld(clamp(ratio, 0, 1) * this.worldHeight);
  }

  worldToScreenY(worldY) {
    return this.viewport.y + worldY - this.y;
  }

  screenToWorldY(screenY) {
    return this.y + screenY - this.viewport.y;
  }

  snapshot() {
    return Object.freeze({
      y: this.y,
      velocityY: this.velocityY,
      maximumY: this.maximumY,
      worldHeight: this.worldHeight,
      viewport: this.viewport,
    });
  }
}
