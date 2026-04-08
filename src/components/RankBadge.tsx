import { getCurrentRank, getNextRank, getProgressToNextRank, getXP, RANKS } from '../data/ranks';
import { useState } from 'react';

export default function RankBadge() {
  const [showAll, setShowAll] = useState(false);
  const rank = getCurrentRank();
  const nextRank = getNextRank();
  const progress = getProgressToNextRank();
  const xp = getXP();

  return (
    <>
      <div
        className="bg-soviet-900/60 rounded-lg p-5 border border-gold-500/30 cursor-pointer hover:border-gold-500/60 transition-colors"
        onClick={() => setShowAll(!showAll)}
      >
        <div className="flex items-center gap-4">
          <span className="text-4xl">{rank.icon}</span>
          <div className="flex-1">
            <div className="flex items-baseline gap-2">
              <h3 className="font-['Oswald'] text-lg font-bold text-gold-400 uppercase tracking-wide">
                {rank.name}
              </h3>
              <span className="text-sm text-soviet-400">({rank.nameRu})</span>
            </div>
            <p className="text-sm text-soviet-400 mt-0.5">{xp} XP</p>
            {nextRank && (
              <div className="mt-2">
                <div className="flex justify-between text-xs text-soviet-500 mb-1">
                  <span>{rank.name}</span>
                  <span>{nextRank.name} ({nextRank.minXP} XP)</span>
                </div>
                <div className="h-2 bg-soviet-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-soviet-500 to-gold-500 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* All Ranks */}
      {showAll && (
        <div className="bg-soviet-900/60 rounded-lg p-5 border border-soviet-700 space-y-2">
          <h4 className="font-['Oswald'] text-sm font-bold text-gold-400 uppercase tracking-wide mb-3">Alle Raenge</h4>
          {RANKS.map(r => {
            const achieved = xp >= r.minXP;
            const isCurrent = r.id === rank.id;
            return (
              <div
                key={r.id}
                className={`flex items-center gap-3 p-2 rounded-lg ${
                  isCurrent ? 'bg-gold-500/10 border border-gold-500/30' : ''
                }`}
              >
                <span className={`text-xl ${achieved ? '' : 'grayscale opacity-40'}`}>{r.icon}</span>
                <div className="flex-1">
                  <span className={`text-sm font-medium ${achieved ? 'text-soviet-100' : 'text-soviet-600'}`}>
                    {r.name}
                  </span>
                  <span className={`text-xs ml-2 ${achieved ? 'text-soviet-400' : 'text-soviet-700'}`}>
                    ({r.nameRu})
                  </span>
                </div>
                <span className={`text-xs ${achieved ? 'text-gold-500' : 'text-soviet-700'}`}>
                  {r.minXP} XP
                </span>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
