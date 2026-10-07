const normalizeSeed = (seed) => {
  const numeric = Number(seed);
  return Number.isFinite(numeric) ? (numeric >>> 0) || 1 : 1;
};

export class SeededRng {
  constructor(seed = 1) {
    this.initialSeed = normalizeSeed(seed);
    this.state = this.initialSeed;
  }

  reset(seed = this.initialSeed) {
    this.initialSeed = normalizeSeed(seed);
    this.state = this.initialSeed;
  }

  next() {
    let value = this.state;
    value ^= value << 13;
    value ^= value >>> 17;
    value ^= value << 5;
    this.state = value >>> 0;
    return this.state / 0x100000000;
  }

  int(minInclusive, maxInclusive) {
    return Math.floor(this.next() * (maxInclusive - minInclusive + 1)) + minInclusive;
  }
}
