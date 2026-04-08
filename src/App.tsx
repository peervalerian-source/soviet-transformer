import { useState, useEffect } from 'react';
import { getAllWords, addWords } from './data/vocabulary';
import type { VocabWord } from './data/vocabulary';
import { getDefaultVocabulary, getTransliteration } from './data/anki-deck';
import Dashboard from './components/Dashboard';
import ImportView from './components/ImportView';
import Settings from './components/Settings';
import MatchGame from './modes/games/MatchGame';
import ScrambleGame from './modes/games/ScrambleGame';
import SpeedRound from './modes/games/SpeedRound';
import SentencePuzzle from './modes/games/SentencePuzzle';
import StoryMode from './modes/stories/StoryMode';
import ChatMode from './modes/chat/ChatMode';
import SwearMode from './modes/games/SwearMode';
import { getApiKey } from './ai/client';
import { checkPendingRankUp } from './data/ranks';
import type { Rank } from './data/ranks';
import RankUpModal from './components/RankUpModal';

type View =
  | 'dashboard'
  | 'import'
  | 'settings'
  | 'match'
  | 'scramble'
  | 'speed'
  | 'sentence'
  | 'story'
  | 'chat'
  | 'swear';

function App() {
  const [view, setView] = useState<View>('dashboard');
  const [words, setWords] = useState<VocabWord[]>([]);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [rankUp, setRankUp] = useState<Rank | null>(null);

  const refreshWords = async () => {
    const all = await getAllWords();
    setWords(all);
    // Check for pending rank up notifications
    const pending = checkPendingRankUp();
    if (pending) setRankUp(pending);
  };

  useEffect(() => {
    const init = async () => {
      const existing = await getAllWords();
      if (existing.length === 0) {
        const defaults = getDefaultVocabulary();
        await addWords(defaults);
        setWords(defaults);
      } else {
        // Backfill transliterations if missing
        const needsUpdate = existing.some(w => !w.transliteration);
        if (needsUpdate) {
          const updated = existing.map(w => {
            if (!w.transliteration) {
              const t = getTransliteration(w.russian);
              if (t) return { ...w, transliteration: t };
            }
            return w;
          });
          await addWords(updated);
          setWords(updated);
        } else {
          setWords(existing);
        }
      }
      setHasApiKey(!!getApiKey());
    };
    init();
  }, []);

  const needsWords = words.length < 4;

  const renderView = () => {
    switch (view) {
      case 'dashboard':
        return <Dashboard words={words} hasApiKey={hasApiKey} onNavigate={(v) => setView(v as View)} />;
      case 'import':
        return <ImportView onDone={() => { refreshWords(); setView('dashboard'); }} />;
      case 'settings':
        return <Settings onApiKeyChange={() => setHasApiKey(!!getApiKey())} onBack={() => setView('dashboard')} />;
      case 'match':
        return <MatchGame words={words} onDone={() => { refreshWords(); setView('dashboard'); }} />;
      case 'scramble':
        return <ScrambleGame words={words} onDone={() => { refreshWords(); setView('dashboard'); }} />;
      case 'speed':
        return <SpeedRound words={words} onDone={() => { refreshWords(); setView('dashboard'); }} />;
      case 'sentence':
        return <SentencePuzzle words={words} onDone={() => { refreshWords(); setView('dashboard'); }} />;
      case 'story':
        return <StoryMode words={words} onDone={() => { refreshWords(); setView('dashboard'); }} />;
      case 'chat':
        return <ChatMode words={words} onDone={() => { refreshWords(); setView('dashboard'); }} />;
      case 'swear':
        return <SwearMode onDone={() => setView('dashboard')} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#1a0a0a]">
      {/* Rank Up Modal */}
      {rankUp && <RankUpModal rank={rankUp} onClose={() => setRankUp(null)} />}

      {/* Header */}
      <header className="bg-soviet-700 border-b-4 border-gold-500 sticky top-0 z-50 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setView('dashboard')}
            className="flex items-center gap-2 group"
          >
            <span className="text-gold-400 text-2xl">&#9733;</span>
            <span className="font-['Oswald'] text-xl font-bold text-gold-400 tracking-wider uppercase group-hover:text-gold-300 transition-colors">
              Soviet Transformer
            </span>
          </button>
          <div className="flex gap-2">
            {view !== 'dashboard' && (
              <button
                onClick={() => setView('dashboard')}
                className="px-3 py-1.5 text-sm text-soviet-100 hover:text-gold-400 hover:bg-soviet-800 rounded-lg transition-colors"
              >
                Zurueck
              </button>
            )}
            <button
              onClick={() => setView('import')}
              className="px-3 py-1.5 text-sm text-soviet-100 hover:text-gold-400 hover:bg-soviet-800 rounded-lg transition-colors"
            >
              Import
            </button>
            <button
              onClick={() => setView('settings')}
              className="px-3 py-1.5 text-sm text-soviet-100 hover:text-gold-400 hover:bg-soviet-800 rounded-lg transition-colors"
            >
              Einstellungen
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {needsWords && view !== 'import' && view !== 'settings' ? (
          <div className="text-center py-20">
            <p className="text-gold-400 text-5xl mb-4">&#9733;</p>
            <h2 className="font-['Oswald'] text-3xl font-bold text-soviet-100 mb-4 uppercase tracking-wide">
              Willkommen, Genosse!
            </h2>
            <p className="text-soviet-200 mb-6">
              Importiere dein Vokabel-Deck, um mit dem Training zu beginnen.
            </p>
            <button
              onClick={() => setView('import')}
              className="px-6 py-3 bg-soviet-600 text-gold-400 rounded-lg hover:bg-soviet-500 transition-colors font-['Oswald'] font-bold uppercase tracking-wider border-2 border-gold-500"
            >
              Vokabeln importieren
            </button>
          </div>
        ) : (
          renderView()
        )}
      </main>
    </div>
  );
}

export default App;
