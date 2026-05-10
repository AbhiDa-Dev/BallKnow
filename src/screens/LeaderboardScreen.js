/**
 * Leaderboard Screen
 * Displays all local players and games sorted by VORP or Points
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
  Animated,
  PanResponder,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getAllGames, deleteGame, updateGame } from '../services/storageService';
import { calculatePlayerMetrics } from '../utils/analyticsEngine';

const SORT_MODES = {
  VORP: 'vorp',
  BPM: 'bpm',
  POINTS: 'points',
  TS: 'ts',
  PTS: 'pts',
  FGM: 'fgm',
  FGA: 'fga',
  FGPCT: 'fgpct',
  THREEPM: 'threepm',
  THREEPA: 'threepa',
  THREEPPCT: 'threeppct',
  REB: 'reb',
  AST: 'ast',
  MIN: 'min',
  BLK: 'blk',
  FT: 'ft',
  FTPCT: 'ftpct',
  PF: 'pf',
  OBPM: 'obpm',
  DBPM: 'dbpm',
  GSC: 'gsc',
};

const LeaderboardScreen = () => {
  const [games, setGames] = useState([]);
  const [sortBy, setSortBy] = useState(SORT_MODES.VORP);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(true);

  // Load games on screen focus
  useFocusEffect(
    useCallback(() => {
      loadGames();
    }, [])
  );

  const loadGames = async () => {
    setLoading(true);
    try {
      const allGames = await getAllGames();

      // Recalculate metrics for games missing metrics or with zero VORP/BPM
      const repaired = [];
      for (const g of allGames) {
        const needsMetrics = !g.metrics || (g.metrics.vorp === 0 && g.metrics.bpm === 0);
        if (needsMetrics && g.stats) {
          try {
            const newMetrics = calculatePlayerMetrics(g.stats, g.teamStats || {});
            g.metrics = newMetrics;
            // persist the repaired metrics
            try {
              await updateGame(g.id, { metrics: newMetrics });
            } catch (e) {
              console.warn('Failed to persist repaired metrics for', g.id, e.message);
            }
          } catch (e) {
            console.warn('Failed to recalc metrics for', g.id, e.message);
          }
        }
        repaired.push(g);
      }

      setGames(repaired);
    } catch (error) {
      console.error('Error loading games:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadGames();
    } finally {
      setRefreshing(false);
    }
  };

  const handleDeleteGame = async (gameId) => {
    try {
      await deleteGame(gameId);
      await loadGames();
    } catch (error) {
      console.error('Error deleting game:', error);
    }
  };

  const getSortedGames = () => {
    const sorted = [...games];
    switch (sortBy) {
      case SORT_MODES.VORP:
        return sorted.sort((a, b) => (b.metrics?.vorp || 0) - (a.metrics?.vorp || 0));
      case SORT_MODES.BPM:
        return sorted.sort((a, b) => (b.metrics?.bpm || 0) - (a.metrics?.bpm || 0));
      case SORT_MODES.TS:
        return sorted.sort((a, b) => (b.metrics?.ts || 0) - (a.metrics?.ts || 0));
      case SORT_MODES.PTS:
        return sorted.sort((a, b) => (b.stats?.pts || 0) - (a.stats?.pts || 0));
      case SORT_MODES.FGM:
        return sorted.sort((a, b) => (b.stats?.fgm || 0) - (a.stats?.fgm || 0));
      case SORT_MODES.FGA:
        return sorted.sort((a, b) => (b.stats?.fga || 0) - (a.stats?.fga || 0));
      case SORT_MODES.FGPCT:
        return sorted.sort((a, b) => {
          const aPct = (a.stats?.fga || 0) > 0 ? ((a.stats?.fgm || 0) / (a.stats?.fga || 1)) * 100 : 0;
          const bPct = (b.stats?.fga || 0) > 0 ? ((b.stats?.fgm || 0) / (b.stats?.fga || 1)) * 100 : 0;
          return bPct - aPct;
        });
      case SORT_MODES.THREEPM:
        return sorted.sort((a, b) => (b.stats?.threepm || 0) - (a.stats?.threepm || 0));
      case SORT_MODES.THREEPA:
        return sorted.sort((a, b) => (b.stats?.threeepa || 0) - (a.stats?.threeepa || 0));
      case SORT_MODES.THREEPPCT:
        return sorted.sort((a, b) => {
          const aPct = (a.stats?.threeepa || 0) > 0 ? ((a.stats?.threepm || 0) / (a.stats?.threeepa || 1)) * 100 : 0;
          const bPct = (b.stats?.threeepa || 0) > 0 ? ((b.stats?.threepm || 0) / (b.stats?.threeepa || 1)) * 100 : 0;
          return bPct - aPct;
        });
      case SORT_MODES.REB:
        return sorted.sort((a, b) => ((b.stats?.orb || 0) + (b.stats?.drb || 0)) - ((a.stats?.orb || 0) + (a.stats?.drb || 0)));
      case SORT_MODES.AST:
        return sorted.sort((a, b) => (b.stats?.ast || 0) - (a.stats?.ast || 0));
      case SORT_MODES.MIN:
        return sorted.sort((a, b) => (b.stats?.min || 0) - (a.stats?.min || 0));
      case SORT_MODES.BLK:
        return sorted.sort((a, b) => (b.stats?.blk || 0) - (a.stats?.blk || 0));
      case SORT_MODES.FT:
        return sorted.sort((a, b) => (b.stats?.ftm || 0) - (a.stats?.ftm || 0));
      case SORT_MODES.FTPCT:
        return sorted.sort((a, b) => (b.metrics?.ftPct || 0) - (a.metrics?.ftPct || 0));
      case SORT_MODES.PF:
        return sorted.sort((a, b) => (b.stats?.pf || 0) - (a.stats?.pf || 0));
      case SORT_MODES.OBPM:
        return sorted.sort((a, b) => (b.metrics?.obpm || 0) - (a.metrics?.obpm || 0));
      case SORT_MODES.DBPM:
        return sorted.sort((a, b) => (b.metrics?.dbpm || 0) - (a.metrics?.dbpm || 0));
      case SORT_MODES.GSC:
        return sorted.sort((a, b) => (b.metrics?.gameScore || 0) - (a.metrics?.gameScore || 0));
      default:
        return sorted;
    }
  };

  const sortedGames = getSortedGames();
  const debugMode = (typeof window !== 'undefined' && window.localStorage && window.localStorage.getItem('ballknow_debug')) ? true : false;

  const GameCard = ({ game, index }) => (
    <Animated.View style={styles.gameCard}>
      <View style={styles.cardContent}>
        <View style={styles.rankBadge}>
          <Text style={styles.rankText}>#{index + 1}</Text>
        </View>
        <View style={styles.playerInfo}>
          <Text style={styles.playerName}>{game.playerName}</Text>
          <Text style={styles.gameDate}>
            {new Date(game.createdAt).toLocaleDateString()} at{' '}
            {game.location || 'Unknown'}
          </Text>
        </View>
        <View style={styles.metricsContainerMultiple}>
          <MetricBox label="PTS" value={game.stats?.pts} reliable={true} highlight={sortBy === SORT_MODES.PTS} />
          <MetricBox label="FGM" value={game.stats?.fgm} reliable={true} highlight={sortBy === SORT_MODES.FGM} />
          <MetricBox label="FGA" value={game.stats?.fga} reliable={true} highlight={sortBy === SORT_MODES.FGA} />
          <MetricBox
            label="FG%"
            value={(game.stats?.fga || 0) > 0 ? ((game.stats?.fgm || 0) / (game.stats?.fga || 1)) * 100 : 0}
            reliable={true}
            highlight={sortBy === SORT_MODES.FGPCT}
          />
          <MetricBox label="3PM" value={game.stats?.threepm} reliable={true} highlight={sortBy === SORT_MODES.THREEPM} />
          <MetricBox label="3PA" value={game.stats?.threeepa} reliable={true} highlight={sortBy === SORT_MODES.THREEPA} />
          <MetricBox
            label="3P%"
            value={(game.stats?.threeepa || 0) > 0 ? ((game.stats?.threepm || 0) / (game.stats?.threeepa || 1)) * 100 : 0}
            reliable={true}
            highlight={sortBy === SORT_MODES.THREEPPCT}
          />
          <MetricBox label="REB" value={(game.stats?.orb || 0) + (game.stats?.drb || 0)} reliable={true} highlight={sortBy === SORT_MODES.REB} />
          <MetricBox label="AST" value={game.stats?.ast} reliable={true} highlight={sortBy === SORT_MODES.AST} />
          <MetricBox label="MIN" value={game.stats?.min} reliable={true} highlight={sortBy === SORT_MODES.MIN} />
          <MetricBox label="BLK" value={game.stats?.blk} reliable={true} highlight={sortBy === SORT_MODES.BLK} />
          <MetricBox label="FT" value={`${game.stats?.ftm || 0}/${game.stats?.fta || 0}`} reliable={true} highlight={sortBy === SORT_MODES.FT} />
          <MetricBox label="FT%" value={game.metrics?.ftPct} reliable={game.metrics?.metricsReliable} highlight={sortBy === SORT_MODES.FTPCT} />
          <MetricBox label="PF" value={game.stats?.pf} reliable={true} highlight={sortBy === SORT_MODES.PF} />
          <MetricBox label="OBPM" value={game.metrics?.obpm} reliable={game.metrics?.metricsReliable} highlight={sortBy === SORT_MODES.OBPM} />
          <MetricBox label="DBPM" value={game.metrics?.dbpm} reliable={game.metrics?.metricsReliable} highlight={sortBy === SORT_MODES.DBPM} />
          <MetricBox label="BPM" value={game.metrics?.bpm} raw={game.metrics?.bpmRaw} reliable={game.metrics?.metricsReliable} highlight={sortBy === SORT_MODES.BPM} debug={debugMode} />
          <MetricBox label="VORP" value={game.metrics?.vorp} raw={game.metrics?.vorpRaw} reliable={game.metrics?.metricsReliable} highlight={sortBy === SORT_MODES.VORP} debug={debugMode} />
          <MetricBox label="TS%" value={game.metrics?.ts} reliable={game.metrics?.metricsReliable} highlight={sortBy === SORT_MODES.TS} />
          <MetricBox label="GSC" value={game.metrics?.gameScore} reliable={game.metrics?.metricsReliable} highlight={sortBy === SORT_MODES.GSC} />
        </View>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteGame(game.id)}
      >
        <MaterialCommunityIcons name="delete" size={20} color="#ff6b6b" />
      </TouchableOpacity>
    </Animated.View>
  );

  const MetricBox = ({ label, value, raw, reliable = true, highlight, debug = false }) => {
    let display;
    const precision = label === 'VORP' ? 2 : 1;
    if (!reliable || value === undefined || value === null) {
      display = 'N/A';
    } else if (typeof value === 'string') {
      display = value;
    } else {
      display = Number(value).toFixed(precision);
    }

    // If debug mode and raw provided, show raw in parentheses
    if (debug && raw !== undefined && raw !== null && reliable) {
      const rawStr = Number(raw).toFixed(precision);
      display = `${display} (${rawStr})`;
    }

    return (
      <View style={[styles.metricBoxSmall, highlight && styles.metricBoxHighlight]}>
        <Text style={styles.metricLabel}>{label}</Text>
        <Text style={styles.metricValue}>{display}</Text>
      </View>
    );
  };

  const SortButton = ({ mode, label, style }) => (
    <TouchableOpacity
      style={[styles.sortButton, style, sortBy === mode && styles.sortButtonActive]}
      onPress={() => setSortBy(mode)}
    >
      <Text
        style={[
          styles.sortButtonText,
          sortBy === mode && styles.sortButtonTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  if (loading && !games.length) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#FFB81C" style={{ marginTop: 50 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.sortContainerWrap}>
        <TouchableOpacity style={styles.filterToggle} onPress={() => setShowFilters((prev) => !prev)}>
          <Text style={styles.filterToggleText}>{showFilters ? 'Hide Filters' : 'Show Filters'}</Text>
          <MaterialCommunityIcons
            name={showFilters ? 'chevron-up' : 'chevron-down'}
            size={18}
            color="#FFB81C"
          />
        </TouchableOpacity>

        {showFilters && (
          <>
            <View style={styles.sortSection}>
              <Text style={styles.sortSectionTitle}>Shooting</Text>
              <View style={styles.sortContainer}>
                <SortButton mode={SORT_MODES.FGM} label="FGM" style={styles.sortButtonThird} />
                <SortButton mode={SORT_MODES.FGA} label="FGA" style={styles.sortButtonThird} />
                <SortButton mode={SORT_MODES.FGPCT} label="FG%" style={styles.sortButtonThird} />
                <SortButton mode={SORT_MODES.THREEPM} label="3PM" style={styles.sortButtonThird} />
                <SortButton mode={SORT_MODES.THREEPA} label="3PA" style={styles.sortButtonThird} />
                <SortButton mode={SORT_MODES.THREEPPCT} label="3P%" style={styles.sortButtonThird} />
                <SortButton mode={SORT_MODES.FT} label="FT" style={styles.sortButtonThird} />
                <SortButton mode={SORT_MODES.FTPCT} label="FT%" style={styles.sortButtonThird} />
                <SortButton mode={SORT_MODES.TS} label="TS%" style={styles.sortButtonThird} />
              </View>
            </View>
            <View style={styles.sortSection}>
              <Text style={styles.sortSectionTitle}>Points + Rebounds + Assists</Text>
              <View style={styles.sortContainer}>
                <SortButton mode={SORT_MODES.PTS} label="PTS" style={styles.sortButtonThird} />
                <SortButton mode={SORT_MODES.REB} label="REB" style={styles.sortButtonThird} />
                <SortButton mode={SORT_MODES.AST} label="AST" style={styles.sortButtonThird} />
              </View>
            </View>
            <View style={styles.sortSection}>
              <Text style={styles.sortSectionTitle}>Impact + Box</Text>
              <View style={styles.sortContainer}>
                <SortButton mode={SORT_MODES.VORP} label="VORP" style={styles.sortButtonQuarter} />
                <SortButton mode={SORT_MODES.BPM} label="BPM" style={styles.sortButtonQuarter} />
                <SortButton mode={SORT_MODES.OBPM} label="OBPM" style={styles.sortButtonQuarter} />
                <SortButton mode={SORT_MODES.DBPM} label="DBPM" style={styles.sortButtonQuarter} />
                <SortButton mode={SORT_MODES.GSC} label="GSC" style={styles.sortButtonQuarter} />
                <SortButton mode={SORT_MODES.MIN} label="MIN" style={styles.sortButtonQuarter} />
                <SortButton mode={SORT_MODES.BLK} label="BLK" style={styles.sortButtonQuarter} />
                <SortButton mode={SORT_MODES.PF} label="PF" style={styles.sortButtonQuarter} />
              </View>
            </View>
          </>
        )}
      </View>

      {games.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="basketball" size={48} color="#666" />
          <Text style={styles.emptyText}>No games logged yet</Text>
          <Text style={styles.emptySubtext}>Start logging games to see your stats</Text>
        </View>
      ) : (
        <FlatList
          data={sortedGames}
          renderItem={({ item, index }) => <GameCard game={item} index={index} />}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d0d0d',
  },
  sortContainer: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 12,
    backgroundColor: '#1a1a1a',
    borderBottomColor: '#333',
    borderBottomWidth: 1,
  },
  sortButton: {
    paddingVertical: 8,
    paddingHorizontal: 2,
    marginVertical: 4,
    borderRadius: 8,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#444',
  },
  sortButtonThird: {
    width: '32%',
  },
  sortButtonQuarter: {
    width: '23.5%',
  },
  sortButtonActive: {
    backgroundColor: '#FFB81C',
    borderColor: '#FFB81C',
  },
  sortButtonText: {
    textAlign: 'center',
    color: '#aaa',
    fontSize: 12,
    fontWeight: '600',
  },
  sortButtonTextActive: {
    color: '#000',
  },
  listContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  gameCard: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    marginBottom: 10,
    padding: 10,
    alignItems: 'center',
    borderLeftColor: '#FFB81C',
    borderLeftWidth: 4,
  },
  cardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFB81C',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#000',
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  gameDate: {
    fontSize: 12,
    color: '#999',
  },
  metricsContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  metricBox: {
    width: 45,
    backgroundColor: '#0d0d0d',
    borderRadius: 8,
    padding: 6,
    alignItems: 'center',
  },
  metricBoxSmall: {
    width: 48,
    backgroundColor: '#0d0d0d',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 6,
    alignItems: 'center',
    marginHorizontal: 2,
    marginBottom: 4,
  },
  metricsContainerMultiple: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
  },
  sortContainerWrap: {
    backgroundColor: '#1a1a1a',
    borderBottomColor: '#333',
    borderBottomWidth: 1,
    paddingBottom: 4,
  },
  filterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomColor: '#2a2a2a',
    borderBottomWidth: 1,
  },
  filterToggleText: {
    color: '#FFB81C',
    fontSize: 13,
    fontWeight: '700',
  },
  sortSection: {
    paddingHorizontal: 8,
    paddingTop: 6,
  },
  sortSectionTitle: {
    color: '#888',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
    marginLeft: 4,
  },
  sortContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  metricBoxHighlight: {
    backgroundColor: '#FFB81C',
    borderColor: '#FFB81C',
  },
  metricLabel: {
    fontSize: 9,
    color: '#999',
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
});

export default LeaderboardScreen;
