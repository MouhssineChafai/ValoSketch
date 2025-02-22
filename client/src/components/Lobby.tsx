'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Socket } from 'socket.io-client';

interface LobbyProps {
  lobbyId: string;
  username: string;
  socket: Socket | null;
  onCreateLobby: (settings: any) => void;
  onExit: () => void;
  onGameStart: () => void;
}

interface Player {
  id: string;
  username: string;
  score: number;
  isDrawing: boolean;
  isHost: boolean;
}

const defaultCategories = {
  agents: true,
  maps: false,
  guns: false,
  skins: false,
  abilities: false
} as const;

type CategoryKey = keyof typeof defaultCategories;

function isValidCategory(category: string): category is CategoryKey {
  return category in defaultCategories;
}

export default function Lobby({ lobbyId, username, socket, onCreateLobby, onExit, onGameStart }: LobbyProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showCopyNotification, setShowCopyNotification] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  
  const [settings, setSettings] = useState({
    drawingTime: 90,
    rounds: 3,
    firstGuessDelay: 5,
    categories: {
      agents: true,
      maps: false,
      guns: false,
      skins: false,
      abilities: false
    },
    modifiers: {
      reduceTimeOnGuess: true,
      allowReroll: true
    },
    maxPlayers: 10
  });

  const handleExit = useCallback(() => {
    socket?.emit('leave_lobby', lobbyId);
    router.push('/');
    onExit();
  }, [socket, lobbyId, router, onExit]);

  useEffect(() => {
    if (!socket) return;

    socket.on('lobby_created', (newLobbyId: string) => {
      onGameStart();
    });

    socket.on('player_joined', (updatedPlayers: Player[]) => {
      setPlayers(updatedPlayers);
    });

    socket.on('player_left', (updatedPlayers: Player[]) => {
      setPlayers(updatedPlayers);
    });

    socket.on('settings_updated', (newSettings: any) => {
      setSettings(newSettings);
    });

    socket.on('game_started', () => {
      onGameStart();
    });

    return () => {
      socket.off('player_joined');
      socket.off('player_left');
      socket.off('settings_updated');
      socket.off('game_started');
      socket.off('lobby_created');
    };
  }, [socket, onGameStart]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        handleExit();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleExit]);

  const startGame = () => {
    socket?.emit('start_game', lobbyId);
  };

  const updateSettings = (newSettings: any) => {
    socket?.emit('update_settings', { lobbyId, settings: newSettings });
  };

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(lobbyId);
    setShowCopyNotification(true);
    setTimeout(() => setShowCopyNotification(false), 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-black/50">
      <div 
        ref={modalRef}
        className="w-full max-w-[600px] bg-[#1A1F24]/90 backdrop-blur-sm rounded-lg p-8 border border-white/10 relative"
      >
        {/* Exit Button */}
        <button
          onClick={handleExit}
          className="absolute top-6 right-6 p-2 text-white/50 hover:text-white transition-colors"
          aria-label="Close lobby"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="3"
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        {/* Host Tag */}
        <div className="flex items-center gap-2 mb-6">
          <span className="text-sm uppercase tracking-wider text-white/50">Host</span>
          <span className="px-3 py-1 bg-[#ff4655]/10 rounded text-[#ff4655] text-sm 
            border border-[#ff4655]/20 font-medium tracking-wide">
            {username}
          </span>
        </div>

        {/* Lobby Header */}
        <div className="mb-8">
          
          {/* Valorant-style code display */}
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <div className="absolute inset-0 bg-[#ff4655]/10 rounded transform skew-x-12" />
              <div 
                className="relative px-4 py-[0.43rem] border-2 border-[#ff4655]/50 rounded
                  bg-gradient-to-r from-[#1A1F24]/80 to-[#1A1F24]/40"
              >
                <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-[#ff4655]" />
                <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-[#ff4655]" />
                <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-[#ff4655]" />
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-[#ff4655]" />
                <p className="text-lg font-mono tracking-[0.2em] text-center text-white">
                  {lobbyId}
                </p>
              </div>
            </div>
            
            <div className="relative">
              <button 
                onClick={handleCopyCode}
                className="px-4 py-3 bg-white/10 hover:bg-white/20 rounded 
                  border border-white/20 hover:border-white/40 transition-all
                  text-sm tracking-wider uppercase whitespace-nowrap"
              >
                <span className="flex items-center gap-2">
                  Copy Code
                  {showCopyNotification && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="green"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="transition-opacity duration-200"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Players Section */}
        <div className="mb-8">
          <div className="space-y-2">
            {players.map((player) => (
              <div 
                key={player.id}
                className="flex items-center justify-between p-3 bg-white/5 rounded
                  border border-white/10"
              >
                <span className="tracking-wide" style={{ fontFamily: 'inherit' }}>{player.username}</span>
                {player.isHost && (
                  <span className="text-[#ff4655] text-sm tracking-wider">HOST</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Word Categories */}
        <div className="mb-8">
          <h3 className="text-sm tracking-wider text-white/70 uppercase mb-4">Word Categories</h3>
          <div className="grid grid-cols-2 gap-4">
            {Object.keys(defaultCategories).map((category) => (
              isValidCategory(category) && (
                <label key={category} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={settings.categories[category]}
                    onChange={(e) => setSettings({
                      ...settings,
                      categories: { ...settings.categories, [category]: e.target.checked }
                    })}
                    className="hidden"
                  />
                  <div className="w-5 h-5 border-2 border-white/30 rounded-sm relative
                    group-hover:border-white/50 transition-colors flex items-center justify-center
                    bg-[#1A1F24]"
                  >
                    {settings.categories[category] && (
                      <div className="absolute inset-0 bg-[#ff4655] rounded-sm flex items-center justify-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="white"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <span className="text-white/70 group-hover:text-white transition-colors capitalize">
                    {category}
                  </span>
                </label>
              )
            ))}
          </div>
        </div>

        {/* Game Settings */}
        <div className="mb-8">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-lg tracking-wider text-white/90 
              hover:text-white mb-4 w-full p-3 rounded
              transition-all duration-200 relative
              hover:bg-white/[0.03]"
          >
            <span className="uppercase font-bold">Advanced Options</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`transform transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          <div className={`grid grid-cols-2 gap-4 transition-all duration-300 ${
            showAdvanced 
              ? 'opacity-100 max-h-[1000px]' 
              : 'opacity-0 max-h-0 overflow-hidden'
          }`}>
            <div>
              <label className="block mb-2 text-sm tracking-wider text-white/70 uppercase">Drawing Time</label>
              <select
                value={settings.drawingTime}
                onChange={(e) => setSettings({ ...settings, drawingTime: parseInt(e.target.value) })}
                className="w-full px-4 py-2 bg-[#1A1F24] border border-[#333940] rounded 
                  text-white focus:outline-none focus:border-[#ff4655]
                  tracking-wider appearance-none cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 12px center'
                }}
              >
                {[15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 200, 300].map((time) => (
                  <option key={time} value={time}>{time}s</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-2 text-sm tracking-wider text-white/70 uppercase">Rounds</label>
              <select
                value={settings.rounds}
                onChange={(e) => setSettings({ ...settings, rounds: parseInt(e.target.value) })}
                className="w-full px-4 py-2 bg-[#1A1F24] border border-[#333940] rounded 
                  text-white focus:outline-none focus:border-[#ff4655]
                  tracking-wider appearance-none cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 12px center'
                }}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((round) => (
                  <option key={round} value={round}>{round}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-2 text-sm tracking-wider text-white/70 uppercase">Max Players</label>
              <select
                value={settings.maxPlayers}
                onChange={(e) => setSettings({ ...settings, maxPlayers: parseInt(e.target.value) })}
                className="w-full px-4 py-2 bg-[#1A1F24] border border-[#333940] rounded 
                  text-white focus:outline-none focus:border-[#ff4655]
                  tracking-wider appearance-none cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 12px center'
                }}
              >
                {[5, 10, 20, 30, 40, 50].map((players) => (
                  <option key={players} value={players}>{players}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-2 text-sm tracking-wider text-white/70 uppercase">First Guess Delay</label>
              <select
                value={settings.firstGuessDelay}
                onChange={(e) => setSettings({ ...settings, firstGuessDelay: parseInt(e.target.value) })}
                className="w-full px-4 py-2 bg-[#1A1F24] border border-[#333940] rounded 
                  text-white focus:outline-none focus:border-[#ff4655]
                  tracking-wider appearance-none cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 12px center'
                }}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((delay) => (
                  <option key={delay} value={delay}>{delay}s</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Create Lobby Button */}
        <button
          onClick={() => onCreateLobby(settings)}
          className="w-full py-4 bg-[#ff4655] text-white rounded 
            hover:bg-[#ff5865] transition-colors uppercase tracking-widest font-bold
            border-2 border-[#ff4655] hover:border-white"
        >
          Create Lobby
        </button>
      </div>
    </div>
  );
}