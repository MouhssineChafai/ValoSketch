'use client';

import dynamic from 'next/dynamic';
import DynamicGameWrapper from '@/components/DynamicGameWrapper';

const GameInterface = dynamic(
  () => import('@/components/GameInterface'),
  { 
    ssr: false,
    loading: () => (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading game...</div>
      </div>
    )
  }
);

export default function Home() {
  return <DynamicGameWrapper />;
}
