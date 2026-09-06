import { ASSET_GROUPS } from "./assets.js";
import { CONFIG } from "./config.js";
import { GameClock } from "./core/clock.js";
import { LANE, MATCH_STATE, TEAM } from "./core/constants.js";
import { SeededRng } from "./core/rng.js";
import { computeViewportTransform } from "./core/viewport.js";
import { readLaunchOptions } from "./qa/matchTestMode.js";
import { AssetLoader } from "./rendering/assetLoader.js";
import { Renderer } from "./rendering/renderer.js";
import { PresentationEffects } from "./rendering/presentationEffects.js";
import { MatchDirector } from "./simulation/matchDirector.js";
import { InputRouter } from "./ui/inputRouter.js";
import { commandActionAt } from "./ui/commandUi.js";

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
    this.effects = new PresentationEffects();
    this.lastInput = null;
    this.selectedLaneId = LANE.LEFT;
    this.commandMenu = "units";
    this.commandFeedback = null;
    this.match = new MatchDirector();
    this.lastFrameAt = null;
    this.running = false;
    this.transform = null;
    this.input = new InputRouter(canvas, () => this.transform, (input) => this.receiveInput(input));
    this.onResize = () => this.resize();
    this.onKeyDown = (event) => this.handleKeyDown(event);
    this.onFrame = (now) => this.frame(now);
  }

  async start() {
    this.resize();
    this.input.attach();
    window.addEventListener("resize", this.onResize, { passive: true });
    window.visualViewport?.addEventListener("resize", this.onResize, { passive: true });
    window.addEventListener("keydown", this.onKeyDown);
    await this.loader.load();
    if (this.options.testMode) {
      this.match.start();
      this.match.deployNow();
      this.effects.reset();
    }
    this.syncMatchState();
    this.running = true;
    requestAnimationFrame(this.onFrame);
  }

  stop() {
    this.running = false;
    this.input.destroy();
    window.removeEventListener("resize", this.onResize);
    window.visualViewport?.removeEventListener("resize", this.onResize);
    window.removeEventListener("keydown", this.onKeyDown);
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
    if (input.kind !== "down") return;
    if (this.match.state === MATCH_STATE.TITLE) {
      this.match.start();
      this.effects.reset();
    }
    else if (this.match.state === MATCH_STATE.COMMAND) this.executeCommandAction(commandActionAt(input, this.commandMenu));
    else if (this.match.state === MATCH_STATE.VICTORY || this.match.state === MATCH_STATE.DEFEAT) {
      this.match.restart();
      this.effects.reset();
    }
    this.syncMatchState();
  }

  executeCommandAction(action) {
    if (!action) return;
    if (action.type === "SELECT_LANE") {
      this.selectedLaneId = action.laneId;
      this.commandFeedback = `${action.laneId === LANE.LEFT ? "LEFT" : "RIGHT"} LANE SELECTED`;
      return;
    }
    if (action.type === "TOGGLE_MENU") {
      this.commandMenu = this.commandMenu === "units" ? "upgrades" : "units";
      this.commandFeedback = this.commandMenu === "units" ? "SHIP REINFORCEMENTS" : "UPGRADES";
      return;
    }
    if (action.type === "DEPLOY") {
      this.match.deployNow();
      this.commandFeedback = "WAVES DEPLOYED";
      return;
    }
    if (action.type === "REMOVE_LAST_UNIT") {
      const queue = this.match.queuedWaves.get(TEAM.PLAYER).get(this.selectedLaneId);
      const entry = queue.at(-1);
      const result = entry ? this.match.executeCommand({ type: "REMOVE_QUEUED_UNIT", team: TEAM.PLAYER, laneId: this.selectedLaneId, queueEntryId: entry.id }) : { ok: false };
      this.commandFeedback = result.ok ? `REFUNDED ${result.refunded} ENERGY` : "NOTHING TO UNDO";
      return;
    }
    const result = this.match.executeCommand({ ...action, team: TEAM.PLAYER, laneId: this.selectedLaneId });
    this.commandFeedback = result.ok ? (action.type === "BUY_UPGRADE" ? "UPGRADE INSTALLED" : `${action.unitType.toUpperCase()} QUEUED`) : this.commandFailureLabel(result.reason);
  }

  commandFailureLabel(reason) {
    return Object.freeze({ INSUFFICIENT_ENERGY: "NOT ENOUGH ENERGY", CAPACITY_RESERVED: "LANE CAPACITY RESERVED", WRONG_PHASE: "COMMAND PHASE ONLY" })[reason] ?? "COMMAND UNAVAILABLE";
  }

  handleKeyDown(event) {
    if (event.key.toLowerCase() === "p") {
      if (this.match.state === MATCH_STATE.PAUSED) this.match.resume();
      else this.match.pause();
    }
    if (event.key.toLowerCase() === "r" && this.match.restart()) this.effects.reset();
    this.syncMatchState();
  }

  syncMatchState() {
    this.state = this.match.state;
  }

  frame(now) {
    if (!this.running) return;
    const delta = this.lastFrameAt === null ? 0 : (now - this.lastFrameAt) / 1000;
    this.lastFrameAt = now;
    const previousState = this.match.state;
    this.clock.advance(delta, previousState, {
      onPhaseTick: (phaseDelta) => {
        if (previousState === MATCH_STATE.COMMAND && this.match.advanceCommand(phaseDelta)) this.clock.beginPhase();
      },
      onSimulationStep: (step) => {
        if (this.match.advanceBattle(step)) this.clock.beginPhase();
        this.effects.observe(this.match.simulation?.state.events ?? []);
      },
    });
    this.effects.update(delta);
    if (this.options.testMode && this.match.state === MATCH_STATE.COMMAND) this.match.deployNow();
    this.syncMatchState();
    this.renderer.render({
      state: this.state,
      frameTime: this.clock.frameTime,
      debugEnabled: this.options.debugEnabled,
      testMode: this.options.testMode,
      lastInput: this.lastInput,
      simulation: this.match.simulation,
      cycle: this.match.cycle,
      phaseRemaining: this.match.phaseRemaining,
      activeBattleSeconds: this.match.activeBattleSeconds,
      economy: this.match.simulation ? this.match.economy : null,
      director: this.match,
      lastAiDecision: this.match.lastAiDecision,
      selectedLaneId: this.selectedLaneId,
      commandMenu: this.commandMenu,
      commandFeedback: this.commandFeedback,
      assets: this.loader,
      effects: this.effects.effects,
    });
    requestAnimationFrame(this.onFrame);
  }

  getViewportSnapshot() {
    return this.transform;
  }
}
