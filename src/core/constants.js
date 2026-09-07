export const MATCH_STATE = Object.freeze({
  LOADING: "LOADING",
  TITLE: "TITLE",
  LIVE_MATCH: "LIVE_MATCH",
  VICTORY: "VICTORY",
  DEFEAT: "DEFEAT",
  PAUSED: "PAUSED",
});

export const TEAM = Object.freeze({
  PLAYER: "TEAM_PLAYER",
  ENEMY: "TEAM_ENEMY",
});

export const LANE = Object.freeze({
  LEFT: "LANE_LEFT",
  RIGHT: "LANE_RIGHT",
});

export const ACTIVE_PHASES = new Set([MATCH_STATE.LIVE_MATCH]);
