'use client';

import { useState, useEffect, useRef } from 'react';

interface Message {
  username: string;
  text: string;
  type: 'chat' | 'system' | 'guess';
}

interface ChatSystemProps {
  socket: any;
  lobbyId: string;
  username: string;
}

export default function ChatSystem({ socket, lobbyId, username }: ChatSystemProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    socket.on('chat_message', (message: Message) => {
      setMessages(prev => [...prev, message]);
    });

    socket.on('system_message', (message: Message) => {
      setMessages(prev => [...prev, { ...message, type: 'system' }]);
    });

    return () => {
      socket.off('chat_message');
      socket.off('system_message');
    };
  }, [socket]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    socket.emit('chat_message', {
      lobbyId,
      username,
      text: input
    });
    setInput('');
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-700">
        Chat
      </div>
      
      <div 
        ref={chatRef}
        className="flex-1 overflow-y-auto p-4 space-y-2"
      >
        {messages.map((msg, i) => (
          <div 
            key={i}
            className={`${
              msg.type === 'system' 
                ? 'text-yellow-400' 
                : msg.type === 'guess' 
                  ? 'text-green-400' 
                  : 'text-white'
            }`}
          >
            <span className="font-bold">{msg.username}: </span>
            {msg.text}
          </div>
        ))}
      </div>

      <form 
        onSubmit={handleSend}
        className="p-4 border-t border-gray-700 flex"
      >
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          className="flex-1 bg-gray-700 rounded-l px-4 py-2 focus:outline-none"
          placeholder="Type your guess..."
        />
        <button 
          type="submit"
          className="bg-red-500 text-white px-4 py-2 rounded-r hover:bg-red-600"
        >
          Send
        </button>
      </form>
    </div>
  );
} 