# 🌌 VanguarDZ
*An elegant, fast-paced co-op cyberpunk typing shooter built with HTML5 Canvas, React, Express, and WebSockets.*

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62B)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![WebSockets](https://img.shields.io/badge/WebSockets-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)

```text
 _    __                                    ____  _____
| |  / /___ _____  ____ ___  ______ ______ / __ \/__  /
| | / / __ `/ __ \/ __ `/ / / / __ `/ ___// / / /  / / 
| |/ / /_/ / / / / /_/ / /_/ / /_/ / /   / /_/ /  / /__
|___/\__,_/_/ /_/\__, /\__,_/\__,_/_/   /_____/  /____/
                /____/                                    
```

VanguarDZ is a premium, minimal, and immersive 2D multiplayer typing game. Players command high-tech spacecraft, typing descending words to fire laser beams and obliterate incoming hostiles. Team up with friends in real-time co-op lobbies, unlock powerful abilities, and survive intense boss fights.

---

## 🌟 Key Features

### 🖥️ Cyber-Minimalist Aesthetics
*   **Procedural Vector Graphics**: Elegant, glowing 2D vector designs on a dark nebula space background.
*   **Parallax Scenery**: Ruined space towers, asteroids, and distant planets drift past without blocking the gameplay arena.
*   **Dynamic Visual FX**: Colorful laser beams, particle explosions, and screen shakes that react to typing accuracy and damage.

### 👥 Up to 3-Player Co-op Lobbies
*   **4-Character Room Codes**: Instantly host or join private rooms. Rooms automatically lock once 3 players enter.
*   **Role-Based Positioning**: The host takes the center slot, Player 2 is assigned the right slot, and Player 3 takes the left slot.
*   **Color-Coded Target Systems**: Enemy words are color-coded (**Red**, **Blue**, or **Green**). You can *only* target and type words matching your ship's color, forcing strict squad coordination.

### 🧬 Real-time Global Leaderboard
*   Tracks online players' scores, wave milestones, and active status.
*   Leaderboards automatically refresh across active tabs and reset/clear active sessions when browser tabs are closed.

### 🌌 Docking Station & Shop
*   Every 5 waves, players dock their ships to purchase and upgrade **Tactical Abilities** using credits earned from streaks and boss defeats.

---

## 🛸 Tactical Threat Index (Enemy Registry)

Standard waves feature a maximum active limit on screen (**6** on waves 1–4, **8** on waves 5–14, and **10** on waves 15+) to manage visual intensity. The following classes represent the hostiles deployed against you:

| Class | Appearance | Spawn Wave | Base Speed | Threat Description / Ability |
| :--- | :--- | :--- | :--- | :--- |
| **Drone** | Orange Fighter | Wave 1+ | `0.5` - `0.8` | Common, light unit. Moves straight or in gentle sines. |
| **Interceptor** | Magenta Jet | Wave 3+ | `0.9` - `1.3` | Elite fast unit. Moves in complex zig-zag and cosine patterns. |
| **Kamikaze** | Red Spiked Orb | Wave 5+ | Fast Scaling | Once they reach the center of the display, they charge directly down at you. |
| **Cruiser** | Gold Gunship | Wave 9+ | `0.189` - `0.315` | Armored (2 HP). Has a queue of 2-3 words and fires single-letter plasma bullets (15 dmg). |
| **Anomaly** | Purple Crystal | Wave 16+ | `0.045` | Mid-wave mini-boss (25% chance on Primes). Emits EMP pulses that lock abilities and scramble words. |
| **Shield Linker** | Blue Support Barge | Wave 17+ | `0.32` - `0.44` | Links to exactly one Drone or Interceptor, making it invulnerable. Self-destructs if its target hits the player. |
| **Stealth Cloaker** | Purple Camo Ship | Wave 21+ | `0.425` - `0.595` | Periodically cloaks (opacity drops to 5%) for 2.6–3.2s. Typing a correct letter reveals them. |
| **Replicator** | Purple Double Diamond | Wave 25+ | `0.405` - `0.540` | Fills a violet charge ring. Once charged (flashes red above 75%), splits into two faster child units. |

> [!WARNING]
> **Single-Letter Bullets**: Fired by cruisers, bosses, and anomalies. They are colored white and can be typed by **anyone**. If a letter-bullet reaches the bottom threshold, it causes an instant **Game Over** for the entire squad!

---

## 🛠️ Local Development Setup

To run the full-stack game locally on your machine:

### 1. Install Dependencies
Install all package dependencies for the Express backend and React frontend:
```bash
npm install
```

### 2. Build the Client
Compile the production-ready React client bundle using Vite:
```bash
npm run build
```

### 3. Start the Server
Run the Express + WebSocket server:
```bash
node server.js
```
The game will now be hosted on [http://localhost:3001](http://localhost:3001). Open multiple browser windows to test the multiplayer lobbies and leaderboard synchronization!

> [!TIP]
> For active frontend development with hot-reloading, run `npm run dev` alongside the backend server.

---

## 💻 Desktop PC App (Electron)

VanguarDZ can also be compiled and packaged as a standalone desktop PC application for Windows.

### 1. Run in Desktop Dev Mode
To launch the game locally in a borderless fullscreen window directly from your terminal:
```bash
npm run desktop:start
```

### 2. Package Standalone Windows Executable Folder
To compile the game into a portable unpacked folder:
```bash
npm run desktop:package
```
Output is written to `desktop-app/release/VanguarDZ-win32-x64/`.

### 3. Build Single Setup Installer File
To package the app into a single standalone installer (`VanguarDZ-Setup.exe`) that you can distribute:
```bash
npm run desktop:installer
```
The compiled installer file will be located at `desktop-app/release/installer/VanguarDZ-Setup.exe`.
*(Note: A copy of this installer is automatically placed in the `public/` directory so players can download the desktop app directly from your web host).*

---

## 🚀 Deployment Guide

### Hosting on **Render** (Recommended)
1. Push the codebase to a GitHub repository.
2. Create a new **Web Service** on Render.
3. Configure the service with:
   * **Runtime**: `Node`
   * **Build Command**: `npm install && npm run build`
   * **Start Command**: `node server.js`
4. Render will deploy the service and provide an `https://...` URL. The React client automatically upgrades its WebSockets to `wss://` on the same URL!

### Hosting on **Vercel** (Frontend) + Render (Backend)
If you host the frontend on Vercel:
1. Connect your repository to Vercel (disabling standard server-side APIs if configuring only static routing).
2. Configure the **Git connection settings** in the Vercel Dashboard to point to `https://github.com/Shreeprasandh/VanguarDZ.git`.
3. Provide the backend websocket server address in the client environment variables (`REACT_APP_WS_URL`) if hosting the server elsewhere.

---

## 🎮 How to Play

1. **Create Profile**: Choose your pilot name and select a ship color (**Red**, **Blue**, or **Green**).
2. **Solo Mode**: Type descending words. Maintain your typing streak to increase your score multiplier and charge your tactical abilities.
3. **Co-op Mode**:
   * Create a room, share the 4-letter room code, and wait for your squad to join.
   * Coordinate colors: make sure there is a player representing each color!
   * **Only type words of your color!**
   * Keep an eye out for **white letter-bullets** and type them immediately to protect your squad's hulls.

---
*Created with 💙 by the VanguarDZ Team.*
