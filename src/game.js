import { ASSET_GROUPS } from "./assets.js";
import { CONFIG } from "./config.js";
import { GameClock } from "./core/clock.js";
import { MATCH_STATE } from "./core/constants.js";
import { SeededRng } from "./core/rng.js";
import { computeViewportTransform } from "./core/viewport.js";
import { readLaunchOptions } from "./qa/matchTestMode.js";
import { AssetLoader } from "./rendering/assetLoader.js";
import { Renderer } from "./rendering/renderer.js";
import { createDemoBattle } from "./simulation/battleSimulation.js";
import { InputRouter } from "./ui/inputRouter.js";

const parseCssPixels = (value) => Number.parseFloat(value) || 0;

export class Game {
  constructor(canvas, options = readLaunchOptions()) {
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) throw new Error("Canvas 2D context is unavailable.");
    this.canvas = canvas;
    this.options = options;
    this.state = MATCH_STATE.LOADING;
    this.clock = new GameClock(CONFIG.timing);
    this.simulationRng = new SeededRng(options.seed);
    this.visualRng = new SeededRng(options.seed ^ 0x9e3779b9);
    this.loader = new AssetLoader(ASSET_GROUPS.boot);
    this.renderer = new Renderer(canvas, context);
    this.lastInput = null;
    this.simulation = null;
    this.lastFrameAt = null;
    this.running = false;
    this.transform = null;
    this.input = new InputRouter(canvas, () => this.transform, (input) => this.receiveInput(input));
    this.onResize = () => this.resize();
    this.onFrame = (now) => this.frame(now);
  }

  async start() {
    this.resize();
    this.input.attach();
    window.addEventListener("resize", this.onResize, { passive: true });
    window.visualViewport?.addEventListener("resize", this.onResize, { passive: true });
    await this.loader.load();
    this.simulation = this.options.testMode ? createDemoBattle() : null;
    this.state = this.options.testMode ? MATCH_STATE.BATTLE : MATCH_STATE.TITLE;
    this.running = true;
    requestAnimationFrame(this.onFrame);
  }

  stop() {
    this.running = false;
    this.input.destroy();
    window.removeEventListener("resize", this.onResize);
    window.visualViewport?.removeEventListener("resize", this.onResize);
  }

  resize() {
    const viewport = window.visualViewport;
    const styles = window.getComputedStyle(document.documentElement);
    const width = Math.round(viewport?.width ?? window.innerWidth);
    const height = Math.round(viewport?.height ?? window.innerHeight);
    const coarsePointer = window.matchMedia?.("(pointer: coarse)").matches;
    const dprCap = coarsePointer ? CONFIG.viewport.coarsePointerPixelRatio : CONFIG.viewport.maxDevicePixelRatio;
    this.transform = computeViewportTransform({
      viewportWidth: width,
      viewportHeight: height,
      safeTop: parseCssPixels(styles.getPropertyValue("--safe-top")),
      safeRight: parseCssPixels(styles.getPropertyValue("--safe-right")),
      safeBottom: parseCssPixels(styles.getPropertyValue("--safe-bottom")),
      safeLeft: parseCssPixels(styles.getPropertyValue("--safe-left")),
      devicePixelRatio: window.devicePixelRatio || 1,
      maxDevicePixelRatio: dprCap,
      designWidth: CONFIG.app.designWidth,
      designHeight: CONFIG.app.designHeight,
    });
    this.renderer.resize(this.transform);
  }

  receiveInput(input) {
    this.lastInput = input;
  }

  frame(now) {
    if (!this.running) return;
    const delta = this.lastFrameAt === null ? 0 : (now - this.lastFrameAt) / 1000;
    this.lastFrameAt = now;
    this.clock.advance(delta, this.state, {
      onSimulationStep: (step) => this.simulation?.step(step),
    });
    this.renderer.render({
      state: this.state,
      frameTime: this.clock.frameTime,
      debugEnabled: this.options.debugEnabled,
      testMode: this.options.testMode,
      lastInput: this.lastInput,
      simulation: this.simulation,
    });
    requestAnimationFrame(this.onFrame);
  }

  getViewportSnapshot() {
    return this.transform;
  }
}
