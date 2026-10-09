/** Only assets owned by this isolated experiment. */
export const ASSET_GROUPS = Object.freeze({
  boot: Object.freeze({
  "homeport-stations": "assets/campaign/homeport-stations-v1.png",
  "shield-relay-atlas": "assets/campaign/shield-relay-atlas-v1.png",
  "shipyard-keyart": "assets/campaign/shipyard-keyart-v1.png",
  "background-placeholder": "assets/runtime/environment/strategy-galaxy-background-v1.png",
  "unified-player-scout": "assets/factions/unified/player-scout-v2.png",
  "unified-player-drone": "assets/factions/unified/player-drone-v1.png",
  "unified-player-fighter": "assets/factions/unified/player-fighter-v2.png",
  "unified-player-bomber": "assets/factions/unified/player-bomber-v2.png",
  "unified-player-frigate": "assets/factions/unified/player-frigate-v2.png",
  "unified-enemy-scout": "assets/factions/unified/enemy-scout-v2.png",
  "unified-enemy-drone": "assets/factions/unified/enemy-drone-v1.png",
  "unified-enemy-fighter": "assets/factions/unified/enemy-fighter-v2.png",
  "unified-enemy-bomber": "assets/factions/unified/enemy-bomber-v2.png",
  "unified-enemy-frigate": "assets/factions/unified/enemy-frigate-v2.png",
  "unified-player-scout-pulse": "assets/projectiles/unified/player-scout-pulse-v2.png",
  "unified-player-fighter-laser": "assets/projectiles/unified/player-fighter-laser-v2.png",
  "unified-player-siege-missile": "assets/projectiles/unified/player-siege-missile-v2.png",
  "unified-player-heavy-cannon": "assets/projectiles/unified/player-heavy-cannon-v2.png",
  "unified-enemy-scout-pulse": "assets/projectiles/unified/enemy-scout-pulse-v2.png",
  "unified-enemy-fighter-laser": "assets/projectiles/unified/enemy-fighter-laser-v2.png",
  "unified-enemy-siege-missile": "assets/projectiles/unified/enemy-siege-missile-v2.png",
  "unified-enemy-heavy-cannon": "assets/projectiles/unified/enemy-heavy-cannon-v2.png",
  "ui-command-medallion": "assets/runtime/ui/orbital-command-medallion-v1.png",
  "upgrade-reactor-icon": "assets/library/galalaxy/Foozle_2DS0016_Void_PickupsPack/Engines/PNGs/Pickup Icon - Engines - Big Pulse Engine.png",
  "upgrade-arsenal-icon": "assets/library/galalaxy/Foozle_2DS0016_Void_PickupsPack/Weapons/PNGs/Pickup Icon - Weapons - Big Space Gun 2000.png",
  "upgrade-autoloader-icon": "assets/library/galalaxy/Foozle_2DS0016_Void_PickupsPack/Engines/PNGs/Pickup Icon - Engines - Supercharged Engine.png",
  "upgrade-multicannon-icon": "assets/library/galalaxy/Foozle_2DS0016_Void_PickupsPack/Weapons/PNGs/Pickup Icon - Weapons - Auto Cannons.png",
  "upgrade-shield-icon": "assets/library/galalaxy/Foozle_2DS0016_Void_PickupsPack/Shield Generators/PNGs/Pickup Icon - Shield Generator - All around shield.png"
}),
  level1: Object.freeze({
  "background-orbital-garden-rival": "assets/runtime/environment/orbital-garden-rival-sector-v1.png",
  "background-orbital-garden-player": "assets/runtime/environment/orbital-garden-player-sector-v1.png",
  "command-hq-garden-player": "assets/runtime/structures/command-hq-garden-player-v1.png",
  "command-hq-garden-rival": "assets/runtime/structures/command-hq-garden-rival-v1.png"
}),
  level2: Object.freeze({
  "background-twin-foundries-rival": "assets/runtime/environment/twin-foundries-rival-sector-v1.png",
  "background-twin-foundries-player": "assets/runtime/environment/twin-foundries-player-sector-v1.png",
  "command-hq-foundry-player": "assets/runtime/structures/command-hq-foundry-player-v1.png",
  "command-hq-foundry-rival": "assets/runtime/structures/command-hq-foundry-rival-v1.png"
}),
  combatVfx: Object.freeze({
  "nairan-scout-engine": "assets/factions/nairan/scout-engine.png",
  "klaed-scout-engine": "assets/factions/klaed/scout-engine.png",
  "nairan-scout-destruction": "assets/factions/nairan/scout-destruction.png",
  "nairan-fighter-destruction": "assets/factions/nairan/fighter-destruction.png",
  "nairan-bomber-destruction": "assets/factions/nairan/bomber-destruction.png",
  "nairan-frigate-destruction": "assets/factions/nairan/frigate-destruction.png",
  "klaed-scout-destruction": "assets/factions/klaed/scout-destruction.png",
  "klaed-fighter-destruction": "assets/factions/klaed/fighter-destruction.png",
  "klaed-bomber-destruction": "assets/factions/klaed/bomber-destruction.png",
  "klaed-frigate-destruction": "assets/factions/klaed/frigate-destruction.png",
  "nairan-scout-shield": "assets/factions/nairan/scout-shield.png",
  "nairan-fighter-shield": "assets/factions/nairan/fighter-shield.png",
  "nairan-bomber-shield": "assets/factions/nairan/bomber-shield.png",
  "nairan-frigate-shield": "assets/factions/nairan/frigate-shield.png",
  "klaed-scout-shield": "assets/factions/klaed/scout-shield.png",
  "klaed-fighter-shield": "assets/factions/klaed/fighter-shield.png",
  "klaed-bomber-shield": "assets/factions/klaed/bomber-shield.png",
  "klaed-frigate-shield": "assets/factions/klaed/frigate-shield.png"
}),
});

export const mergeAssetGroups = (...groups) => Object.assign({}, ...groups);

export const runtimeAssetManifestForLevel = (level = 1) => mergeAssetGroups(
  ASSET_GROUPS.boot,
  Number(level) === 2 ? ASSET_GROUPS.level2 : ASSET_GROUPS.level1,
  ASSET_GROUPS.combatVfx,
);

export const levelAssetManifest = (level = 1) => Number(level) === 2 ? ASSET_GROUPS.level2 : ASSET_GROUPS.level1;
