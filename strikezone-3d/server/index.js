const colyseus = require('colyseus');
const http = require('http');
const express = require('express');
const path = require('path');

// Import game room
const { GameRoom } = require('./rooms/GameRoom');

const app = express();
app.use(express.static(path.join(__dirname, '../client')));

const server = http.createServer(app);
const gameServer = new colyseus.Server({ server });

// Register GameRoom
gameServer.define('game', GameRoom);

const PORT = process.env.PORT || 8080;

server.listen(PORT, () => {
    console.log(`StrikeZone 3D server listening on port ${PORT}`);
    console.log(`Open http://localhost:${PORT} in your browser`);
});
