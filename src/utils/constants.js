/**
 * Application-wide Constants
 */

// App Metadata
export const APP_NAME = 'BallKnow';
export const APP_VERSION = '1.0.0';
export const APP_DESCRIPTION = 'Local Basketball Analytics';

// Colors
export const COLORS = {
  primary: '#FFB81C', // Gold/Yellow
  dark: '#0d0d0d',    // Very dark background
  darkGray: '#1a1a1a', // Card background
  gray: '#333',       // Borders
  lightGray: '#666',  // Disabled text
  white: '#fff',
  red: '#ff6b6b',
  green: '#51cf66',
  blue: '#4c6ef5',
};

// Typography
export const FONT_SIZES = {
  xs: 10,
  sm: 12,
  base: 14,
  lg: 16,
  xl: 18,
  '2xl': 20,
  '3xl': 24,
};

export const FONT_WEIGHTS = {
  light: '300',
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};

// Spacing
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
};

// Border Radius
export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 999,
};

// Basketball Stat Categories
export const STAT_CATEGORIES = {
  BASIC: 'basic',
  SHOOTING: 'shooting',
  REBOUNDING: 'rebounding',
  PLAYMAKING: 'playmaking',
  DEFENSE: 'defense',
  DISCIPLINE: 'discipline',
};

// Metric Thresholds for Color Coding
export const METRIC_THRESHOLDS = {
  VORP: {
    elite: 5.0,
    great: 2.5,
    good: 1.0,
    average: 0,
    poor: -1.0,
  },
  BPM: {
    elite: 10.0,
    great: 5.0,
    good: 2.0,
    average: 0,
    poor: -2.0,
  },
  TS_PERCENT: {
    elite: 65,
    great: 60,
    good: 55,
    average: 50,
    poor: 40,
  },
};

// Position List (for future features)
export const POSITIONS = ['PG', 'SG', 'SF', 'PF', 'C'];

// Game Types (for future features)
export const GAME_TYPES = [
  'Pickup',
  'League',
  'Tournament',
  'Scrimmage',
  'Practice',
];

// Default Team Stats
export const DEFAULT_TEAM_STATS = {
  possessions: 100,
  pace: 100,
  ptsPerGame: 105,
};

// NBA Benchmarks (for context)
export const NBA_AVERAGES = {
  pts: 105,
  pace: 100,
  ts: 0.574,
  efg: 0.510,
  tov: 0.13,
  orb: 0.11,
  drb: 0.73,
  ast: 0.27,
};

// Replacement Level (used in VORP calculation)
export const REPLACEMENT_LEVEL = {
  efficiency: 0.55,
  tsPct: 0.51,
  asbRatio: 0.20,
};

// Storage Keys
export const STORAGE_KEYS = {
  GAMES: '@ballknow_games',
  FOLDERS: '@ballknow_folders',
  PLAYERS: '@ballknow_players',
  SETTINGS: '@ballknow_settings',
};

// Sort Modes
export const SORT_MODES = {
  VORP: 'vorp',
  BPM: 'bpm',
  TS: 'ts',
  POINTS: 'points',
  DATE: 'date',
};

// Time Constants
export const TIME_CONSTANTS = {
  DEBOUNCE_MS: 300,
  ANIMATION_DURATION_MS: 300,
  REFRESH_INTERVAL_MS: 5000,
};

// Validation Rules
export const VALIDATION_RULES = {
  MIN_NAME_LENGTH: 1,
  MAX_NAME_LENGTH: 50,
  MAX_STAT_VALUE: 999,
  MIN_STAT_VALUE: 0,
};

// Toast Messages
export const MESSAGES = {
  GAME_SAVED: 'Game logged successfully!',
  GAME_DELETED: 'Game deleted',
  ERROR_SAVE: 'Failed to save game',
  ERROR_DELETE: 'Failed to delete game',
  ERROR_MISSING_STATS: 'Please fill in all required stats',
  ERROR_INVALID_NAME: 'Please enter a valid player name',
  CONFIRM_DELETE: 'Delete this game?',
  CONFIRM_CLEAR: 'Clear the form?',
};

// Feature Flags (for future rollout control)
export const FEATURE_FLAGS = {
  ENABLE_EXPORT: true,
  ENABLE_IMPORT: true,
  ENABLE_SEASONS: false,
  ENABLE_TEAMS: false,
  ENABLE_VIDEO_LOGGING: false,
  ENABLE_PHOTOS: false,
};

export default {
  COLORS,
  FONT_SIZES,
  SPACING,
  STAT_CATEGORIES,
  METRIC_THRESHOLDS,
  STORAGE_KEYS,
  SORT_MODES,
  MESSAGES,
  FEATURE_FLAGS,
};
