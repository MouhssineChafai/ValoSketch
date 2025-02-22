'use client';

import { useEffect, useState } from 'react';

interface VideoBackgroundProps {
  gameState?: 'menu' | 'lobby' | 'game';
  onTransitionComplete?: () => void;
}

export default function VideoBackground({ gameState = 'menu', onTransitionComplete }: VideoBackgroundProps) {
  const [videoSource, setVideoSource] = useState('/background.mp4');
  const [opacity, setOpacity] = useState(1);
  const [previousState, setPreviousState] = useState(gameState);

  useEffect(() => {
    // Only apply fade effect when transitioning from lobby to game
    if (gameState === 'game' && previousState === 'lobby') {
      // Fade out current video
      setOpacity(0);
      // Wait for fade out, then change source and fade in
      setTimeout(() => {
        setVideoSource('/background_2.mp4');
        setTimeout(() => {
          setOpacity(1);
          // Notify parent when transition is complete
          onTransitionComplete?.();
        }, 50);
      }, 500);
    } else if (gameState !== 'game') {
      // Instantly switch back to menu video without fade
      setOpacity(1);
      setVideoSource('/background.mp4');
    }

    setPreviousState(gameState);
  }, [gameState, previousState, onTransitionComplete]);

  return (
    <div className="fixed top-0 left-0 w-full h-full -z-10 overflow-hidden">
      <video
        autoPlay
        loop
        muted
        playsInline
        key={videoSource}
        className="absolute min-w-full min-h-full object-cover"
        style={{
          filter: 'brightness(0.6)',
          transition: 'opacity 0.5s ease-in-out',
          opacity: opacity
        }}
      >
        <source src={videoSource} type="video/mp4" />
      </video>
      {/* Overlay gradient for better text readability */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.4) 100%)',
          transition: 'opacity 0.5s ease-in-out',
          opacity: opacity
        }}
      />
    </div>
  );
} 