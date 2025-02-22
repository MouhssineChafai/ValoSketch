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
          socketInstance?.connect();
        }
      });

      socketInstance.on('error', (message: string) => {
        setError(message);
      });

      socketInstance.on('lobby_created', (newLobbyId: string) => {
        setGameState('transitioning');
        router.push(`/lobby/${newLobbyId}`);
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
        <VideoBackground 
          gameState={gameState} 
          onTransitionComplete={() => {
            if (gameState === 'transitioning') {
              setGameState('game');
            }
          }} 
        />
        
        {gameState === 'menu' ? (
          <Menu
            onCreateLobby={handleCreateLobby}
            onJoinLobby={(code: string) => {
              setLobbyId(code);
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
        ) : gameState === 'game' ? (
          <div 
            className="backdrop-blur-sm bg-black/50 transition-opacity duration-500"
            style={{ opacity: gameState === 'game' ? 1 : 0 }}
          >
            <Game
              socket={socket}
              lobbyId={lobbyId}
              username={username}
            />
          </div>
        ) : null}
      </div>
    </Suspense>
  );
} 