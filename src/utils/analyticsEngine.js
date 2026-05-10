/**
 * Advanced Basketball Analytics Engine
 * Calculates VORP, BPM, and TS% for local game data
 */

// NBA Replacement Level Baseline (per 36 minutes)
const REPLACEMENT_LEVEL = {
  efficiency: 0.55,
  tsPct: 0.51,
  asbRatio: 0.20, // Assist/Scoring Ratio
};

// League Average Constants (used for BPM calculation)
const LEAGUE_AVERAGE = {
  ptsPerGame: 105,
  pace: 100,
  tsPct: 0.574,
  efg: 0.510,
  tovRate: 0.13,
  orbRate: 0.11,
  drbRate: 0.73,
  astRate: 0.27,
};

/**
 * Calculate True Shooting Percentage (TS%)
 * TS% = PTS / (2 * (FGA + 0.44 * FTA))
 */
export const calculateTS = (pts, fga, fta) => {
  if (fga === 0 || (fga + 0.44 * fta) === 0) return 0;
  const denom = 2 * (fga + 0.44 * fta);
  return (pts / denom) * 100;
};

/**
 * Calculate Effective Field Goal Percentage (eFG%)
 * eFG% = (FGM + 0.5 * 3PM) / FGA
 */
export const calculateEFG = (fgm, threepm, fga) => {
  if (fga === 0) return 0;
  return ((fgm + 0.5 * threepm) / fga) * 100;
};

/**
 * Calculate Player Efficiency Rating (PER)
 * Simplified PER based on basic box score stats
 */
export const calculatePER = (stats) => {
  const {
    pts,
    fga,
    fta,
    orb,
    drb,
    ast,
    stl,
    blk,
    tov,
    pf,
    min,
  } = stats;
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

        const debugObj = {
          stats,
          teamStats,
          minutes,
          possessions,
          per36Pts,
          per36AST,
          per36STL,
          per36BLK,
          per36TOV,
          per36REB,
          efg,
          ts,
          offensiveRating,
          defensiveRating,
          reboundImpact,
          tovImpact,
          bpmRaw: bpm,
        };
        console.debug('BPM Debug', debugObj);
        try {
          window.localStorage.setItem('ballknow_bpm_debug', JSON.stringify(debugObj));
        } catch (e) {
          // ignore storage errors
        }
      }
    blk,
    tov,
    pf,
    min,
  } = stats;

  const minutes = min && min > 0 ? min : 1;

  // Calculate per-36 min rates
  const possessions = teamStats.possessions || 100;
  const per36Pts = (pts / minutes) * 36;
  const per36AST = (ast / minutes) * 36;
  const per36STL = (stl / minutes) * 36;
  const per36BLK = (blk / minutes) * 36;
  const per36TOV = (tov / minutes) * 36;
  const per36REB = ((orb + drb) / minutes) * 36;

  // Offensive impact
  const efg = calculateEFG(fgm, threepm, fga);
  const ts = calculateTS(pts, fga, fta);

  let offensiveRating = 0;
  if (fga > 0) {
    offensiveRating = (pts * 100) / (minutes * (possessions / 48));
    offensiveRating += (per36AST * 0.5) / possessions;
  }

  // Defensive impact (STL + BLK - PF impact)
  let defensiveRating = (per36STL + per36BLK) * 2 - (pf / minutes) * 36;

  // Rebound impact
  let reboundImpact = (per36REB - LEAGUE_AVERAGE.drbRate * 36) * 0.5;

  // Turnover impact
  let tovImpact = -per36TOV * 0.5;

  // Combined BPM = Offensive + Defensive + Rebounding + Turnover
  const bpm = offensiveRating + defensiveRating + reboundImpact + tovImpact;

  // Debug: log intermediate values when running in dev
  try {
    if (typeof window !== 'undefined' && window.localStorage && window.localStorage.getItem('ballknow_debug')) {
      console.debug('BPM Debug', {
        stats,
        teamStats,
        minutes,
        possessions,
        per36Pts,
        per36AST,
        per36STL,
        per36BLK,
        per36TOV,
        per36REB,
        efg,
        ts,
        offensiveRating,
        defensiveRating,
        reboundImpact,
        tovImpact,
        bpmRaw: bpm,
      });
    }
  } catch (e) {
    // ignore
  }

  return Math.round(bpm * 10) / 10;
};

/**
 * Calculate Value Over Replacement Player (VORP)
 * Measures how much better a player is than a replacement-level player
 */
export const calculateVORP = (stats, teamStats) => {
  const { min } = stats;
  const minutes = min && min > 0 ? min : 1;

  // Get BPM
  const bpm = calculateBPM(stats, teamStats);

  // VORP adjustment factor
  const vorpMultiplier = 1.2;

  // Calculate per-48 minute value
  const vorp = (bpm * minutes) / 48 * vorpMultiplier;

  return Math.round(vorp * 10) / 10;
};

/**
 * Calculate all metrics for a player game session
 */
export const calculatePlayerMetrics = (stats, teamStats) => {
  const ts = calculateTS(stats.pts, stats.fga, stats.fta);
  const efg = calculateEFG(stats.fgm, stats.threepm, stats.fga);
  const per = calculatePER(stats);
  const bpm = calculateBPM(stats, teamStats);
  const vorp = calculateVORP(stats, teamStats);

  return {
    ts: Math.round(ts * 10) / 10,
    efg: Math.round(efg * 10) / 10,
    per: Math.round(per * 10) / 10,
    bpm: Math.round(bpm * 10) / 10,
    vorp: Math.round(vorp * 10) / 10,
  };
};

/**
 * Validate that all required stats are present
 */
export const validateGameStats = (stats) => {
  const required = [
    'min',
    'fgm',
    'fga',
    'threepm',
    'threeepa',
    'ftm',
    'fta',
    'orb',
    'drb',
    'ast',
    'stl',
    'blk',
    'tov',
    'pf',
    'pts',
  ];

  for (let stat of required) {
    if (stats[stat] === undefined || stats[stat] === null) {
      return { valid: false, missing: stat };
    }
  }

  return { valid: true };
};

/**
 * Calculate team possession estimate
 */
export const calculateTeamPossessions = (teamStats) => {
  const { fga, orb, tov, fta } = teamStats;
  return (fga - orb + tov + (0.44 * fta)) || 100;
};
