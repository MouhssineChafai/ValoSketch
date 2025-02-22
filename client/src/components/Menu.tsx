'use client';

import { Dispatch, SetStateAction, useState } from 'react';

interface MenuProps {
  onCreateLobby: () => void;
  onJoinLobby: (code: string) => void;
  username: string;
  setUsername: Dispatch<SetStateAction<string>>;
  error: string;
  setError: Dispatch<SetStateAction<string>>;
}

export default function Menu({ onCreateLobby, onJoinLobby, username, setUsername, error, setError }: MenuProps) {
  const [lobbyCode, setLobbyCode] = useState('');
  
  const valorantFont = {
    fontFamily: "'VALORANT', sans-serif"
  };

  const handleJoinClick = () => {
    if (!username || !lobbyCode) {
      return;
    }
    onJoinLobby(lobbyCode);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <div className="w-full max-w-[600px] text-center">
        <h1 
          className="text-7xl font-bold mb-2"
          style={valorantFont}
        >
          VALOSKETCH
        </h1>
        <p className="text-base mb-16 tracking-[0.2em] text-[#9ea4bc] font-light">
          Draw, Guess, and Compete in the Ultimate Valorant Pictionary Game
        </p>
        
        {error && (
          <div className="bg-red-500/50 border border-red-400 text-white px-4 py-3 rounded relative mb-4
            flex items-center justify-between"
          >
            {error}
            <button
              onClick={() => setError('')}
              className="ml-4 hover:text-white/80 transition-colors"
              aria-label="Close error message"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}

        <div className="space-y-6">
          <input
            type="text"
            placeholder="Enter username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-4 bg-white/10 border border-white/20 rounded 
              text-white placeholder-gray-400 focus:outline-none focus:border-white/40
              tracking-wider"
          />
          
          <div className="flex gap-4">
            <button
              onClick={onCreateLobby}
              disabled={!username}
              className="relative flex-1 py-4 bg-[#ff4655] text-white rounded 
                hover:bg-[#ff5865] transition-colors uppercase tracking-widest font-bold
                border-2 border-[#ff4655] hover:border-white
                disabled:opacity-100 disabled:cursor-not-allowed"
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="transform translate-y-[-1px]">
                  Custom Lobby
                </span>
              </div>
            </button>
            
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                placeholder="Lobby code"
                value={lobbyCode}
                onChange={(e) => setLobbyCode(e.target.value.toUpperCase())}
                className="flex-1 p-4 bg-white/10 border border-white/20 rounded 
                  text-white placeholder-gray-400 focus:outline-none focus:border-white/40
                  tracking-wider uppercase"
              />
              <button
                onClick={handleJoinClick}
                disabled={!username || !lobbyCode}
                className="px-8 py-4 bg-transparent text-white rounded 
                  hover:bg-white/10 transition-colors uppercase tracking-widest
                  border-2 border-white/50 hover:border-white font-bold
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="transform translate-y-[-1px]">
                  Join
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 