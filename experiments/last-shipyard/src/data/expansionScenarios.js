import { CONFIG } from "../config.js";
import { TEAM } from "../core/constants.js";
import { EXPANSION_ID } from "./campaignExpansion.js";

export const BASTION = Object.freeze({ cost: 140, buildSeconds: 8, maxHp: 340 });
export const EVACUATION = Object.freeze({ cost: 120, seconds: 16 });
export const isExpansionMission = mission => mission?.campaignId === EXPANSION_ID;

// These are test presets. They neither require nor grant equipment in the old campaign.
export const expansionMatchOptions = mission => {
  if (!isExpansionMission(mission) || !mission.available || ![2, 4].includes(mission.number)) throw new Error("This mission is not playable yet.");
  const ferry = mission.goal.kind === "evacuate";
  const marker = mission.map.markers[0];
  const mapDefinition = { ...mission.map, objectiveMission: true,
    features: { ...mission.map.features, captureNodes: !ferry, defensiveTurrets: true },
    objectiveCapture: { paidOnly: true, pauseWhenContested: true },
    lanes: mission.map.lanes.map(lane => ({ ...lane, defenseLineY: lane.anchors.holdY,
      ...(!ferry ? { node: marker } : {}) })),
    structures: mission.map.structures.map(s => ({ ...s, maxHp: 1400 })).concat(ferry ? [{
      id: marker.id, structureType: "station", team: TEAM.PLAYER, laneId: marker.laneId,
      x: marker.x, y: marker.y, maxHp: 900,
    }] : []),
  };
  return { mission, mapDefinition, equippedAbility: ferry ? "aegis" : null,
    config: { ...CONFIG,
      timing: { ...CONFIG.timing, deploymentIntervalSeconds: 30 },
      caps: { ...CONFIG.caps, unitsPerLaneTeam: ferry ? 10 : 12,
        unitsPerLaneTeamByTeam: { [TEAM.PLAYER]: ferry ? 10 : 12, [TEAM.ENEMY]: 8 },
        unitsPerTeamByTeam: { [TEAM.PLAYER]: ferry ? 16 : 12, [TEAM.ENEMY]: ferry ? 12 : 8 } },
      balance: { ...CONFIG.balance, startingEnergy: ferry ? 340 : 300, energyCap: 400,
        startingEnergyByTeam: { [TEAM.PLAYER]: ferry ? 340 : 300, [TEAM.ENEMY]: 400 },
        incomePerSecondByTeam: { [TEAM.PLAYER]: ferry ? 12 : 10, [TEAM.ENEMY]: 12 },
        baseIncomePerSecond: ferry ? 12 : 10, nodeIncomePerSecond: 0, nodeCaptureRatePerSecond: 8,
        baseWaveDronesPerLane: 1, freeDronesByTeam: { [TEAM.PLAYER]: 1, [TEAM.ENEMY]: 0 },
        baseWaveDroneEscalationMaximumBonus: 0, maximumBacklogWaves: 1, maximumActiveDronesPerLane: 2,
        escalation: [{ fromBattleSeconds: 0, multiplier: 1 }] },
      rules: { missionOwnsVictory: true, allowLaneStance: false, bomberVariant: "standard",
        units: mission.units, unitsByTeam: { [TEAM.PLAYER]: mission.units, [TEAM.ENEMY]: ["scout", "fighter", "bomber"] }, upgrades: [] },
    },
  };
};
