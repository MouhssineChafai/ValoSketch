'use client';

export default function Logo() {
  return (
    <div className="fixed top-8 left-8 z-10">
      <img 
        src="/V_Bug_Negative_Red.png" 
        alt="Valorant Logo" 
        className="w-[1200px] h-[600px] opacity-90 hover:opacity-100"
        style={{
          filter: 'brightness(1) contrast(1.1)'
        }}
      />
    </div>
  );
} 