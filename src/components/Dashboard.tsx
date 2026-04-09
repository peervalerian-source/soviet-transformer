import { useState } from 'react';
import type { VocabWord } from '../data/vocabulary';
import { getTodayStats, getStreak, getWeeklyStats } from '../data/progress';
import RankBadge from './RankBadge';
import { getXP } from '../data/ranks';

interface Props {
  words: VocabWord[];
  hasApiKey: boolean;
  onNavigate: (view: string) => void;
}

export default function Dashboard({ words, hasApiKey, onNavigate }: Props) {
  const todayStats = getTodayStats();
  const streak = getStreak();
  const weeklyStats = getWeeklyStats();

  const newCount = words.filter(w => w.mastery === 'new').length;
  const learningCount = words.filter(w => w.mastery === 'learning').length;
  const masteredCount = words.filter(w => w.mastery === 'mastered').length;
  const accuracy = todayStats.totalAnswers > 0
    ? Math.round((todayStats.correctAnswers / todayStats.totalAnswers) * 100)
    : 0;

  const maxDaily = Math.max(...weeklyStats.map(s => s.wordsStudied), 1);

  const games = [
    { id: 'match', name: 'Wort-Match', desc: 'Verbinde Russisch-Deutsch Paare', icon: '&#9876;', needsAI: false },
    { id: 'scramble', name: 'Buchstaben-Salat', desc: 'Setze russische Woerter zusammen', icon: '&#9881;', needsAI: false },
    { id: 'speed', name: 'Speed-Round', desc: '60 Sekunden, so viele Woerter wie moeglich', icon: '&#9889;', needsAI: false },
    { id: 'sentence', name: 'Satz-Puzzle', desc: 'Bringe Woerter in die richtige Reihenfolge', icon: '&#9874;', needsAI: false },
    { id: 'review', name: 'Aktive Wiederholung', desc: 'Geuebte Vokabeln in beide Richtungen', icon: '&#9851;', needsAI: false },
    { id: 'fastpace', name: 'Fast Pace', desc: 'Survival-Wortschatz intensiv trainieren', icon: '&#9889;&#9733;', needsAI: false },
    { id: 'story', name: 'Mini-Geschichten', desc: 'Interaktive Stories mit Lueckentexten', icon: '&#9997;', needsAI: true },
    { id: 'chat', name: 'Chat-Simulation', desc: 'Situationen auf Russisch meistern', icon: '&#9742;', needsAI: true },
  ];

  return (
    <div className="space-y-8">
      {/* Rank Badge */}
      <RankBadge />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Woerter" value={words.length} sub="im Arsenal" />
        <StatCard label="Streak" value={streak} sub={streak === 1 ? 'Tag' : 'Tage'} highlight />
        <StatCard label="XP" value={getXP()} sub="gesammelt" />
        <StatCard label="Genauigkeit" value={`${accuracy}%`} sub="heute" />
      </div>

      {/* Mastery Progress */}
      <div className="bg-soviet-900/60 rounded-lg p-6 border border-soviet-700">
        <h3 className="font-['Oswald'] font-semibold text-gold-400 mb-4 uppercase tracking-wide">Fortschritt</h3>
        <div className="flex gap-1 h-5 rounded overflow-hidden bg-soviet-800">
          {masteredCount > 0 && (
            <div
              className="bg-gold-500 transition-all duration-500"
              style={{ width: `${(masteredCount / words.length) * 100}%` }}
            />
          )}
          {learningCount > 0 && (
            <div
              className="bg-soviet-500 transition-all duration-500"
              style={{ width: `${(learningCount / words.length) * 100}%` }}
            />
          )}
          {newCount > 0 && (
            <div
              className="bg-soviet-800 transition-all duration-500"
              style={{ width: `${(newCount / words.length) * 100}%` }}
            />
          )}
        </div>
        <div className="flex gap-6 mt-3 text-sm text-soviet-200">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-gold-500" /> Gemeistert ({masteredCount})
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-soviet-500" /> Am Lernen ({learningCount})
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-soviet-800 border border-soviet-600" /> Neu ({newCount})
          </span>
        </div>
      </div>

      {/* Weekly Activity */}
      <div className="bg-soviet-900/60 rounded-lg p-6 border border-soviet-700">
        <h3 className="font-['Oswald'] font-semibold text-gold-400 mb-4 uppercase tracking-wide">Diese Woche</h3>
        <div className="flex items-end gap-2 h-24">
          {weeklyStats.map((day, i) => {
            const height = day.wordsStudied > 0 ? Math.max((day.wordsStudied / maxDaily) * 100, 8) : 4;
            const dayName = new Date(day.date).toLocaleDateString('de-DE', { weekday: 'short' });
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className={`w-full rounded-t transition-all duration-300 ${
                    day.wordsStudied > 0 ? 'bg-soviet-500' : 'bg-soviet-800'
                  }`}
                  style={{ height: `${height}%` }}
                />
                <span className="text-xs text-soviet-400">{dayName}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Game Modes */}
      <div>
        <h3 className="font-['Oswald'] font-semibold text-gold-400 mb-4 text-lg uppercase tracking-wide">
          &#9733; Trainingsmodule
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {games.map(game => {
            const disabled = game.needsAI && !hasApiKey;
            return (
              <button
                key={game.id}
                onClick={() => !disabled && onNavigate(game.id)}
                disabled={disabled}
                className={`text-left p-5 rounded-lg border transition-all duration-200 ${
                  disabled
                    ? 'bg-soviet-900/30 border-soviet-800 opacity-40 cursor-not-allowed'
                    : 'bg-soviet-900/60 border-soviet-700 hover:border-gold-500 hover:shadow-[0_0_15px_rgba(204,0,0,0.3)] cursor-pointer'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl text-gold-400" dangerouslySetInnerHTML={{ __html: game.icon }} />
                  <div>
                    <h4 className="font-['Oswald'] font-medium text-soviet-100 uppercase tracking-wide">{game.name}</h4>
                    <p className="text-sm text-soviet-300 mt-0.5">{game.desc}</p>
                    {disabled && (
                      <p className="text-xs text-gold-500 mt-1">API-Key in Einstellungen noetig</p>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Easteregg */}
      <EasterEgg onActivate={() => onNavigate('swear')} />
    </div>
  );
}

function EasterEgg({ onActivate }: { onActivate: () => void }) {
  const [clicks, setClicks] = useState(0);

  const handleClick = () => {
    const next = clicks + 1;
    setClicks(next);
    if (next >= 3) {
      setClicks(0);
      onActivate();
    }
  };

  return (
    <div className="text-center py-4">
      <span
        onClick={handleClick}
        className="text-soviet-900/30 text-xs cursor-default select-none hover:text-soviet-800/40 transition-colors"
        title=""
      >
        blyat
      </span>
    </div>
  );
}

function StatCard({ label, value, sub, highlight }: {
  label: string;
  value: string | number;
  sub: string;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-lg p-4 border ${
      highlight
        ? 'bg-soviet-700/50 border-gold-500'
        : 'bg-soviet-900/60 border-soviet-700'
    }`}>
      <p className="text-sm text-soviet-300 font-['Oswald'] uppercase tracking-wide">{label}</p>
      <p className={`text-3xl font-bold font-['Oswald'] mt-1 ${highlight ? 'text-gold-400' : 'text-soviet-100'}`}>
        {value}
      </p>
      <p className="text-xs text-soviet-400 mt-0.5">{sub}</p>
    </div>
  );
}
