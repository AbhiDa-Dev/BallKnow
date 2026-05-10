const fs = require('fs');

// Inline simplified analytics functions (matching src/utils/analyticsEngine.js logic)
const calculateEFG = (fgm, threepm, fga) => {
  if (!fgm || fga === 0) return 0;
  return ((fgm + 0.5 * threepm) / fga) * 100;
};

const calculateTS = (pts, fga, fta) => {
  if (!pts || pts === 0) return 0;
  if (fga === 0 || (fga + 0.44 * fta) === 0) return 0;
  const denom = 2 * (fga + 0.44 * fta);
  return (pts / denom) * 100;
};

const calculatePER = (stats) => {
  const {
    pts = 0,
    fga = 0,
    fta = 0,
    orb = 0,
    drb = 0,
    ast = 0,
    stl = 0,
    blk = 0,
    tov = 0,
    pf = 0,
    min = 0,
  } = stats || {};
  const minutes = min && min > 0 ? min : 1;
  const perMin =
    (pts +
      ast * 0.7 +
      stl * 0.5 +
      blk * 0.5 +
      (orb + drb) * 0.35 -
      (fga - pts / 2) * 0.2 -
      tov * 0.5 -
      pf * 0.1) /
    minutes;
  return Math.round(perMin * 10) / 10;
};

const calculateBPM = (stats, teamStats = {}) => {
  const {
    pts = 0,
    fga = 0,
    fgm = 0,
    threepm = 0,
    fta = 0,
    ftm = 0,
    orb = 0,
    drb = 0,
    ast = 0,
    stl = 0,
    blk = 0,
    tov = 0,
    pf = 0,
    min = 0,
  } = stats || {};
  const minutes = min && min > 0 ? min : (teamStats.estimatedMinutes || 0);
  if (minutes === 0) return 0;
  const possessions = teamStats.possessions || 100;
  const per36Pts = (pts / minutes) * 36;
  const per36AST = (ast / minutes) * 36;
  const per36STL = (stl / minutes) * 36;
  const per36BLK = (blk / minutes) * 36;
  const per36TOV = (tov / minutes) * 36;
  const per36REB = ((orb + drb) / minutes) * 36;
  const efg = calculateEFG(fgm, threepm, fga);
  const ts = calculateTS(pts, fga, fta);
  let offensiveRating = 0;
  if (fga > 0) {
    offensiveRating = (pts * 100) / (minutes * (possessions / 48));
    offensiveRating += (per36AST * 0.5) / possessions;
  }
  let defensiveRating = (per36STL + per36BLK) * 2 - (pf / minutes) * 36;
  let reboundImpact = (per36REB - 0.73 * 36) * 0.5;
  let tovImpact = -per36TOV * 0.5;
  let bpm = offensiveRating + defensiveRating + reboundImpact + tovImpact;
  const BPM_CAP = 50;
  if (Number.isFinite(bpm)) {
    if (bpm > BPM_CAP) bpm = BPM_CAP;
    if (bpm < -BPM_CAP) bpm = -BPM_CAP;
  }
  return Math.round(bpm * 10) / 10;
};

const calculateVORP = (stats, teamStats = {}) => {
  const minutes = stats.min && stats.min > 0 ? stats.min : (teamStats.estimatedMinutes || 0);
  if (minutes === 0) return 0;
  const bpm = calculateBPM(stats, teamStats);
  const vorpMultiplier = 1.2;
  let vorp = (bpm * minutes) / 48 * vorpMultiplier;
  const VORP_CAP = 10;
  if (Number.isFinite(vorp)) {
    if (vorp > VORP_CAP) vorp = VORP_CAP;
    if (vorp < -VORP_CAP) vorp = -VORP_CAP;
  }
  return Math.round(vorp * 10) / 10;
};

const calculatePlayerMetrics = (stats, teamStats = {}) => {
  const ts = calculateTS(stats.pts || 0, stats.fga || 0, stats.fta || 0);
  const efg = calculateEFG(stats.fgm || 0, stats.threepm || 0, stats.fga || 0);
  const per = calculatePER(stats || {});
  const minutes = stats && stats.min && stats.min > 0 ? stats.min : (teamStats.estimatedMinutes || 0);
  const metricsReliable = minutes > 0;
  const bpm = metricsReliable ? calculateBPM(stats, teamStats) : 0;
  const vorp = metricsReliable ? calculateVORP(stats, teamStats) : 0;
  return {
    ts: Math.round(ts * 10) / 10,
    efg: Math.round(efg * 10) / 10,
    per: Math.round(per * 10) / 10,
    bpm: Math.round(bpm * 10) / 10,
    vorp: Math.round(vorp * 10) / 10,
    metricsReliable,
  };
};

// Two sample games
const teamStatsDefault = { possessions: 100, gameDurationMinutes: 40, playersCount: 5 };

const game1 = {
  id: 'seed-zero-min',
  playerName: 'SeedZero',
  location: 'Gym A',
  createdAt: new Date().toISOString(),
  stats: { min: 0, fgm: 2, fga: 2, threepm: 1, threeepa: 1, ftm: 1, fta: 1, orb: 0, drb: 0, ast: 0, stl: 0, blk: 0, tov: 0, pf: 0, pts: 6 },
  teamStats: { ...teamStatsDefault },
};
const metrics1 = calculatePlayerMetrics(game1.stats, game1.teamStats);
game1.metrics = metrics1;

const game2 = {
  id: 'seed-12-min',
  playerName: 'SeedTwelve',
  location: 'Gym A',
  createdAt: new Date().toISOString(),
  stats: { min: 12, fgm: 4, fga: 8, threepm: 1, threeepa: 3, ftm: 2, fta: 2, orb: 1, drb: 4, ast: 3, stl: 1, blk: 0, tov: 1, pf: 1, pts: 11 },
  teamStats: { ...teamStatsDefault },
};
const metrics2 = calculatePlayerMetrics(game2.stats, game2.teamStats);
game2.metrics = metrics2;

const seed = [game1, game2];
fs.writeFileSync(__dirname + '/seed_games.json', JSON.stringify(seed, null, 2));
console.log('Wrote seed_games.json with', seed.length, 'entries');
