import { Game } from "./game.js";
import { readLaunchOptions } from "./qa/matchTestMode.js";

const canvas = document.querySelector("#game-canvas");
const game = new Game(canvas, readLaunchOptions());
game.start().catch((error) => {
  console.error("Strategy Galalaxy failed to start.", error);
});

if (game.options.debugEnabled || game.options.testMode) {
  window.__strategyGalalaxy = game;
}
