import { CONFIG } from "../config.js";
import { TEAM } from "../core/constants.js";
import { EXPANSION_ID } from "./campaignExpansion.js";

export const BASTION = Object.freeze({ cost: 140, buildSeconds: 8, maxHp: 340 });
export const EVACUATION = Object.freeze({ cost: 120, seconds: 16 });
export const isExpansionMission = mission => mission?.campaignId === EXPANSION_ID;
export const ACT_ONE_PRESETS = Object.freeze({
  1: { energy: 210, income: 7, laneLimit: 10, totalLimit: 10, carrierHp: 1200, enemyCarrierHp: 650, enemyLimit: 8, ability: "aegis" },
  2: { energy: 250, income: 8, laneLimit: 12, totalLimit: 12, carrierHp: 1400, enemyLimit: 10, ability: "aegis" },
  3: { energy: 280, income: 9, laneLimit: 12, totalLimit: 12, carrierHp: 1400, enemyLimit: 12, ability: "aegis" },
  4: { energy: 340, income: 12, laneLimit: 10, totalLimit: 16, carrierHp: 1400, enemyLimit: 12, ability: "aegis" },
});

// Authored Act I equipment. Free pilots reuse it without changing campaign unlocks.
export const expansionMatchOptions = (mission, equipment = {}) => {
  if (!isExpansionMission(mission) || !mission.available || !ACT_ONE_PRESETS[mission.number]) throw new Error("This mission is not playable yet.");
  const preset = ACT_ONE_PRESETS[mission.number];
  const ferry = mission.goal.kind === "evacuate";
  const capture = mission.goal.kind === "capture-defend";
  const defense = mission.goal.kind === "defend";
  const marker = mission.map.markers[0];
  const mapDefinition = { ...mission.map, objectiveMission: true, spacingScale: mission.number <= 3 ? 1.3 : 1,
    features: { ...mission.map.features, captureNodes: capture, defensiveTurrets: true },
    objectiveCapture: { paidOnly: true, pauseWhenContested: true },
    lanes: mission.map.lanes.map(lane => ({ ...lane, defenseLineY: mission.goal.kind === "destroy" ? null : lane.anchors.holdY,
      ...(capture ? { node: marker } : {}) })),
    structures: mission.map.structures.map(s => ({ ...s, maxHp: s.team === TEAM.PLAYER ? preset.carrierHp : preset.enemyCarrierHp })).concat(ferry || defense ? [{
      id: marker.id, structureType: "station", team: TEAM.PLAYER, laneId: marker.laneId,
      x: marker.x, y: marker.y, maxHp: 900,
    }] : []),
  };
  return { mission, mapDefinition, equippedAbility: mission.number >= 2 && mission.number <= 3 && equipment.ability === "repair" ? "repair" : preset.ability,
    config: { ...CONFIG,
      timing: { ...CONFIG.timing, deploymentIntervalSeconds: 30 },
      caps: { ...CONFIG.caps, unitsPerLaneTeam: preset.laneLimit,
        unitsPerLaneTeamByTeam: { [TEAM.PLAYER]: preset.laneLimit, [TEAM.ENEMY]: ferry ? 8 : preset.enemyLimit },
        unitsPerTeamByTeam: { [TEAM.PLAYER]: preset.totalLimit, [TEAM.ENEMY]: preset.enemyLimit } },
      balance: { ...CONFIG.balance, startingEnergy: preset.energy, energyCap: 400,
        startingEnergyByTeam: { [TEAM.PLAYER]: preset.energy, [TEAM.ENEMY]: 400 },
        incomePerSecondByTeam: { [TEAM.PLAYER]: preset.income, [TEAM.ENEMY]: 12 },
        baseIncomePerSecond: preset.income, nodeIncomePerSecond: 0, nodeCaptureRatePerSecond: 8,
        baseWaveDronesPerLane: 1, freeDronesByTeam: { [TEAM.PLAYER]: mission.number <= 3 ? 0 : 1, [TEAM.ENEMY]: 0 },
        baseWaveDroneEscalationMaximumBonus: 0, maximumBacklogWaves: 1, maximumActiveDronesPerLane: 2,
        escalation: [{ fromBattleSeconds: 0, multiplier: 1 }] },
      rules: { missionOwnsVictory: true, allowLaneStance: false, bomberVariant: "standard",
        units: mission.units, unitsByTeam: { [TEAM.PLAYER]: mission.units, [TEAM.ENEMY]: defense ? ["scout", "fighter", "bomber", "frigate"] : mission.number === 1 ? ["scout", "fighter"] : ["scout", "fighter", "bomber"] }, upgrades: [] },
    },
  };
};
