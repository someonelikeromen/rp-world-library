const crypto = require('node:crypto');

function secondTimestamp(now = new Date()) {
  return new Date(now).toISOString().replace(/\.\d{3}Z$/, 'Z');
}

function xmur3(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function nextSeed() {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}

function sfc32(a, b, c, d) {
  return function rng() {
    a >>>= 0;
    b >>>= 0;
    c >>>= 0;
    d >>>= 0;
    const t = (a + b) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    d = (d + 1) | 0;
    const out = (t + d) | 0;
    c = (c + out) | 0;
    return (out >>> 0) / 4294967296;
  };
}

function publicSeedInfo(material) {
  return {
    seedTime: material.seedTime,
    seedHash: material.seedHash,
    replayable: false,
    salt: 'internal-hidden',
  };
}

function createSeedMaterial(now = new Date()) {
  const seedTime = secondTimestamp(now);
  const internalSalt = crypto.randomBytes(16).toString('hex');
  const seedSource = `${seedTime}|${internalSalt}`;
  const seedHash = crypto.createHash('sha256').update(seedSource).digest('hex').slice(0, 16);
  return { seedTime, internalSalt, seedSource, seedHash };
}

function rngFromSeedSource(seedSource) {
  const seed = xmur3(seedSource);
  return sfc32(seed(), seed(), seed(), seed());
}

function createInstantRng(now = new Date()) {
  const material = createSeedMaterial(now);
  return {
    rng: rngFromSeedSource(material.seedSource),
    seedInfo: publicSeedInfo(material),
  };
}

function makeInstantSeed(now = new Date()) {
  return publicSeedInfo(createSeedMaterial(now));
}

function randomInt(rng, min, max) {
  if (!Number.isInteger(min) || !Number.isInteger(max) || max < min) {
    throw new Error(`Invalid randomInt range: ${min}..${max}`);
  }
  return min + Math.floor(rng() * (max - min + 1));
}

module.exports = {
  secondTimestamp,
  makeInstantSeed,
  createInstantRng,
  randomInt,
};
