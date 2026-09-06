/** Semantic groups keep gameplay independent from individual filenames. */
export const ASSET_GROUPS = Object.freeze({
  boot: Object.freeze({}),
  ships: Object.freeze({}),
  effects: Object.freeze({}),
  ui: Object.freeze({}),
});

export const mergeAssetGroups = (...groups) => Object.assign({}, ...groups);
