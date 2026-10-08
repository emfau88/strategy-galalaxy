import { CONFIG } from "../config.js";
import { TEAM } from "../core/constants.js";
import { CLASSIC_LANES, ORBITAL_GARDEN } from "./definitions.js";

export const MISSIONS = Object.freeze([
  {
    id: "first-contact", number: 1, title: "Erstkontakt", available: true,
    map: ORBITAL_GARDEN, kind: "assault", objective: "Durchbrich die Blockade. Zerstöre den Carrier.",
    briefing: ["Scouts halten leichte Gegner auf.", "Fighter räumen den Weg. Nutze die Angriffspausen."],
    lesson: "Eine kleine Flotte. Ein erster Durchbruch.",
    units: ["scout", "fighter"], enemyUnits: ["scout", "fighter"], upgrades: [],
    fleetLimit: 12, enemyFleetLimit: 8, startingEnergy: 160, enemyEnergy: 140,
    income: 10, enemyIncome: 6, carrierHp: 1000, enemyCarrierHp: 650,
    waveSeconds: 26, introSeconds: 12, warningSeconds: 6, assaultSeconds: 16, recoverySeconds: 28,
    attacks: [[{ unitType: "scout", at: 0 }, { unitType: "fighter", at: 6 }]],
    threat: "Scout-Verband + Fighter-Eskorte",
    reward: "BOMBER-BAUPLAN", rewardDetail: "Mission 2 und das erste Dock sind jetzt verfügbar.",
  },
  {
    id: "heavy-resistance", number: 2, title: "Schwerer Widerstand", available: true,
    map: ORBITAL_GARDEN, kind: "assault", objective: "Besiege den schweren Blockadeverband.",
    briefing: ["Bomber treffen Fregatten und Carrier besonders hart.", "Schicke Fighter zuerst: Sie schützen die Bomber."],
    lesson: "Eskorte zuerst. Belagerung dahinter.",
    units: ["scout", "fighter", "bomber"], enemyUnits: ["fighter", "frigate"], upgrades: [],
    fleetLimit: 14, enemyFleetLimit: 7, startingEnergy: 250, enemyEnergy: 300,
    income: 12, enemyIncome: 8, carrierHp: 1200, enemyCarrierHp: 1000,
    waveSeconds: 28, introSeconds: 8, warningSeconds: 7, assaultSeconds: 20, recoverySeconds: 32,
    attacks: [[{ unitType: "frigate", at: 0 }, { unitType: "fighter", at: 4 }]],
    threat: "1 Fregatte + 2 Fighter pro Vorstoß",
    reward: "AEGIS-BAUPLAN", rewardDetail: "Aegis ist ausgerüstet. Mission 3: Verteidige den Hafen.",
  },
  {
    id: "harbor-fire", number: 3, title: "Hafen im Feuer", available: true, map: ORBITAL_GARDEN, kind: "defense",
    objective: "Wehre drei Angriffe ab. Dein Carrier muss überleben.",
    briefing: ["Deine Schiffe halten automatisch die Abwehrlinie.", "80 E für sechs Sekunden Aegis oder neue Schiffe?"],
    lesson: "Halten statt vorstoßen. Schild oder Verstärkung?",
    units: ["scout", "fighter", "bomber"], enemyUnits: ["scout", "fighter", "bomber", "frigate"], upgrades: [],
    fleetLimit: 14, enemyFleetLimit: 8, startingEnergy: 250, enemyEnergy: 300,
    income: 12, enemyIncome: 10, carrierHp: 1400, enemyCarrierHp: 1000,
    waveSeconds: 28, introSeconds: 10, warningSeconds: 8, assaultSeconds: 20, recoverySeconds: 12,
    attacks: [
      [{ unitType: "scout", at: 0 }, { unitType: "fighter", at: 4 }],
      [{ unitType: "frigate", at: 0 }, { unitType: "fighter", at: 4 }],
      [{ unitType: "fighter", at: 0 }, { unitType: "bomber", at: 3 }, { unitType: "scout", at: 7 }],
    ],
    threat: "Drei Angriffe aus dem Sprungkorridor",
    threats: ["3 Scouts + 2 Fighter", "1 Fregatte + 2 Fighter", "2 Fighter + 1 Bomber + 3 Scouts"],
    reward: "FREGATTEN-BAUPLAN", rewardDetail: "Kapitel 1 beendet. Der Hafen erwacht wieder zum Leben.",
  },
  {
    id: "split-front", number: 4, title: "Geteilte Front", available: true, map: CLASSIC_LANES, kind: "assault", allowLaneStance: true,
    objective: "Halte eine Front. Brich auf der anderen zum Carrier durch.",
    briefing: ["Links starten deine Schiffe im Haltemodus.", "Wähle eine Lane: HALTEN oder VORSTOSS im Flottenmenü."],
    lesson: "Fregatte hält links. Bomber stoßen rechts vor.",
    units: ["scout", "fighter", "bomber", "frigate"], enemyUnits: ["scout", "fighter", "bomber", "frigate"], upgrades: [],
    fleetLimit: 12, fleetTotal: 18, enemyFleetLimit: 9, enemyFleetTotal: 14,
    startingEnergy: 320, enemyEnergy: 350, income: 14, enemyIncome: 10, carrierHp: 1600, enemyCarrierHp: 1400,
    waveSeconds: 30, introSeconds: 10, warningSeconds: 8, assaultSeconds: 22, recoverySeconds: 30,
    defaultHoldLane: 0,
    attacks: [[{unitType:"frigate",lane:0,at:0},{unitType:"scout",lane:1,at:3},{unitType:"fighter",lane:0,at:5},{unitType:"bomber",lane:1,at:9}]],
    threat: "Links schwer · rechts schnelle Angriffe",
    laneThreats: ["LINKS: Fregatte + Fighter", "RECHTS: Scouts + Bomber"],
    reward: "IONENBOMBER-BAUPLAN", rewardDetail: "Ionenbomber bereit. In der Werft kostenlos wechseln.",
  },
  {
    id: "the-window", number: 5, title: "Das Zeitfenster", available: true, map: ORBITAL_GARDEN, kind: "assault", allowLaneStance: true,
    objective: "Überstehe die Belagerung. Nutze die lange Aufbaupause.",
    briefing: ["Halte zuerst die Linie. Dann auf VORSTOSS umschalten.", "Standardbomber belagern; Ionenbomber stören Schiffswaffen."],
    lesson: "Ein schwerer Ansturm. Ein langer Gegenstoß.",
    units: ["scout", "fighter", "bomber", "frigate"], enemyUnits: ["fighter", "bomber", "frigate"], upgrades: [],
    fleetLimit: 16, enemyFleetLimit: 8, startingEnergy: 320, enemyEnergy: 400,
    income: 14, enemyIncome: 10, carrierHp: 1700, enemyCarrierHp: 1500,
    waveSeconds: 30, introSeconds: 8, warningSeconds: 8, assaultSeconds: 20, recoverySeconds: 48,
    defaultHoldLane: 0,
    attacks: [[{unitType:"frigate",at:0},{unitType:"bomber",at:3},{unitType:"fighter",at:7}]],
    threat: "Fregatte + Bomber + Fighter",
    reward: "STÖRIMPULS-BAUPLAN", rewardDetail: "Neue Carrier-Fähigkeit. In der Werft statt Aegis wählen.",
  },
  { id: "shield-network", number: 6, title: "Das Schildnetz", available: false, map: CLASSIC_LANES,
    lesson: "Relais ausschalten. Die Werft endgültig sichern." },
].map(mission => Object.freeze(mission)));

export const missionById = id => MISSIONS.find(mission => mission.id === id) ?? null;
export const missionUnlocked = (mission, completed) => Boolean(mission && (mission.number === 1
  || completed.includes(MISSIONS[mission.number - 2].id)));
// Earned classes can be tried in later completed missions without changing the introductory lesson.
export const missionForProgress = (mission, completed = []) => mission?.available && mission.number >= 2
  && completed.includes("harbor-fire") && !mission.units.includes("frigate") ? { ...mission, units: [...mission.units, "frigate"] } : mission;
export const nextMission = mission => MISSIONS[mission.number] ?? null;
export const shipyardStage = completed => completed.includes("harbor-fire") ? 2 : completed.includes("first-contact") ? 1 : 0;

// Each mission owns its arsenal and budget. Enemy purchases use the same legal commands.
export const missionMatchOptions = (mission, equipment = {}) => {
  if (!mission?.available) throw new Error("This mission is not playable yet.");
  return {
    mission,
    mapDefinition: { ...mission.map, balanceOverrides: {}, defenseLineY: mission.kind === "defense" ? 780 : null,
      lanes: mission.kind === "defense" ? mission.map.lanes.map(lane => ({ ...lane, enemySpawn: { ...lane.enemySpawn, y: 420 } })) : mission.map.lanes,
      structures: mission.map.structures.filter(structure => mission.kind !== "defense" || structure.team !== TEAM.ENEMY).map(structure => structure.structureType === "hq"
        ? { ...structure, maxHp: structure.team === TEAM.PLAYER ? mission.carrierHp : mission.enemyCarrierHp } : structure) },
    config: { ...CONFIG,
      caps: { ...CONFIG.caps, unitsPerLaneTeam: mission.fleetLimit,
        unitsPerTeamByTeam: { [TEAM.PLAYER]: mission.fleetTotal ?? mission.fleetLimit, [TEAM.ENEMY]: mission.enemyFleetTotal ?? mission.enemyFleetLimit },
        unitsPerLaneTeamByTeam: { [TEAM.PLAYER]: mission.fleetLimit, [TEAM.ENEMY]: mission.enemyFleetLimit } },
      timing: { ...CONFIG.timing, deploymentIntervalSeconds: mission.waveSeconds },
      balance: { ...CONFIG.balance, startingEnergy: mission.startingEnergy, energyCap: 400,
        startingEnergyByTeam: { [TEAM.PLAYER]: mission.startingEnergy, [TEAM.ENEMY]: mission.enemyEnergy },
        baseIncomePerSecond: mission.income,
        incomePerSecondByTeam: { [TEAM.PLAYER]: mission.income, [TEAM.ENEMY]: mission.enemyIncome },
        baseWaveDronesPerLane: 1, freeDronesByTeam: { [TEAM.PLAYER]: 1, [TEAM.ENEMY]: 0 },
        baseWaveDroneEscalationMaximumBonus: 0, maximumBacklogWaves: 1,
        escalation: [{ fromBattleSeconds: 0, multiplier: 1 }] },
      rules: { missionOwnsVictory: true, allowLaneStance: Boolean(mission.allowLaneStance),
        bomberVariant: equipment.bomberVariant === "ion" ? "ion" : "standard", units: mission.units, unitsByTeam: { [TEAM.PLAYER]: mission.units, [TEAM.ENEMY]: mission.enemyUnits }, upgrades: [] },
    },
  };
};
