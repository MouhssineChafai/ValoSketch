'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import GameInterface from '@/components/GameInterface';

export default function LobbyPage() {
  const params = useParams();
  const lobbyCode = params.code as string;
  const router = useRouter();

  // Validate format and redirect if invalid
  useEffect(() => {
    const isValidFormat = /^[A-Z0-9]{6,32}$/.test(lobbyCode);
    if (!isValidFormat) {
      router.replace('/');
    }
  }, [lobbyCode, router]);

  // Return null while redirecting for invalid format
  if (!/^[A-Z0-9]{6,32}$/.test(lobbyCode)) {
    return null;
  }

  return <GameInterface initialLobbyId={lobbyCode} />;
} 