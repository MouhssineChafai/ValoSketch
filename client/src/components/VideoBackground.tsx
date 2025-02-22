'use client';

export default function VideoBackground() {
  return (
    <div className="fixed top-0 left-0 w-full h-full -z-10 overflow-hidden">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute min-w-full min-h-full object-cover"
        style={{
          filter: 'brightness(0.6)'  // Darken the video slightly
        }}
      >
        <source src="/background.mp4" type="video/mp4" />
      </video>
      {/* Overlay gradient for better text readability */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.4) 100%)'
        }}
      />
    </div>
  );
} 