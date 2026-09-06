/** Semantic groups keep gameplay independent from individual filenames. */
export const ASSET_GROUPS = Object.freeze({
  boot: Object.freeze({
    "background-void": "assets/environment/void.png",
    "background-stars": "assets/environment/stars.png",
    "background-planet": "assets/environment/planet.png",
    "background-asteroid": "assets/environment/asteroid.png",
    "nairan-scout": "assets/factions/nairan/scout.png",
    "nairan-fighter": "assets/factions/nairan/fighter.png",
    "nairan-bomber": "assets/factions/nairan/bomber.png",
    "nairan-frigate": "assets/factions/nairan/frigate.png",
    "klaed-scout": "assets/factions/klaed/scout.png",
    "klaed-fighter": "assets/factions/klaed/fighter.png",
    "klaed-bomber": "assets/factions/klaed/bomber.png",
    "klaed-frigate": "assets/factions/klaed/frigate.png",
    "nairan-bolt": "assets/projectiles/nairan-bolt.png",
    "klaed-bullet": "assets/projectiles/klaed-bullet.png",
  }),
  ships: Object.freeze({}),
  effects: Object.freeze({}),
  ui: Object.freeze({}),
});

export const mergeAssetGroups = (...groups) => Object.assign({}, ...groups);
