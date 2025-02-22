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
    try {
      const lobby = await getLobby(data.lobbyId);
      
      if (!lobby) {
        socket.emit('join_lobby_response', {
          success: false,
          message: 'Lobby not found'
        });
        return;
      }

      // Add the player to the lobby
      lobby.players.push({
        id: socket.id,
        username: data.username,
        score: 0,
        isDrawing: false,
        isHost: false
      });

      // Save updated lobby state
      await saveLobby(data.lobbyId, lobby);

      // Join the socket room
      socket.join(data.lobbyId);

      // Notify everyone in the lobby
      io.to(data.lobbyId).emit('player_joined', lobby.players);
      
      // Send success response with lobbyId
      socket.emit('join_lobby_response', {
        success: true,
        lobbyId: data.lobbyId // Include the lobbyId in the response
      });

    } catch (error) {
      console.error('Error joining lobby:', error);
      socket.emit('join_lobby_response', {
        success: false,
        message: 'Failed to join lobby'
      });
    }
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
    try {
      const lobby = await getLobby(lobbyId);
      
      if (lobby) {
        // Lobby exists
        socket.emit('lobby_verified', true);
      } else {
        // Lobby doesn't exist
        socket.emit('lobby_verified', false);
      }
    } catch (error) {
      console.error('Error verifying lobby:', error);
      socket.emit('lobby_verified', false);
    }
  });
});

function generateLobbyId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 