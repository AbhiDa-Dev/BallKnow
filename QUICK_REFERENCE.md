# BallKnow Quick Reference Guide

## 🚀 Quick Start (60 seconds)

```bash
# 1. Install dependencies
npm install

# 2. Start dev server
npm start

# 3. Pick your platform
# i = iOS Simulator
# a = Android Emulator  
# w = Web Browser
# Or scan QR code with Expo Go app
```

## 📱 App Navigation

### Tab 1: Leaderboard
- **Purpose**: View all logged games ranked by metric
- **Sort Buttons**: VORP | BPM | TS% | PTS
- **Actions**: Delete (tap trash), Refresh (pull down)

### Tab 2: Log Game
- **Purpose**: Record a new game's stats
- **Sections**: 6 stat categories + 14 inputs
- **Action**: Save Game (auto-calculates metrics)

---

## 🎯 Logging a Game (5 min)

### Step-by-Step

1. **Switch to "Log Game" tab**
2. **Enter Player Name**: `John Doe`
3. **Enter Location**: `Downtown Courts`
4. **Fill Stats** (example values):
   ```
   Minutes:      28
   FG: 9/18      3P: 2/5      FT: 5/6
   OR/DR: 2/7    AST/TOV: 5/2
   STL/BLK: 1/0  PF: 2
   ```
5. **View PTS**: Auto-calculated at bottom
6. **Tap "Save Game"** ✓

### What Happens Next
- Metrics calculated instantly (TS%, BPM, VORP)
- Game saved to device storage
- Ready to log another or view leaderboard

---

## 📊 Metrics Explained (TL;DR)

| Metric | What It Means | Formula | Elite |
|--------|--------------|---------|-------|
| **TS%** | Shooting efficiency | PTS/(2×(FGA+0.44×FTA))×100 | >65% |
| **BPM** | On-court rating per 100 poss. | Offensive+Defensive+REB+TOV | >+10 |
| **VORP** | vs replacement player | (BPM × Min)/48 × 1.2 | >+5.0 |
| **PTS** | Points scored | FGM×2 - 3PM + FTM | N/A |

---

## 📁 Project Structure (Important Files)

```
src/
├── screens/
│   ├── LeaderboardScreen.js     👈 Rankings display
│   └── GameEditorScreen.js      👈 Game logging form
├── services/
│   └── storageService.js        👈 Data persistence
├── utils/
│   ├── analyticsEngine.js       👈 Calculations (VORP, BPM, TS%)
│   ├── constants.js             👈 Colors, thresholds, configs
│   ├── helpers.js               👈 Utility functions
│   └── sampleDataGenerator.js   👈 Test data
App.js                           👈 Navigation setup
package.json                     👈 Dependencies
```

---

## 🛠️ Common Commands

```bash
npm start          # Start dev server (interactive menu)
npm run ios        # Run on iOS Simulator
npm run android    # Run on Android Emulator
npm run web        # Run in web browser
npm test           # Run unit tests
```

---

## 💾 Data Structure (Game Object)

```javascript
{
  id: "1682450123456",
  playerName: "John Doe",
  location: "Downtown Courts",
  createdAt: "2024-04-25T15:30:00Z",
  stats: {
    min: 28, fgm: 9, fga: 18, threepm: 2, threeepa: 5,
    ftm: 5, fta: 6, orb: 2, drb: 7, ast: 5, stl: 1,
    blk: 0, tov: 2, pf: 2, pts: 25
  },
  metrics: {
    ts: 57.6,
    efg: 56.8,
    per: 18.2,
    bpm: 3.2,
    vorp: 0.8
  }
}
```

---

## 🎨 Customizing the App

### Change Primary Color
**File**: `src/utils/constants.js`
```javascript
primary: '#FFB81C'  // Change to your color (e.g., '#FF5733')
```

### Adjust Metric Thresholds
**File**: `src/utils/constants.js`
```javascript
METRIC_THRESHOLDS = {
  VORP: {
    elite: 5.0,    // Adjust these
    great: 2.5,
    good: 1.0,
  }
}
```

### Add a New Sort Mode
**File**: `src/screens/LeaderboardScreen.js`

1. Add to `SORT_MODES`:
```javascript
const SORT_MODES = {
  PER: 'per',  // NEW
};
```

2. Add case in `getSortedGames()`:
```javascript
case SORT_MODES.PER:
  return sorted.sort((a, b) => (b.metrics?.per || 0) - (a.metrics?.per || 0));
```

3. Add button in render:
```javascript
<SortButton mode={SORT_MODES.PER} label="PER" />
```

---

## 🧪 Testing

### Run Tests
```bash
npm test
```

### What's Tested
- ✅ All analytics calculations (VORP, BPM, TS%)
- ✅ Edge cases (zero stats, extreme values)
- ✅ Data validation
- ✅ Formula correctness

### Test File Location
```
src/utils/__tests__/analyticsEngine.test.js
```

---

## 🐛 Troubleshooting

### "App won't start"
```bash
npm install
npm start
```

### "Games not saving"
- Check that player name is filled
- Ensure all stat fields have values (0 is OK)
- Check console for errors: `F12` (web) or Expo CLI

### "Metrics seem wrong"
- Verify calculations in `analyticsEngine.js`
- Run tests: `npm test`
- Check sample data: `sampleDataGenerator.js`

### "Performance is slow with many games"
- Consider implementing pagination
- Archive old seasons
- Use React DevTools Profiler

---

## 📚 File Descriptions

| File | Purpose | Key Functions |
|------|---------|---|
| **App.js** | Navigation setup | Bottom tab routing |
| **LeaderboardScreen.js** | Game display | Sort, delete, refresh |
| **GameEditorScreen.js** | Game logging | Form, validation, save |
| **analyticsEngine.js** | Calculations | TS%, BPM, VORP |
| **storageService.js** | Data persistence | CRUD operations |
| **constants.js** | App config | Colors, thresholds |
| **helpers.js** | Utilities | Formatting, calculations |

---

## ⚡ Performance Tips

1. **FlatList Optimization**
   - Keys are properly set
   - `removeClippedSubviews` enabled
   - Pagination ready for large datasets

2. **State Management**
   - State only at component level (no Redux needed)
   - Re-renders minimized
   - Effects properly managed

3. **Storage**
   - All calculations done on save
   - No recalculation on render
   - Instant metric display

---

## 🔐 Data Privacy

✅ **All data stored locally on device**
- ✅ No internet required
- ✅ No account needed
- ✅ No tracking
- ✅ No data sharing
- ✅ 100% private

---

## 🚀 Next Steps for Development

### If Adding Features
1. Update `STAT_CATEGORIES` in `constants.js`
2. Add new form fields in `GameEditorScreen.js`
3. Update validation in `analyticsEngine.js`
4. Add new analytics if needed
5. Test: `npm test`

### If Optimizing Performance
1. Profile with React DevTools
2. Check FlatList rendering
3. Minimize state updates
4. Lazy load heavy components

### If Adding Backend (Future)
1. Create `src/api/` directory
2. Set up API service
3. Replace `storageService` calls
4. Add offline caching layer
5. Handle sync conflicts

---

## 📞 Team Contact

- **Abhinav Akula**
- **Parth Illendula**
- **Sakethram Badri**

---

## 📋 Checklist: Before Submitting

- [ ] All stats validate correctly
- [ ] Metrics calculate properly
- [ ] App runs on iOS/Android/Web
- [ ] Leaderboard displays games
- [ ] Delete functionality works
- [ ] Sort buttons function correctly
- [ ] Form clears on save
- [ ] Tests pass: `npm test`
- [ ] No console errors
- [ ] Device data persists after restart

---

## 🎓 Learning Resources

- **React Native Docs**: https://reactnative.dev/
- **Expo Docs**: https://docs.expo.dev/
- **React Navigation**: https://reactnavigation.org/
- **Jest Testing**: https://jestjs.io/

---

**Quick Ref v1.0** | Last updated: April 2026
