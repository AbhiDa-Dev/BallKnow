/**
 * Game Editor Screen
 * Form for logging play-by-play stats during live games
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  TextInput,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { saveGame } from '../services/storageService';
import { validateGameStats } from '../utils/analyticsEngine';

const STAT_FIELDS = [
  { key: 'min', label: 'Minutes Played', category: 'basic' },
  { key: 'fgm', label: 'Field Goals Made', category: 'shooting' },
  { key: 'fga', label: 'Field Goals Attempted', category: 'shooting' },
  { key: 'threepm', label: '3PM', category: 'shooting' },
  { key: 'threeepa', label: '3PA', category: 'shooting' },
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
  const [playerName, setPlayerName] = useState('');
  const [location, setLocation] = useState('');
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);

  const updateStat = (key, value) => {
    const numValue = value === '' ? 0 : parseInt(value, 10) || 0;
    setStats({ ...stats, [key]: numValue });
  };

  const calculatePTS = () => {
    const ftm = stats.ftm || 0;
    const fgm = stats.fgm || 0;
    const threepm = stats.threepm || 0;
    return fgm * 2 - threepm + ftm;
  };

  const handleSaveGame = async () => {
    if (!playerName.trim()) {
      Alert.alert('Error', 'Please enter player name');
      return;
    }

    const gameStats = {
      ...stats,
      pts: calculatePTS(),
    };

    const validation = validateGameStats(gameStats);
    if (!validation.valid) {
      Alert.alert('Error', `Missing required stat: ${validation.missing}`);
      return;
    }

    setLoading(true);
    try {
      await saveGame({
        playerName: playerName.trim(),
        location: location.trim() || 'Unknown',
        stats: gameStats,
        teamStats: {
          possessions: 100, // Default possession estimate
        },
      });

      Alert.alert('Success', 'Game logged successfully!', [
        {
          text: 'Log Another',
          onPress: () => {
            setPlayerName('');
            setLocation('');
            setStats({});
          },
        },
        {
          text: 'View Leaderboard',
          onPress: () => navigation.navigate('Leaderboard'),
        },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to save game: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    Alert.alert('Clear Form?', 'This will reset all stats.', [
      {
        text: 'Cancel',
        onPress: () => {},
      },
      {
        text: 'Clear',
        onPress: () => {
          setPlayerName('');
          setLocation('');
          setStats({});
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
        value={String(stats[field.key] || '')}
        onChangeText={(value) => updateStat(field.key, value)}
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
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Player Info Section */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Player Info</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Player Name"
            placeholderTextColor="#666"
            value={playerName}
            onChangeText={setPlayerName}
          />
          <TextInput
            style={styles.textInput}
            placeholder="Location (Gym, Court, etc.)"
            placeholderTextColor="#666"
            value={location}
            onChangeText={setLocation}
          />
        </View>

        {/* Basic Stats */}
        <StatCategory category="basic" label="Basic Stats" />

        {/* Shooting Stats */}
        <StatCategory category="shooting" label="Shooting Stats" />

        {/* Rebounding Stats */}
        <StatCategory category="rebounding" label="Rebounding" />

        {/* Playmaking Stats */}
        <StatCategory category="playmaking" label="Playmaking" />

        {/* Defense Stats */}
        <StatCategory category="defense" label="Defense" />

        {/* Discipline Stats */}
        <StatCategory category="discipline" label="Discipline" />

        {/* Calculated Stats Display */}
        <View style={styles.calculatedStats}>
          <Text style={styles.categoryTitle}>Calculated Stats</Text>
          <View style={styles.statDisplayRow}>
            <Text style={styles.statDisplayLabel}>Points (PTS)</Text>
            <Text style={styles.statDisplayValue}>{calculatePTS()}</Text>
          </View>
          <Text style={styles.calculatedNote}>
            Points calculated from: FGM×2 - 3PM + FTM
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.clearButton]}
            onPress={handleClear}
            disabled={loading}
          >
            <MaterialCommunityIcons name="restart" size={20} color="#ff6b6b" />
            <Text style={styles.clearButtonText}>Clear Form</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.saveButton, loading && styles.buttonDisabled]}
            onPress={handleSaveGame}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#000" size={20} />
            ) : (
              <>
                <MaterialCommunityIcons name="check" size={20} color="#000" />
                <Text style={styles.saveButtonText}>Save Game</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  infoSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  textInput: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#333',
    fontSize: 16,
  },
  categoryContainer: {
    marginBottom: 20,
  },
  categoryTitle: {
    fontSize: 16,
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
    marginBottom: 8,
  },
  statDisplayLabel: {
    color: '#ccc',
    fontSize: 14,
  },
  statDisplayValue: {
    color: '#FFB81C',
    fontSize: 20,
    fontWeight: 'bold',
  },
  calculatedNote: {
    color: '#666',
    fontSize: 12,
    marginTop: 8,
    fontStyle: 'italic',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingVertical: 14,
    gap: 8,
  },
  clearButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#ff6b6b',
  },
  clearButtonText: {
    color: '#ff6b6b',
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#FFB81C',
  },
  saveButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});

export default GameEditorScreen;
