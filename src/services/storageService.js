/**
 * Local Storage Service
 * Manages all AsyncStorage operations for game data persistence
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { calculatePlayerMetrics, calculateTeamPossessions } from '../utils/analyticsEngine';

const STORAGE_KEYS = {
  GAMES: '@ballknow_games',
  FOLDERS: '@ballknow_folders',
  PLAYERS: '@ballknow_players',
};

/**
 * Save a new game session
 */
export const saveGame = async (game) => {
  try {
    const games = await getAllGames();
    const newGame = {
      id: Date.now().toString(),
      ...game,
      createdAt: new Date().toISOString(),
      metrics: calculatePlayerMetrics(game.stats, game.teamStats),
    };
    games.push(newGame);
    await AsyncStorage.setItem(STORAGE_KEYS.GAMES, JSON.stringify(games));
    return newGame;
  } catch (error) {
    console.error('Error saving game:', error);
    throw error;
  }
};

/**
 * Get all saved games
 */
export const getAllGames = async () => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.GAMES);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error retrieving games:', error);
    return [];
  }
};

/**
 * Delete a game by ID
 */
export const deleteGame = async (gameId) => {
  try {
    const games = await getAllGames();
    const updated = games.filter((g) => g.id !== gameId);
    await AsyncStorage.setItem(STORAGE_KEYS.GAMES, JSON.stringify(updated));
    return true;
  } catch (error) {
    console.error('Error deleting game:', error);
    throw error;
  }
};

/**
 * Update an existing game
 */
export const updateGame = async (gameId, updates) => {
  try {
    const games = await getAllGames();
    const gameIndex = games.findIndex((g) => g.id === gameId);
    if (gameIndex === -1) throw new Error('Game not found');

    const updatedGame = {
      ...games[gameIndex],
      ...updates,
      metrics: calculatePlayerMetrics(updates.stats || games[gameIndex].stats, updates.teamStats || games[gameIndex].teamStats),
    };
    games[gameIndex] = updatedGame;
    await AsyncStorage.setItem(STORAGE_KEYS.GAMES, JSON.stringify(games));
    return updatedGame;
  } catch (error) {
    console.error('Error updating game:', error);
    throw error;
  }
};

/**
 * Get games by folder
 */
export const getGamesByFolder = async (folderId) => {
  try {
    const games = await getAllGames();
    return games.filter((g) => g.folderId === folderId);
  } catch (error) {
    console.error('Error retrieving games by folder:', error);
    return [];
  }
};

/**
 * Create a new folder
 */
export const createFolder = async (folderName) => {
  try {
    const folders = await getAllFolders();
    const newFolder = {
      id: Date.now().toString(),
      name: folderName,
      createdAt: new Date().toISOString(),
    };
    folders.push(newFolder);
    await AsyncStorage.setItem(STORAGE_KEYS.FOLDERS, JSON.stringify(folders));
    return newFolder;
  } catch (error) {
    console.error('Error creating folder:', error);
    throw error;
  }
};

/**
 * Get all folders
 */
export const getAllFolders = async () => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.FOLDERS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error retrieving folders:', error);
    return [];
  }
};

/**
 * Delete a folder and its games
 */
export const deleteFolder = async (folderId) => {
  try {
    const folders = await getAllFolders();
    const games = await getAllGames();
    
    const updatedFolders = folders.filter((f) => f.id !== folderId);
    const updatedGames = games.filter((g) => g.folderId !== folderId);
    
    await AsyncStorage.setItem(STORAGE_KEYS.FOLDERS, JSON.stringify(updatedFolders));
    await AsyncStorage.setItem(STORAGE_KEYS.GAMES, JSON.stringify(updatedGames));
    return true;
  } catch (error) {
    console.error('Error deleting folder:', error);
    throw error;
  }
};

/**
 * Get aggregated player statistics across all games
 */
export const getPlayerStats = async (playerName) => {
  try {
    const games = await getAllGames();
    const playerGames = games.filter((g) => g.playerName === playerName);

    if (playerGames.length === 0) {
      return null;
    }

    const aggregated = {
      playerName,
      gamesPlayed: playerGames.length,
      totalMinutes: 0,
      totalPoints: 0,
      totalAssists: 0,
      totalRebounds: 0,
      totalSteals: 0,
      totalBlocks: 0,
      averageVORP: 0,
      averageBPM: 0,
      averageTS: 0,
    };

    playerGames.forEach((game) => {
      aggregated.totalMinutes += game.stats.min || 0;
      aggregated.totalPoints += game.stats.pts || 0;
      aggregated.totalAssists += game.stats.ast || 0;
      aggregated.totalRebounds += (game.stats.orb || 0) + (game.stats.drb || 0);
      aggregated.totalSteals += game.stats.stl || 0;
      aggregated.totalBlocks += game.stats.blk || 0;
      aggregated.averageVORP += game.metrics.vorp || 0;
      aggregated.averageBPM += game.metrics.bpm || 0;
      aggregated.averageTS += game.metrics.ts || 0;
    });

    aggregated.averageVORP = Math.round((aggregated.averageVORP / playerGames.length) * 10) / 10;
    aggregated.averageBPM = Math.round((aggregated.averageBPM / playerGames.length) * 10) / 10;
    aggregated.averageTS = Math.round((aggregated.averageTS / playerGames.length) * 10) / 10;

    return aggregated;
  } catch (error) {
    console.error('Error getting player stats:', error);
    return null;
  }
};

/**
 * Clear all data (for testing/reset)
 */
export const clearAllData = async () => {
  try {
    await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
    return true;
  } catch (error) {
    console.error('Error clearing data:', error);
    throw error;
  }
};

/**
 * Export all data as JSON
 */
export const exportData = async () => {
  try {
    const games = await getAllGames();
    const folders = await getAllFolders();
    return { games, folders, exportedAt: new Date().toISOString() };
  } catch (error) {
    console.error('Error exporting data:', error);
    throw error;
  }
};
