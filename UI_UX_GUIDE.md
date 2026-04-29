# BallKnow UI/UX Flow & Screen Designs

## 🎨 Design System

### Color Palette

```
Primary:   #FFB81C (Gold/Basketball Orange)
Dark:      #0d0d0d (Very Dark Background)
DarkGray:  #1a1a1a (Card/Component Background)
Gray:      #333    (Borders & Dividers)
Light:     #666    (Muted Text)
White:     #fff    (Primary Text)
Red:       #ff6b6b (Destructive Actions)
Green:     #51cf66 (Success/Positive)
```

### Typography

```
Headings:       18-24px, Bold (700)
Labels:         14-16px, Semibold (600)
Body Text:      12-14px, Regular (400)
Small Text:     10-12px, Regular (400)
```

### Spacing Grid

```
xs:   4px
sm:   8px
md:  12px
lg:  16px
xl:  20px
2xl: 24px
```

---

## 📱 Screen 1: Leaderboard

### Layout Structure

```
┌─────────────────────────────────────┐
│         BallKnow (Header)           │
├─────────────────────────────────────┤
│  [VORP] [BPM] [TS%] [PTS]          │ ← Sort Buttons
├─────────────────────────────────────┤
│                                     │
│  ┌──────────────────────────────┐  │
│  │ #1  John Doe                 │  │
│  │     Downtown Courts, 4/25    │  │
│  │  VORP: 0.8  BPM: +3.2        │  │
│  │  TS%: 57.6  PTS: 25          │  │ X
│  └──────────────────────────────┘  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │ #2  Jane Smith               │  │
│  │     Riverside Gym, 4/24      │  │
│  │  VORP: 0.5  BPM: +2.1        │  │
│  │  TS%: 52.3  PTS: 18          │  │ X
│  └──────────────────────────────┘  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │ #3  Mike Johnson             │  │
│  │     Central Park, 4/23       │  │
│  │  VORP: 0.2  BPM: +0.8        │  │
│  │  TS%: 48.9  PTS: 22          │  │ X
│  └──────────────────────────────┘  │
│                                     │
├─────────────────────────────────────┤
│  🏀 Leaderboard │ ✏️ Log Game       │
└─────────────────────────────────────┘
```

### Empty State

```
┌─────────────────────────────────────┐
│         BallKnow (Header)           │
├─────────────────────────────────────┤
│                                     │
│                                     │
│              🏀                     │
│        No games logged yet          │
│   Start logging games to see        │
│         your stats                  │
│                                     │
│                                     │
├─────────────────────────────────────┤
│  🏀 Leaderboard │ ✏️ Log Game       │
└─────────────────────────────────────┘
```

### Interactive Elements

**Sort Button (Inactive)**
```
┌─────────┐
│  VORP   │  ← Light border, gray text
└─────────┘
```

**Sort Button (Active)**
```
┌─────────┐
│  VORP   │  ← Gold background, black text
└─────────┘
```

**Game Card**
- Left border: 4px gold
- Corners: 12px border radius
- Padding: 12px
- Background: #1a1a1a
- Delete button on far right (tap → confirmation)

---

## 📝 Screen 2: Game Editor

### Layout Structure

```
┌─────────────────────────────────────┐
│     Log Game (Header)               │
├─────────────────────────────────────┤
│                                     │
│  PLAYER INFO                        │
│  ┌─────────────────────────────┐   │
│  │ Player Name                 │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ Location (Gym, Court, etc.) │   │
│  └─────────────────────────────┘   │
│                                     │
│  BASIC STATS                        │
│  Minutes Played        [  24 ]      │
│                                     │
│  SHOOTING STATS                     │
│  Field Goals Made      [   9 ]      │
│  Field Goals Attempted [ 18 ]       │
│  3PM                   [   2 ]      │
│  3PA                   [   5 ]      │
│  FTM                   [   5 ]      │
│  FTA                   [   6 ]      │
│                                     │
│  REBOUNDING                         │
│  Offensive Rebounds    [   2 ]      │
│  Defensive Rebounds    [   7 ]      │
│                                     │
│  PLAYMAKING                         │
│  Assists               [   5 ]      │
│  Turnovers             [   2 ]      │
│                                     │
│  DEFENSE                            │
│  Steals                [   1 ]      │
│  Blocks                [   0 ]      │
│                                     │
│  DISCIPLINE                         │
│  Personal Fouls        [   2 ]      │
│                                     │
│  CALCULATED STATS                   │
│  ┌─────────────────────────────┐   │
│  │ Points (PTS)           25   │   │
│  │ Calculated from:            │   │
│  │ FGM×2 - 3PM + FTM           │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌──────────────┬──────────────┐   │
│  │ ↻ Clear Form │ ✓ Save Game  │   │
│  └──────────────┴──────────────┘   │
│                                     │
├─────────────────────────────────────┤
│  🏀 Leaderboard │ ✏️ Log Game       │
└─────────────────────────────────────┘
```

### Form Sections

Each section has:
- **Title** (Colored gold #FFB81C)
- **Input rows** with label + text field
- **Borders**: Dark gray (#333)
- **Input styling**: Dark background (#1a1a1a), white text

### Input Field

```
Minutes Played        [ 24 ]
└─ label             └ field
  white color      dark bg + gold border
```

### Button States

**Clear Button (Inactive)**
```
┌──────────────┐
│ ↻ Clear Form │  ← Red border, red text, transparent bg
└──────────────┘
```

**Clear Button (Hover/Active)**
```
┌──────────────┐
│ ↻ Clear Form │  ← Slightly darker red
└──────────────┘
```

**Save Button (Enabled)**
```
┌──────────────┐
│ ✓ Save Game  │  ← Gold background, black text
└──────────────┘
```

**Save Button (Loading)**
```
┌──────────────┐
│    ⟳ ...     │  ← Spinner animation
└──────────────┘
```

---

## 🔄 User Flows

### Flow 1: Log a New Game

```
App Loads
    ↓
User taps "Log Game" tab
    ↓
GameEditorScreen displays empty form
    ↓
User fills in stats (name, location, stats)
    ↓
Points auto-calculated display updates
    ↓
User taps "Save Game"
    ↓
Form validates all fields
    ↓
Analytics calculated on device
    ↓
Game saved to AsyncStorage
    ↓
Success alert shown with options:
  • Log Another (clears form)
  • View Leaderboard (navigates)
    ↓
Form resets or navigates
```

### Flow 2: View & Sort Leaderboard

```
App Loads
    ↓
Leaderboard tab is default
    ↓
Games loaded from AsyncStorage
    ↓
Games sorted by VORP (default)
    ↓
Displayed in ranked order with metrics
    ↓
User taps sort button (e.g., "BPM")
    ↓
List re-sorts by BPM
    ↓
Highlighted sort button updates
    ↓
User can pull to refresh
    ↓
Or swipe to delete a game
    ↓
Delete requires confirmation
```

### Flow 3: Delete a Game

```
User taps trash icon on game card
    ↓
Confirmation prompt appears
    ↓
User confirms delete
    ↓
Game removed from AsyncStorage
    ↓
Leaderboard refreshes
    ↓
Game no longer visible in list
```

---

## 📲 Responsive Design

### Landscape Mode Support
- Metric boxes stack horizontally
- Buttons remain full-width
- Form columns auto-adjust

### Different Device Sizes
- **Small (iPhone SE)**: Single column, compact spacing
- **Regular (iPhone 12)**: Optimal single column
- **Large (iPhone 14 Pro Max)**: Consider wider cards
- **Tablet (iPad)**: Two-column layout possible

### Safe Area Handling
- Bottom tab bar respects notch/safe area
- Content padding accounts for safe area
- Header respects safe area on all devices

---

## 🎯 Gesture Interactions

### Leaderboard

**Swipe Left on Card**
```
Game Card
    │ ← Swipe left
    ↓
Delete button reveals (red trash icon)
    │ ← Tap trash
    ↓
Confirmation dialog
    │ ← Confirm
    ↓
Card animates out + removes from list
```

**Pull Down to Refresh**
```
At top of list
    │ ← Pull down
    ↓
Refresh spinner appears
    │
Games re-fetch from storage
    │
Spinner completes
    ↓
List updates
```

### Game Editor

**Tap Input Field**
```
Empty field with placeholder text
    │ ← Tap
    ↓
Keyboard appears
    │
User types number
    │ ← Finished
    ↓
Keyboard dismisses
```

---

## 💡 Visual Feedback

### Form Submission
```
1. User taps "Save Game"
   └─ Button shows loading spinner
   
2. Form validates (instant)
   
3. Analytics calculate (instant)
   
4. Storage saves (instant)
   
5. Success alert appears
   └─ With two action buttons
```

### Deletion
```
1. User taps trash icon
   └─ Icon momentarily highlights
   
2. Confirmation dialog appears
   └─ Two buttons: Cancel / Delete
   
3. User confirms
   
4. Card animates out with fade
   
5. List updates (no flash)
```

### Loading State
```
Initially:          After first load:
┌─────────────┐    ┌─────────────┐
│   ⟳ ...     │    │  [Games]    │
│ Loading...  │    │  [Games]    │
│             │    │  [Games]    │
└─────────────┘    └─────────────┘
```

---

## 🎨 Component Styling Reference

### Colors by Component

```
Backgrounds:
  └─ Screen: #0d0d0d
  └─ Cards/Input: #1a1a1a
  └─ Tab Bar: #1a1a1a

Text:
  └─ Primary: #fff (white)
  └─ Secondary: #999 (light gray)
  └─ Tertiary: #666 (medium gray)
  └─ Disabled: #444 (dark gray)

Accents:
  └─ Highlight: #FFB81C (gold)
  └─ Success: #51cf66 (green)
  └─ Error: #ff6b6b (red)
  └─ Borders: #333 (dark gray)
```

### Shadows (iOS-style)
```
Cards: Light shadow, 2px offset
Buttons: No shadow (flat design)
```

---

## 🖼️ Visual Hierarchy

### Leaderboard
```
Most important: Player name + rank
Important:      Metrics (VORP, BPM)
Secondary:      Location + date
Tertiary:       Delete button (right side)
```

### Game Editor
```
Most important: "Save Game" button (gold, large)
Important:      Each stat input label
Secondary:      Calculated stats box
Tertiary:       "Clear Form" button
```

---

## ♿ Accessibility Considerations

- Touch targets: Minimum 44×44 points
- Color contrast: White text on dark background (WCAG AA)
- Labels: All inputs have visible labels
- Buttons: Enough spacing between interactive elements
- Text sizes: Readable at 14px+ for body text

---

**UI/UX Document v1.0** | April 2026
