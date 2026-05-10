/**
 * Advanced Basketball Analytics Engine
 * Calculates VORP, BPM, and TS% for local game data
 */

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
  if (!pts || pts === 0) return 0;
  if (fga === 0 || (fga + 0.44 * fta) === 0) return 0;
  const denom = 2 * (fga + 0.44 * fta);
  return (pts / denom) * 100;
};

/**
 * Calculate Effective Field Goal Percentage (eFG%)
 * eFG% = (FGM + 0.5 * 3PM) / FGA
 */
export const calculateEFG = (fgm, threepm, fga) => {
  if (!fgm || fga === 0) return 0;
  return ((fgm + 0.5 * threepm) / fga) * 100;
};

/**
 * Calculate Player Efficiency Rating (PER)
 * Simplified PER based on basic box score stats
 */
export const calculatePER = (stats) => {
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

/**
 * Calculate Box Plus-Minus (BPM)
 * On-court rating for player impact in points per 100 possessions
 */
export const calculateBPM = (stats, teamStats = {}) => {
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

  // Use provided minutes if >0, otherwise try an estimatedMinutes fallback from teamStats
  const minutes = min && min > 0 ? min : (teamStats.estimatedMinutes || 0);

  // If no reliable minutes, metrics are unreliable — return 0 to avoid misleading values
  if (minutes === 0) return 0;

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
  let bpm = offensiveRating + defensiveRating + reboundImpact + tovImpact;

  // Cap extreme BPM values to avoid misleading outputs from tiny-minute samples
  const BPM_CAP = 50; // points per 100 possessions cap
  if (Number.isFinite(bpm)) {
    if (bpm > BPM_CAP) bpm = BPM_CAP;
    if (bpm < -BPM_CAP) bpm = -BPM_CAP;
  }

  // Debug: optionally persist intermediate values when debug flag is set
  try {
    if (typeof window !== 'undefined' && window.localStorage && window.localStorage.getItem('ballknow_debug')) {
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
  } catch (e) {
    // ignore
  }

  return Math.round(bpm * 10) / 10;
};

/**
 * Calculate Value Over Replacement Player (VORP)
 * Measures how much better a player is than a replacement-level player
 */
export const calculateVORP = (stats, teamStats = {}) => {
  const { min = 0 } = stats || {};
  const minutes = min && min > 0 ? min : (teamStats.estimatedMinutes || 0);

  // If no reliable minutes, VORP is unreliable
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

/**
 * Calculate all metrics for a player game session
 */
export const calculatePlayerMetrics = (stats, teamStats = {}) => {
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
  const { fga = 0, orb = 0, tov = 0, fta = 0 } = teamStats || {};
  return (fga - orb + tov + 0.44 * fta) || 100;
};
