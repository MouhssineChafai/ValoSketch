'use client';

import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import GameInterface from '@/components/GameInterface';

export default function LobbyPage() {
  const params = useParams();
  const lobbyCode = params.code as string;
  const router = useRouter();
  
  // Validate lobby code format (you can adjust the regex based on your code format)
  const isValidFormat = /^[A-Z0-9]{6,32}$/.test(lobbyCode);

  if (!isValidFormat) {
    router.replace('/');
    return null;
  }
  
  return <GameInterface initialLobbyId={lobbyCode} />;
} 