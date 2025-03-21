'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
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

// First, add an interface for the response type
interface JoinLobbyResponse {
  success: boolean;
  message?: string;
  lobbyId?: string;
}

export default function GameInterface({ initialLobbyId }: GameInterfaceProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<GameState>(initialLobbyId ? 'game' : 'menu');
  const [lobbyId, setLobbyId] = useState<string>(initialLobbyId || '');
  const [error, setError] = useState('');
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [isVerifying, setIsVerifying] = useState(!!initialLobbyId);

  // Auto-hide error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError('');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Handle initial lobby verification
  useEffect(() => {
    if (initialLobbyId && socket?.connected) {
      setIsVerifying(true);
      socket.emit('verify_lobby', initialLobbyId);
    }
  }, [initialLobbyId, socket?.connected]);

  // Create a navigation handler
  const handleNavigation = useCallback((newLobbyId: string) => {
    console.log('Navigating to lobby:', newLobbyId);
    setLobbyId(newLobbyId);
    setGameState('game');
    router.push(`/lobby/${newLobbyId}`);
  }, [router]);

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
        if (initialLobbyId) {
          socketInstance?.emit('verify_lobby', initialLobbyId);
        }
      });

      socketInstance.on('join_lobby_response', (response: JoinLobbyResponse) => {
        console.log('Join lobby response:', response);
        if (response.success && response.lobbyId) {
          setLobbyId(response.lobbyId);
          setGameState('game');
          router.replace(`/lobby/${response.lobbyId}`);
        } else {
          setError(response.message || 'Failed to join lobby');
        }
      });

      socketInstance.on('lobby_verified', (exists: boolean) => {
        setIsVerifying(false);
        if (exists) {
          setGameState('game');
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
        console.log('Lobby created, received ID:', newLobbyId);
        handleNavigation(newLobbyId);
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
  }, [handleNavigation, initialLobbyId, lobbyId, router]);

  // Split the create lobby logic into two functions
  const handleCreateLobby = () => {
    if (!username) {
      setError('Please enter a username');
      return;
    }
    if (!socket?.connected) {
      setError('Not connected to server');
      return;
    }
    // Generate lobby ID when transitioning to lobby screen
    const newLobbyId = generateLobbyId();
    setLobbyId(newLobbyId);
    // Navigate to lobby configuration screen
    setGameState('lobby');
  };

  // Handle lobby creation
  const handleLobbyCreation = (settings: any) => {
    if (!socket?.connected) {
      setError('Not connected to server');
      return;
    }
    
    // Emit create_lobby and let the server handle it
    socket.emit('create_lobby', {
      settings,
      username,
      lobbyId
    });

    // Navigate immediately after emitting
    router.push(`/lobby/${lobbyId}`);
  };

  const handleJoinLobby = (code: string) => {
    if (!username) {
      setError('Please enter a username');
      return;
    }
    if (!socket?.connected) {
      setError('Not connected to server');
      return;
    }
    
    socket.emit('join_lobby', {
      lobbyId: code,
      username
    });
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

  // Show loading state while verifying lobby
  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        <VideoBackground />
        <div className="text-lg">Verifying lobby...</div>
      </div>
    );
  }

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
        />
        
        {gameState === 'menu' ? (
          <Menu
            onCreateLobby={handleCreateLobby}  // No parameters needed here
            onJoinLobby={handleJoinLobby}
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
              onCreateLobby={handleLobbyCreation}  // This one handles the settings
              onExit={handleExit}
              onGameStart={handleGameStart}
            />
          </div>
        ) : gameState === 'game' ? (
          <div 
            className="backdrop-blur-sm bg-black/50"
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