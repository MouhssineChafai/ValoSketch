'use client';

import dynamic from 'next/dynamic';

const GameInterface = dynamic(
  () => import('./GameInterface'),
  { 
    ssr: false,
    loading: () => (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading game...</div>
      </div>
    )
  }
);

export default function DynamicGameWrapper() {
  return <GameInterface />;
} 