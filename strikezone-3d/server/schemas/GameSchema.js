const { Schema, type } = require('@colyseus/schema');

// Player schema
class PlayerState extends Schema {
    static define() {
        return {
            sessionId: 'string',
            team: 'number',
            classType: 'number',
            x: 'number',
            y: 'number',
            z: 'number',
            yaw: 'number',
            pitch: 'number',
            health: 'number',
            maxHealth: 'number',
            ammo: 'number',
            maxAmmo: 'number',
            grenades: 'number',
            abilityCooldown: 'number',
            isAlive: 'boolean',
            kills: 'number',
            deaths: 'number'
        };
    }
}

// Game state schema
class GameState extends Schema {
    static define() {
        return {
            players: [PlayerState],
            timeRemaining: 'number',
            blueScore: 'number',
            redScore: 'number',
            winningScore: 'number',
            gamePhase: 'number'
        };
    }
}

module.exports = { PlayerState, GameState };
