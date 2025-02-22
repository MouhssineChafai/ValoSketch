'use client';

import { useEffect, useState } from 'react';
import DrawingCanvas from './DrawingCanvas';

interface GameProps {
  socket: any;
  lobbyId: string;
  username: string;
}

export default function Game({ socket, lobbyId, username }: GameProps) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentWord, setCurrentWord] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    socket.on('your_turn', (word: string) => {
      setIsDrawing(true);
      setCurrentWord(word);
    });

    socket.on('turn_end', () => {
      setIsDrawing(false);
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
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4 flex justify-between items-center">
          <div>Time Left: {timeLeft}s</div>
          {isDrawing && <div>Word to draw: {currentWord}</div>}
        </div>
        
        <DrawingCanvas
          isDrawing={isDrawing}
          socket={socket}
          lobbyId={lobbyId}
        />
      </div>
    </div>
  );
} 