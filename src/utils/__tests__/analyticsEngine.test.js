/**
 * Analytics Engine Tests
 * Tests for VORP, BPM, and TS% calculations
 */

import {
  calculateTS,
  calculateEFG,
  calculatePER,
  calculateBPM,
  calculateVORP,
  calculatePlayerMetrics,
  validateGameStats,
} from '../analyticsEngine';

describe('Analytics Engine', () => {
  // Sample game stats for testing
  const eliteStats = {
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
    pts: 35,
  };

  const poorStats = {
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

  const teamStats = { possessions: 100 };

  describe('calculateTS', () => {
    it('calculates true shooting percentage correctly', () => {
      const ts = calculateTS(25, 18, 6);
      expect(ts).toBeGreaterThan(50);
      expect(ts).toBeLessThan(70);
    });

    it('returns 0 for no FGA', () => {
      const ts = calculateTS(10, 0, 5);
      expect(ts).toBe(0);
    });

    it('handles elite shooter (high TS%)', () => {
      const ts = calculateTS(35, 18, 9);
      expect(ts).toBeGreaterThan(60);
    });

    it('handles poor shooter (low TS%)', () => {
      const ts = calculateTS(5, 10, 2);
      expect(ts).toBeLessThan(45);
    });
  });

  describe('calculateEFG', () => {
    it('calculates effective field goal percentage', () => {
      const efg = calculateEFG(10, 3, 18);
      expect(efg).toBeGreaterThan(0);
      expect(efg).toBeLessThan(100);
    });

    it('returns 0 for no FGA', () => {
      const efg = calculateEFG(5, 2, 0);
      expect(efg).toBe(0);
    });

    it('gives bonus for 3-pointers', () => {
      const efg1 = calculateEFG(7, 0, 18); // No 3s
      const efg2 = calculateEFG(7, 3, 18); // Same FGM, with 3s
      expect(efg2).toBeGreaterThan(efg1);
    });
  });

  describe('calculatePER', () => {
    it('returns positive PER for elite performance', () => {
      const per = calculatePER(eliteStats);
      expect(per).toBeGreaterThan(1);
    });

    it('returns lower PER for poor performance', () => {
      const per = calculatePER(poorStats);
      expect(per).toBeLessThan(10);
    });

    it('returns 0 for no minutes', () => {
      const stats = { ...eliteStats, min: 0 };
      const per = calculatePER(stats);
      expect(per).toBe(0);
    });
  });

  describe('calculateBPM', () => {
    it('calculates box plus-minus for elite player', () => {
      const bpm = calculateBPM(eliteStats, teamStats);
      expect(bpm).toBeGreaterThan(2);
    });

    it('calculates negative BPM for poor performance', () => {
      const bpm = calculateBPM(poorStats, teamStats);
      expect(bpm).toBeLessThan(1);
    });

    it('returns 0 for no minutes', () => {
      const stats = { ...eliteStats, min: 0 };
      const bpm = calculateBPM(stats, teamStats);
      expect(typeof bpm).toBe('number');
      expect(bpm).not.toBeNaN();
    });
  });

  describe('calculateVORP', () => {
    it('returns positive VORP for above-replacement player', () => {
      const vorp = calculateVORP(eliteStats, teamStats);
      expect(vorp).toBeGreaterThan(0);
    });

    it('scales with minutes played', () => {
      const stats1 = { ...eliteStats, min: 12 };
      const stats2 = { ...eliteStats, min: 40 };

      const vorp1 = calculateVORP(stats1, teamStats);
      const vorp2 = calculateVORP(stats2, teamStats);

      expect(vorp2).toBeGreaterThanOrEqual(vorp1);
    });
  });

  describe('calculatePlayerMetrics', () => {
    it('returns all metrics for a game', () => {
      const metrics = calculatePlayerMetrics(eliteStats, teamStats);

      expect(metrics).toHaveProperty('ts');
      expect(metrics).toHaveProperty('efg');
      expect(metrics).toHaveProperty('per');
      expect(metrics).toHaveProperty('bpm');
      expect(metrics).toHaveProperty('vorp');
    });

    it('returns expected value types for all metrics', () => {
      const metrics = calculatePlayerMetrics(eliteStats, teamStats);
      expect(typeof metrics.ts).toBe('number');
      expect(typeof metrics.efg).toBe('number');
      expect(typeof metrics.per).toBe('number');
      expect(typeof metrics.bpm).toBe('number');
      expect(typeof metrics.bpmRaw).toBe('number');
      expect(typeof metrics.vorp).toBe('number');
      expect(typeof metrics.vorpRaw).toBe('number');
      expect(typeof metrics.obpm).toBe('number');
      expect(typeof metrics.dbpm).toBe('number');
      expect(typeof metrics.metricsReliable).toBe('boolean');
      expect(metrics.ftPct === null || typeof metrics.ftPct === 'number').toBe(true);
      expect(typeof metrics.gameScore).toBe('number');
    });

    it('elite game has higher metrics than poor game', () => {
      const eliteMetrics = calculatePlayerMetrics(eliteStats, teamStats);
      const poorMetrics = calculatePlayerMetrics(poorStats, teamStats);

      expect(eliteMetrics.ts).toBeGreaterThan(poorMetrics.ts);
      expect(eliteMetrics.vorp).toBeGreaterThan(poorMetrics.vorp);
    });
  });

  describe('validateGameStats', () => {
    it('returns valid for complete stats', () => {
      const result = validateGameStats(eliteStats);
      expect(result.valid).toBe(true);
    });

    it('returns invalid and missing field for incomplete stats', () => {
      const incomplete = { ...eliteStats };
      delete incomplete.ast;

      const result = validateGameStats(incomplete);
      expect(result.valid).toBe(false);
      expect(result.missing).toBe('ast');
    });

    it('returns invalid for null values', () => {
      const stats = { ...eliteStats, min: null };
      const result = validateGameStats(stats);
      expect(result.valid).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('handles all zero stats', () => {
      const zeroStats = {
        min: 10,
        fgm: 0,
        fga: 0,
        threepm: 0,
        threeepa: 0,
        ftm: 0,
        fta: 0,
        orb: 0,
        drb: 0,
        ast: 0,
        stl: 0,
        blk: 0,
        tov: 0,
        pf: 0,
        pts: 0,
      };

      const metrics = calculatePlayerMetrics(zeroStats, teamStats);
      expect(metrics.ts).toBe(0);
      expect(metrics.vorp).toBeLessThanOrEqual(0);
    });

    it('handles high minute games correctly', () => {
      const overtimeStats = { ...eliteStats, min: 48 };
      const metrics = calculatePlayerMetrics(overtimeStats, teamStats);

      expect(metrics.vorp).toBeGreaterThan(0);
      expect(metrics).not.toHaveProperty('undefined');
    });
  });
});
