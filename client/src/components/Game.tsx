'use client';

import { useEffect, useState } from 'react';
import DrawingCanvas from './DrawingCanvas';
import ChatSystem from './ChatSystem';
import ScoreBoard from './ScoreBoard';

interface GameProps {
  socket: any;
  lobbyId: string;
  username: string;
}

export default function Game({ socket, lobbyId, username }: GameProps) {
  const [scores, setScores] = useState<Array<{username: string, score: number}>>([]);
  const [currentDrawer, setCurrentDrawer] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number>(90);
  const [currentWord, setCurrentWord] = useState<string>('');

  useEffect(() => {
    socket.on('your_turn', (word: string) => {
      setCurrentDrawer(username);
      setCurrentWord(word);
    });

    socket.on('turn_end', () => {
      setCurrentDrawer('');
      setCurrentWord('');
    });

    socket.on('timer_update', (time: number) => {
      setTimeLeft(time);
    });

    return () => {
      socket.off('your_turn');
      socket.off('turn_end');
      socket.off('timer_update');
    };
  }, [socket]);

  return (
    <div className="h-screen p-4 flex gap-4">
      {/* Left sidebar - Scores */}
      <div className="w-64 bg-gray-800/50 rounded-lg p-4">
        <ScoreBoard 
          scores={scores}
          currentDrawer={currentDrawer}
        />
      </div>

      {/* Main content - Drawing Canvas and Tools */}
      <div className="flex-1 flex flex-col gap-4">
        <div className="h-16 bg-gray-800/50 rounded-lg p-4 flex items-center justify-between">
          <div className="text-xl">Time Left: {timeLeft}s</div>
          <div className="text-xl">Word: {currentWord}</div>
        </div>
        
        <div className="flex-1 bg-gray-800/50 rounded-lg overflow-hidden">
          <DrawingCanvas 
            socket={socket}
            lobbyId={lobbyId}
            isDrawing={username === currentDrawer}
          />
        </div>

        <div className="h-24 bg-gray-800/50 rounded-lg p-4">
          {/* Drawing tools */}
          Drawing Tools
        </div>
      </div>

      {/* Right sidebar - Chat */}
      <div className="w-80 bg-gray-800/50 rounded-lg">
        <ChatSystem 
          socket={socket}
          lobbyId={lobbyId}
          username={username}
        />
      </div>
    </div>
  );
} 