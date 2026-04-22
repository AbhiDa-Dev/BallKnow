# Ball Knowledge (BallKnow) 🏀

## Team Members
- Abhinav Akula
- Parth Illendula
- Sakethram Badri

## Application Description
**Ball Knowledge** is a local-only mobile analytics application built for basketball players who want professional-grade insights without the need for an account, backend, or internet connection. Built entirely with **React Native**, the app allows users to log raw game data in real-time and instantly calculate a player's true impact using advanced metrics like **VORP** and **BPM**.

The app is designed for the "stat-head" at the local gym. It focuses on privacy and speed, storing all data locally on the device. While casual players only track points, BallKnow users track value, efficiency, and true "Ball Knowledge."

## Project Goals and Features
The goal of this project is to demonstrate a high-performance mobile application that handles complex mathematical processing and local data management using **JavaScript** within the React Native framework.

### Features
* **Offline Stat-Logger:** A specialized mobile interface to log play-by-play stats (FGA, AST, STL, etc.) during live local runs.
* **Local Advanced Metric Engine:** Real-time, on-device calculations of:
    * **VORP (Value Over Replacement Player)**
    * **BPM (Box Plus-Minus: Offensive and Defensive)**
    * **TS% (True Shooting Percentage)**
* **Local Leaderboard:** A dynamic ranking system that sorts local players and game sessions stored on the device by impact and efficiency.
* **On-Device Storage:** Complete privacy—no cloud, no backend, and no sign-up required.
* **Folder-Based Organization:** Group your local games by "Gym Location," "Summer League," or "Pickup Sessions."
* **Swipe-to-Delete:** Polished mobile UX for managing local game entries using native gestures.

## Overall Architecture of the Application
BallKnow is a **frontend-only** application. Because calculations like BPM require comparing a player to a "replacement level" benchmark, the app manages these constants and formulas locally within the application state.

### Main Parts of the Application
* **The Local Leaderboard Screen:**
    * A high-performance list that sorts the data stored on the device.
    * Users can toggle between sorting by "Points" (Casual view) and "VORP" (Knowledge view) to see who actually contributed to winning.
* **The Game Editor Screen:**
    * A multi-input form designed for quick entry during game breaks.
    * Uses controlled components to capture all 11+ required stat categories.
* **The Analytics Module:**
    * A JavaScript logic layer that processes raw box score numbers into advanced outputs using NBA-standard regression formulas.

### Data Flow
The application uses **React Native state management** to handle the flow of information. When a user saves a game, the data is pushed to a local store. The **Leaderboard** then re-calculates the rankings based on the new VORP and BPM results. Since the project is strictly local, all state transitions and calculations are instantaneous.

### Technologies Used
* **React Native** (Core Framework)
* **JavaScript (ES6+)** (For all components and logic)
* **React Navigation** (For moving between the Leaderboard and Logger)
* **React Native Gesture Handler** (For swipe-to-delete and native interactions)

## Repository / Shared Project Access
This project will be submitted through this gitHub

---

### Data Requirements for Calculations
To ensure the analytics engine works correctly, the local inputs must include:
1.  **Player Stats:** Minutes Played, FGM/A, 3PM/A, FTM/A, ORB, DRB, AST, STL, BLK, TOV, PF.
2.  **Session Context:** Team and Opponent scoring totals (required for the BPM formula to determine game pace and relative defensive rating).
