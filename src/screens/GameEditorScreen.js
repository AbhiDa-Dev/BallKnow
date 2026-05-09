/**
 * Game Editor Screen (Post-Game Stats)
 * Simple interface to log completed games - select players and add stats
 */

import React, { useState, useFocusEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  TextInput,
  SafeAreaView,
  Alert,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { saveGame, getAllGames } from '../services/storageService';

const STAT_FIELDS = [
  { key: 'min', label: 'Minutes Played', category: 'basic' },
  { key: 'fgm', label: 'Field Goals Made', category: 'shooting' },
  { key: 'fga', label: 'Field Goals Attempted', category: 'shooting' },
  { key: 'threepm', label: '3-Pointers Made', category: 'shooting' },
  { key: 'threeepa', label: '3-Pointers Attempted', category: 'shooting' },
  { key: 'ftm', label: 'Free Throws Made', category: 'shooting' },
  { key: 'fta', label: 'Free Throws Attempted', category: 'shooting' },
  { key: 'orb', label: 'Offensive Rebounds', category: 'rebounding' },
  { key: 'drb', label: 'Defensive Rebounds', category: 'rebounding' },
  { key: 'ast', label: 'Assists', category: 'playmaking' },
  { key: 'stl', label: 'Steals', category: 'defense' },
  { key: 'blk', label: 'Blocks', category: 'defense' },
  { key: 'tov', label: 'Turnovers', category: 'playmaking' },
  { key: 'pf', label: 'Personal Fouls', category: 'discipline' },
];

const GameEditorScreen = ({ navigation }) => {
  const [location, setLocation] = useState('');
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [allPlayers, setAllPlayers] = useState([]);
  const [selectedPlayerForEdit, setSelectedPlayerForEdit] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [playerStats, setPlayerStats] = useState({});
  const [loading, setLoading] = useState(false);

  // Load unique player names from existing games
  useFocusEffect(
    React.useCallback(() => {
      loadPlayerNames();
    }, [])
  );

  const loadPlayerNames = async () => {
    try {
      const games = await getAllGames();
      const uniquePlayers = [...new Set(games.map((g) => g.playerName))];
      setAllPlayers(uniquePlayers.sort());
    } catch (error) {
      console.error('Error loading players:', error);
    }
  };

  const togglePlayerSelection = (playerName) => {
    if (selectedPlayers.includes(playerName)) {
      setSelectedPlayers(selectedPlayers.filter((p) => p !== playerName));
      const newStats = { ...playerStats };
      delete newStats[playerName];
      setPlayerStats(newStats);
    } else {
      setSelectedPlayers([...selectedPlayers, playerName]);
      setPlayerStats({
        ...playerStats,
        [playerName]: {
          min: 0,
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
        },
      });
    }
  };

  const openEditModal = (playerName) => {
    setSelectedPlayerForEdit(playerName);
    setEditModalVisible(true);
  };

  const updatePlayerStat = (playerName, key, value) => {
    const numValue = value === '' ? 0 : parseInt(value, 10) || 0;
    setPlayerStats({
      ...playerStats,
      [playerName]: {
        ...playerStats[playerName],
        [key]: numValue,
      },
    });
  };

  const calculatePTS = (stats) => {
    const ftm = stats.ftm || 0;
    const fgm = stats.fgm || 0;
    const threepm = stats.threepm || 0;
    const derivedTwoPM = Math.max(0, fgm - threepm);
    return derivedTwoPM * 2 + threepm * 3 + ftm;
  };

  const getStatSummary = (playerName) => {
    const stats = playerStats[playerName];
    if (!stats) return '';
    const pts = calculatePTS(stats);
    const reb = (stats.orb || 0) + (stats.drb || 0);
    return `${pts} pts | ${reb} reb | ${stats.ast || 0} ast`;
  };

  const handleSaveAllGames = async () => {
    if (!location.trim()) {
      Alert.alert('Error', 'Please enter game location');
      return;
    }

    if (selectedPlayers.length === 0) {
      Alert.alert('Error', 'Please select at least one player');
      return;
    }

    setLoading(true);
    let saved = 0;
    let failed = 0;

    try {
      for (const playerName of selectedPlayers) {
        const stats = playerStats[playerName];
        const gameStats = {
          ...stats,
          pts: calculatePTS(stats),
        };

        try {
          const savedGame = await saveGame({
            playerName,
            location: location.trim(),
            stats: gameStats,
            teamStats: { possessions: 100 },
          });
          console.log('GameEditor saved game:', savedGame.id, savedGame);
          saved++;
        } catch (error) {
          failed++;
          console.error(`Failed to save ${playerName}:`, error);
        }
      }

      Alert.alert(
        'Games Saved',
        `${saved} game(s) saved${failed > 0 ? `, ${failed} failed` : ''}`,
        [
          {
            text: 'OK',
            onPress: () => {
              setLocation('');
              setSelectedPlayers([]);
              setPlayerStats({});
              navigation.navigate('Leaderboard');
            },
          },
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    Alert.alert('Reset Form?', 'This will clear all selections and stats.', [
      { text: 'Cancel' },
      {
        text: 'Reset',
        onPress: () => {
          setLocation('');
          setSelectedPlayers([]);
          setPlayerStats({});
        },
        style: 'destructive',
      },
    ]);
  };

  const StatInput = ({ field }) => (
    <View key={field.key} style={styles.statInputRow}>
      <Text style={styles.statLabel}>{field.label}</Text>
      <TextInput
        style={styles.statInput}
        keyboardType="number-pad"
        maxLength={3}
        placeholder="0"
        placeholderTextColor="#666"
        value={String(playerStats[selectedPlayerForEdit]?.[field.key] || '')}
        onChangeText={(value) =>
          updatePlayerStat(selectedPlayerForEdit, field.key, value)
        }
      />
    </View>
  );

  const StatCategory = ({ category, label }) => {
    const categoryFields = STAT_FIELDS.filter((f) => f.category === category);
    return (
      <View key={category} style={styles.categoryContainer}>
        <Text style={styles.categoryTitle}>{label}</Text>
        {categoryFields.map((field) => (
          <StatInput key={field.key} field={field} />
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Location Section */}
        <View style={styles.locationSection}>
          <Text style={styles.sectionTitle}>Game Location</Text>
          <TextInput
            style={styles.locationInput}
            placeholder="Gym, Court, etc."
            placeholderTextColor="#666"
            value={location}
            onChangeText={setLocation}
          />
        </View>

        {/* Players Section */}
        <View style={styles.playersSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Select Players</Text>
            <Text style={styles.selectedCount}>
              {selectedPlayers.length} selected
            </Text>
          </View>

          {allPlayers.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="account-multiple" size={32} color="#666" />
              <Text style={styles.emptyStateText}>
                No players yet. Use Live Tracker to record your first game.
              </Text>
            </View>
          ) : (
            <FlatList
              data={allPlayers}
              keyExtractor={(item) => item}
              scrollEnabled={false}
              renderItem={({ item: playerName }) => {
                const isSelected = selectedPlayers.includes(playerName);
                return (
                  <View key={playerName} style={styles.playerRow}>
                    <TouchableOpacity
                      style={[
                        styles.playerButton,
                        isSelected && styles.playerButtonSelected,
                      ]}
                      onPress={() => togglePlayerSelection(playerName)}
                    >
                      <MaterialCommunityIcons
                        name={isSelected ? 'checkbox-marked' : 'checkbox-blank-outline'}
                        size={24}
                        color={isSelected ? '#FFB81C' : '#666'}
                      />
                      <View style={styles.playerInfo}>
                        <Text style={styles.playerName}>{playerName}</Text>
                        {isSelected && (
                          <Text style={styles.playerStats}>
                            {getStatSummary(playerName)}
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>

                    {isSelected && (
                      <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => openEditModal(playerName)}
                      >
                        <MaterialCommunityIcons
                          name="pencil"
                          size={20}
                          color="#FFB81C"
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                );
              }}
            />
          )}
        </View>

        {selectedPlayers.length > 0 && (
          <>
            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.resetButton]}
                onPress={resetForm}
              >
                <MaterialCommunityIcons name="restart" size={20} color="#ff6b6b" />
                <Text style={styles.resetButtonText}>Clear</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.button,
                  styles.saveButton,
                  loading && styles.buttonDisabled,
                ]}
                onPress={handleSaveAllGames}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#000" size={20} />
                ) : (
                  <>
                    <MaterialCommunityIcons name="check" size={20} color="#000" />
                    <Text style={styles.saveButtonText}>Save Games</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>

      {/* Edit Stats Modal */}
      <Modal visible={editModalVisible} transparent animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit {selectedPlayerForEdit}</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalBody}>
              <StatCategory category="basic" label="Basic Stats" />
              <StatCategory category="shooting" label="Shooting Stats" />
              <StatCategory category="rebounding" label="Rebounding" />
              <StatCategory category="playmaking" label="Playmaking" />
              <StatCategory category="defense" label="Defense" />
              <StatCategory category="discipline" label="Discipline" />

              {/* Calculated Stats Display */}
              <View style={styles.calculatedStats}>
                <Text style={styles.categoryTitle}>Calculated Stats</Text>
                <View style={styles.statDisplayRow}>
                  <Text style={styles.statDisplayLabel}>Points (PTS)</Text>
                  <Text style={styles.statDisplayValue}>
                    {calculatePTS(playerStats[selectedPlayerForEdit] || {})}
                  </Text>
                </View>
                <Text style={styles.calculatedNote}>
                  Points = (FGM - 3PM)×2 + 3PM×3 + FTM
                </Text>
              </View>

              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.modalCloseButtonText}>Done</Text>
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
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  locationSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  locationInput: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 14,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#333',
    fontSize: 16,
  },
  playersSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  selectedCount: {
    color: '#FFB81C',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyState: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#666',
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  playerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#333',
    gap: 12,
  },
  playerButtonSelected: {
    borderColor: '#FFB81C',
    backgroundColor: '#1f1f1f',
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  playerStats: {
    color: '#FFB81C',
    fontSize: 12,
    marginTop: 4,
  },
  editButton: {
    padding: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  resetButton: {
    backgroundColor: '#222',
  },
  resetButtonText: {
    color: '#ff6b6b',
    fontWeight: '700',
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: '#FFB81C',
  },
  saveButtonText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 14,
  },
  buttonDisabled: {
    opacity: 0.6,
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
  modalBody: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  categoryContainer: {
    marginBottom: 20,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFB81C',
    marginBottom: 12,
  },
  statInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  statLabel: {
    flex: 1,
    color: '#ccc',
    fontSize: 14,
  },
  statInput: {
    width: 80,
    backgroundColor: '#1a1a1a',
    borderRadius: 6,
    padding: 10,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#333',
    textAlign: 'center',
    fontSize: 14,
  },
  calculatedStats: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    borderLeftColor: '#FFB81C',
    borderLeftWidth: 3,
  },
  statDisplayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statDisplayLabel: {
    color: '#888',
    fontSize: 12,
  },
  statDisplayValue: {
    color: '#FFB81C',
    fontSize: 18,
    fontWeight: '700',
  },
  calculatedNote: {
    color: '#666',
    fontSize: 11,
    marginTop: 8,
    fontStyle: 'italic',
  },
  modalCloseButton: {
    backgroundColor: '#FFB81C',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 32,
  },
  modalCloseButtonText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 16,
  },
});

export default GameEditorScreen;
