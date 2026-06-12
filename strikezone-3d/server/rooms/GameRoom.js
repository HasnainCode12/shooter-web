const colyseus = require('colyseus');
const { PlayerState, GameState } = require('../schemas/GameSchema');

// Class definitions based on GDD
const CLASSES = {
    AR: { health: 100, speed: 5.5, damage: 18, headshotMult: 1.5, fireRate: 600, magazine: 30, reloadTime: 2000 },
    Sniper: { health: 80, speed: 4.8, damage: 80, headshotMult: 1.5, fireRate: 50, magazine: 5, reloadTime: 3500 },
    SMG: { health: 90, speed: 6.2, damage: 10, headshotMult: 1.3, fireRate: 900, magazine: 40, reloadTime: 1800 },
    Grenadier: { health: 100, speed: 5.0, damage: 90, headshotMult: 1.0, fireRate: 40, magazine: 4, reloadTime: 2500 }
};

class GameRoom extends colyseus.Room {
    onCreate(options) {
        this.setState(new GameState());
        this.state.winningScore = 50;
        this.state.timeRemaining = 600; // 10 minutes
        this.state.blueScore = 0;
        this.state.redScore = 0;
        this.state.gamePhase = 0; // waiting
        
        this.spawnPoints = {
            blue: [
                { x: -40, y: 0, z: -40 },
                { x: -40, y: 0, z: 0 },
                { x: -40, y: 0, z: 40 },
                { x: -30, y: 0, z: -20 }
            ],
            red: [
                { x: 40, y: 0, z: -40 },
                { x: 40, y: 0, z: 0 },
                { x: 40, y: 0, z: 40 },
                { x: 30, y: 0, z: -20 }
            ]
        };

        // Matchmaking simulation - start when 8 players join
        this.on('message', (client, data) => {
            if (data.type === 'join') {
                this.handleJoin(client, data);
            } else if (data.type === 'input') {
                this.handleInput(client, data);
            } else if (data.type === 'shoot') {
                this.handleShoot(client, data);
            } else if (data.type === 'ability') {
                this.handleAbility(client, data);
            } else if (data.type === 'respawn') {
                this.handleRespawn(client, data);
            }
        });

        // Game loop - 30 Hz
        this.setSimulationInterval(() => this.gameLoop(), 33);
        
        // Timer countdown
        setInterval(() => {
            if (this.state.gamePhase === 2 && this.state.timeRemaining > 0) {
                this.state.timeRemaining--;
                if (this.state.timeRemaining <= 0) {
                    this.endGame();
                }
            }
        }, 1000);
    }

    handleJoin(client, data) {
        const team = this.state.players.length % 2; // Alternate teams
        const player = new PlayerState();
        player.sessionId = client.sessionId;
        player.team = team;
        player.classType = data.classType || 0; // Default to AR
        player.isAlive = true;
        player.kills = 0;
        player.deaths = 0;
        
        const classData = Object.values(CLASSES)[player.classType];
        player.health = classData.health;
        player.maxHealth = classData.health;
        player.ammo = classData.magazine;
        player.maxAmmo = classData.magazine;
        player.grenades = player.classType === 3 ? 2 : 1;
        player.abilityCooldown = 0;
        
        const spawnPoint = this.spawnPoints[team === 0 ? 'blue' : 'red'][this.state.players.length % 4];
        player.x = spawnPoint.x;
        player.y = spawnPoint.y;
        player.z = spawnPoint.z;
        player.yaw = team === 0 ? 0 : Math.PI;
        player.pitch = 0;
        
        this.state.players.push(player);
        
        // Start game when 8 players
        if (this.state.players.length >= 8 && this.state.gamePhase === 0) {
            this.state.gamePhase = 1; // warmup
            setTimeout(() => {
                this.state.gamePhase = 2; // playing
            }, 10000); // 10 second warmup
        }
    }

    handleInput(client, data) {
        const player = this.state.players.find(p => p.sessionId === client.sessionId);
        if (!player || !player.isAlive) return;
        
        const classData = Object.values(CLASSES)[player.classType];
        const speed = classData.speed;
        
        // Simple movement validation
        if (data.forward) player.z -= speed * 0.033;
        if (data.backward) player.z += speed * 0.033;
        if (data.left) player.x -= speed * 0.033;
        if (data.right) player.x += speed * 0.033;
        
        // Update rotation
        if (data.yaw !== undefined) player.yaw = data.yaw;
        if (data.pitch !== undefined) player.pitch = Math.max(-Math.PI/2, Math.min(Math.PI/2, data.pitch));
        
        // Map bounds
        player.x = Math.max(-50, Math.min(50, player.x));
        player.z = Math.max(-50, Math.min(50, player.z));
    }

    handleShoot(client, data) {
        const shooter = this.state.players.find(p => p.sessionId === client.sessionId);
        if (!shooter || !shooter.isAlive || shooter.ammo <= 0) return;
        
        shooter.ammo--;
        const classData = Object.values(CLASSES)[shooter.classType];
        
        // Simple hitscan logic
        const hitPlayers = this.state.players.filter(p => 
            p.isAlive && p.team !== shooter.team &&
            Math.abs(p.x - shooter.x) < 50 &&
            Math.abs(p.z - shooter.z) < 50
        );
        
        for (const target of hitPlayers) {
            const dx = target.x - shooter.x;
            const dz = target.z - shooter.z;
            const distance = Math.sqrt(dx*dx + dz*dz);
            
            // Check if in crosshair (simplified)
            const angleToTarget = Math.atan2(dx, dz);
            const angleDiff = Math.abs(angleToTarget - shooter.yaw);
            
            if (angleDiff < 0.3 && distance < 50) {
                let damage = classData.damage;
                
                // Headshot check (simplified - if pitch is upward)
                if (shooter.pitch > -0.3) {
                    damage *= classData.headshotMult;
                }
                
                // Damage falloff for some weapons
                if (player.classType === 2 && distance > 15) { // SMG
                    damage *= (1 - (distance - 15) / 10);
                }
                
                target.health -= damage;
                
                if (target.health <= 0) {
                    target.health = 0;
                    target.isAlive = false;
                    target.deaths++;
                    shooter.kills++;
                    
                    // Score update
                    if (shooter.team === 0) {
                        this.state.blueScore++;
                    } else {
                        this.state.redScore++;
                    }
                    
                    // Check win condition
                    if (this.state.blueScore >= 50 || this.state.redScore >= 50) {
                        this.endGame();
                    }
                }
                
                break; // Only hit one target
            }
        }
    }

    handleAbility(client, data) {
        const player = this.state.players.find(p => p.sessionId === client.sessionId);
        if (!player || !player.isAlive || player.abilityCooldown > 0) return;
        
        // Set cooldown based on class
        const cooldowns = [8000, 0, 15000, 20000]; // AR, Sniper, SMG, Grenadier
        player.abilityCooldown = cooldowns[player.classType];
        
        // Apply ability effects (simplified)
        if (player.classType === 0) { // AR slide
            player.z -= 4;
        } else if (player.classType === 2) { // SMG adrenaline
            // Speed boost handled in client
        }
    }

    handleRespawn(client, data) {
        const player = this.state.players.find(p => p.sessionId === client.sessionId);
        if (!player || player.isAlive) return;
        
        const classData = Object.values(CLASSES)[player.classType];
        player.health = classData.health;
        player.ammo = classData.magazine;
        player.isAlive = true;
        
        const spawnPoint = this.spawnPoints[player.team === 0 ? 'blue' : 'red'][Math.floor(Math.random() * 4)];
        player.x = spawnPoint.x;
        player.y = spawnPoint.y;
        player.z = spawnPoint.z;
        player.yaw = player.team === 0 ? 0 : Math.PI;
    }

    gameLoop() {
        // Update ability cooldowns
        this.state.players.forEach(player => {
            if (player.abilityCooldown > 0) {
                player.abilityCooldown -= 33;
            }
            
            // Auto reload
            const classData = Object.values(CLASSES)[player.classType];
            if (player.ammo <= 0 && player.isAlive) {
                // Simplified reload
                setTimeout(() => {
                    if (player.ammo <= 0) {
                        player.ammo = classData.magazine;
                    }
                }, classData.reloadTime);
            }
        });
    }

    endGame() {
        this.state.gamePhase = 3;
        // Send end game message to all clients
        this.broadcast({ type: 'gameOver', winner: this.state.blueScore > this.state.redScore ? 'blue' : 'red' });
        
        // Restart after 10 seconds
        setTimeout(() => {
            this.state.gamePhase = 0;
            this.state.blueScore = 0;
            this.state.redScore = 0;
            this.state.timeRemaining = 600;
            this.state.players.forEach(p => {
                p.kills = 0;
                p.deaths = 0;
                p.isAlive = true;
                const classData = Object.values(CLASSES)[p.classType];
                p.health = classData.health;
                p.ammo = classData.magazine;
            });
        }, 10000);
    }

    onLeave(client) {
        const index = this.state.players.findIndex(p => p.sessionId === client.sessionId);
        if (index !== -1) {
            this.state.players.splice(index, 1);
        }
    }
}

module.exports = { GameRoom };
