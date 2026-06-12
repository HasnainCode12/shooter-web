# StrikeZone 3D - Web-Based Tactical FPS

## Overview
StrikeZone 3D is a team-based 4v4 first-person tactical shooter playable directly in your web browser. This implementation includes:

- **4 Distinct Classes**: Assault Rifle, Sniper, SMG, and Grenadier
- **Team Deathmatch**: First team to 50 kills wins, or most kills after 10 minutes
- **3D Graphics**: Built with Three.js for immersive first-person gameplay
- **Authoritative Server**: Colyseus-powered server ensures fair play
- **Real-time Multiplayer**: WebSocket-based communication

## Features Implemented

### Classes
| Class | Health | Speed | Damage | Fire Rate | Magazine | Ability |
|-------|--------|-------|--------|-----------|----------|---------|
| Assault Rifle | 100 | 5.5 m/s | 18 (27 HS) | 600 RPM | 30 | Combat Slide |
| Sniper | 80 | 4.8 m/s | 80 (120 HS) | 50 RPM | 5 | Focus Scope |
| SMG | 90 | 6.2 m/s | 10 (13 HS) | 900 RPM | 40 | Adrenaline Rush |
| Grenadier | 100 | 5.0 m/s | 90 splash | 40 RPM | 4 grenades | Bounce Grenade |

### Controls
- **WASD**: Movement
- **Mouse**: Look/Aim
- **Left Click**: Shoot
- **Q**: Use Class Ability
- **R**: Reload (automatic)

### Game Mechanics
- Team-based spawning (Blue vs Red)
- 5-second respawn timer
- Minimap showing player positions
- Health and ammo tracking
- Score and timer display
- Ability cooldown indicators

## How to Run

### Prerequisites
- Node.js v20+ installed
- Modern web browser (Chrome, Firefox, Edge)

### Starting the Server

```bash
cd /workspace/strikezone-3d
node server/index.js
```

The server will start on **http://localhost:8080**

### Playing the Game

1. Open your browser and navigate to `http://localhost:8080`
2. Click "PLAY" on the main menu
3. Select your class (AR, Sniper, SMG, or Grenadier)
4. Click "JOIN MATCH"
5. Wait for the match to start (requires 8 players for full match, but you can test solo)
6. Click on the game canvas to enable mouse look
7. Use WASD to move and mouse to aim
8. Left-click to shoot, Q to use abilities

## Architecture

### Client (Browser)
- **Three.js**: 3D rendering engine
- **Colyseus.js**: WebSocket client for real-time communication
- **HTML5 Canvas**: Minimap and HUD rendering

### Server (Node.js)
- **Colyseus**: Multiplayer framework with room management
- **@colyseus/schema**: State synchronization
- **Express**: Static file serving

### Network Protocol
- WebSocket connection for real-time game state
- 30 Hz tick rate for smooth gameplay
- Client-side prediction for responsive controls
- Server-authoritative logic for anti-cheat

## File Structure

```
strikezone-3d/
├── client/
│   └── index.html          # Main game client (HTML + CSS + JS)
├── server/
│   ├── index.js            # Server entry point
│   ├── rooms/
│   │   └── GameRoom.js     # Game logic and room management
│   └── schemas/
│       └── GameSchema.js   # State schema definitions
├── package.json            # Dependencies
└── README.md               # This file
```

## Testing

To test the game:

1. **Single Player Test**: Open one browser tab and join a match. You'll be placed on a team.

2. **Multiplayer Test**: Open multiple browser tabs (or use different browsers/incognito windows) to simulate multiple players. The game will automatically assign teams.

3. **Gameplay Tests**:
   - Try each class and their unique abilities
   - Test shooting mechanics and damage
   - Verify score tracking works correctly
   - Check minimap updates in real-time
   - Test respawn system after death

## Next Steps for Full Production

This is a working prototype. For a full production release as specified in the GDD:

1. **Add Physics Engine**: Integrate Cannon-es or Rapier for proper collision detection
2. **Enhanced Map Design**: Create detailed 3D models for the "Foundry" map
3. **Character Models**: Add animated player models instead of capsules
4. **Weapon Models**: Add viewmodel weapons with animations
5. **Sound Effects**: Add shooting, footsteps, and ambient audio
6. **Particle Effects**: Muzzle flashes, hit markers, explosions
7. **Matchmaking Service**: Implement Redis-based matchmaking with Glicko-2 rating
8. **Authentication**: Add JWT-based user accounts
9. **Database**: PostgreSQL for player stats and progression
10. **Anti-Cheat**: Enhanced server validation and heuristic detection
11. **Deployment**: Docker containers with Kubernetes orchestration

## License

MIT License - Free to use and modify
