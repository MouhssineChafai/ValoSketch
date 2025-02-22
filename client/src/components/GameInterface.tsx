'use client';

import { useState, useEffect, Suspense } from 'react';
import { io, Socket } from 'socket.io-client';
import Lobby from './Lobby';
import Game from './Game';
import VideoBackground from './VideoBackground';
import { useRouter } from 'next/navigation';
import Menu from './Menu';
import type { GameState } from '../types';
import { generateLobbyId } from '../utils/helpers';

// Add Valorant font (you'll need to add this font to your project)
const valorantFont = {
  fontFamily: "'VALORANT', sans-serif"
};

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center text-white">
      <VideoBackground />
      <div className="text-lg">Loading...</div>
    </div>
  );
}

interface GameInterfaceProps {
  initialLobbyId?: string;
}

export default function GameInterface({ initialLobbyId }: GameInterfaceProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<GameState>('menu');
  const [lobbyId, setLobbyId] = useState<string>(initialLobbyId || '');
  const [error, setError] = useState('');
  const router = useRouter();
  const [username, setUsername] = useState('');

  // Auto-hide error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError('');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (initialLobbyId) {
      // Verify lobby exists when accessing directly
      socket?.emit('verify_lobby', initialLobbyId);
    }
  }, [initialLobbyId, socket]);

  useEffect(() => {
    let socketInstance: Socket | null = null;

    const connectSocket = () => {
      socketInstance = io('http://localhost:3001', {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000
      });

      socketInstance.on('connect', () => {
        console.log('Connected to server');
        setError('');
      });

      socketInstance.on('lobby_verified', (exists: boolean) => {
        if (exists) {
          setGameState('lobby');
        } else {
          setError('Lobby not found');
          router.replace('/');
        }
      });

      socketInstance.on('connect_error', (error) => {
        console.error('Connection error:', error);
        setError('Failed to connect to server. Retrying...');
      });

      socketInstance.on('disconnect', (reason) => {
        console.log('Disconnected:', reason);
        if (reason === 'io server disconnect') {
          // Server disconnected us, try to reconnect
          socketInstance?.connect();
        }
      });

      socketInstance.on('error', (message: string) => {
        setError(message);
      });

      socketInstance.on('lobby_created', (newLobbyId: string) => {
        // Just transition to game state when lobby is created
        setGameState('game');
      });

      setSocket(socketInstance);
    };

    connectSocket();

    return () => {
      if (socketInstance) {
        socketInstance.removeAllListeners();
        socketInstance.disconnect();
      }
    };
  }, []);

  const handleCreateLobby = () => {
    if (!username) {
      setError('Please enter a username');
      return;
    }
    // Just generate code and show config screen
    const newLobbyId = generateLobbyId();
    setLobbyId(newLobbyId);
    setGameState('lobby');
  };

  const handleJoinLobby = () => {
    if (!socket || !username || !lobbyId) {
      setError('Please enter both username and lobby code');
      return;
    }
    socket.emit('join_lobby', { lobbyId, username });
  };

  const handleGameStart = () => {
    setGameState('game');
  };

  const handleExit = () => {
    setGameState('menu');
    setLobbyId('');
    if (socket) {
      socket.emit('leave_lobby', lobbyId);
    }
  };

  if (!socket) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        <VideoBackground />
        <div className="text-lg">Connecting to server...</div>
      </div>
    );
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      <div className="relative min-h-screen text-white">
        <VideoBackground />
        
        {gameState === 'menu' ? (
          <Menu
            onCreateLobby={handleCreateLobby}
            onJoinLobby={(code: string) => {
              setLobbyId(code);
              setGameState('lobby');
            }}
            username={username}
            setUsername={setUsername}
            error={error}
            setError={setError}
          />
        ) : gameState === 'lobby' ? (
          <div className="backdrop-blur-sm bg-black/50">
            <Lobby
              lobbyId={lobbyId}
              username={username}
              socket={socket}
              onCreateLobby={(settings) => {
                socket?.emit('create_lobby', {
                  settings,
                  username,
                  lobbyId
                });
              }}
              onExit={handleExit}
              onGameStart={handleGameStart}
            />
          </div>
        ) : (
          <div className="backdrop-blur-sm bg-black/50">
            <Game
              socket={socket}
              lobbyId={lobbyId}
              username={username}
            />
          </div>
        )}
      </div>
    </Suspense>
  );
} 