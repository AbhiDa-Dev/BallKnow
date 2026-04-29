/**
 * Sample Data Generator for Testing
 * Use this to populate the app with example games
 */

import { saveGame } from '../services/storageService';

const SAMPLE_PLAYERS = ['John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Williams'];
const SAMPLE_LOCATIONS = ['Downtown Courts', 'Riverside Gym', 'Central Park', 'Eastside Recreation'];

/**
 * Generate a random stat value within realistic basketball ranges
 */
const randomStat = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

/**
 * Create realistic game stats
 */
const generateGameStats = () => {
  const min = randomStat(12, 36);
  const fga = randomStat(8, 20);
  const fgm = randomStat(3, Math.min(fga, 15));
  const threepa = randomStat(2, 8);
  const threepm = randomStat(0, Math.min(threepa, 4));
  const fta = randomStat(2, 8);
  const ftm = randomStat(1, fta);

  return {
    min,
    fgm,
    fga,
    threepm,
    threeepa: threepa,
    ftm,
    fta,
    orb: randomStat(0, 4),
    drb: randomStat(2, 8),
    ast: randomStat(1, 10),
    stl: randomStat(0, 3),
    blk: randomStat(0, 2),
    tov: randomStat(0, 4),
    pf: randomStat(0, 5),
    pts: fgm * 2 - threepm + ftm, // Adjusted for 3-pointers
  };
};

/**
 * Populate database with sample games
 */
export const generateSampleGames = async (count = 20) => {
  try {
    for (let i = 0; i < count; i++) {
      const player = SAMPLE_PLAYERS[Math.floor(Math.random() * SAMPLE_PLAYERS.length)];
      const location = SAMPLE_LOCATIONS[Math.floor(Math.random() * SAMPLE_LOCATIONS.length)];
      const stats = generateGameStats();

      // Vary the dates within the last 30 days
      const daysAgo = Math.floor(Math.random() * 30);
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - daysAgo);

      await saveGame({
        playerName: player,
        location,
        stats,
        teamStats: {
          possessions: randomStat(85, 110),
        },
        createdAt: createdAt.toISOString(),
      });
    }

    console.log(`Generated ${count} sample games successfully!`);
  } catch (error) {
    console.error('Error generating sample games:', error);
  }
};

/**
 * Example: Create a specific player's season
 */
export const generatePlayerSeason = async (playerName, games = 10) => {
  try {
    for (let i = 0; i < games; i++) {
      const location = SAMPLE_LOCATIONS[Math.floor(Math.random() * SAMPLE_LOCATIONS.length)];
      const stats = generateGameStats();

      const daysAgo = games - i; // Spread over sequential days
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - daysAgo);

      await saveGame({
        playerName,
        location,
        stats,
        teamStats: { possessions: randomStat(90, 105) },
        createdAt: createdAt.toISOString(),
      });
    }

    console.log(`Generated ${games} games for ${playerName}`);
  } catch (error) {
    console.error('Error generating player season:', error);
  }
};

/**
 * High-performing game example (useful for testing analytics)
 */
export const generateEliteGameStats = () => {
  return {
    min: 32,
    fgm: 12,
    fga: 18,
    threepm: 3,
    threeepa: 6,
    ftm: 8,
    fta: 9,
    orb: 3,
    drb: 8,
    ast: 6,
    stl: 2,
    blk: 1,
    tov: 2,
    pf: 2,
    pts: 35, // 12*2 - 3 + 8
  };
};

/**
 * Poor-performing game example
 */
export const generatePoorGameStats = () => {
  return {
    min: 24,
    fgm: 2,
    fga: 10,
    threepm: 0,
    threeepa: 3,
    ftm: 1,
    fta: 2,
    orb: 0,
    drb: 2,
    ast: 1,
    stl: 0,
    blk: 0,
    tov: 3,
    pf: 4,
    pts: 5,
  };
};

export default {
  generateSampleGames,
  generatePlayerSeason,
  generateEliteGameStats,
  generatePoorGameStats,
};
