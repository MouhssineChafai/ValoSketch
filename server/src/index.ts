import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { saveLobby, getLobby, deleteLobby, lobbyExists } from './firebase';
import type { GameState, Player, GameSettings, LobbyState } from './types';

const app = express();
app.use(cors()); // Enable CORS for all routes

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling'], // Add both transports
  allowEIO3: true // Enable compatibility mode
});

// Socket.IO event handlers
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Handle creating a new lobby
  socket.on('create_lobby', async (data: { 
    settings: GameSettings, 
    username: string,
    lobbyId: string 
  }) => {
    console.log('Creating lobby with settings:', data.settings);
    try {
      const lobbyId = data.lobbyId;
      const lobbyState: LobbyState = {
        lobbyId,
        players: [{
          id: socket.id,
          username: data.username,
          score: 0,
          isDrawing: false,
          isHost: true
        }],
        currentRound: 0,
        currentTurn: 0,
        settings: data.settings,
        status: 'waiting',
        host: socket.id
      };
      
      await saveLobby(lobbyId, lobbyState);
      socket.join(lobbyId);
      socket.emit('lobby_created', lobbyId);
    } catch (error) {
      console.error('Error creating lobby:', error);
      socket.emit('error', 'Failed to create lobby');
    }
  });

  // Handle joining a lobby
  socket.on('join_lobby', async (data: { lobbyId: string, username: string }) => {
    console.log('Join lobby attempt:', data);
    const lobby = await getLobby(data.lobbyId);
    
    if (!lobby) {
      socket.emit('error', 'Lobby not found');
      return;
    }

    if (lobby.status !== 'waiting') {
      socket.emit('error', 'Game already in progress');
      return;
    }

    const newPlayer = {
      id: socket.id,
      username: data.username,
      score: 0,
      isDrawing: false,
      isHost: false
    };

    lobby.players.push(newPlayer);
    socket.join(data.lobbyId);
    
    io.to(data.lobbyId).emit('player_joined', lobby.players);
    socket.emit('joined_lobby', {
      lobbyId: data.lobbyId,
      settings: lobby.settings
    });
    await saveLobby(data.lobbyId, lobby);
  });

  socket.on('update_settings', async (data: { lobbyId: string, settings: GameSettings }) => {
    const lobby = await getLobby(data.lobbyId);
    
    if (!lobby || lobby.host !== socket.id) {
      return;
    }

    lobby.settings = data.settings;
    await saveLobby(data.lobbyId, lobby);
    io.to(data.lobbyId).emit('settings_updated', data.settings);
  });

  socket.on('start_game', async (lobbyId: string) => {
    const lobby = await getLobby(lobbyId);
    
    if (!lobby || lobby.host !== socket.id) {
      return;
    }

    lobby.status = 'playing';
    await saveLobby(lobbyId, lobby);
    io.to(lobbyId).emit('game_started');
  });

  socket.on('draw', (data: {
    lobbyId: string;
    from: { x: number; y: number };
    to: { x: number; y: number };
    color: string;
    brushSize: number;
  }) => {
    socket.to(data.lobbyId).emit('draw_line', {
      from: data.from,
      to: data.to,
      color: data.color,
      brushSize: data.brushSize
    });
  });

  socket.on('clear_canvas', (data: { lobbyId: string }) => {
    socket.to(data.lobbyId).emit('clear_canvas');
  });

  socket.on('disconnect', async () => {
    // Find all lobbies this socket is in
    const allLobbies = io.sockets.adapter.rooms;
    for (const [roomId] of allLobbies) {
      const lobby = await getLobby(roomId);
      if (lobby) {
        const playerIndex = lobby.players.findIndex((p: Player) => p.id === socket.id);
        
        if (playerIndex !== -1) {
          lobby.players.splice(playerIndex, 1);
          
          if (lobby.players.length === 0) {
            await deleteLobby(roomId);
          } else if (lobby.host === socket.id) {
            // Transfer host to next player
            lobby.host = lobby.players[0].id;
            lobby.players[0].isHost = true;
            await saveLobby(roomId, lobby);
          }
          
          io.to(roomId).emit('player_left', lobby.players);
        }
      }
    }
  });

  socket.on('verify_lobby', async (lobbyId: string) => {
    const exists = await lobbyExists(lobbyId);
    socket.emit('lobby_verified', exists);
  });
});

function generateLobbyId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 