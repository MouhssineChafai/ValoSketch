'use client';

interface ScoreBoardProps {
  scores: Array<{username: string, score: number}>;
  currentDrawer: string;
}

export default function ScoreBoard({ scores, currentDrawer }: ScoreBoardProps) {
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-700">
        Players
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {scores.map((player, i) => (
          <div 
            key={i}
            className={`p-4 flex justify-between items-center border-b border-gray-700/50 ${
              player.username === currentDrawer ? 'bg-red-500/20' : ''
            }`}
          >
            <div className="flex items-center gap-2">
              {player.username === currentDrawer && (
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  fill="currentColor" 
                  className="w-5 h-5 text-red-500"
                >
                  <path d="M21.731 2.269a2.625 2.625 0 00-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 000-3.712zM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 00-1.32 2.214l-.8 2.685a.75.75 0 00.933.933l2.685-.8a5.25 5.25 0 002.214-1.32L19.513 8.2z" />
                </svg>
              )}
              <span className="font-medium">{player.username}</span>
            </div>
            <div className="font-bold text-lg">{player.score}</div>
          </div>
        ))}
      </div>
    </div>
  );
} 