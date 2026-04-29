/**
 * Utility Helpers
 * Common functions used throughout the app
 */

/**
 * Format a number to specific decimal places
 */
export const formatNumber = (value, decimals = 1) => {
  if (typeof value !== 'number') return '0';
  return (Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals)).toFixed(decimals);
};

/**
 * Format seconds to MM:SS
 */
export const formatTime = (seconds) => {
  if (!seconds || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

/**
 * Format date to readable string
 */
export const formatDate = (dateString) => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return 'Unknown date';
  }
};

/**
 * Format date and time
 */
export const formatDateTime = (dateString) => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return 'Unknown';
  }
};

/**
 * Calculate percentage
 */
export const calculatePercentage = (value, total) => {
  if (total === 0) return 0;
  return (value / total) * 100;
};

/**
 * Get color based on metric value
 */
export const getMetricColor = (value, metric) => {
  const thresholds = {
    vorp: { elite: 5, great: 2.5, good: 1, avg: 0 },
    bpm: { elite: 10, great: 5, good: 2, avg: 0 },
    ts: { elite: 65, great: 60, good: 55, avg: 50 },
  };

  const key = metric.toLowerCase();
  const t = thresholds[key];

  if (!t) return '#999';

  if (value >= t.elite) return '#51cf66'; // Green
  if (value >= t.great) return '#69db7c'; // Light Green
  if (value >= t.good) return '#FFB81C'; // Gold
  if (value >= t.avg) return '#ffa500'; // Orange
  return '#ff6b6b'; // Red
};

/**
 * Debounce a function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle a function
 */
export const throttle = (func, limit) => {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Clone a deep object
 */
export const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Check if value is empty
 */
export const isEmpty = (value) => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return !value;
};

/**
 * Safely parse JSON
 */
export const safeJsonParse = (json, defaultValue = null) => {
  try {
    return JSON.parse(json);
  } catch {
    return defaultValue;
  }
};

/**
 * Calculate shooting percentages
 */
export const calculateShootingStats = (stats) => {
  const { fgm, fga, threepm, threepa, ftm, fta } = stats;

  return {
    fgPercent: fga > 0 ? ((fgm / fga) * 100).toFixed(1) : 0,
    threePercent: threepa > 0 ? ((threepm / threepa) * 100).toFixed(1) : 0,
    ftPercent: fta > 0 ? ((ftm / fta) * 100).toFixed(1) : 0,
  };
};

/**
 * Calculate rebound percentage
 */
export const calculateReboundStats = (stats) => {
  const totalRebounds = (stats.orb || 0) + (stats.drb || 0);
  return {
    totalRebounds,
    orbPercent: stats.orb || 0,
    drbPercent: stats.drb || 0,
  };
};

/**
 * Compare two games for debugging
 */
export const compareGames = (game1, game2) => {
  const diffs = {};

  Object.keys(game1).forEach((key) => {
    if (JSON.stringify(game1[key]) !== JSON.stringify(game2[key])) {
      diffs[key] = {
        before: game1[key],
        after: game2[key],
      };
    }
  });

  return diffs;
};

/**
 * Generate unique ID
 */
export const generateId = () => {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Validate email (basic)
 */
export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

/**
 * Capitalize string
 */
export const capitalize = (str) => {
  if (typeof str !== 'string') return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Get initials from name
 */
export const getInitials = (name) => {
  if (typeof name !== 'string') return '';
  return name
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase())
    .join('')
    .substr(0, 2);
};

/**
 * Sort array of objects by key
 */
export const sortByKey = (array, key, descending = true) => {
  return [...array].sort((a, b) => {
    if (descending) {
      return (b[key] || 0) - (a[key] || 0);
    }
    return (a[key] || 0) - (b[key] || 0);
  });
};

export default {
  formatNumber,
  formatTime,
  formatDate,
  formatDateTime,
  calculatePercentage,
  getMetricColor,
  debounce,
  throttle,
  deepClone,
  isEmpty,
  safeJsonParse,
  calculateShootingStats,
  calculateReboundStats,
  compareGames,
  generateId,
  validateEmail,
  capitalize,
  getInitials,
  sortByKey,
};
