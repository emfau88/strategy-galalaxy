import { CONFIG } from "../config.js";
import { CLASSIC_LANES, ORBITAL_GARDEN } from "./definitions.js";

export const MISSIONS = Object.freeze([
  Object.freeze({
    id: "first-contact", number: 1, title: "Erstkontakt", available: true,
    map: ORBITAL_GARDEN, aiProfile: "cadet", aiInvestmentBias: "fleet",
    objective: "Zerstöre den gegnerischen Carrier.",
    briefing: ["Scouts bilden deinen schnellen Schutzschirm.", "Fighter verstärken ihn mit kräftigen Salven."],
    lesson: "Beobachten. Verstärken. Vorrücken.",
    units: Object.freeze(["scout", "fighter"]), upgrades: Object.freeze([]),
    fleetLimit: 12, startingEnergy: 160, income: 10, carrierHp: 900,
    waveSeconds: 22, waveDrones: 1, opponentIntervalSeconds: 2,
  }),
  Object.freeze({
    id: "heavy-resistance", number: 2, title: "Schwerer Widerstand", available: false,
    map: ORBITAL_GARDEN, lesson: "Bomber einsetzen und mit einer Eskorte schützen.",
  }),
  Object.freeze({
    id: "split-front", number: 3, title: "Geteilte Front", available: false,
    map: CLASSIC_LANES, lesson: "Zwei Lanes beobachten und Verstärkung verteilen.",
  }),
]);

export const missionById = (id) => MISSIONS.find((mission) => mission.id === id) ?? null;
export const missionUnlocked = (mission, completed) => mission.number === 1
  || completed.includes(MISSIONS[mission.number - 2].id);

// Mission rules belong to a new match. The free-battle maps/config stay intact.
export const missionMatchOptions = (mission) => {
  if (!mission?.available) throw new Error("This mission is not playable yet.");
  return {
    mission,
    mapDefinition: {
      ...mission.map,
      balanceOverrides: {},
      structures: mission.map.structures.map((structure) => structure.structureType === "hq"
        ? { ...structure, maxHp: mission.carrierHp } : structure),
    },
    config: {
      ...CONFIG,
      caps: { ...CONFIG.caps, unitsPerLaneTeam: mission.fleetLimit },
      timing: { ...CONFIG.timing, deploymentIntervalSeconds: mission.waveSeconds,
        opponentAiDecisionIntervalSeconds: mission.opponentIntervalSeconds },
      balance: {
        ...CONFIG.balance, startingEnergy: mission.startingEnergy, energyCap: 250,
        baseIncomePerSecond: mission.income,
        baseWaveDronesPerLane: mission.waveDrones,
        baseWaveDroneEscalationMaximumBonus: 0,
        maximumBacklogWaves: 1,
        escalation: [{ fromBattleSeconds: 0, multiplier: 1 }],
      },
      rules: { units: mission.units, upgrades: mission.upgrades },
    },
    aiProfile: mission.aiProfile,
    aiInvestmentBias: mission.aiInvestmentBias,
  };
};
