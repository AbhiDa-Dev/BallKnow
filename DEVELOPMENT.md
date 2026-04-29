# BallKnow Development Guide

## Project Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI: `npm install -g expo-cli`

### Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start the Development Server**
   ```bash
   npm start
   ```

   This will open the Expo CLI menu. You can:
   - Press `i` to open iOS Simulator
   - Press `a` to open Android Emulator
   - Press `w` to open in web browser
   - Scan the QR code with Expo Go app on your phone

### Project Structure

```
BallKnow/
├── App.js                          # Main entry point with navigation
├── app.json                        # Expo configuration
├── package.json                    # Dependencies
├── babel.config.js                 # Babel configuration
├── src/
│   ├── screens/
│   │   ├── LeaderboardScreen.js    # Main ranking display
│   │   └── GameEditorScreen.js     # Game logging form
│   ├── services/
│   │   └── storageService.js       # AsyncStorage operations
│   └── utils/
│       └── analyticsEngine.js      # VORP, BPM, TS% calculations
└── README.md                        # Project documentation
```

## Features

### 1. **Leaderboard Screen**
- View all logged games sorted by:
  - **VORP** (Value Over Replacement Player) - Impact metric
  - **BPM** (Box Plus-Minus) - On-court rating
  - **TS%** (True Shooting Percentage) - Shooting efficiency
  - **PTS** (Points) - Traditional scoring
- Swipe-to-delete games
- Pull-to-refresh the list

### 2. **Game Editor Screen**
- Log all 14 required stats in real-time:
  - **Minutes Played**
  - **Shooting**: FGM/A, 3PM/A, FTM/A
  - **Rebounding**: ORB, DRB
  - **Playmaking**: AST, TOV
  - **Defense**: STL, BLK
  - **Discipline**: PF
- Auto-calculated Points (PTS) display
- Save games with player name and location
- Form validation before saving

### 3. **Analytics Engine**
Automatically calculates:

#### True Shooting % (TS%)
```
TS% = PTS / (2 × (FGA + 0.44 × FTA)) × 100
```
Measures overall shooting efficiency.

#### Box Plus-Minus (BPM)
Rates a player's on-court impact in points per 100 possessions. Accounts for:
- Offensive contribution
- Defensive rating
- Rebounding impact
- Turnover impact

#### Value Over Replacement Player (VORP)
Compares player stats to a "replacement level" baseline (55% TS%, 0.51 TS% minimum player).

## Usage Examples

### Logging a Game

1. Tap the **"Log Game"** tab
2. Enter player name: `"John Doe"`
3. Enter location: `"Downtown Courts"`
4. Fill in all stats:
   - Minutes: `24`
   - FGM/FGA: `8/16`
   - 3PM/3PA: `2/5`
   - FTM/FTA: `4/5`
   - ORB/DRB: `2/5`
   - AST/TOV: `4/2`
   - STL/BLK: `1/0`
   - PF: `2`
5. Tap **"Save Game"** to log it
6. Metrics are calculated automatically

### Viewing the Leaderboard

1. Tap the **"Leaderboard"** tab
2. Switch sorting modes with the buttons at top:
   - **VORP** → Highlights most impactful players
   - **BPM** → Shows who contributes most per minute
   - **TS%** → Identifies most efficient shooters
   - **PTS** → Casual point scorers
3. Swipe left on a game to delete it
4. Pull down to refresh the list

## Data Storage

All game data is stored **locally on the device** using AsyncStorage:
- No internet required
- No account needed
- Complete privacy
- Fast, instant access

Data is stored as JSON and can be exported for backup.

## Development Commands

```bash
# Start dev server
npm start

# Run on iOS Simulator
npm run ios

# Run on Android Emulator
npm run android

# Run on web browser
npm run web

# Run tests (when configured)
npm test
```

## Analytics Formulas Reference

### Possession Estimate
```
Possessions = FGA - ORB + TOV + (0.44 × FTA)
```

### Effective Field Goal % (eFG%)
```
eFG% = (FGM + 0.5 × 3PM) / FGA
```

### Player Efficiency Rating (PER)
```
Per-Minute = (PTS + AST×0.7 + STL×0.5 + BLK×0.5 + REB×0.35 
           - (FGA - PTS/2)×0.2 - TOV×0.5 - PF×0.1) / MIN
```

## Future Enhancements

- Team management and comparison stats
- Season/session grouping
- Advanced filtering and search
- Data export/import (CSV, JSON)
- Custom replacement level adjustment
- Photo/video clip attachments
- Multi-player game logging
- Advanced visualizations and charts

## Troubleshooting

### App won't start
```bash
npm install
npm start
```

### AsyncStorage errors
Clear app cache and reinstall:
```bash
npm install expo-async-storage
```

### Stats not calculating
Ensure all fields are filled (0 is acceptable). Check `analyticsEngine.js` for calculation logic.

### Performance issues
If the leaderboard is slow with many games:
- Consider implementing pagination
- Use FlatList optimization techniques
- Archive old seasons

## Architecture Notes

- **State Management**: React hooks + AsyncStorage
- **Navigation**: React Navigation (Bottom Tabs)
- **Styling**: React Native StyleSheet
- **Gestures**: React Native Gesture Handler
- **Analytics**: Pure JavaScript calculations

No Redux, Context API, or external state management needed—the app is simple enough for local state to handle efficiently.

## License

BallKnow © 2026 | Abhinav Akula, Parth Illendula, Sakethram Badri
