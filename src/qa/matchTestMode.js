export const readLaunchOptions = (search = window.location.search) => {
  const params = new URLSearchParams(search);
  const seed = Number(params.get("seed"));
  const requestedLevel = Number(params.get("level"));
  return Object.freeze({
    debugEnabled: params.get("debug") === "1",
    testMode: params.get("test") === "match",
    level: requestedLevel === 1 || requestedLevel === 2 ? requestedLevel : params.get("test") === "match" ? 2 : 1,
    seed: Number.isFinite(seed) ? seed : 104729,
  });
};
