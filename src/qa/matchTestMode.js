export const readLaunchOptions = (search = window.location.search) => {
  const params = new URLSearchParams(search);
  const seed = Number(params.get("seed"));
  return Object.freeze({
    debugEnabled: params.get("debug") === "1",
    testMode: params.get("test") === "match",
    seed: Number.isFinite(seed) ? seed : 104729,
  });
};
