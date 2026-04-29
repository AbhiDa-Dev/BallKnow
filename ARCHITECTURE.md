# BallKnow Architecture & Technical Documentation

## System Overview

BallKnow is a **completely local, frontend-only** React Native application. There is no backend server, no API calls, and no internet dependency.

```
┌─────────────────────────────────────────┐
│         User Interface Layer             │
│  (React Native Components & Navigation)  │
├─────────────────────────────────────────┤
│         State Management Layer           │
│    (React Hooks + Local State)           │
├─────────────────────────────────────────┤
│     Analytics & Business Logic Layer     │
│  (VORP, BPM, TS% Calculations)           │
├─────────────────────────────────────────┤
│      Data Persistence Layer              │
│      (AsyncStorage / Device)             │
└─────────────────────────────────────────┘
```

## Data Flow

### Game Logging Flow

```
User Input Form
    ↓
Form Validation
    ↓
Stat Object Created
    ↓
Analytics Engine Processing
    ├─ TS% Calculation
    ├─ BPM Calculation
    ├─ VORP Calculation
    └─ PER Calculation
    ↓
Game Object + Metrics
    ↓
AsyncStorage Persistence
    ↓
Leaderboard Updated
```

### Leaderboard Display Flow

```
Screen Focus (useFocusEffect)
    ↓
Fetch All Games (AsyncStorage)
    ↓
Sort by Selected Metric
    ↓
Render FlatList
    ↓
User Can Delete/Sort/Refresh
```

## Component Breakdown

### LeaderboardScreen.js

**Purpose**: Display all logged games with advanced filtering and sorting.

**Key Features**:
- Four sort modes: VORP, BPM, TS%, Points
- Swipe-to-delete with visual feedback
- Pull-to-refresh
- Empty state handling
- Performance optimization with FlatList

**State Management**:
```javascript
const [games, setGames] = useState([]);        // All games
const [sortBy, setSortBy] = useState(VORP);    // Current sort mode
const [loading, setLoading] = useState(false); // Loading state
const [refreshing, setRefreshing] = useState(false); // Refresh state
```

**Key Methods**:
- `loadGames()` - Fetches from storage
- `getSortedGames()` - Applies current sort
- `handleDeleteGame()` - Removes game and refreshes
- `onRefresh()` - Manual refresh with visual feedback

### GameEditorScreen.js

**Purpose**: Collect game statistics and calculate metrics.

**Organization**:
- Stat fields grouped by category
- Form inputs for each required stat
- Real-time points calculation display
- Two-action buttons (Clear & Save)

**State Management**:
```javascript
const [playerName, setPlayerName] = useState('');  // Player
const [location, setLocation] = useState('');      // Location
const [stats, setStats] = useState({});            // All stats
const [loading, setLoading] = useState(false);     // Save loading state
```

**Key Methods**:
- `updateStat()` - Update individual stat
- `calculatePTS()` - Real-time points calc
- `handleSaveGame()` - Validate and persist
- `handleClear()` - Reset form with confirmation

## Analytics Engine Deep Dive

### File: src/utils/analyticsEngine.js

#### True Shooting Percentage (TS%)

**Formula**:
```
TS% = PTS / (2 × (FGA + 0.44 × FTA)) × 100
```

**Purpose**: Measures overall shooting efficiency including free throws.

**Code**:
```javascript
export const calculateTS = (pts, fga, fta) => {
  if (fga === 0 || (fga + 0.44 * fta) === 0) return 0;
  const denom = 2 * (fga + 0.44 * fta);
  return (pts / denom) * 100;
};
```

**Benchmark**:
- NBA Average: 57.4%
- Elite (>65%): Top 15% of players
- Poor (<40%): Bottom 15%

#### Effective Field Goal % (eFG%)

**Formula**:
```
eFG% = (FGM + 0.5 × 3PM) / FGA × 100
```

**Purpose**: Accounts for 3-pointers being worth more than 2-pointers.

**Code**:
```javascript
export const calculateEFG = (fgm, threepm, fga) => {
  if (fga === 0) return 0;
  return ((fgm + 0.5 * threepm) / fga) * 100;
};
```

#### Player Efficiency Rating (PER)

**Purpose**: Single composite rating of player value.

**Components**:
- Scoring: +pts
- Playmaking: +ast×0.7
- Defense: +stl×0.5 + blk×0.5
- Rebounding: +reb×0.35
- Penalties: -missed shots, -turnovers, -fouls

**Per-36 minute conversion** allows comparing different playing times.

#### Box Plus-Minus (BPM)

**Purpose**: On-court impact in points per 100 possessions.

**Three Components**:

1. **Offensive Rating**
   - Points generated per possession
   - Assisted points
   - Shooting efficiency

2. **Defensive Rating**
   - Steals and blocks (defense creation)
   - Penalty for personal fouls
   - Relative to team defense

3. **Rebounding Impact**
   - ORB and DRB contributions
   - Compared to league average
   - Weighted by rarity

4. **Turnover Impact**
   - Each turnover is negative impact
   - Possession wasted

**Formula Summary**:
```
BPM = Offensive Rating + Defensive Rating + Rebounding + Turnovers
```

#### Value Over Replacement (VORP)

**Purpose**: How much better than a replacement-level player (bench player).

**Replacement Level Baseline**:
- TS%: 51% (very poor shooter)
- Efficiency: 55% (basic scoring ability)
- Assist/Score Ratio: 20% (limited playmaking)

**Formula**:
```
VORP = (BPM × Min) / 48 × 1.2
```

The 1.2 multiplier reflects that replacement players are below average.

**Interpretation**:
- +5.0: All-Star level
- +2.0-5.0: Great player
- +0-2.0: Good contribution
- 0: Replacement level
- <0: Below replacement

### Validation

**validateGameStats()** checks all required fields are present:
```javascript
const required = [
  'min', 'fgm', 'fga', 'threepm', 'threeepa',
  'ftm', 'fta', 'orb', 'drb', 'ast', 'stl',
  'blk', 'tov', 'pf', 'pts'
];
```

## Storage Service Architecture

### File: src/services/storageService.js

Wrapper around AsyncStorage providing these operations:

**Game Operations**:
- `saveGame()` - Add new game with auto-calculated metrics
- `getAllGames()` - Fetch all games
- `deleteGame()` - Remove by ID
- `updateGame()` - Modify existing game
- `getGamesByFolder()` - Filter by folder (future feature)

**Folder Operations** (future enhancement):
- `createFolder()` - Create logical grouping
- `getAllFolders()` - Get all folders
- `deleteFolder()` - Remove folder and contents

**Aggregation**:
- `getPlayerStats()` - Season-long statistics
  - Games played
  - Total stats across season
  - Career averages

**Data Management**:
- `clearAllData()` - Complete reset (testing)
- `exportData()` - JSON export for backup

### Data Structure

**Stored Game Object**:
```javascript
{
  id: "1682450123456",           // Timestamp-based unique ID
  playerName: "John Doe",
  location: "Downtown Courts",
  createdAt: "2024-04-25T15:30:00Z",
  stats: {
    min, fgm, fga, threepm, threeepa, ftm, fta,
    orb, drb, ast, stl, blk, tov, pf, pts
  },
  metrics: {
    ts, efg, per, bpm, vorp
  },
  teamStats: {
    possessions: 100
  }
}
```

**Storage Keys**:
- `@ballknow_games` - Array of all games
- `@ballknow_folders` - Array of folder objects
- `@ballknow_players` - Array of player profiles
- `@ballknow_settings` - App preferences

## Navigation Architecture

### Tab-Based Navigation

```
App.js (Root)
├── Tab.Screen "Leaderboard"
│   └── LeaderboardScreen
│       ├── Sort Controls
│       └── FlatList (Games)
└── Tab.Screen "Log Game"
    └── GameEditorScreen
        ├── Player Info Section
        ├── Stat Input Categories
        │   ├── Basic
        │   ├── Shooting
        │   ├── Rebounding
        │   ├── Playmaking
        │   ├── Defense
        │   └── Discipline
        ├── Calculated Display
        └── Action Buttons
```

**Libraries Used**:
- `@react-navigation/native` - Core navigation
- `@react-navigation/bottom-tabs` - Tab navigation
- `react-native-gesture-handler` - Swipe support
- `react-native-screens` - Performance optimization

## Performance Optimizations

### FlatList Best Practices
- `keyExtractor` for proper indexing
- `removeClippedSubviews` for tall lists
- `maxToRenderPerBatch` limiting
- Memoized components with `React.memo()`

### State Optimization
- Minimal state at component level
- Local state for UI-only concerns
- Batch updates where possible
- Avoid re-renders with proper dependencies

### Analytics Calculation
- Calculated on save (not on every render)
- Stored with game data (no recalculation needed)
- Pure functions with no side effects

## Testing Strategy

### Unit Tests (Jest)
```
src/utils/__tests__/analyticsEngine.test.js
├─ calculateTS tests
├─ calculateEFG tests
├─ calculatePER tests
├─ calculateBPM tests
├─ calculateVORP tests
├─ validateGameStats tests
└─ Edge case tests
```

### Test Coverage Areas
- ✅ All calculation functions
- ✅ Edge cases (zero stats, extreme values)
- ✅ Validation logic
- ✅ Data structure integrity

### Running Tests
```bash
npm test
```

## Constants & Configuration

### File: src/utils/constants.js

**Organized by Purpose**:
- `COLORS` - Theme colors
- `FONT_SIZES` - Typography scale
- `SPACING` - Layout grid
- `STAT_CATEGORIES` - Game stat groups
- `METRIC_THRESHOLDS` - Performance tiers
- `STORAGE_KEYS` - AsyncStorage keys
- `SORT_MODES` - Leaderboard sort options
- `FEATURE_FLAGS` - Feature rollout control

### Usage Example
```javascript
import { COLORS, METRIC_THRESHOLDS } from '../utils/constants';

<View style={{backgroundColor: COLORS.primary}}>
  {value >= METRIC_THRESHOLDS.VORP.elite && <Text>Elite!</Text>}
</View>
```

## Helpers & Utilities

### File: src/utils/helpers.js

**Formatting Functions**:
- `formatNumber(value, decimals)` - Consistent decimal display
- `formatDate()` / `formatDateTime()` - Readable dates
- `formatTime()` - MM:SS format

**Calculation Helpers**:
- `calculatePercentage()` - X% of Y
- `calculateShootingStats()` - FG%, 3P%, FT%
- `calculateReboundStats()` - Total, ORB, DRB

**UI Helpers**:
- `getMetricColor()` - Color based on threshold
- `capitalize()` - String formatting
- `getInitials()` - Name to initials

**Data Helpers**:
- `debounce()` / `throttle()` - Event optimization
- `deepClone()` - Safe object copying
- `safeJsonParse()` - Error-safe JSON parsing

## Future Architecture Improvements

### 1. State Management Upgrade
If app grows, consider:
- Redux for complex state
- Zustand for lightweight alternative
- Context API for simple needs

### 2. Data Sync
- Cloud backup option
- Multi-device sync
- Offline-first architecture

### 3. Advanced Analytics
- Seasonal tracking
- Player comparison
- Trend analysis
- Visualizations

### 4. Performance
- Code splitting for lazy loading
- Asset optimization
- Native modules for heavy computation
- Caching strategies

## Deployment Checklist

- [ ] Update version in `package.json` and `app.json`
- [ ] Run all tests: `npm test`
- [ ] Test on iOS simulator
- [ ] Test on Android emulator
- [ ] Build production bundle
- [ ] Test on physical device
- [ ] Collect analytics metrics
- [ ] Document any schema changes
- [ ] Create release notes

## Troubleshooting Guide

### App crashes on load
→ Check `App.js` for initialization errors
→ Review AsyncStorage mock in tests

### Metrics calculation seems off
→ Verify input stats are in correct format
→ Check `analyticsEngine.js` for formula correctness
→ Run unit tests: `npm test`

### Games not persisting
→ Ensure AsyncStorage permissions (mobile)
→ Check browser DevTools for errors
→ Clear AsyncStorage and retry

### Performance issues with many games
→ Implement pagination in FlatList
→ Archive old seasons
→ Optimize component re-renders

---

**Document Version**: 1.0  
**Last Updated**: April 2026  
**Maintainers**: Abhinav, Parth, Sakethram
