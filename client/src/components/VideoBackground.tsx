'use client';

interface VideoBackgroundProps {
  gameState?: 'menu' | 'lobby' | 'game';
}

export default function VideoBackground({ gameState = 'menu' }: VideoBackgroundProps) {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute min-w-full min-h-full object-cover"
        style={{
          filter: 'brightness(0.6)'
        }}
      >
        <source src="/background.mp4" type="video/mp4" />
      </video>
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.4) 100%)'
        }}
      />
    </div>
  );
} 