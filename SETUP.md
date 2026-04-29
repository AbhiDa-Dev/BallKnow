# 🏀 BallKnow - React Native App

A fully functional React Native implementation of the BallKnow basketball analytics application. This is a **local-only, frontend-only** app that calculates advanced basketball metrics on-device.

## ✨ Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm start
```

### 3. Run on Your Device
- **iOS**: Press `i` or scan QR code with iOS camera
- **Android**: Press `a` or use Expo Go app
- **Web**: Press `w` for browser

## 📱 Features Built

### ✅ Implemented Features

#### **Leaderboard Screen**
- Dynamic ranking system showing all logged games
- **Four sort modes**: VORP, BPM, TS%, Points
- Visual highlighting of active sort metric
- Swipe-to-delete with confirmation
- Pull-to-refresh functionality
- Empty state with friendly messaging
- Real-time metric display in compact cards

#### **Game Editor Screen**
- Complete form with 14 stat inputs organized by category:
  - **Basic**: Minutes Played
  - **Shooting**: FGM/A, 3PM/A, FTM/A
  - **Rebounding**: ORB, DRB
  - **Playmaking**: Assists, Turnovers
  - **Defense**: Steals, Blocks
  - **Discipline**: Personal Fouls
- Auto-calculated points display
- Player name and location tracking
- Form validation before saving
- Success feedback with navigation options
- Clear form functionality with confirmation

#### **Analytics Engine**
Automatically calculates these metrics on save:

| Metric | Formula | Use Case |
|--------|---------|----------|
| **TS%** | PTS / (2 × (FGA + 0.44 × FTA)) × 100 | Shooting efficiency |
| **eFG%** | (FGM + 0.5 × 3PM) / FGA × 100 | Adjusted field goal % |
| **PER** | Per-minute impact rating | Overall contribution |
| **BPM** | Points per 100 possessions | On-court rating |
| **VORP** | Value over replacement player | Impact vs baseline |

#### **Local Storage**
- All data persists on device via AsyncStorage
- No internet required
- No backend needed
- Complete privacy

#### **UI/UX**
- Dark theme (perfect for gym use)
- Gold accent color (#FFB81C)
- Touch-optimized components
- Bottom tab navigation
- Smooth animations
- Responsive design

## 📁 Project Structure

```
BallKnow/
├── App.js                          # Main entry point with navigation
├── app.json                        # Expo configuration
├── package.json                    # npm dependencies
├── babel.config.js                 # Babel setup
├── .gitignore                      # Git ignore rules
├── README.md                        # Project overview (original)
├── DEVELOPMENT.md                  # Detailed dev guide
└── src/
    ├── screens/
    │   ├── LeaderboardScreen.js     # Rankings & sorting
    │   └── GameEditorScreen.js      # Game logging form
    ├── services/
    │   └── storageService.js        # AsyncStorage wrapper
    └── utils/
        ├── analyticsEngine.js       # VORP, BPM, TS% calculations
        ├── constants.js             # App-wide constants & configs
        ├── helpers.js               # Utility functions
        └── sampleDataGenerator.js    # Test data generator
```

## 🎮 How to Use

### Logging a Game

1. **Open** the "Log Game" tab
2. **Enter** player name (e.g., "John Doe")
3. **Enter** location (e.g., "Downtown Courts")
4. **Fill in** all stat boxes (example game below):
   ```
   Minutes: 28
   FGM/A: 9/18    3PM/A: 2/5    FTM/A: 5/6
   ORB/DRB: 2/7   AST/TOV: 5/2
   STL/BLK: 1/0   PF: 2
   ```
5. **Tap** "Save Game" → Points auto-calculated (25 pts)
6. See metrics instantly calculated

### Viewing Rankings

1. **Open** the "Leaderboard" tab
2. **Sort** by clicking buttons:
   - 🏆 **VORP** - Most impactful players
   - 📊 **BPM** - Best on-court rating
   - 🎯 **TS%** - Most efficient shooters
   - 🔥 **PTS** - Most points scored
3. **Delete** by tapping the trash icon
4. **Refresh** by pulling down

## 📊 Metrics Explained

### True Shooting % (TS%)
**What it measures**: Overall shooting efficiency including free throws.

**Formula**: 
```
TS% = PTS ÷ (2 × (FGA + 0.44 × FTA)) × 100
```

**Elite threshold**: >65% | **Poor threshold**: <40%

### Box Plus-Minus (BPM)
**What it measures**: How many points a player adds/subtracts per 100 possessions.

**Factors**:
- Offensive rating (scoring & assists)
- Defensive impact (steals, blocks, fouls)
- Rebounding (offensive & defensive)
- Turnover impact

**Elite threshold**: +10 | **Poor threshold**: -2

### Value Over Replacement (VORP)
**What it measures**: How much better a player is than a "replacement-level" backup.

**Replacement Level Baseline**:
- Efficiency: 55%
- TS%: 51%
- Assist/Scoring Ratio: 20%

**Formula**: `VORP = (BPM × Min) ÷ 48 × 1.2`

## 🛠️ Development

### Available Commands

```bash
npm start       # Start dev server
npm run ios     # Run on iOS Simulator
npm run android # Run on Android Emulator
npm run web     # Run in browser
npm test        # Run tests (when configured)
```

### Tech Stack

- **Framework**: React Native (Expo)
- **Navigation**: React Navigation (Bottom Tabs)
- **Storage**: Expo AsyncStorage
- **Gestures**: React Native Gesture Handler
- **Icons**: Expo Vector Icons (Material Community)
- **Styling**: React Native StyleSheet
- **Analytics**: Pure JavaScript (no external libs)

### Key Files to Understand

1. **`src/utils/analyticsEngine.js`** - Core calculation logic
2. **`src/services/storageService.js`** - Data persistence
3. **`src/screens/LeaderboardScreen.js`** - Main display logic
4. **`src/screens/GameEditorScreen.js`** - Form & validation

## 🎯 Example Game Flow

```
Player logs "John Doe" at "Downtown Courts" with stats:
├─ Minutes: 24
├─ Shooting: 7-14 FG, 2-4 3PT, 3-4 FT
├─ Rebounding: 2 ORB, 6 DRB
├─ Playmaking: 4 AST, 1 TOV
├─ Defense: 2 STL, 0 BLK
└─ Discipline: 2 PF

Points calculated: 7×2 - 2 + 3 = 19 PTS

Metrics calculated on-device:
├─ TS%: 19 ÷ (2 × (14 + 0.44×4)) × 100 = 57.6%
├─ BPM: +3.2 (on-court rating)
├─ VORP: +0.8 (vs replacement)
└─ Stored in AsyncStorage

Appears on Leaderboard ranked by selected sort mode
```

## 🔧 Testing with Sample Data

To populate with test games, uncomment in `App.js`:

```javascript
import { generateSampleGames } from './src/utils/sampleDataGenerator';

// On app load:
useEffect(() => {
  generateSampleGames(20); // Creates 20 realistic games
}, []);
```

## 📈 Data Structure

### Game Object
```javascript
{
  id: "1682450123456",
  playerName: "John Doe",
  location: "Downtown Courts",
  createdAt: "2024-04-25T15:30:00.000Z",
  stats: {
    min: 28,
    fgm: 9,
    fga: 18,
    threepm: 2,
    threeepa: 5,
    ftm: 5,
    fta: 6,
    orb: 2,
    drb: 7,
    ast: 5,
    stl: 1,
    blk: 0,
    tov: 2,
    pf: 2,
    pts: 25
  },
  metrics: {
    ts: 57.6,    // True Shooting %
    efg: 56.8,   // Effective FG %
    per: 18.2,   // Player Efficiency Rating
    bpm: 3.2,    // Box Plus-Minus
    vorp: 0.8    // Value Over Replacement
  }
}
```

## 🎨 Customization

### Change Color Scheme
Edit `src/utils/constants.js`:
```javascript
export const COLORS = {
  primary: '#FFB81C',   // Change this
  dark: '#0d0d0d',      // Background color
  // ...
};
```

### Adjust Metric Thresholds
In `src/utils/constants.js`:
```javascript
export const METRIC_THRESHOLDS = {
  VORP: {
    elite: 5.0,   // Adjust these values
    great: 2.5,
    // ...
  }
}
```

## 📚 Full Documentation

See [DEVELOPMENT.md](DEVELOPMENT.md) for:
- Detailed setup instructions
- Analytics formulas reference
- Troubleshooting guide
- Architecture overview
- Future enhancement ideas

## 🐛 Known Limitations

- Single player per game entry (no multi-player tracking yet)
- Fixed possession estimate (100)
- No seasonal grouping
- No data export/import UI (API exists)
- No backup/restore functionality

## 🚀 Future Enhancements

- [ ] Multi-player game logging
- [ ] Season management
- [ ] Advanced charts and visualizations
- [ ] CSV/JSON export
- [ ] Photo/video attachments
- [ ] Team comparison stats
- [ ] Custom replacement level adjustment
- [ ] Cloud backup option

## 👥 Team

- **Abhinav Akula**
- **Parth Illendula**
- **Sakethram Badri**

## 📄 License

© 2026 BallKnow. All rights reserved.

---

## ⚡ Ready to Start?

1. Run `npm install`
2. Run `npm start`
3. Scan QR code or choose platform
4. Log your first game!

Questions? Check [DEVELOPMENT.md](DEVELOPMENT.md) for detailed guidance.
