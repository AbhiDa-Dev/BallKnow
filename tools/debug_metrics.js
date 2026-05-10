// Node script to reproduce analytics calculations for debugging
function calculateEFG(fgm, threepm, fga) {
  if (fga === 0) return 0;
  return ((fgm + 0.5 * threepm) / fga) * 100;
}
function calculateTS(pts, fga, fta) {
  if (fga === 0 || (fga + 0.44 * fta) === 0) return 0;
  const denom = 2 * (fga + 0.44 * fta);
  return (pts / denom) * 100;
}
function calculatePER(stats) {
  const { pts, fga, fta, orb, drb, ast, stl, blk, tov, pf, min } = stats;
  const minutes = min && min > 0 ? min : 1;
  const perMin = (pts + ast * 0.7 + stl * 0.5 + blk * 0.5 + (orb + drb) * 0.35 - (fga - pts / 2) * 0.2 - tov * 0.5 - pf * 0.1) / minutes;
  return Math.round(perMin * 10) / 10;
}
function calculateBPM(stats, teamStats) {
  const { pts, fga, fgm, threepm, fta, ftm, orb, drb, ast, stl, blk, tov, pf, min } = stats;
  const minutes = min && min > 0 ? min : 1;
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
  const bpm = offensiveRating + defensiveRating + reboundImpact + tovImpact;
  return {
    bpmRaw: bpm,
    offensiveRating,
    defensiveRating,
    reboundImpact,
    tovImpact,
    per36: { per36Pts, per36AST, per36STL, per36BLK, per36TOV, per36REB },
    efg,
    ts,
  };
}
function calculateVORP(stats, teamStats) {
  const minutes = stats.min && stats.min > 0 ? stats.min : 1;
  const bpm = calculateBPM(stats, teamStats).bpmRaw;
  const vorpMultiplier = 1.2;
  const vorp = (bpm * minutes) / 48 * vorpMultiplier;
  return vorp;
}

const sampleStats = {
  // LeBron James - 2026-05-09 vs OKC (Postseason)
  min: 37,
  fgm: 7,
  fga: 19,
  twopm: 5,
  twopa: 13,
  threepm: 2,
  threeepa: 6,
  ftm: 3,
  fta: 4,
  orb: 6,
  drb: 8,
  ast: 8,
  stl: 0,
  blk: 1,
  tov: 1,
  pf: 3,
  pts: 19,
};
const teamStats = { possessions: 100 };
const res = calculateBPM(sampleStats, teamStats);
console.log('BPM debug (node):', res);
console.log('VORP (node):', calculateVORP(sampleStats, teamStats));
console.log('EFG:', calculateEFG(sampleStats.fgm, sampleStats.threepm, sampleStats.fga));
console.log('TS:', calculateTS(sampleStats.pts, sampleStats.fga, sampleStats.fta));
console.log('PER:', calculatePER(sampleStats));
