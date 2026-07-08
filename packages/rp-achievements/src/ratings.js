const RATING_LEVELS = [
  { n: 0, rating: 'N0 普通人级', min: 0, max: 99 },
  { n: 1, rating: 'N1 街头级', min: 100, max: 299 },
  { n: 2, rating: 'N2 墙壁级', min: 300, max: 599 },
  { n: 3, rating: 'N3 房屋级', min: 600, max: 999 },
  { n: 4, rating: 'N4 建筑级', min: 1000, max: 1999 },
  { n: 5, rating: 'N5 街区级', min: 2000, max: 3999 },
  { n: 6, rating: 'N6 城镇级', min: 4000, max: 7999 },
  { n: 7, rating: 'N7 城市级', min: 8000, max: 15999 },
  { n: 8, rating: 'N8 山脉/区域级', min: 16000, max: 31999 },
  { n: 9, rating: 'N9 国家/大陆板块级', min: 32000, max: 63999 },
  { n: 10, rating: 'N10 大陆级', min: 64000, max: 127999 },
  { n: 11, rating: 'N11 月球/小行星级', min: 128000, max: 255999 },
  { n: 12, rating: 'N12 行星级', min: 256000, max: 511999 },
  { n: 13, rating: 'N13 大行星/恒星表层级', min: 512000, max: 1023999 },
  { n: 14, rating: 'N14 恒星级', min: 1024000, max: 2047999 },
  { n: 15, rating: 'N15 星系级', min: 2048000, max: 4095999 },
  { n: 16, rating: 'N16 星系团级', min: 4096000, max: 8191999 },
  { n: 17, rating: 'N17 可观测宇宙级', min: 8192000, max: 16383999 },
  { n: 18, rating: 'N18 单体宇宙级', min: 16384000, max: 32767999 },
  { n: 19, rating: 'N19 多宇宙级', min: 32768000, max: 65535999 },
  { n: 20, rating: 'N20 大型多元宇宙级', min: 65536000, max: 131071999 },
  { n: 21, rating: 'N21 无限多元宇宙级', min: 131072000, max: 262143999 },
  { n: 22, rating: 'N22 高维多元级', min: 262144000, max: 524287999 },
  { n: 23, rating: 'N23 复杂高维结构级', min: 524288000, max: 1048575999 },
  { n: 24, rating: 'N24 外层/超维叙事结构级', min: 1048576000, max: Infinity }
];

const TIER_OFFSETS = {
  minor: { min: -3, max: -1, typicalMin: -3, typicalMax: -2 },
  standard: { min: -2, max: 0, typicalMin: -2, typicalMax: -1 },
  major: { min: -1, max: 1, typicalMin: -1, typicalMax: 0 },
  epic: { min: 0, max: 2, typicalMin: 0, typicalMax: 1 },
  legendary: { min: 1, max: null, typicalMin: 1, typicalMax: null },
  mythic: { min: null, max: null, typicalMin: null, typicalMax: null }
};

function clampN(n) {
  return Math.max(0, Math.min(24, Number(n)));
}

function parseRatingN(value) {
  if (value == null) throw new Error('Missing rating value');
  if (typeof value === 'number') return clampN(value);
  if (typeof value === 'object') return parseRatingN(value.rating ?? value.n ?? value.level);
  const m = String(value).match(/N\s*(\d{1,2})/i);
  if (!m) throw new Error(`Cannot parse N rating from ${value}`);
  return clampN(Number(m[1]));
}

function ratingByN(n) {
  const level = RATING_LEVELS.find(x => x.n === clampN(n));
  if (!level) throw new Error(`Unknown N level ${n}`);
  return level;
}

function nRangeForAchievementTier(tier, currentWorldRating, currentWorldTopRating) {
  const offsets = TIER_OFFSETS[tier];
  if (!offsets) throw new Error(`Unknown achievement tier: ${tier}`);
  const anchor = parseRatingN(currentWorldRating);
  const top = parseRatingN(currentWorldTopRating ?? currentWorldRating);
  if (tier === 'legendary') return { minN: clampN(anchor + 1), maxN: top, anchorN: anchor, topN: top };
  if (tier === 'mythic') return { minN: Math.max(0, top - 1), maxN: top, anchorN: anchor, topN: top };
  return { minN: clampN(anchor + offsets.min), maxN: Math.min(top, clampN(anchor + offsets.max)), anchorN: anchor, topN: top };
}

function scoreSegment(level, segment = 'mid') {
  const { min, max } = ratingByN(level);
  if (!Number.isFinite(max)) return min;
  const span = max - min;
  const ratios = { low: 0.125, mid: 0.5, high: 0.75, peak: 0.95 };
  return Math.round(min + span * (ratios[segment] ?? ratios.mid));
}

function makeRewardRating(n, segment = 'mid', basis = '') {
  const level = ratingByN(n);
  return { rating: level.rating, score: scoreSegment(level.n, segment), segment, basis };
}

module.exports = { RATING_LEVELS, TIER_OFFSETS, parseRatingN, ratingByN, nRangeForAchievementTier, scoreSegment, makeRewardRating };
