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

const DEFAULT_ESTIMATED_MINUTES = 24;
const DEFAULT_POSSESSIONS = 95;
const BPM_CAP = 20;
const VORP_CAP = 3;
const REPLACEMENT_LEVEL_BPM = -2;
const VORP_GAME_SCALER = 0.08;

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

  if (!min || min <= 0) return 0;
  const minutes = min;

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

  // Use provided minutes if >0, otherwise use estimated or a practical default.
  const minutes = min && min > 0 ? min : (teamStats.estimatedMinutes || DEFAULT_ESTIMATED_MINUTES);
  const possessions = teamStats.possessions || DEFAULT_POSSESSIONS;

  // Box-score based, single-game BPM proxy calibrated to typical BPM ranges.
  const missedFG = Math.max(0, fga - fgm);
  const missedFT = Math.max(0, fta - ftm);

  const offensiveContribution =
    pts +
    ast * 0.7 +
    orb * 0.5 -
    missedFG * 0.7 -
    missedFT * 0.5 -
    tov;

  const defensiveContribution =
    stl * 1.3 +
    blk * 1.0 +
    drb * 0.45 -
    pf * 0.35;

  const paceFactor = 100 / Math.max(70, possessions);
  const per36Impact = ((offensiveContribution + defensiveContribution) / Math.max(1, minutes)) * 36 * paceFactor;

  let bpm = per36Impact * 0.25 - 2;
  const bpmRaw = bpm;
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
        offensiveContribution,
        defensiveContribution,
        per36Impact,
        bpmRaw,
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
 * Calculate BPM components (obpm/dbpm) and return components object
 */
export const calculateBPMComponents = (stats, teamStats = {}) => {
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

  const minutes = min && min > 0 ? min : (teamStats.estimatedMinutes || DEFAULT_ESTIMATED_MINUTES);
  const possessions = teamStats.possessions || DEFAULT_POSSESSIONS;
  const paceFactor = 100 / Math.max(70, possessions);

  const missedFG = Math.max(0, fga - fgm);
  const missedFT = Math.max(0, fta - ftm);

  const obpmRawPer36 =
    ((pts + ast * 0.7 + orb * 0.5 - missedFG * 0.7 - missedFT * 0.5 - tov) / Math.max(1, minutes)) *
    36 *
    paceFactor;
  const dbpmRawPer36 =
    ((stl * 1.5 + blk * 1.2 + drb * 0.5 - pf * 0.35) / Math.max(1, minutes)) *
    36 *
    paceFactor;

  let obpm = obpmRawPer36 * 0.25 - 1.2;
  let dbpm = dbpmRawPer36 * 0.35 - 1.2;
  let bpm = obpm + dbpm;

  const bpmRaw = bpm;
  if (Number.isFinite(obpm)) obpm = Math.max(-BPM_CAP, Math.min(BPM_CAP, obpm));
  if (Number.isFinite(dbpm)) dbpm = Math.max(-BPM_CAP, Math.min(BPM_CAP, dbpm));
  if (Number.isFinite(bpm)) bpm = Math.max(-BPM_CAP, Math.min(BPM_CAP, bpm));

  return {
    metricsReliable: (min && min > 0) || !!teamStats.estimatedMinutes,
    bpm: Math.round(bpm * 10) / 10,
    bpmRaw: Math.round(bpmRaw * 10) / 10,
    obpm: Math.round(obpm * 10) / 10,
    dbpm: Math.round(dbpm * 10) / 10,
    reboundImpact: Math.round((orb / Math.max(1, minutes)) * 36 * 0.1 * 10) / 10,
    tovImpact: Math.round((-tov / Math.max(1, minutes)) * 36 * 0.1 * 10) / 10,
  };
};

/**
 * Calculate Value Over Replacement Player (VORP)
 * Measures how much better a player is than a replacement-level player
 */
export const calculateVORP = (stats, teamStats = {}) => {
  const { min = 0 } = stats || {};
  const minutes = min && min > 0 ? min : (teamStats.estimatedMinutes || DEFAULT_ESTIMATED_MINUTES);

  const bpm = calculateBPM(stats, teamStats);
  // Single-game VORP proxy:
  // value above replacement (BPM - replacement) * minute share * game scaler.
  const minutesShare = minutes / 240; // 48 minutes * 5 players
  const vorpRaw = (bpm - REPLACEMENT_LEVEL_BPM) * minutesShare * VORP_GAME_SCALER;
  let vorp = vorpRaw;

  if (Number.isFinite(vorp)) {
    if (vorp > VORP_CAP) vorp = VORP_CAP;
    if (vorp < -VORP_CAP) vorp = -VORP_CAP;
  }

  // Keep internal precision; UI handles display rounding.
  return vorp;
};

/**
 * Calculate Game Score (Hollinger's Game Score approximation)
 * gameScore = PTS + 0.4*FGM - 0.7*FGA - 0.4*(FTA - FTM) + 0.7*ORB + 0.3*DRB + STL + 0.7*AST + 0.7*BLK - 0.4*PF - TOV
 */
export const calculateGameScore = (stats = {}) => {
  const {
    pts = 0,
    fgm = 0,
    fga = 0,
    ftm = 0,
    fta = 0,
    orb = 0,
    drb = 0,
    stl = 0,
    ast = 0,
    blk = 0,
    pf = 0,
    tov = 0,
  } = stats;

  const gs =
    pts +
    0.4 * fgm -
    0.7 * fga -
    0.4 * (fta - ftm) +
    0.7 * orb +
    0.3 * drb +
    stl +
    0.7 * ast +
    0.7 * blk -
    0.4 * pf -
    tov;

  return Math.round(gs * 10) / 10;
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
  const vorpRaw = metricsReliable ? calculateVORP(stats, teamStats) : 0;
  const vorp = Math.round(vorpRaw * 100) / 100;

  // Get BPM components (obpm/dbpm) if reliable
  const comps = metricsReliable ? calculateBPMComponents(stats, teamStats) : { bpm: 0, obpm: 0, dbpm: 0, metricsReliable: false };

  // Free throw percentage
  const ftPct = stats.fta && stats.fta > 0 ? Math.round((stats.ftm / stats.fta) * 1000) / 10 : null;

  // Game score
  const gameScore = calculateGameScore(stats || {});

  return {
    ts: Math.round(ts * 10) / 10,
    efg: Math.round(efg * 10) / 10,
    per: Math.round(per * 10) / 10,
    bpm: comps.bpm,
    bpmRaw: comps.bpmRaw || 0,
    vorp,
    vorpRaw: typeof vorpRaw === 'number' ? Math.round(vorpRaw * 1000) / 1000 : 0,
    obpm: comps.obpm,
    dbpm: comps.dbpm,
    metricsReliable,
    ftPct,
    gameScore,
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
