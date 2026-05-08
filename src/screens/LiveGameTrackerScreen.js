/**
 * Live Game Tracker Screen
 * Real-time multi-player stat tracking with quick button presses during live games
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  SafeAreaView,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  FlatList,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { saveGame } from '../services/storageService';

const LiveGameTrackerScreen = ({ navigation }) => {
  const [players, setPlayers] = useState([]);
  const [activePlayerId, setActivePlayerId] = useState(null);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [addPlayerModalVisible, setAddPlayerModalVisible] = useState(false);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [location, setLocation] = useState('');
  const [minutes, setMinutes] = useState(0);

  // Default stat structure for a player
  const createEmptyStats = () => ({
    fgm: 0,      // Field Goals Made
    fga: 0,      // Field Goals Attempted
    fgMissed: 0, // Shots Missed (tracked separately)
    threepm: 0,  // 3-Pointers Made
    threeepa: 0, // 3-Pointers Attempted
    ftm: 0,      // Free Throws Made
    fta: 0,      // Free Throws Attempted
    orb: 0,      // Offensive Rebounds
    drb: 0,      // Defensive Rebounds
    ast: 0,      // Assists
    stl: 0,      // Steals
    blk: 0,      // Blocks
    tov: 0,      // Turnovers
    pf: 0,       // Personal Fouls
  });

  const addPlayer = () => {
    if (!newPlayerName.trim()) {
      Alert.alert('Error', 'Please enter player name');
      return;
    }

    const newPlayer = {
      id: Date.now().toString(),
      name: newPlayerName.trim(),
      stats: createEmptyStats(),
    };

    setPlayers([...players, newPlayer]);
    setActivePlayerId(newPlayer.id);
    setNewPlayerName('');
    setAddPlayerModalVisible(false);
  };

  const removePlayer = (playerId) => {
    const updatedPlayers = players.filter((p) => p.id !== playerId);
    setPlayers(updatedPlayers);
    if (activePlayerId === playerId) {
      setActivePlayerId(updatedPlayers.length > 0 ? updatedPlayers[0].id : null);
    }
  };

  const getActivePlayer = () => {
    return players.find((p) => p.id === activePlayerId);
  };

  const updatePlayerStat = (playerId, statKey, value) => {
    const updatedPlayers = players.map((p) => {
      if (p.id === playerId) {
        return {
          ...p,
          stats: { ...p.stats, [statKey]: value },
        };
      }
      return p;
    });
    setPlayers(updatedPlayers);
  };

  const incrementPlayerStat = (playerId, statKey) => {
    const player = players.find((p) => p.id === playerId);
    if (player) {
      updatePlayerStat(playerId, statKey, player.stats[statKey] + 1);
    }
  };

  const decrementPlayerStat = (playerId, statKey) => {
    const player = players.find((p) => p.id === playerId);
    if (player && player.stats[statKey] > 0) {
      updatePlayerStat(playerId, statKey, player.stats[statKey] - 1);
    }
  };

  const activePlayer = getActivePlayer();

  const calculatePTS = (stats) => {
    return stats.fgm * 2 - stats.threepm + stats.ftm;
  };

  const resetGame = () => {
    Alert.alert('Reset Game?', 'This will clear all players and stats.', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Reset',
        onPress: () => {
          setPlayers([]);
          setActivePlayerId(null);
          setMinutes(0);
          setLocation('');
        },
        style: 'destructive',
      },
    ]);
  };

  const handleSaveGame = async (playerId) => {
    const playerToSave = players.find((p) => p.id === playerId);
    if (!playerToSave) return;

    if (!location.trim()) {
      Alert.alert('Error', 'Please enter game location');
      return;
    }

    try {
      const gameStats = {
        ...playerToSave.stats,
        min: minutes,
        pts: calculatePTS(playerToSave.stats),
      };

      await saveGame({
        playerName: playerToSave.name,
        location: location.trim(),
        stats: gameStats,
        teamStats: { possessions: 100 },
      });

      Alert.alert('Success', `${playerToSave.name}'s game saved!`);
    } catch (error) {
      Alert.alert('Error', 'Failed to save game: ' + error.message);
    }
  };

  const handleSaveAll = async () => {
    if (!location.trim()) {
      Alert.alert('Error', 'Please enter game location');
      return;
    }

    let saved = 0;
    let failed = 0;

    for (const player of players) {
      try {
        const gameStats = {
          ...player.stats,
          min: minutes,
          pts: calculatePTS(player.stats),
        };

        await saveGame({
          playerName: player.name,
          location: location.trim(),
          stats: gameStats,
          teamStats: { possessions: 100 },
        });
        saved++;
      } catch (error) {
        failed++;
        console.error(`Failed to save ${player.name}:`, error);
      }
    }

    Alert.alert(
      'Game Saved',
      `${saved} player(s) saved${failed > 0 ? `, ${failed} failed` : ''}`,
      [
        {
          text: 'OK',
          onPress: () => {
            setSaveModalVisible(false);
            resetGame();
          },
        },
      ]
    );
  };

  const ShotButton = ({ madeColor, missedColor }) => (
    <View style={styles.shotButtonGroup}>
      <TouchableOpacity
        style={[styles.shotButton, { borderColor: madeColor }]}
        onPress={() => {
          incrementPlayerStat(activePlayerId, 'fgm');
          incrementPlayerStat(activePlayerId, 'fga');
        }}
      >
        <MaterialCommunityIcons name="check-circle" size={24} color={madeColor} />
        <Text style={[styles.shotButtonLabel, { color: madeColor }]}>MAKE</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.shotButton, { borderColor: missedColor }]}
        onPress={() => {
          incrementPlayerStat(activePlayerId, 'fgMissed');
          incrementPlayerStat(activePlayerId, 'fga');
        }}
      >
        <MaterialCommunityIcons name="close-circle" size={24} color={missedColor} />
        <Text style={[styles.shotButtonLabel, { color: missedColor }]}>MISS</Text>
      </TouchableOpacity>
    </View>
  );

  const ReboundButton = ({ label, offColor, defColor }) => (
    <View style={styles.reboundButtonGroup}>
      <TouchableOpacity
        style={[styles.reboundButton, { borderColor: offColor }]}
        onPress={() => incrementPlayerStat(activePlayerId, 'orb')}
      >
        <MaterialCommunityIcons name="arrow-down" size={20} color={offColor} />
        <Text style={[styles.reboundLabel, { color: offColor }]}>OFF</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.reboundButton, { borderColor: defColor }]}
        onPress={() => incrementPlayerStat(activePlayerId, 'drb')}
      >
        <MaterialCommunityIcons name="arrow-up" size={20} color={defColor} />
        <Text style={[styles.reboundLabel, { color: defColor }]}>DEF</Text>
      </TouchableOpacity>
    </View>
  );

  const StatDisplay = ({ label, value, onAdd, onSubtract }) => (
    <View style={styles.statDisplayRow}>
      <View style={styles.statDisplayLeft}>
        <Text style={styles.statDisplayLabel}>{label}</Text>
        <Text style={styles.statDisplayValue}>{value}</Text>
      </View>
      <View style={styles.statDisplayButtons}>
        <TouchableOpacity style={styles.minusButton} onPress={onSubtract}>
          <MaterialCommunityIcons name="minus" size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.plusButton} onPress={onAdd}>
          <MaterialCommunityIcons name="plus" size={20} color="#000" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (!activePlayer) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="basketball" size={48} color="#666" />
          <Text style={styles.emptyStateText}>No Players Registered</Text>
          <TouchableOpacity
            style={styles.addFirstPlayerButton}
            onPress={() => setAddPlayerModalVisible(true)}
          >
            <MaterialCommunityIcons name="plus" size={20} color="#000" />
            <Text style={styles.addFirstPlayerButtonText}>Add Player</Text>
          </TouchableOpacity>
        </View>

        <Modal visible={addPlayerModalVisible} transparent animationType="slide">
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Register Player</Text>
                <TouchableOpacity onPress={() => setAddPlayerModalVisible(false)}>
                  <MaterialCommunityIcons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
              <View style={styles.modalBody}>
                <Text style={styles.modalLabel}>Player Name</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter player name"
                  placeholderTextColor="#666"
                  value={newPlayerName}
                  onChangeText={setNewPlayerName}
                  autoFocus
                />
                <TouchableOpacity style={styles.modalAddButton} onPress={addPlayer}>
                  <Text style={styles.modalAddButtonText}>Add Player</Text>
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Player Selection & Header */}
      <View style={styles.playerSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.playerList}
        >
          {players.map((player) => (
            <TouchableOpacity
              key={player.id}
              style={[
                styles.playerCard,
                activePlayerId === player.id && styles.playerCardActive,
              ]}
              onPress={() => setActivePlayerId(player.id)}
              onLongPress={() => {
                Alert.alert(`Remove ${player.name}?`, '', [
                  { text: 'Cancel' },
                  {
                    text: 'Remove',
                    onPress: () => removePlayer(player.id),
                    style: 'destructive',
                  },
                ]);
              }}
            >
              <Text style={styles.playerCardName}>{player.name}</Text>
              <Text style={styles.playerCardPoints}>
                {calculatePTS(player.stats)} pts
              </Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={styles.addPlayerCard}
            onPress={() => setAddPlayerModalVisible(true)}
          >
            <MaterialCommunityIcons name="plus" size={28} color="#FFB81C" />
            <Text style={styles.addPlayerCardText}>Add</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Stats Header */}
      <View style={styles.statsHeader}>
        <View style={styles.headerStat}>
          <Text style={styles.headerStatLabel}>MIN</Text>
          <Text style={styles.headerStatValue}>{minutes}</Text>
        </View>
        <View style={styles.headerStat}>
          <Text style={styles.headerStatLabel}>PTS</Text>
          <Text style={styles.headerStatValue}>{calculatePTS(activePlayer.stats)}</Text>
        </View>
        <View style={styles.headerStat}>
          <Text style={styles.headerStatLabel}>REB</Text>
          <Text style={styles.headerStatValue}>
            {activePlayer.stats.orb + activePlayer.stats.drb}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={() => setSaveModalVisible(true)}
        >
          <MaterialCommunityIcons name="check" size={20} color="#000" />
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Quick Shots Section */}
        <View style={styles.quickSection}>
          <Text style={styles.quickSectionTitle}>FIELD GOALS</Text>
          <ShotButton madeColor="#51cf66" missedColor="#ff6b6b" />
          <View style={styles.shotStatsRow}>
            <View style={styles.shotStat}>
              <Text style={styles.shotStatLabel}>FGA</Text>
              <Text style={styles.shotStatValue}>{activePlayer.stats.fga}</Text>
            </View>
            <View style={styles.shotStat}>
              <Text style={styles.shotStatLabel}>FGM</Text>
              <Text style={styles.shotStatValue}>{activePlayer.stats.fgm}</Text>
            </View>
            <View style={styles.shotStat}>
              <Text style={styles.shotStatLabel}>MISS</Text>
              <Text style={styles.shotStatValue}>{activePlayer.stats.fgMissed}</Text>
            </View>
            <View style={styles.shotStat}>
              <Text style={styles.shotStatLabel}>FG%</Text>
              <Text style={styles.shotStatValue}>
                {activePlayer.stats.fga > 0
                  ? ((activePlayer.stats.fgm / activePlayer.stats.fga) * 100).toFixed(1)
                  : 0}
                %
              </Text>
            </View>
          </View>
        </View>

        {/* 3PT Section */}
        <View style={styles.quickSection}>
          <Text style={styles.quickSectionTitle}>3-POINTERS</Text>
          <ShotButton madeColor="#4c6ef5" missedColor="#ff6b6b" />
          <View style={styles.shotStatsRow}>
            <View style={styles.shotStat}>
              <Text style={styles.shotStatLabel}>3PA</Text>
              <Text style={styles.shotStatValue}>{activePlayer.stats.threeepa}</Text>
            </View>
            <View style={styles.shotStat}>
              <Text style={styles.shotStatLabel}>3PM</Text>
              <Text style={styles.shotStatValue}>{activePlayer.stats.threepm}</Text>
            </View>
            <View style={styles.shotStat}>
              <Text style={styles.shotStatLabel}>3P%</Text>
              <Text style={styles.shotStatValue}>
                {activePlayer.stats.threeepa > 0
                  ? ((activePlayer.stats.threepm / activePlayer.stats.threeepa) * 100).toFixed(
                      1
                    )
                  : 0}
                %
              </Text>
            </View>
          </View>
        </View>

        {/* Rebounds Section */}
        <View style={styles.quickSection}>
          <Text style={styles.quickSectionTitle}>REBOUNDS</Text>
          <ReboundButton label="Rebounds" offColor="#ffa500" defColor="#4c6ef5" />
          <View style={styles.reboundStatsRow}>
            <View style={styles.reboundStat}>
              <Text style={styles.reboundStatLabel}>ORB</Text>
              <Text style={styles.reboundStatValue}>{activePlayer.stats.orb}</Text>
            </View>
            <View style={styles.reboundStat}>
              <Text style={styles.reboundStatLabel}>DRB</Text>
              <Text style={styles.reboundStatValue}>{activePlayer.stats.drb}</Text>
            </View>
            <View style={styles.reboundStat}>
              <Text style={styles.reboundStatLabel}>Total</Text>
              <Text style={styles.reboundStatValue}>
                {activePlayer.stats.orb + activePlayer.stats.drb}
              </Text>
            </View>
          </View>
        </View>

        {/* Free Throws Section */}
        <View style={styles.quickSection}>
          <Text style={styles.quickSectionTitle}>FREE THROWS</Text>
          <ShotButton madeColor="#51cf66" missedColor="#ff6b6b" />
          <View style={styles.shotStatsRow}>
            <View style={styles.shotStat}>
              <Text style={styles.shotStatLabel}>FTA</Text>
              <Text style={styles.shotStatValue}>{activePlayer.stats.fta}</Text>
            </View>
            <View style={styles.shotStat}>
              <Text style={styles.shotStatLabel}>FTM</Text>
              <Text style={styles.shotStatValue}>{activePlayer.stats.ftm}</Text>
            </View>
            <View style={styles.shotStat}>
              <Text style={styles.shotStatLabel}>FT%</Text>
              <Text style={styles.shotStatValue}>
                {activePlayer.stats.fta > 0
                  ? ((activePlayer.stats.ftm / activePlayer.stats.fta) * 100).toFixed(1)
                  : 0}
                %
              </Text>
            </View>
          </View>
        </View>

        {/* Other Stats */}
        <View style={styles.detailedStatsSection}>
          <Text style={styles.quickSectionTitle}>OTHER STATS</Text>
          <StatDisplay
            label="Assists"
            value={activePlayer.stats.ast}
            onAdd={() => incrementPlayerStat(activePlayerId, 'ast')}
            onSubtract={() => decrementPlayerStat(activePlayerId, 'ast')}
          />
          <StatDisplay
            label="Steals"
            value={activePlayer.stats.stl}
            onAdd={() => incrementPlayerStat(activePlayerId, 'stl')}
            onSubtract={() => decrementPlayerStat(activePlayerId, 'stl')}
          />
          <StatDisplay
            label="Blocks"
            value={activePlayer.stats.blk}
            onAdd={() => incrementPlayerStat(activePlayerId, 'blk')}
            onSubtract={() => decrementPlayerStat(activePlayerId, 'blk')}
          />
          <StatDisplay
            label="Turnovers"
            value={activePlayer.stats.tov}
            onAdd={() => incrementPlayerStat(activePlayerId, 'tov')}
            onSubtract={() => decrementPlayerStat(activePlayerId, 'tov')}
          />
          <StatDisplay
            label="Fouls"
            value={activePlayer.stats.pf}
            onAdd={() => incrementPlayerStat(activePlayerId, 'pf')}
            onSubtract={() => decrementPlayerStat(activePlayerId, 'pf')}
          />
        </View>

        <TouchableOpacity style={styles.resetButton} onPress={resetGame}>
          <MaterialCommunityIcons name="restart" size={20} color="#ff6b6b" />
          <Text style={styles.resetButtonText}>Reset Game</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Add Player Modal */}
      <Modal visible={addPlayerModalVisible} transparent animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Register Player</Text>
              <TouchableOpacity onPress={() => setAddPlayerModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.modalLabel}>Player Name</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter player name"
                placeholderTextColor="#666"
                value={newPlayerName}
                onChangeText={setNewPlayerName}
                autoFocus
              />
              <TouchableOpacity style={styles.modalAddButton} onPress={addPlayer}>
                <Text style={styles.modalAddButtonText}>Add Player</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Save Modal */}
      <Modal visible={saveModalVisible} transparent animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Save Game</Text>
              <TouchableOpacity onPress={() => setSaveModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalBody}>
              <Text style={styles.modalLabel}>Location *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Gym, Court, etc."
                placeholderTextColor="#666"
                value={location}
                onChangeText={setLocation}
              />

              <Text style={styles.modalLabel}>Minutes Played</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter minutes"
                placeholderTextColor="#666"
                keyboardType="number-pad"
                value={String(minutes)}
                onChangeText={(val) => setMinutes(parseInt(val, 10) || 0)}
              />

              <Text style={styles.modalLabel}>Players to Save</Text>
              <FlatList
                data={players}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <View style={styles.playerSaveItem}>
                    <View>
                      <Text style={styles.playerSaveItemName}>{item.name}</Text>
                      <Text style={styles.playerSaveItemStats}>
                        {calculatePTS(item.stats)} pts | {item.stats.orb + item.stats.drb}{' '}
                        reb | {item.stats.ast} ast
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.saveSingleButton}
                      onPress={() => handleSaveGame(item.id)}
                    >
                      <MaterialCommunityIcons
                        name="download"
                        size={20}
                        color="#FFB81C"
                      />
                    </TouchableOpacity>
                  </View>
                )}
              />

              <TouchableOpacity style={styles.modalSaveAllButton} onPress={handleSaveAll}>
                <MaterialCommunityIcons name="check" size={20} color="#000" />
                <Text style={styles.modalSaveAllButtonText}>Save All Players</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setSaveModalVisible(false)}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d0d0d',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#999',
    fontSize: 16,
    marginTop: 16,
  },
  addFirstPlayerButton: {
    marginTop: 24,
    backgroundColor: '#FFB81C',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addFirstPlayerButtonText: {
    color: '#000',
    fontWeight: '600',
  },
  playerSection: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomColor: '#333',
    borderBottomWidth: 1,
  },
  playerList: {
    paddingHorizontal: 4,
    gap: 8,
  },
  playerCard: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: '#333',
    minWidth: 100,
    alignItems: 'center',
  },
  playerCardActive: {
    backgroundColor: '#FFB81C',
    borderColor: '#FFB81C',
  },
  playerCardName: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  playerCardPoints: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },
  playerCardActive_points: {
    color: '#000',
  },
  addPlayerCard: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: '#333',
    minWidth: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPlayerCardText: {
    color: '#FFB81C',
    fontWeight: '600',
    fontSize: 12,
    marginTop: 4,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1a1a1a',
    borderBottomColor: '#333',
    borderBottomWidth: 1,
  },
  headerStat: {
    alignItems: 'center',
  },
  headerStatLabel: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
  },
  headerStatValue: {
    color: '#FFB81C',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 4,
  },
  saveButton: {
    backgroundColor: '#FFB81C',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  saveButtonText: {
    color: '#000',
    fontWeight: '600',
    fontSize: 14,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  quickSection: {
    marginBottom: 24,
  },
  quickSectionTitle: {
    color: '#FFB81C',
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 12,
    letterSpacing: 1,
  },
  shotButtonGroup: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  shotButton: {
    flex: 1,
    paddingVertical: 20,
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shotButtonLabel: {
    fontWeight: '700',
    fontSize: 12,
    marginTop: 8,
    letterSpacing: 0.5,
  },
  reboundButtonGroup: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  reboundButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reboundLabel: {
    fontWeight: '700',
    fontSize: 11,
    marginTop: 6,
    letterSpacing: 0.5,
  },
  shotStatsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  shotStat: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  shotStatLabel: {
    color: '#888',
    fontSize: 11,
    fontWeight: '600',
  },
  shotStatValue: {
    color: '#FFB81C',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },
  reboundStatsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  reboundStat: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  reboundStatLabel: {
    color: '#888',
    fontSize: 11,
    fontWeight: '600',
  },
  reboundStatValue: {
    color: '#FFB81C',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },
  detailedStatsSection: {
    marginTop: 8,
  },
  statDisplayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomColor: '#222',
    borderBottomWidth: 1,
  },
  statDisplayLeft: {
    justifyContent: 'center',
  },
  statDisplayLabel: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
  },
  statDisplayValue: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 4,
  },
  statDisplayButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  minusButton: {
    backgroundColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  plusButton: {
    backgroundColor: '#FFB81C',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  resetButton: {
    backgroundColor: '#222',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
    marginBottom: 32,
  },
  resetButtonText: {
    color: '#ff6b6b',
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  modalContent: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomColor: '#333',
    borderBottomWidth: 1,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  modalLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  modalBody: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  modalInput: {
    backgroundColor: '#1a1a1a',
    borderColor: '#333',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 14,
    marginBottom: 12,
  },
  modalAddButton: {
    backgroundColor: '#FFB81C',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  modalAddButtonText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 16,
  },
  modalSaveAllButton: {
    backgroundColor: '#FFB81C',
    paddingVertical: 14,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  modalSaveAllButtonText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 16,
  },
  modalCancelButton: {
    backgroundColor: '#222',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 32,
  },
  modalCancelButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  playerSaveItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    marginBottom: 8,
  },
  playerSaveItemName: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  playerSaveItemStats: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },
  saveSingleButton: {
    padding: 8,
  },
});

export default LiveGameTrackerScreen;
