import { LANE, TEAM } from "../core/constants.js";
import { CORE_SLICE_FEATURES } from "./definitions.js";

export const EXPANSION_ID = "last-shipyard-sector-rebuild-v2";
const freeze = value => {
  if (value && typeof value === "object") { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
};
const lane = (id, x, width, playerY, enemyY, holdY) => ({ id, centerX: x, width,
  playerSpawn: { x, y: playerY }, enemySpawn: { x, y: enemyY }, anchors: { holdY } });
const center = (height, enemyY = 150, holdY = height - 350) => [lane(LANE.CENTER, 210, 330, height - 180, enemyY, holdY)];
const twins = (height, leftEnemy, rightEnemy, leftHold, rightHold) => [
  lane(LANE.LEFT, 105, 170, height - 180, leftEnemy, leftHold),
  lane(LANE.RIGHT, 315, 170, height - 180, rightEnemy, rightHold),
];
const marker = (id, kind, label, laneId, x, y) => ({ id, kind, label, laneId, x, y, radius: 46 });
const pad = (laneId, x, y) => ({ laneId, x, y });
const define = ({ slug, number, title, theme, height, lanes, markers, pads = [], objective, decision, reward,
  goal, requiredAlive = [], enemyCarrier = false, enemyCarrierLane = null, units }) => freeze({
  id: `v2-${slug}`, campaignId: EXPANSION_ID, number, title, objective, decision, reward,
  available: [2, 4].includes(number), status: [2, 4].includes(number) ? "playable-pilot" : "layout-preview", units, upgrades: [],
  goal: { ...goal, requiredAlive: ["player-hq", ...requiredAlive] },
  map: { id: `v2-${slug}-layout`, title, level: lanes.length, visualTheme: lanes.length === 1 ? "orbital_garden" : "twin_foundries",
    sectorTheme: theme, bounds: { width: 420, height }, features: { ...CORE_SLICE_FEATURES },
    lanes, markers, buildPads: pads.map((p, i) => ({ ...p, id: `v2-${slug}-pad-${i + 1}`, modules: number >= 6 ? ["bastion", "repair-dock"] : ["bastion"] })),
    structures: [
      { id: "player-hq", structureType: "hq", team: TEAM.PLAYER, laneId: null, x: 210, y: height - 12 },
      ...(enemyCarrier ? [{ id: "enemy-hq", structureType: "hq", team: TEAM.ENEMY, laneId: enemyCarrierLane,
        x: enemyCarrierLane === LANE.RIGHT ? 315 : 210, y: 12 }] : []),
    ],
  },
});
const light = ["scout", "fighter"], siege = [...light, "bomber"], full = [...siege, "frigate"];

// Two independent pilots; the remaining layouts cannot enter a combat runtime.
export const EXPANSION_MISSIONS = freeze([
  define({ slug: "light-in-the-wreckage", number: 1, title: "Ein Licht im Schrott", theme: "Schrottkorridor", height: 900,
    lanes: center(900, 140, 540), markers: [], units: light, enemyCarrier: true,
    objective: "Zerstöre den Blockadeträger. Dein Carrier muss überleben.",
    decision: "Schnelle Scouts schicken oder auf Fighter sparen?", reward: "Bastion-Bauplan",
    goal: { kind: "destroy", targets: ["enemy-hq"] } }),
  define({ slug: "first-outpost", number: 2, title: "Der erste Außenposten", theme: "Bergungssektor", height: 1180,
    lanes: center(1180, 190, 610), markers: [{ ...marker("outpost-relay", "control", "Kontrollrelais", LANE.CENTER, 210, 590), radius: 90 }],
    pads: [pad(LANE.CENTER, 120, 685)], units: light,
    objective: "Erobere das Relais und wehre zwei Gegenangriffe ab. Halte es am Ende sicher.",
    decision: "Eine Bastion errichten oder mehr Schiffe schicken?", reward: "Bomber-Bauplan",
    goal: { kind: "capture-defend", controlTarget: "outpost-relay", attacks: 2, requireClearBattle: true } }),
  define({ slug: "harbor-under-fire", number: 3, title: "Hafen im Feuer", theme: "Werftbecken", height: 980,
    lanes: center(980, 260, 620), markers: [marker("harbor-dock", "protect", "Vorgeschobenes Dock", LANE.CENTER, 120, 720)],
    pads: [pad(LANE.CENTER, 300, 590), pad(LANE.CENTER, 145, 825)], units: siege, requiredAlive: ["harbor-dock"],
    objective: "Wehre drei Angriffe ab. Dock und Carrier müssen überleben.",
    decision: "Vorne abfangen oder hinten eine Verteidigung aufbauen?", reward: "Aegis · Hafen in Betrieb",
    goal: { kind: "defend", attacks: 3, requireClearBattle: true } }),
  define({ slug: "last-ferry", number: 4, title: "Die letzte Fähre", theme: "Ziviler Sprungkorridor", height: 1320,
    lanes: twins(1320, 490, 180, 925, 1060), markers: [{ ...marker("evacuation-gate", "project", "Sprungstation", LANE.LEFT, 105, 900), radius: 90 }],
    pads: [pad(LANE.LEFT, 65, 985)], units: siege, requiredAlive: ["evacuation-gate"],
    objective: "Schließe drei Evakuierungsladungen ab. Sprungstation und Carrier müssen überleben.",
    decision: "Energie für die Rettung oder für eine bedrohte Front?", reward: "Fregatten-Bauplan · Fachleute gerettet",
    goal: { kind: "evacuate", projectTarget: "evacuation-gate", segments: 3 } }),
  define({ slug: "knowledge-under-fire", number: 5, title: "Wissen unter Beschuss", theme: "Forschungsanlage", height: 1120,
    lanes: center(1120, 185, 595), markers: [marker("research-archive", "research", "Forschungsarchiv", LANE.CENTER, 210, 555)],
    pads: [pad(LANE.CENTER, 110, 675)], units: full, requiredAlive: ["research-archive"],
    objective: "Sichere das Archiv, erforsche einen Prototyp und bestehe den Gegenangriff.",
    decision: "Ionenbomber oder Störimpuls zuerst entwickeln?", reward: "Gewählter Prototyp · Reparaturdock",
    goal: { kind: "research-defend", projectTarget: "research-archive", segments: 2, choices: ["ion", "disrupt"], requireClearBattle: true } }),
  define({ slug: "cut-the-supply", number: 6, title: "Schnitt in die Versorgung", theme: "Äußerer Blockadering", height: 1380,
    lanes: twins(1380, 370, 170, 890, 980), markers: [marker("alarm-relay", "sabotage", "Alarmrelais", LANE.LEFT, 105, 465),
      marker("production-dock", "sabotage", "Produktionsdock", LANE.RIGHT, 315, 275)],
    pads: [pad(LANE.RIGHT, 340, 1050)], units: full,
    objective: "Sabotiere mindestens eine Anlage. Löse danach den Abzug am Carrier aus.",
    decision: "Sicher abziehen oder auch das zweite Ziel riskieren?", reward: "Zweiter Forschungsprototyp",
    goal: { kind: "sabotage-extract", targets: ["alarm-relay", "production-dock"], minimumTargets: 1, projectTarget: "player-hq", segments: 1 } }),
  define({ slug: "key-to-the-blockade", number: 7, title: "Der Schlüssel zur Blockade", theme: "Innerer Blockadering", height: 1260,
    lanes: twins(1260, 430, 180, 720, 900), markers: [marker("shield-control", "control", "Schildsteuerung", LANE.LEFT, 105, 680)],
    units: full, enemyCarrier: true, enemyCarrierLane: LANE.RIGHT,
    objective: "Besetze links das Relais. Zerstöre rechts den dadurch verwundbaren Träger.",
    decision: "Links Kontrolle sichern und rechts genügend Angriffskraft behalten.", reward: "Zugang zum Werftkern",
    goal: { kind: "control-shield-destroy", controlTarget: "shield-control", targets: ["enemy-hq"], attackLaneId: LANE.RIGHT } }),
  define({ slug: "shipyard-awakens", number: 8, title: "Die Werft erwacht", theme: "Herz der Heimatwerft", height: 1180,
    lanes: twins(1180, 250, 150, 790, 730), markers: [marker("shipyard-core", "project", "Werftkern", null, 210, 905)],
    pads: [pad(LANE.LEFT, 105, 830), pad(LANE.RIGHT, 315, 770)], units: full, requiredAlive: ["shipyard-core"],
    objective: "Aktiviere drei Startsegmente und besiege den Schlussangriff. Kern und Carrier überleben.",
    decision: "Module, Flotte und Startenergie auf zwei Fronten verteilen.", reward: "Heimatwerft aktiv · Kampagnenabschluss",
    goal: { kind: "activate-defend", projectTarget: "shipyard-core", segments: 3, requireClearBattle: true } }),
]);
export const expansionMissionById = id => EXPANSION_MISSIONS.find(mission => mission.id === id) ?? null;
