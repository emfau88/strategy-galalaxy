import { ASSET_GROUPS, levelAssetManifest, mergeAssetGroups } from "./assets.js";
import { CONFIG } from "./config.js";
import { GameClock } from "./core/clock.js";
import { BattlefieldCamera } from "./core/battlefieldCamera.js";
import { LANE, MATCH_STATE, TEAM } from "./core/constants.js";
import { SeededRng } from "./core/rng.js";
import { computeViewportTransform, responsivePortraitDesignHeight } from "./core/viewport.js";
import { readLaunchOptions } from "./qa/matchTestMode.js";
import { AssetLoader } from "./rendering/assetLoader.js";
import { Renderer } from "./rendering/renderer.js";
import { PresentationEffects } from "./rendering/presentationEffects.js";
import { SoundSystem } from "./audio/soundSystem.js";
import { MatchDirector } from "./simulation/matchDirector.js";
import { InputRouter } from "./ui/inputRouter.js";
import { commandActionAt, commandUiBottomInset, containsPoint, endActionAt, pauseActionAt, titleActionAt, utilityActionAt } from "./ui/commandUi.js";
import { cameraNavigatorRatioAt } from "./ui/cameraUi.js";
import { AI_PROFILES } from "./simulation/opponentAi.js";
import { CLASSIC_LANES, ORBITAL_GARDEN, UNIT_DEFINITIONS } from "./data/definitions.js";
import { missionById, missionMatchOptions, missionUnlocked, nextMission, missionForProgress } from "./data/campaign.js";
import { CampaignProgress } from "./campaign/progress.js";
import { ExpansionProgress } from "./campaign/expansionProgress.js";
import { EXPANSION_MISSIONS, expansionMissionById, nextExpansionMission } from "./data/campaignExpansion.js";
import { expansionMatchOptions, isExpansionMission } from "./data/expansionScenarios.js";
import { stationActionAt, worldSiteAt } from "./ui/stationUi.js";
import { abilityActionAt } from "./ui/abilityUi.js";
import { campaignActionAt, campaignResultActionAt } from "./ui/campaignUi.js";

const parseCssPixels = (value) => Number.parseFloat(value) || 0;
const LEVELS = Object.freeze([ORBITAL_GARDEN, CLASSIC_LANES]);
const configForMap = (map) => ({ ...CONFIG, balance: { ...CONFIG.balance, ...(map.balanceOverrides ?? {}) } });

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
    this.loader = new AssetLoader();
    this.renderer = new Renderer(canvas, context);
    this.effects = new PresentationEffects();
    this.sound = new SoundSystem();
    this.campaign = new CampaignProgress();
    this.expansion = new ExpansionProgress();
    this.selectedExpansionId = this.expansion.data.lastPreviewId ?? EXPANSION_MISSIONS[0].id;
    this.menuScreen = "main";
    this.selectedMissionId = this.campaign.data.lastMissionId ?? "first-contact";
    this.recordedMissionResult = null;
    this.rewardFirstTime = false;
    this.lastInput = null;
    this.levelIndex = Math.max(0, LEVELS.findIndex((level) => level.level === options.level));
    this.selectedLaneId = LEVELS[this.levelIndex].lanes[0].id;
    this.commandMenu = "units";
    this.commandDockOpen = false;
    this.selectedSiteId = null;
    this.commandFeedback = null;
    this.commandFeedbackUntil = 0;
    this.fullscreenActive = false;
    this.match = new MatchDirector({ config: configForMap(LEVELS[this.levelIndex]), mapDefinition: LEVELS[this.levelIndex] });
    this.camera = new BattlefieldCamera({
      worldHeight: LEVELS[this.levelIndex].bounds.height,
      designWidth: CONFIG.app.designWidth,
      designHeight: CONFIG.app.designHeight,
      config: CONFIG.camera,
    });
    this.cameraGesture = null;
    this.aiProfiles = [AI_PROFILES.CADET, AI_PROFILES.TACTICIAN, AI_PROFILES.ADMIRAL];
    this.lastFrameAt = null;
    this.running = false;
    this.assetsReady = false;
    this.levelLoading = false;
    this.levelLoadPromise = null;
    this.transform = null;
    this.input = new InputRouter(canvas, () => this.transform, (input) => this.receiveInput(input));
    this.onResize = () => this.resize();
    this.onKeyDown = (event) => this.handleKeyDown(event);
    this.onFullscreenChange = () => { this.fullscreenActive = Boolean(document.fullscreenElement); };
    this.onFrame = (now) => this.frame(now);
  }

  async start() {
    this.resize();
    this.input.attach();
    window.addEventListener("resize", this.onResize, { passive: true });
    window.visualViewport?.addEventListener("resize", this.onResize, { passive: true });
    window.addEventListener("keydown", this.onKeyDown);
    document.addEventListener("fullscreenchange", this.onFullscreenChange);
    this.running = true;
    requestAnimationFrame(this.onFrame);
    // Keep the first request wave compact and deterministic. Map art and combat VFX
    // follow only after the shared shell is drawable, so large backgrounds can no
    // longer starve every HQ, turret and HUD image on a cold mobile connection.
    await this.loader.load(ASSET_GROUPS.boot);
    await this.loader.load(mergeAssetGroups(
      levelAssetManifest(LEVELS[this.levelIndex].level),
      ASSET_GROUPS.combatVfx,
    ));
    this.assetsReady = true;
    if (this.options.testMode) {
      this.match.start();
      this.camera.setWorldHeight(this.match.simulation.state.map.bounds.height);
      this.camera.reset("player");
      this.effects.reset();
    }
    this.syncMatchState();
  }

  stop() {
    this.running = false;
    this.input.destroy();
    window.removeEventListener("resize", this.onResize);
    window.visualViewport?.removeEventListener("resize", this.onResize);
    window.removeEventListener("keydown", this.onKeyDown);
    document.removeEventListener("fullscreenchange", this.onFullscreenChange);
  }

  resize() {
    const viewport = window.visualViewport;
    const styles = window.getComputedStyle(document.documentElement);
    const width = Math.round(viewport?.width ?? window.innerWidth);
    const height = Math.round(viewport?.height ?? window.innerHeight);
    const safeTop = parseCssPixels(styles.getPropertyValue("--safe-top"));
    const safeRight = parseCssPixels(styles.getPropertyValue("--safe-right"));
    const safeBottom = parseCssPixels(styles.getPropertyValue("--safe-bottom"));
    const safeLeft = parseCssPixels(styles.getPropertyValue("--safe-left"));
    const designHeight = responsivePortraitDesignHeight({
      viewportWidth: width,
      viewportHeight: height,
      safeTop,
      safeRight,
      safeBottom,
      safeLeft,
      designWidth: CONFIG.app.designWidth,
      minimumDesignHeight: CONFIG.app.designHeight,
    });
    const coarsePointer = window.matchMedia?.("(pointer: coarse)").matches;
    const dprCap = coarsePointer ? CONFIG.viewport.coarsePointerPixelRatio : CONFIG.viewport.maxDevicePixelRatio;
    this.transform = computeViewportTransform({
      viewportWidth: width,
      viewportHeight: height,
      safeTop,
      safeRight,
      safeBottom,
      safeLeft,
      devicePixelRatio: window.devicePixelRatio || 1,
      maxDevicePixelRatio: dprCap,
      designWidth: CONFIG.app.designWidth,
      designHeight,
    });
    this.camera.resize(CONFIG.app.designWidth, designHeight);
    this.syncCommandViewport();
    this.renderer.resize(this.transform);
  }

  receiveInput(input) {
    this.lastInput = input;
    if (!this.assetsReady) return;
    if (input.kind === "down" && this.match.state === MATCH_STATE.PAUSED) {
      const action = pauseActionAt(input, this.transform?.designHeight);
      if (action?.type === "RESUME_MATCH") {
        this.match.resume();
        this.sound.play("select");
        this.syncMatchState();
        return;
      }
      if (action?.type === "RETURN_TO_TITLE") {
        this.returnToTitle();
        return;
      }
    }
    if (input.kind === "down" && [MATCH_STATE.VICTORY, MATCH_STATE.DEFEAT, MATCH_STATE.DRAW].includes(this.match.state)) {
      const expansion = isExpansionMission(this.match.mission);
      const next = expansion ? this.expansionRunMode === "campaign" && nextExpansionMission(this.match.mission) : this.match.mission && nextMission(this.match.mission);
      const action = this.match.mission
        ? campaignResultActionAt(input, this.transform?.designHeight, this.match.state === MATCH_STATE.VICTORY && next?.available)
        : endActionAt(input, this.transform?.designHeight);
      if (action?.type === "NEXT_MISSION") {
        if (expansion) {
          this.returnToTitle(); this.selectedExpansionId = next.id; this.expansion.selectPreview(next.id);
          this.menuScreen = "expansion-map"; this.prepareLevelAssets(next.map); return;
        }
        this.returnToTitle(); this.selectedMissionId = next.id; this.menuScreen = "briefing"; this.prepareLevelAssets(next.map); return;
      }
      if (action?.type === "RETURN_TO_TITLE" || action?.type === "RETURN_TO_MISSIONS") {
        this.returnToTitle();
        if (action.type === "RETURN_TO_MISSIONS") this.menuScreen = expansion ? "expansion" : "missions";
        return;
      }
      if (action?.type === "RESTART_MATCH") {
        this.restartMatch();
        return;
      }
    }
    if (input.kind === "down" && this.match.state === MATCH_STATE.LIVE_MATCH && this.match.carrierAbility?.equipped) {
      const ability = abilityActionAt(input);
      if (ability) { this.executeCommandAction(ability); this.syncMatchState(); return; }
    }
    if (input.kind === "down" && this.match.state === MATCH_STATE.LIVE_MATCH && isExpansionMission(this.match.mission) && this.match.mapDefinition.markers.length) {
      const action = stationActionAt(input, this.transform?.designHeight, this.selectedSiteId, this.commandDockOpen, this.match.mapDefinition.buildPads.length);
      if (action) { this.executeStationAction(action); return; }
    }
    if (this.handleCameraInput(input)) return;
    if (input.kind !== "down") return;
    this.sound.unlock().catch(() => {});
    const utility = utilityActionAt(input);
    if (utility?.type === "TOGGLE_FULLSCREEN") {
      this.toggleFullscreen();
      return;
    }
    if (utility?.type === "TOGGLE_SOUND") {
      this.sound.toggleMuted();
      this.showFeedback(this.sound.enabled ? "SOUND ON" : "SOUND OFF");
      return;
    }
    if (utility?.type === "TOGGLE_PAUSE") {
      if (this.match.state === MATCH_STATE.PAUSED) this.match.resume();
      else this.match.pause();
      this.sound.play("select");
      return;
    }
    if (this.match.state === MATCH_STATE.TITLE) {
      const menuAction = campaignActionAt(input, this.menuScreen, this.transform?.designHeight);
      if (menuAction) {
        this.executeMenuAction(menuAction);
        this.syncMatchState();
        return;
      }
      if (this.menuScreen !== "skirmish") return;
      const action = titleActionAt(input, this.transform?.designHeight);
      if (action?.type === "CYCLE_DIFFICULTY") {
        const index = (this.aiProfiles.indexOf(this.match.aiProfile) + 1) % this.aiProfiles.length;
        this.match.setAiProfile(this.aiProfiles[index]);
        return;
      }
      if (action?.type === "CYCLE_LEVEL") {
        const profile = this.match.aiProfile;
        this.levelIndex = (this.levelIndex + 1) % LEVELS.length;
        const mapDefinition = LEVELS[this.levelIndex];
        this.selectedLaneId = mapDefinition.lanes[0].id;
        this.match = new MatchDirector({ config: configForMap(mapDefinition), mapDefinition, aiProfile: profile });
        this.camera.setWorldHeight(mapDefinition.bounds.height);
        this.camera.reset("player");
        this.prepareLevelAssets(mapDefinition);
        this.sound.play("select");
        return;
      }
      if (action?.type !== "START_MATCH") return;
      if (!this.levelAssetsReady(this.match.mapDefinition)) {
        const pendingMap = this.match.mapDefinition;
        this.prepareLevelAssets(pendingMap).then(() => {
          if (this.menuScreen === "skirmish" && this.match.state === MATCH_STATE.TITLE && this.match.mapDefinition === pendingMap) this.startSelectedMatch();
        });
        return;
      }
      this.startSelectedMatch();
    }
    else if (this.match.state === MATCH_STATE.LIVE_MATCH) this.executeCommandAction(commandActionAt(input, this.commandMenu, this.transform?.designHeight, this.match.mapDefinition.lanes.map((lane) => lane.id), this.commandDockOpen, this.match.config.rules));
    this.syncMatchState();
  }

  executeMenuAction(action) {
    this.sound.play("select");
    if (action.type === "SET_EXPANSION_MODE") { this.expansion.setMode(action.mode); return; }
    if (action.type === "START_EXPANSION") { this.startExpansionMission(); return; }
    if (action.type === "OPEN_EXPANSION") { this.menuScreen = "expansion"; return; }
    if (action.type === "EXPANSION_BACK") { this.menuScreen = this.menuScreen === "expansion-map" ? "expansion" : "missions"; return; }
    if (action.type === "SELECT_EXPANSION_MISSION" || action.type === "BROWSE_EXPANSION") {
      const index = EXPANSION_MISSIONS.findIndex(mission => mission.id === this.selectedExpansionId);
      const mission = action.type === "SELECT_EXPANSION_MISSION" ? expansionMissionById(action.missionId)
        : EXPANSION_MISSIONS[index + action.delta];
      if (mission && this.expansion.selectPreview(mission.id)) {
        this.selectedExpansionId = mission.id; this.menuScreen = "expansion-map";
        if (mission.available) this.prepareLevelAssets(mission.map);
      }
      return;
    }
    if (action.type === "OPEN_SHIPYARD") this.menuScreen = "shipyard";
    else if (action.type === "TOGGLE_BOMBER") this.campaign.toggleBomber();
    else if (action.type === "OPEN_CAMPAIGN") this.menuScreen = "missions";
    else if (action.type === "OPEN_SETTINGS") this.menuScreen = "settings";
    else if (action.type === "MENU_BACK") this.menuScreen = this.menuScreen === "briefing" ? "missions" : "main";
    else if (action.type === "TOGGLE_SOUND") this.sound.toggleMuted();
    else if (action.type === "TOGGLE_AEGIS") this.campaign.toggleAegis();
    else if (action.type === "OPEN_SKIRMISH") {
      const mapDefinition = LEVELS[this.levelIndex];
      this.match = new MatchDirector({ config: configForMap(mapDefinition), mapDefinition });
      this.selectedLaneId = mapDefinition.lanes[0].id;
      this.menuScreen = "skirmish";
      this.prepareLevelAssets(mapDefinition);
    } else if (action.type === "SELECT_MISSION") {
      const mission = missionById(action.missionId);
      if (!mission?.available || !missionUnlocked(mission, this.campaign.data.completed)) return;
      this.selectedMissionId = mission.id;
      this.menuScreen = "briefing";
      this.prepareLevelAssets(mission.map);
    } else if (action.type === "START_MISSION") this.startMission();
  }

  startMission() {
    const mission = missionForProgress(missionById(this.selectedMissionId), this.campaign.data.completed);
    if (this.menuScreen !== "briefing" || this.match.state !== MATCH_STATE.TITLE
      || !mission?.available || !missionUnlocked(mission, this.campaign.data.completed)) return false;
    if (!this.levelAssetsReady(mission.map)) {
      this.prepareLevelAssets(mission.map).then(() => {
        if (this.selectedMissionId === mission.id && this.menuScreen === "briefing") this.startMission();
      });
      return false;
    }
    this.match = new MatchDirector({ ...missionMatchOptions(mission, this.campaign.data.equipment), equippedAbility: this.campaign.data.equipment.ability });
    this.selectedLaneId = mission.map.lanes[0].id;
    this.commandMenu = "units";
    this.setCommandDockOpen(false);
    this.commandFeedback = null;
    this.recordedMissionResult = null;
    this.campaign.begin(mission.id);
    return this.startSelectedMatch();
  }

  startExpansionMission() {
    const mission = expansionMissionById(this.selectedExpansionId);
    if (this.menuScreen !== "expansion-map" || this.match.state !== MATCH_STATE.TITLE || !this.expansion.canStart(mission?.id)) return false;
    if (!this.levelAssetsReady(mission.map)) {
      this.prepareLevelAssets(mission.map).then(() => {
        if (this.selectedExpansionId === mission.id && this.menuScreen === "expansion-map") this.startExpansionMission();
      });
      return false;
    }
    this.match = new MatchDirector(expansionMatchOptions(mission));
    this.expansionRunMode = this.expansion.data.mode;
    this.selectedLaneId = mission.map.lanes[0].id;
    this.selectedSiteId = null; this.commandMenu = "units";
    this.setCommandDockOpen(false); this.commandFeedback = null; this.recordedMissionResult = null;
    return this.startSelectedMatch();
  }

  executeStationAction(action) {
    const map = this.match.mapDefinition;
    if (action.type === "SITE_PANEL") return;
    if (action.type === "CLOSE_SITE") { this.selectedSiteId = null; this.syncCommandViewport(); return; }
    if (action.type === "FOCUS_SITE") {
      const site = action.site === "pad" ? map.buildPads[action.index ?? 0] : map.markers[0];
      if (site.laneId) this.selectedLaneId = site.laneId;
      this.selectedSiteId = site.id; this.setCommandDockOpen(false);
      this.camera.jumpToWorld(site.y); this.sound.play("select"); return;
    }
    if (action.type === "SITE_COMMAND") {
      const pad = map.buildPads.find(p => p.id === this.selectedSiteId);
      const command = pad ? { type: "BUILD_STATION", padId: pad.id, module: "bastion" }
        : { type: "START_PROJECT", stationId: this.selectedSiteId };
      if (!pad && this.match.mission.goal.kind !== "evacuate") return;
      const result = this.match.executeCommand({ ...command, team: TEAM.PLAYER });
      this.showFeedback(result.ok ? pad ? "BASTION IM BAU · 8 SEKUNDEN" : "RETTUNGSLADUNG BEZAHLT" : this.commandFailureLabel(result.reason));
      this.sound.play(result.ok ? "purchase" : "error");
    }
  }

  levelAssetsReady(mapDefinition) {
    return Object.keys(levelAssetManifest(mapDefinition.level)).every((key) => this.loader.get(key));
  }

  prepareLevelAssets(mapDefinition) {
    if (this.levelAssetsReady(mapDefinition)) return Promise.resolve(this.loader);
    if (this.levelLoadPromise) return this.levelLoadPromise.then(() => this.prepareLevelAssets(mapDefinition));
    this.levelLoading = true;
    const requestedLevel = mapDefinition.level;
    this.levelLoadPromise = this.loader.load(levelAssetManifest(requestedLevel)).finally(() => {
      this.levelLoading = false;
      this.levelLoadPromise = null;
    });
    return this.levelLoadPromise;
  }

  startSelectedMatch() {
    if (this.match.state !== MATCH_STATE.TITLE) return false;
    if (!this.match.start()) return false;
    this.syncCommandViewport();
    this.camera.setWorldHeight(this.match.simulation.state.map.bounds.height);
    this.camera.reset("player");
    this.effects.reset();
    this.sound.reset();
    this.sound.play("deploy");
    this.sound.vibrate([12, 24, 18]);
    this.syncMatchState();
    return true;
  }

  restartMatch() {
    if (!this.match.restart()) return false;
    this.selectedSiteId = null;
    this.setCommandDockOpen(false);
    this.commandMenu = "units";
    this.commandFeedback = null;
    this.recordedMissionResult = null;
    this.camera.setWorldHeight(this.match.simulation.state.map.bounds.height);
    this.camera.reset("player");
    this.effects.reset();
    this.sound.reset();
    this.sound.play("deploy");
    this.syncMatchState();
    return true;
  }

  returnToTitle() {
    if (!this.match.returnToTitle()) return false;
    this.selectedSiteId = null;
    this.cameraGesture = null;
    this.menuScreen = isExpansionMission(this.match.mission) ? "expansion" : "main";
    this.commandMenu = "units";
    this.setCommandDockOpen(false);
    this.commandFeedback = null;
    this.effects.reset();
    this.sound.reset();
    this.sound.play("select");
    this.syncMatchState();
    return true;
  }

  handleCameraInput(input) {
    const cameraState = this.match.state === MATCH_STATE.LIVE_MATCH || this.match.state === MATCH_STATE.PAUSED;
    if (!cameraState) {
      if (input.kind === "up" || input.kind === "cancel") this.cameraGesture = null;
      return false;
    }

    if (input.kind === "down") {
      const navigatorRatio = cameraNavigatorRatioAt(input, this.camera.viewport);
      if (navigatorRatio !== null) {
        this.cameraGesture = { type: "navigator" };
        this.camera.jumpToRatio(navigatorRatio);
        return true;
      }
      if (!containsPoint(this.camera.viewport, input)) return false;
      this.cameraGesture = {
        type: "pan",
        originX: input.x,
        originY: input.y,
        originTime: input.timeStamp,
        moved: false,
      };
      this.camera.beginPan(input.y, input.timeStamp);
      return true;
    }

    if (!this.cameraGesture) return false;
    if (this.cameraGesture.type === "navigator") {
      if (input.kind === "move") {
        const ratio = cameraNavigatorRatioAt({ ...input, x: 400 }, this.camera.viewport);
        if (ratio !== null) this.camera.jumpToRatio(ratio);
      }
      if (input.kind === "up" || input.kind === "cancel") this.cameraGesture = null;
      return true;
    }

    if (input.kind === "move") {
      const distance = Math.hypot(input.x - this.cameraGesture.originX, input.y - this.cameraGesture.originY);
      if (!this.cameraGesture.moved && distance >= this.camera.config.dragThreshold) {
        this.cameraGesture.moved = true;
        this.camera.beginPan(this.cameraGesture.originY, this.cameraGesture.originTime);
      }
      if (this.cameraGesture.moved) this.camera.panTo(input.y, input.timeStamp);
      return true;
    }

    if (input.kind === "up") {
      if (this.cameraGesture.moved) this.camera.endPan();
      else {
        this.camera.cancelPan();
        const site = this.match.mapDefinition.objectiveMission && this.match.state === MATCH_STATE.LIVE_MATCH
          ? worldSiteAt(this.match.mapDefinition, { x: this.cameraGesture.originX, y: this.camera.screenToWorldY(this.cameraGesture.originY) }) : null;
        if (site) {
          if (site.laneId) this.selectedLaneId = site.laneId;
          this.selectedSiteId = site.id; this.setCommandDockOpen(false); this.camera.jumpToWorld(site.y);
          this.sound.play("select"); this.cameraGesture = null; return true;
        }
        if (this.match.state === MATCH_STATE.LIVE_MATCH && this.playerHqContains({ x: this.cameraGesture.originX, y: this.cameraGesture.originY })) {
          this.setCommandDockOpen(!this.commandDockOpen);
          this.sound.play("select");
        }
      }
      this.cameraGesture = null;
      return true;
    }
    if (input.kind === "cancel") {
      this.camera.cancelPan();
      this.cameraGesture = null;
      return true;
    }
    return true;
  }

  toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => this.showFeedback("FULLSCREEN UNAVAILABLE"));
      return;
    }
    const target = this.canvas.parentElement ?? this.canvas;
    if (!target.requestFullscreen) {
      this.showFeedback("FULLSCREEN UNAVAILABLE");
      return;
    }
    target.requestFullscreen().catch(() => this.showFeedback("FULLSCREEN UNAVAILABLE"));
  }

  showFeedback(message, seconds = 1.45) {
    this.commandFeedback = message;
    this.commandFeedbackUntil = this.clock.frameTime + seconds;
  }

  executeCommandAction(action) {
    if (!action) return;
    if (action.type === "FOCUS_CARRIER") { this.camera.reset("player"); this.sound.play("select"); return; }
    if (action.type === "TOGGLE_LANE_STANCE") {
      const stance = this.match.simulation.state.laneStances.get(this.selectedLaneId) === "hold" ? "push" : "hold";
      this.match.executeCommand({ type: "SET_LANE_STANCE", team: TEAM.PLAYER, laneId: this.selectedLaneId, stance });
      this.showFeedback(stance === "hold" ? "LANE HÄLT DIE ABWEHRLINIE" : "LANE IM VORSTOSS"); return;
    }
    if (action.type === "ACTIVATE_AEGIS" || action.type === "ACTIVATE_CARRIER") {
      const result = this.match.executeCommand({ ...action, team: TEAM.PLAYER, laneId: this.selectedLaneId });
      this.showFeedback(result.ok ? this.match.equippedAbility === "disrupt" ? "STÖRIMPULS · 3,5s WAFFENPAUSE" : "AEGIS AKTIV · 6 SEKUNDEN SCHUTZ" : this.commandFailureLabel(result.reason));
      this.sound.play(result.ok ? "purchase" : "error");
      if (result.ok) this.sound.vibrate([12, 20, 12]);
      return;
    }
    if (action.type === "FOCUS_FRONT") {
      const units = [...this.match.simulation.state.units.values()].filter(unit => unit.alive && unit.team === TEAM.PLAYER && unit.laneId === this.selectedLaneId);
      const engaged = units.filter(unit => unit.targetId);
      const frontY = engaged.length ? engaged.reduce((sum, unit) => sum + unit.y, 0) / engaged.length : units.length ? Math.min(...units.map(unit => unit.y)) : this.match.mapDefinition.bounds.height - 120;
      this.camera.jumpToWorld(frontY);
      if (this.match.missionRuntime) this.match.missionRuntime.frontVisited = true;
      this.sound.play("select"); return;
    }
    if (action.type === "TOGGLE_COMMAND_DOCK") {
      this.setCommandDockOpen(!this.commandDockOpen);
      this.sound.play("select");
      return;
    }
    if (action.type === "SET_COMMAND_MENU") {
      if (action.menu === "upgrades" && this.match.config.rules?.upgrades?.length === 0) {
        this.showFeedback("FORSCHUNG FOLGT IN SPÄTEREN MISSIONEN");
        return;
      }
      this.commandMenu = action.menu;
      this.syncCommandViewport();
      this.sound.play("select");
      return;
    }
    if (action.type === "SELECT_LANE") {
      this.selectedLaneId = action.laneId;
      const laneLabel = action.laneId === LANE.CENTER ? "MAIN" : action.laneId === LANE.LEFT ? "LEFT" : "RIGHT";
      this.showFeedback(`${laneLabel} LANE SELECTED`);
      this.sound.play("select");
      return;
    }
    const result = this.match.executeCommand({ ...action, team: TEAM.PLAYER, laneId: this.selectedLaneId });
    const deploymentLabel = UNIT_DEFINITIONS[action.unitType]?.deploymentLabel ?? action.unitType?.toUpperCase();
    this.showFeedback(result.ok ? (action.type === "BUY_UPGRADE" ? "UPGRADE ONLINE" : `${deploymentLabel} ${this.match.mission ? "GESTARTET" : "LAUNCHED"}`) : this.commandFailureLabel(result.reason));
    this.sound.play(result.ok ? "purchase" : "error");
    if (result.ok) this.sound.vibrate(9);
  }

  commandFailureLabel(reason) {
    if (this.match.mission && reason === "LANE_CAPACITY") {
      const count = this.match.simulation.state.lanes.get(this.selectedLaneId).unitIds.get(TEAM.PLAYER).length;
      return `ZU WENIG PLATZ · ${count}/${this.match.config.caps.unitsPerLaneTeam}`;
    }
    if (this.match.mission) return {
      TEAM_CAPACITY: "GESAMTFLOTTE VOLL · AUF VERLUSTE WARTEN", NO_ABILITY_TARGETS: "KEINE GEGNERSCHIFFE IN DIESER LANE",
      ABILITY_COOLDOWN: "CARRIER-FÄHIGKEIT LÄDT NOCH", ABILITY_NOT_EQUIPPED: "AEGIS NICHT AUSGERÜSTET",
      INSUFFICIENT_ENERGY: "NICHT GENUG ENERGIE", COOLDOWN_ACTIVE: "EINHEIT LÄDT NACH",
      SITE_OCCUPIED: "BAUPLATZ BEREITS BELEGT", STATION_UNSECURED: "STATION BRAUCHT EIGENE BESATZUNG UND RUHE",
      PROJECT_ALREADY_STARTED: "LADUNG BEREITS BEZAHLT", OBJECTIVE_LOST: "ZIELANLAGE VERLOREN",
      MISSION_LOCKED_UNIT: "IN DIESER MISSION NICHT VERFÜGBAR", MISSION_LOCKED_UPGRADE: "FORSCHUNG FOLGT SPÄTER",
    }[reason] ?? "BEFEHL NICHT VERFÜGBAR";
    return Object.freeze({ INSUFFICIENT_ENERGY: "NOT ENOUGH ENERGY", LANE_CAPACITY: "LANE AT CAPACITY", COOLDOWN_ACTIVE: "WING RECHARGING", UNAVAILABLE_UPGRADE: "UPGRADE UNAVAILABLE", WRONG_PHASE: "COMMAND UNAVAILABLE", MAX_LEVEL: "UPGRADE ALREADY MAXED" })[reason] ?? "COMMAND UNAVAILABLE";
  }

  setCommandDockOpen(open) {
    this.commandDockOpen = Boolean(open);
    if (open) this.selectedSiteId = null;
    this.syncCommandViewport();
  }

  syncCommandViewport() {
    if (!this.camera) return;
    const topInset = this.match.mission ? this.match.carrierAbility?.equipped ? 180 : 126 : CONFIG.camera.battlefieldTopInset;
    if (this.camera.config.battlefieldTopInset !== topInset) {
      this.camera.config = { ...CONFIG.camera, battlefieldTopInset: topInset };
      this.camera.resize(this.camera.designWidth, this.camera.designHeight);
    }
    this.camera.setBottomInset(this.commandDockOpen ? commandUiBottomInset(this.commandMenu)
      : isExpansionMission(this.match.mission) && this.match.mapDefinition.markers.length ? this.selectedSiteId ? 296 : 132 : CONFIG.camera.battlefieldBottomInset);
  }

  playerHqContains(point) {
    const hq = this.match.simulation?.state.structures.get("player-hq");
    if (!hq?.alive) return false;
    const screenY = this.camera.worldToScreenY(hq.y);
    return Math.abs(point.x - hq.x) <= 76 && Math.abs(point.y - screenY) <= 62;
  }

  handleKeyDown(event) {
    if (event.key.toLowerCase() === "p") {
      if (this.match.state === MATCH_STATE.PAUSED) this.match.resume();
      else this.match.pause();
    }
    if (event.key.toLowerCase() === "r") this.restartMatch();
    this.syncMatchState();
  }

  syncMatchState() {
    this.state = this.assetsReady ? this.match.state : MATCH_STATE.LOADING;
    if (this.match.mission && this.match.state === MATCH_STATE.VICTORY && this.recordedMissionResult !== this.match) {
      if (isExpansionMission(this.match.mission)) {
        const completed = this.expansionRunMode === "pilots" ? this.expansion.data.pilotCompleted : this.expansion.data.completed;
        this.rewardFirstTime = !completed.includes(this.match.mission.id);
        this.expansion.complete(this.match.mission.id, this.expansionRunMode); this.recordedMissionResult = this.match; return;
      }
      this.rewardFirstTime = !this.campaign.data.completed.includes(this.match.mission.id);
      const hq = this.match.simulation.state.structures.get("player-hq");
      this.campaign.complete(this.match.mission.id, {carrierHpRatio: hq.hp / hq.maxHp, abilityUses: this.match.missionRuntime.abilityUses});
      this.recordedMissionResult = this.match;
    }
  }

  frame(now) {
    if (!this.running) return;
    const delta = this.lastFrameAt === null ? 0 : (now - this.lastFrameAt) / 1000;
    this.lastFrameAt = now;
    const previousState = this.match.state;
    const previousCycle = this.match.cycle;
    this.camera.update(delta);
    this.clock.advance(delta, previousState, {
      onSimulationStep: (step) => {
        this.match.advanceLive(step);
        this.effects.observe(this.match.simulation?.state.events ?? []);
      },
    });
    this.effects.update(delta);
    this.sound.observe(this.match.simulation?.state.events ?? []);
    if (this.match.cycle > previousCycle) {
      this.sound.play("deploy");
      this.sound.vibrate([12, 24, 18]);
    }
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
      menuScreen: this.menuScreen,
      selectedMissionId: this.selectedMissionId,
      campaignProgress: this.campaign.snapshot(),
      expansionProgress: this.expansion.snapshot(),
      selectedExpansionId: this.selectedExpansionId,
      selectedSiteId: this.selectedSiteId,
      expansionRunMode: this.expansionRunMode,
      mission: this.match.mission,
      rewardFirstTime: this.rewardFirstTime,
      aiProfile: this.match.aiProfile,
      lastAiDecision: this.match.lastAiDecision,
      mapDefinition: this.match.mapDefinition,
      selectedLevel: this.match.mapDefinition.level,
      selectedLaneId: this.selectedLaneId,
      commandMenu: this.commandMenu,
      commandDockOpen: this.commandDockOpen,
      fullscreenActive: this.fullscreenActive,
      soundEnabled: this.sound.enabled,
      camera: this.camera.snapshot(),
      commandFeedback: this.clock.frameTime < this.commandFeedbackUntil ? this.commandFeedback : null,
      assetProgress: this.loader.progress,
      assetErrors: this.loader.errors.length,
      levelLoading: this.levelLoading,
      assets: this.loader,
      effects: this.effects.effects,
    });
    requestAnimationFrame(this.onFrame);
  }

  getViewportSnapshot() {
    return this.transform;
  }

  getCameraSnapshot() {
    return this.camera.snapshot();
  }
}
