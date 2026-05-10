/**
 * Live Game Tracker Screen
 * Real-time multi-player stat tracking with quick button presses during live games
 */

import React, { useEffect, useState } from 'react';
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
import { clearAllData, saveGame, updateGame } from '../services/storageService';
import { calculateTeamPossessions } from '../utils/analyticsEngine';

const LiveGameTrackerScreen = ({ navigation }) => {
  const [players, setPlayers] = useState([]);
  const [activePlayerId, setActivePlayerId] = useState(null);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [addPlayerModalVisible, setAddPlayerModalVisible] = useState(false);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [location, setLocation] = useState('');
  const [teams, setTeams] = useState([]);
  const [teamModalVisible, setTeamModalVisible] = useState(false);
  const [teamNameInput, setTeamNameInput] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [pendingTeamForNewPlayer, setPendingTeamForNewPlayer] = useState(null);
  const [showPlayersTable, setShowPlayersTable] = useState(false);
  // Always attempt to read bpm debug data; Save modal will display it unconditionally
  let bpmDebug = null;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      bpmDebug = JSON.parse(window.localStorage.getItem('ballknow_bpm_debug') || 'null');
    }
  } catch (e) {
    bpmDebug = null;
  }

  // Default stat structure for a player
  const createEmptyStats = () => ({
    min: 0,      // Minutes Played (per player!)
    fgm: 0,      // Total Field Goals Made (includes threes)
    fga: 0,      // Total Field Goals Attempted (includes threes)
    twopm: 0,    // 2-pointers made (explicit)
    twopa: 0,    // 2-pointers attempted (explicit)
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

  const buildTeamStats = (playersList) => {
    const playersCount = playersList.length || 1;
    let fga = 0;
    let orb = 0;
    let tov = 0;
    let fta = 0;
    let minutesSum = 0;
    let maxMin = 0;

    playersList.forEach((p) => {
      const s = p.stats || {};
      fga += s.fga || 0;
      // Possessions formula uses offensive rebounds only.
      orb += s.orb || 0;
      tov += s.tov || 0;
      fta += s.fta || 0;
      const m = s.min || 0;
      minutesSum += m;
      if (m > maxMin) maxMin = m;
    });

    const teamStats = {
      fga,
      orb,
      tov,
      fta,
      playersCount,
    };

    // If players provided minutes, use average as estimatedMinutes for analytics
    if (minutesSum > 0) {
      teamStats.estimatedMinutes = Math.max(1, Math.round(minutesSum / playersCount));
    }

    // If there is a clear game duration (max minutes), set it
    if (maxMin > 0) {
      teamStats.gameDurationMinutes = maxMin;
    }

    // Derive possessions estimate
    try {
      teamStats.possessions = calculateTeamPossessions(teamStats);
    } catch (e) {
      teamStats.possessions = 100;
    }

    return teamStats;
  };

  const addPlayer = () => {
    if (!newPlayerName.trim()) {
      Alert.alert('Error', 'Please enter player name');
      return;
    }

    const newPlayer = {
      id: Date.now().toString(),
      name: newPlayerName.trim(),
      stats: createEmptyStats(),
      teamId: pendingTeamForNewPlayer || selectedTeamId,
    };

    setPlayers((prev) => [...prev, newPlayer]);
    setActivePlayerId(newPlayer.id);
    setNewPlayerName('');
    setPendingTeamForNewPlayer(null);
    setAddPlayerModalVisible(false);
  };

  const addTeam = () => {
    if (!teamNameInput.trim()) {
      Alert.alert('Error', 'Please enter team name');
      return;
    }
    const newTeam = { id: Date.now().toString(), name: teamNameInput.trim() };
    setTeams((prev) => [...prev, newTeam]);
    setTeamNameInput('');
  };

  const removeTeam = (teamId) => {
    // remove team and clear teamId from players
    setTeams((prev) => prev.filter((t) => t.id !== teamId));
    setPlayers((prev) => prev.map((p) => (p.teamId === teamId ? { ...p, teamId: null } : p)));
  };

  const openAddPlayerForTeam = (teamId) => {
    setPendingTeamForNewPlayer(teamId);
    setNewPlayerName('');
    setAddPlayerModalVisible(true);
  };

  const fillTeamWithFiller = (teamId, count = 5) => {
    const filler = [];
    for (let i = 0; i < count; i++) {
      const min = Math.floor(Math.random() * 25) + 12; // 12-36
      const usageProfile = Math.random(); // lower => role player, higher => primary option

      const twopaBase = usageProfile > 0.7 ? 10 : usageProfile > 0.35 ? 7 : 4;
      const threepaBase = usageProfile > 0.7 ? 6 : usageProfile > 0.35 ? 4 : 2;
      const ftaBase = usageProfile > 0.7 ? 5 : usageProfile > 0.35 ? 3 : 1;

      const twopa = Math.max(0, twopaBase + Math.floor(Math.random() * 5) - 2);
      const threeepa = Math.max(0, threepaBase + Math.floor(Math.random() * 5) - 2);
      const fta = Math.max(0, ftaBase + Math.floor(Math.random() * 5) - 2);

      const twopm = Math.floor(Math.random() * (twopa + 1)); // 0..twopa
      const threepm = Math.floor(Math.random() * (threeepa + 1)); // 0..threeepa
      const ftm = Math.floor(Math.random() * (fta + 1)); // 0..fta

      const fga = twopa + threeepa;
      const fgm = twopm + threepm;

      const id = Date.now().toString() + i;
      filler.push({
        id,
        name: `Filler ${i + 1}`,
        teamId,
        stats: {
          min,
          fgm,
          fga,
          twopm,
          twopa,
          threepm,
          threeepa,
          ftm,
          fta,
          orb: Math.min(5, Math.floor(Math.random() * (Math.max(1, min / 8)))),
          drb: Math.min(10, Math.floor(Math.random() * (Math.max(2, min / 5)))),
          ast: Math.min(10, Math.floor(Math.random() * (Math.max(1, min / 5)))),
          stl: Math.min(4, Math.floor(Math.random() * (Math.max(1, min / 10)))),
          blk: Math.min(4, Math.floor(Math.random() * (Math.max(1, min / 10)))),
          tov: Math.min(7, Math.floor(Math.random() * (Math.max(1, min / 6)))),
          pf: Math.min(6, Math.floor(Math.random() * (Math.max(1, min / 7)))),
        },
      });
    }
    setPlayers((prev) => [...prev, ...filler]);
    setActivePlayerId((prevActiveId) => prevActiveId || filler[0]?.id || null);
  };

  // Edit existing player: rename, assign/unassign, delete
  const [editPlayerModalVisible, setEditPlayerModalVisible] = useState(false);
  const [editPlayerId, setEditPlayerId] = useState(null);
  const [editPlayerNameInput, setEditPlayerNameInput] = useState('');

  const openEditPlayerModal = (player) => {
    setEditPlayerId(player.id);
    setEditPlayerNameInput(player.name || '');
    setEditPlayerModalVisible(true);
  };

  const editPlayerName = (playerId, name) => {
    setPlayers((prev) => prev.map((p) => (p.id === playerId ? { ...p, name: name } : p)));
  };

  const assignPlayerToTeam = (playerId, teamId) => {
    setPlayers((prev) => prev.map((p) => (p.id === playerId ? { ...p, teamId } : p)));
  };

  const unassignPlayer = (playerId) => assignPlayerToTeam(playerId, null);

  const removePlayer = (playerId) => {
    const updatedPlayers = players.filter((p) => p.id !== playerId);
    setPlayers(updatedPlayers);
    if (activePlayerId === playerId) {
      setActivePlayerId(updatedPlayers.length > 0 ? updatedPlayers[0].id : null);
    }
  };

  const getActivePlayer = () => {
    if (players.length === 0) return null;
    return players.find((p) => p.id === activePlayerId) || players[0];
  };

  useEffect(() => {
    if (players.length === 0) {
      if (activePlayerId !== null) setActivePlayerId(null);
      return;
    }
    const hasActive = players.some((p) => p.id === activePlayerId);
    if (!hasActive) {
      setActivePlayerId(players[0].id);
    }
  }, [players, activePlayerId]);

  const updatePlayerStat = (playerId, statKey, value) => {
    setPlayers((prev) =>
      prev.map((p) => {
        if (p.id === playerId) {
          return {
            ...p,
            stats: { ...p.stats, [statKey]: value },
          };
        }
        return p;
      })
    );
  };

  const incrementPlayerStat = (playerId, statKey) => {
    if (!playerId) return;
    setPlayers((prev) =>
      prev.map((p) => {
        if (p.id === playerId) {
          return {
            ...p,
            stats: { ...p.stats, [statKey]: (p.stats[statKey] || 0) + 1 },
          };
        }
        return p;
      })
    );
  };

  const decrementPlayerStat = (playerId, statKey) => {
    if (!playerId) return;
    setPlayers((prev) =>
      prev.map((p) => {
        if (p.id === playerId) {
          const current = p.stats[statKey] || 0;
          return {
            ...p,
            stats: { ...p.stats, [statKey]: current > 0 ? current - 1 : 0 },
          };
        }
        return p;
      })
    );
  };

  const activePlayer = getActivePlayer();

  const calculateTotalPTS = (stats) => {
    // Derive 2P makes from total FGM minus 3PM to ensure PTS updates when FGM changes
    const derivedTwoPM = Math.max(0, (stats.fgm || 0) - (stats.threepm || 0));
    const threePM = stats.threepm || 0;
    const ftm = stats.ftm || 0;
    return derivedTwoPM * 2 + threePM * 3 + ftm;
  };

  // Centralized atomic shot handler to avoid race conditions
  const handleShot = ({ playerId, shotType, made }) => {
    if (!playerId) {
      Alert.alert('Select Player', 'Please select a player first');
      return;
    }

    setPlayers((prev) => {
      return prev.map((p) => {
        if (p.id !== playerId) return p;

        const s = { ...p.stats };

        if (shotType === 'two') {
          // 2-pt
          s.twopa = (s.twopa || 0) + 1;
          s.fga = (s.fga || 0) + 1;
          if (made) {
            s.twopm = (s.twopm || 0) + 1;
            s.fgm = (s.fgm || 0) + 1;
          }
        } else if (shotType === 'three') {
          // 3-pt
          s.threeepa = (s.threeepa || 0) + 1;
          s.fga = (s.fga || 0) + 1;
          if (made) {
            s.threepm = (s.threepm || 0) + 1;
            s.fgm = (s.fgm || 0) + 1;
          }
        } else if (shotType === 'ft') {
          // free throw
          s.fta = (s.fta || 0) + 1;
          if (made) {
            s.ftm = (s.ftm || 0) + 1;
          }
        }

        return { ...p, stats: s };
      });
    });
  };

  const clearCurrentGameState = () => {
    setPlayers([]);
    setTeams([]);
    setActivePlayerId(null);
    setSelectedTeamId(null);
    setPendingTeamForNewPlayer(null);
    setNewPlayerName('');
    setTeamNameInput('');
    setLocation('');
    setAddPlayerModalVisible(false);
    setEditPlayerModalVisible(false);
    setTeamModalVisible(false);
    setSaveModalVisible(false);
    setShowPlayersTable(false);
  };

  const clearCurrentGameAndLeaderboard = async () => {
    try {
      await clearAllData();
    } catch (error) {
      console.warn('Failed to clear persisted data:', error?.message || error);
    } finally {
      clearCurrentGameState();
    }
  };

  const resetGame = () => {

    // React Native Alert can be inconsistent on web; provide a fallback.
    if (typeof window !== 'undefined' && typeof window.confirm === 'function') {
      const confirmed = window.confirm('Reset game? This will clear live tracker state and leaderboard data.');
      if (confirmed) {
        clearCurrentGameAndLeaderboard();
      }
      return;
    }

    Alert.alert('Reset Game?', 'This will clear live tracker state and leaderboard data.', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Reset',
        onPress: () => {
          clearCurrentGameAndLeaderboard();
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

    if (saving) return; // prevent duplicate clicks
    setSaving(true);
    try {
      const gameStats = {
        ...playerToSave.stats,
        pts: calculateTotalPTS(playerToSave.stats),
      };

      let result;
      // Build teamStats from current players for better BPM/VORP accuracy
      const teamStats = buildTeamStats(players);

      // If this player has a savedGameId, update instead of creating a duplicate
      if (playerToSave.savedGameId) {
        result = await updateGame(playerToSave.savedGameId, {
          stats: gameStats,
          teamStats,
        });
        console.log('LiveTracker updated game:', result.id, result);
      } else {
        result = await saveGame({
          playerName: playerToSave.name,
          location: location.trim(),
          stats: gameStats,
          teamStats,
        });
        console.log('LiveTracker saved new game:', result.id, result);
        // store saved id to avoid future duplicates
        setPlayers((prev) => prev.map((p) => (p.id === playerId ? { ...p, savedGameId: result.id } : p)));
      }

      // Close the Save modal so user sees immediate feedback
      setSaveModalVisible(false);
      Alert.alert('Success', `${playerToSave.name}'s game saved!`);
    } catch (error) {
      Alert.alert('Error', 'Failed to save game: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAll = async () => {
    if (!location.trim()) {
      Alert.alert('Error', 'Please enter game location');
      return;
    }

    if (saving) return;
    setSaving(true);

    let saved = 0;
    let failed = 0;

    for (const player of players) {
      try {
        const gameStats = {
          ...player.stats,
          pts: calculateTotalPTS(player.stats),
        };

        const teamStats = buildTeamStats(players);
        if (player.savedGameId) {
          // update existing saved game in-session
          await updateGame(player.savedGameId, {
            stats: gameStats,
            teamStats,
          });
        } else {
          const result = await saveGame({
            playerName: player.name,
            location: location.trim(),
            stats: gameStats,
            teamStats,
          });
          // remember saved id for this session to prevent duplicates
          setPlayers((prev) => prev.map((p) => (p.id === player.id ? { ...p, savedGameId: result.id } : p)));
        }

        saved++;
      } catch (error) {
        failed++;
        console.error(`Failed to save ${player.name}:`, error);
      }
    }

    setSaving(false);
    setSaveModalVisible(false);

    Alert.alert(
      'Game Saved',
      `${saved} player(s) saved${failed > 0 ? `, ${failed} failed` : ''}. Live tracker state was kept.`
    );
  };

  // Flexible shot button that can track different stat keys
  const ShotButton = ({ type }) => {
    // type: 'two' | 'three' | 'ft'
    const made = () => handleShot({ playerId: activePlayerId, shotType: type, made: true });
    const missed = () => handleShot({ playerId: activePlayerId, shotType: type, made: false });

    const colors = {
      two: { made: '#51cf66', miss: '#ff6b6b' },
      three: { made: '#4c6ef5', miss: '#ff6b6b' },
      ft: { made: '#51cf66', miss: '#ff6b6b' },
    };

    const madeColor = colors[type].made;
    const missedColor = colors[type].miss;

    return (
      <View style={styles.shotButtonGroup}>
        <TouchableOpacity
          style={[styles.shotButton, { borderColor: madeColor }]}
          onPress={made}
        >
          <MaterialCommunityIcons name="check-circle" size={24} color={madeColor} />
          <Text style={[styles.shotButtonLabel, { color: madeColor }]}>MAKE</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.shotButton, { borderColor: missedColor }]}
          onPress={missed}
        >
          <MaterialCommunityIcons name="close-circle" size={24} color={missedColor} />
          <Text style={[styles.shotButtonLabel, { color: missedColor }]}>MISS</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const ReboundButton = ({ offColor, defColor }) => (
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
            style={[styles.addFirstPlayerButton, { backgroundColor: '#222' }]}
            onPress={() => setTeamModalVisible(true)}
          >
            <MaterialCommunityIcons name="account-group" size={20} color="#FFB81C" />
            <Text style={[styles.addFirstPlayerButtonText, { color: '#fff' }]}>Create Team First</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addFirstPlayerButton}
            onPress={() => setAddPlayerModalVisible(true)}
          >
            <MaterialCommunityIcons name="plus" size={20} color="#000" />
            <Text style={styles.addFirstPlayerButtonText}>Add Player</Text>
          </TouchableOpacity>
        </View>

        <Modal visible={teamModalVisible} transparent animationType="slide">
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Teams</Text>
                <TouchableOpacity onPress={() => setTeamModalVisible(false)}>
                  <MaterialCommunityIcons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
              <ScrollView contentContainerStyle={styles.modalBody}>
                <Text style={styles.modalLabel}>Create Team</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Team name"
                  placeholderTextColor="#666"
                  value={teamNameInput}
                  onChangeText={setTeamNameInput}
                />
                <TouchableOpacity style={styles.modalAddButton} onPress={addTeam}>
                  <Text style={styles.modalAddButtonText}>Add Team</Text>
                </TouchableOpacity>

                <Text style={[styles.modalLabel, { marginTop: 20 }]}>Existing Teams</Text>
                {teams.map((t) => (
                  <View key={t.id} style={styles.playerSaveItem}>
                    <View>
                      <Text style={styles.playerSaveItemName}>{t.name}</Text>
                      <Text style={styles.playerSaveItemStats}>{players.filter(p => p.teamId === t.id).length} players</Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                      <TouchableOpacity
                        style={styles.saveSingleButton}
                        onPress={() => openAddPlayerForTeam(t.id)}
                      >
                        <MaterialCommunityIcons name="plus" size={18} color="#FFB81C" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.saveSingleButton}
                        onPress={() => fillTeamWithFiller(t.id, 5)}
                      >
                        <MaterialCommunityIcons name="dice-multiple" size={18} color="#FFB81C" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.saveSingleButton}
                        onPress={() => removeTeam(t.id)}
                      >
                        <MaterialCommunityIcons name="trash-can" size={18} color="#ff6b6b" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}

                <TouchableOpacity
                  style={[styles.modalCancelButton, { marginTop: 12 }]}
                  onPress={() => setTeamModalVisible(false)}
                >
                  <Text style={styles.modalCancelButtonText}>Done</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </SafeAreaView>
        </Modal>

        <Modal visible={addPlayerModalVisible} transparent animationType="slide">
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Register Player</Text>
                <TouchableOpacity onPress={() => { setPendingTeamForNewPlayer(null); setAddPlayerModalVisible(false); }}>
                  <MaterialCommunityIcons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
              <View style={styles.modalBody}>
                <Text style={styles.modalLabel}>Player Name</Text>
                {pendingTeamForNewPlayer && (
                  <Text style={styles.playerSaveItemStats}>
                    Adding to: {teams.find((team) => team.id === pendingTeamForNewPlayer)?.name || 'Selected Team'}
                  </Text>
                )}
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

        <Modal visible={editPlayerModalVisible} transparent animationType="slide">
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit Player</Text>
                <TouchableOpacity onPress={() => setEditPlayerModalVisible(false)}>
                  <MaterialCommunityIcons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
              <View style={styles.modalBody}>
                <Text style={styles.modalLabel}>Name</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editPlayerNameInput}
                  onChangeText={setEditPlayerNameInput}
                />

                <Text style={styles.modalLabel}>Assign to Team</Text>
                {teams.length === 0 && <Text style={{ color: '#888' }}>No teams created</Text>}
                {teams.map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    style={[styles.saveSingleButton, { flexDirection: 'row', alignItems: 'center', gap: 8 }]}
                    onPress={() => assignPlayerToTeam(editPlayerId, t.id)}
                  >
                    <MaterialCommunityIcons name="account" size={16} color="#FFB81C" />
                    <Text style={{ color: '#fff' }}>{t.name}</Text>
                  </TouchableOpacity>
                ))}

                <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
                  <TouchableOpacity
                    style={[styles.modalAddButton, { flex: 1, backgroundColor: '#ff6b6b' }]}
                    onPress={() => {
                      removePlayer(editPlayerId);
                      setEditPlayerModalVisible(false);
                    }}
                  >
                    <Text style={styles.modalAddButtonText}>Delete Player</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalCancelButton, { flex: 1 }]}
                    onPress={() => {
                      if (editPlayerId) {
                        editPlayerName(editPlayerId, editPlayerNameInput.trim() || 'Unnamed');
                      }
                      setEditPlayerModalVisible(false);
                    }}
                  >
                    <Text style={styles.modalCancelButtonText}>Save</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={[styles.modalCancelButton, { marginTop: 12 }]}
                  onPress={() => {
                    if (editPlayerId) unassignPlayer(editPlayerId);
                  }}
                >
                  <Text style={styles.modalCancelButtonText}>Unassign from Team</Text>
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
          <TouchableOpacity
            style={styles.teamButton}
            onPress={() => setTeamModalVisible(true)}
          >
            <MaterialCommunityIcons name="account-group" size={20} color="#FFB81C" />
            <Text style={styles.teamButtonText}>Teams</Text>
          </TouchableOpacity>

          {players.map((player) => (
            <TouchableOpacity
              key={player.id}
              style={[
                styles.playerCard,
                activePlayerId === player.id && styles.playerCardActive,
              ]}
              onPress={() => setActivePlayerId(player.id)}
              onLongPress={() => openEditPlayerModal(player)}
            >
              <Text style={styles.playerCardName}>{player.name}</Text>
              <Text style={styles.playerCardPoints}>
                {calculateTotalPTS(player.stats)} pts
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

        {/* Teams Modal */}
        <Modal visible={teamModalVisible} transparent animationType="slide">
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Teams</Text>
                <TouchableOpacity onPress={() => setTeamModalVisible(false)}>
                  <MaterialCommunityIcons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
              <ScrollView contentContainerStyle={styles.modalBody}>
                <Text style={styles.modalLabel}>Create Team</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Team name"
                  placeholderTextColor="#666"
                  value={teamNameInput}
                  onChangeText={setTeamNameInput}
                />
                <TouchableOpacity style={styles.modalAddButton} onPress={addTeam}>
                  <Text style={styles.modalAddButtonText}>Add Team</Text>
                </TouchableOpacity>

                <Text style={[styles.modalLabel, { marginTop: 20 }]}>Existing Teams</Text>
                {teams.map((t) => (
                  <View key={t.id} style={styles.playerSaveItem}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.playerSaveItemName}>{t.name}</Text>
                      <Text style={styles.playerSaveItemStats}>{players.filter(p => p.teamId === t.id).length} players</Text>
                      {players
                        .filter((p) => p.teamId === t.id)
                        .map((p) => (
                          <View
                            key={p.id}
                            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}
                          >
                            <TouchableOpacity onPress={() => openEditPlayerModal(p)}>
                              <Text style={{ color: '#ddd' }}>{p.name}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => removePlayer(p.id)}>
                              <MaterialCommunityIcons name="close-circle" size={18} color="#ff6b6b" />
                            </TouchableOpacity>
                          </View>
                        ))}
                    </View>
                    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                      <TouchableOpacity
                        style={styles.saveSingleButton}
                        onPress={() => openAddPlayerForTeam(t.id)}
                      >
                        <MaterialCommunityIcons name="plus" size={18} color="#FFB81C" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.saveSingleButton}
                        onPress={() => fillTeamWithFiller(t.id, 5)}
                      >
                        <MaterialCommunityIcons name="dice-multiple" size={18} color="#FFB81C" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.saveSingleButton}
                        onPress={() => removeTeam(t.id)}
                      >
                        <MaterialCommunityIcons name="trash-can" size={18} color="#ff6b6b" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}

                <TouchableOpacity
                  style={[styles.modalCancelButton, { marginTop: 12 }]}
                  onPress={() => setTeamModalVisible(false)}
                >
                  <Text style={styles.modalCancelButtonText}>Done</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </SafeAreaView>
        </Modal>

      {/* Stats Header */}
      <View style={styles.statsHeader}>
        <View style={styles.headerStat}>
          <Text style={styles.headerStatLabel}>MIN</Text>
          <TextInput
            style={styles.headerStatInput}
            keyboardType="numeric"
            value={(activePlayer.stats.min || 0).toString()}
            onChangeText={(text) => {
              const parsed = parseInt(text.replace(/[^0-9]/g, ''), 10);
              updatePlayerStat(activePlayerId, 'min', Number.isNaN(parsed) ? 0 : parsed);
            }}
          />
          <View style={styles.headerStatButtons}>
            <TouchableOpacity
              onPress={() => decrementPlayerStat(activePlayerId, 'min')}
              style={styles.smallButton}
            >
              <MaterialCommunityIcons name="minus" size={14} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => incrementPlayerStat(activePlayerId, 'min')}
              style={styles.smallButton}
            >
              <MaterialCommunityIcons name="plus" size={14} color="#000" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.headerStat}>
          <Text style={styles.headerStatLabel}>PTS</Text>
          <Text style={styles.headerStatValue}>{calculateTotalPTS(activePlayer.stats)}</Text>
        </View>
        <View style={styles.headerStat}>
          <Text style={styles.headerStatLabel}>FGM/FGA</Text>
          <Text style={styles.headerStatValue}>{(activePlayer.stats.fgm||0)}/{(activePlayer.stats.fga||0)}</Text>
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
        <TouchableOpacity
          style={[styles.saveButton, { marginLeft: 8, backgroundColor: '#444' }]}
          onPress={() => console.log('PLAYERS', players)}
        >
          <MaterialCommunityIcons name="information" size={18} color="#fff" />
          <Text style={[styles.saveButtonText, { color: '#fff' }]}>Log</Text>
        </TouchableOpacity>
      </View>

      <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
        <TouchableOpacity
          style={styles.tableToggleButton}
          onPress={() => setShowPlayersTable((prev) => !prev)}
        >
          <MaterialCommunityIcons
            name={showPlayersTable ? 'chevron-up' : 'chevron-down'}
            size={18}
            color="#FFB81C"
          />
          <Text style={styles.tableToggleText}>
            {showPlayersTable ? 'Hide Team Players' : 'Show Team Players'}
          </Text>
        </TouchableOpacity>
        {showPlayersTable && (
          <View style={styles.tableContainer} testID="players-table" data-testid="players-table" accessibilityLabel="players-table">
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={styles.tableHeaderText}>Player</Text>
              <Text style={styles.tableHeaderText}>FGM</Text>
              <Text style={styles.tableHeaderText}>FGA</Text>
              <Text style={styles.tableHeaderText}>PTS</Text>
            </View>
            {players.map((p) => (
              <View
                key={p.id}
                style={[styles.tableRow, activePlayerId === p.id && styles.tableRowActive]}
              >
                <Text style={styles.tableCellText}>{p.name}</Text>
                <Text style={styles.tableCellText}>{p.stats.fgm || 0}</Text>
                <Text style={styles.tableCellText}>{p.stats.fga || 0}</Text>
                <Text style={styles.tableCellText}>{calculateTotalPTS(p.stats)}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 2-Point Shots Section */}
        <View style={styles.quickSection}>
          <Text style={styles.quickSectionTitle}>2-POINT SHOTS</Text>
          <ShotButton type="two" />
          <View style={styles.shotStatsRow}>
            <View style={styles.shotStat}>
              <Text style={styles.shotStatLabel}>2PA</Text>
                <Text style={styles.shotStatValue}>{
                    (activePlayer.stats.twopa != null ? activePlayer.stats.twopa : ((activePlayer.stats.fga || 0) - (activePlayer.stats.threeepa || 0)))
                  }</Text>
            </View>
            <View style={styles.shotStat}>
              <Text style={styles.shotStatLabel}>2PM</Text>
                <Text style={styles.shotStatValue}>{
                    (activePlayer.stats.twopm != null ? activePlayer.stats.twopm : ((activePlayer.stats.fgm || 0) - (activePlayer.stats.threepm || 0)))
                  }</Text>
            </View>
            <View style={styles.shotStat}>
              <Text style={styles.shotStatLabel}>2P%</Text>
              <Text style={styles.shotStatValue}>
                  {((activePlayer.stats.fga || 0) - (activePlayer.stats.threeepa || 0)) > 0
                    ? (((activePlayer.stats.fgm || 0) - (activePlayer.stats.threepm || 0)) /
                        ((activePlayer.stats.fga || 0) - (activePlayer.stats.threeepa || 0)) *
                        100
                      ).toFixed(1)
                    : 0}
                  %
              </Text>
            </View>
          </View>
        </View>

        {/* 3-Point Shots Section */}
        <View style={styles.quickSection}>
          <Text style={styles.quickSectionTitle}>3-POINT SHOTS</Text>
          <ShotButton type="three" />
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
          <ReboundButton offColor="#ffa500" defColor="#4c6ef5" />
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
          <ShotButton type="ft" />
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

        <View style={{ paddingHorizontal: 16, paddingBottom: 24 }}>
          <Text style={{ color: '#666', fontSize: 10 }}>PLAYERS JSON: {JSON.stringify(players)}</Text>
        </View>
      </ScrollView>

      {/* Add Player Modal */}
      <Modal visible={addPlayerModalVisible} transparent animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Register Player</Text>
              <TouchableOpacity onPress={() => { setPendingTeamForNewPlayer(null); setAddPlayerModalVisible(false); }}>
                <MaterialCommunityIcons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.modalLabel}>Player Name</Text>
              {pendingTeamForNewPlayer && (
                <Text style={styles.playerSaveItemStats}>
                  Adding to: {teams.find((team) => team.id === pendingTeamForNewPlayer)?.name || 'Selected Team'}
                </Text>
              )}
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
              {pendingTeamForNewPlayer && (
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => {
                    setPendingTeamForNewPlayer(null);
                    setAddPlayerModalVisible(false);
                  }}
                >
                  <Text style={styles.modalCancelButtonText}>Cancel Team Add</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Edit Player Modal */}
      <Modal visible={editPlayerModalVisible} transparent animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Player</Text>
              <TouchableOpacity onPress={() => setEditPlayerModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.modalLabel}>Name</Text>
              <TextInput
                style={styles.modalInput}
                value={editPlayerNameInput}
                onChangeText={setEditPlayerNameInput}
              />

              <Text style={styles.modalLabel}>Assign to Team</Text>
              {teams.length === 0 && <Text style={{ color: '#888' }}>No teams created</Text>}
              {teams.map((t) => (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.saveSingleButton, { flexDirection: 'row', alignItems: 'center', gap: 8 }]}
                  onPress={() => assignPlayerToTeam(editPlayerId, t.id)}
                >
                  <MaterialCommunityIcons name="account" size={16} color="#FFB81C" />
                  <Text style={{ color: '#fff' }}>{t.name}</Text>
                </TouchableOpacity>
              ))}

              <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
                <TouchableOpacity
                  style={[styles.modalAddButton, { flex: 1, backgroundColor: '#ff6b6b' }]}
                  onPress={() => {
                    removePlayer(editPlayerId);
                    setEditPlayerModalVisible(false);
                  }}
                >
                  <Text style={styles.modalAddButtonText}>Delete Player</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalCancelButton, { flex: 1 }]}
                  onPress={() => {
                    // Save edits
                    if (editPlayerId) {
                      editPlayerName(editPlayerId, editPlayerNameInput.trim() || 'Unnamed');
                    }
                    setEditPlayerModalVisible(false);
                  }}
                >
                  <Text style={styles.modalCancelButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={[styles.modalCancelButton, { marginTop: 12 }]}
                onPress={() => {
                  if (editPlayerId) unassignPlayer(editPlayerId);
                }}
              >
                <Text style={styles.modalCancelButtonText}>Unassign from Team</Text>
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
                        {calculateTotalPTS(item.stats)} pts | {item.stats.orb + item.stats.drb}{' '}
                        reb | {item.stats.ast} ast | {item.stats.min} min
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

              <>
                <Text style={styles.modalLabel}>Debug: Team Stats (computed)</Text>
                <Text style={styles.debugBox}>{JSON.stringify(buildTeamStats(players), null, 2)}</Text>

                <Text style={styles.modalLabel}>Debug: BPM Raw</Text>
                <Text style={styles.debugBox}>{bpmDebug ? JSON.stringify(bpmDebug, null, 2) : 'No bpm debug available'}</Text>
              </>

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
    alignItems: 'center',
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
  headerStatInput: {
    color: '#FFB81C',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 4,
    padding: 0,
    textAlign: 'center',
    minWidth: 44,
  },
  headerStatButtons: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
  },
  smallButton: {
    backgroundColor: '#333',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 4,
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
  tableContainer: {
    backgroundColor: '#111',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#222',
  },
  tableToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#333',
  },
  tableToggleText: {
    color: '#FFB81C',
    fontWeight: '600',
    fontSize: 12,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  tableHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    marginBottom: 6,
  },
  tableHeaderText: {
    color: '#aaa',
    flex: 1,
    textAlign: 'left',
    fontSize: 12,
    fontWeight: '700',
  },
  tableCellText: {
    color: '#fff',
    flex: 1,
    textAlign: 'left',
    fontSize: 13,
  },
  tableRowActive: {
    backgroundColor: '#0f0f0f',
    borderRadius: 6,
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
  debugBox: {
    backgroundColor: '#0f0f0f',
    borderColor: '#222',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 12,
    maxHeight: 160,
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
  teamButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    marginRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#111',
  },
  teamButtonText: {
    color: '#FFB81C',
    fontWeight: '600',
    marginLeft: 6,
  },
});

export default LiveGameTrackerScreen;
