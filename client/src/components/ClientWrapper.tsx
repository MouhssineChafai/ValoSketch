'use client';

import dynamic from 'next/dynamic';

const GameInterface = dynamic(
  () => import('./GameInterface'),
  { ssr: false }
);

export default function ClientWrapper() {
  return <GameInterface />;
} 