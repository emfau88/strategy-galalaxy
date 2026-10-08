// One short flow through both entries of the built Pages artifact.
process.argv.push("--site");
await import("../experiments/last-shipyard/scripts/browser-smoke.mjs");
