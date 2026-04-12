import { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth } from './firebase';
import { getAllWords, addWords } from './data/vocabulary';
import type { VocabWord } from './data/vocabulary';
import { getDefaultVocabulary, getTransliteration } from './data/anki-deck';
import { getFastPaceVocabulary, getFastPaceIds } from './data/fast-pace-deck';
import { getVerbVocabulary, getVerbIds } from './data/verb-deck';
import { syncFromCloud, triggerSync, forceSyncToCloud } from './data/sync';
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
import ReviewMode from './modes/games/ReviewMode';
import FastPaceMode from './modes/games/FastPaceMode';
import FlashcardMode from './modes/games/FlashcardMode';
import VerbTrainerMode from './modes/games/VerbTrainerMode';
import AuthButton from './components/AuthButton';
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
  | 'swear'
  | 'review'
  | 'flashcard'
  | 'fastpace'
  | 'verbtrainer';

function App() {
  const [view, setView] = useState<View>('dashboard');
  const [words, setWords] = useState<VocabWord[]>([]);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [rankUp, setRankUp] = useState<Rank | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [fastPaceFilter, setFastPaceFilter] = useState(() => localStorage.getItem('russfun_fastpace') === 'on');
  const [verbFilter, setVerbFilter] = useState(() => localStorage.getItem('russfun_verben') === 'on');

  const refreshWords = useCallback(async () => {
    const all = await getAllWords();
    setWords(all);
    const pending = checkPendingRankUp();
    if (pending) setRankUp(pending);
    // Trigger cloud sync if logged in
    if (user) {
      setSyncing(true);
      triggerSync(user.uid);
      setTimeout(() => setSyncing(false), 3000);
    }
  }, [user]);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        setSyncing(true);
        // First: download cloud data and merge
        await syncFromCloud(firebaseUser.uid);
        // Refresh local state after merge
        const all = await getAllWords();
        setWords(all);
        // Then: upload merged state back to cloud (so both sides are in sync)
        await forceSyncToCloud(firebaseUser.uid);
        setSyncing(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Initial load
  useEffect(() => {
    const init = async () => {
      let existing = await getAllWords();
      if (existing.length === 0) {
        const defaults = getDefaultVocabulary();
        await addWords(defaults);
        existing = defaults;
      } else {
        const needsUpdate = existing.some(w => !w.transliteration);
        if (needsUpdate) {
          existing = existing.map(w => {
            if (!w.transliteration) {
              const t = getTransliteration(w.russian);
              if (t) return { ...w, transliteration: t };
            }
            return w;
          });
          await addWords(existing);
        }
      }
      // Add Fast Pace + Verb words if not yet in DB
      const existingIds = new Set(existing.map(w => w.id));
      const fpWords = getFastPaceVocabulary().filter(w => !existingIds.has(w.id));
      const vbWords = getVerbVocabulary().filter(w => !existingIds.has(w.id));
      const newWords = [...fpWords, ...vbWords];
      if (newWords.length > 0) {
        await addWords(newWords);
        existing = [...existing, ...newWords];
      }
      setWords(existing);
      setHasApiKey(!!getApiKey());
    };
    init();
  }, []);

  const toggleFastPace = useCallback(() => {
    setFastPaceFilter(prev => {
      const next = !prev;
      localStorage.setItem('russfun_fastpace', next ? 'on' : 'off');
      return next;
    });
  }, []);

  const toggleVerben = useCallback(() => {
    setVerbFilter(prev => {
      const next = !prev;
      localStorage.setItem('russfun_verben', next ? 'on' : 'off');
      return next;
    });
  }, []);

  const fpIds = getFastPaceIds();
  const vbIds = getVerbIds();
  const activeWords = (() => {
    if (!fastPaceFilter && !verbFilter) return words;
    // Combine active filters
    return words.filter(w =>
      (fastPaceFilter && fpIds.has(w.id)) || (verbFilter && vbIds.has(w.id))
    );
  })();
  const needsWords = activeWords.length < 4;

  const renderView = () => {
    switch (view) {
      case 'dashboard':
        return <Dashboard words={activeWords} hasApiKey={hasApiKey} onNavigate={(v) => setView(v as View)} fastPaceFilter={fastPaceFilter} onToggleFastPace={toggleFastPace} verbFilter={verbFilter} onToggleVerben={toggleVerben} />;
      case 'import':
        return <ImportView onDone={() => { refreshWords(); setView('dashboard'); }} />;
      case 'settings':
        return <Settings onApiKeyChange={() => setHasApiKey(!!getApiKey())} onBack={() => setView('dashboard')} />;
      case 'match':
        return <MatchGame words={activeWords} onDone={() => { refreshWords(); setView('dashboard'); }} />;
      case 'scramble':
        return <ScrambleGame words={activeWords} onDone={() => { refreshWords(); setView('dashboard'); }} />;
      case 'speed':
        return <SpeedRound words={activeWords} onDone={() => { refreshWords(); setView('dashboard'); }} />;
      case 'sentence':
        return <SentencePuzzle words={activeWords} onDone={() => { refreshWords(); setView('dashboard'); }} />;
      case 'story':
        return <StoryMode words={activeWords} onDone={() => { refreshWords(); setView('dashboard'); }} />;
      case 'chat':
        return <ChatMode words={activeWords} onDone={() => { refreshWords(); setView('dashboard'); }} />;
      case 'review':
        return <ReviewMode words={activeWords} onDone={() => { refreshWords(); setView('dashboard'); }} />;
      case 'flashcard':
        return <FlashcardMode words={activeWords} onDone={() => { refreshWords(); setView('dashboard'); }} />;
      case 'fastpace':
        return <FastPaceMode words={activeWords} onDone={() => { refreshWords(); setView('dashboard'); }} />;
      case 'verbtrainer':
        return <VerbTrainerMode words={activeWords} onDone={() => { refreshWords(); setView('dashboard'); }} />;
      case 'swear':
        return <SwearMode onDone={() => setView('dashboard')} />;
    }
  };

  const [menuOpen, setMenuOpen] = useState(false);

  const navigateTo = (v: View) => {
    setView(v);
    setMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#1a0a0a]">
      {rankUp && <RankUpModal rank={rankUp} onClose={() => setRankUp(null)} />}
      <div id="game-flash" />

      <header className="bg-soviet-700 border-b-4 border-gold-500 sticky top-0 z-50 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigateTo('dashboard')}
            className="flex items-center gap-2 group"
          >
            <span className="text-gold-400 text-2xl">&#9733;</span>
            <span className="font-['Oswald'] text-xl font-bold text-gold-400 tracking-wider uppercase group-hover:text-gold-300 transition-colors">
              Soviet Transformer
            </span>
          </button>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-2">
            {view !== 'dashboard' && (
              <button onClick={() => navigateTo('dashboard')} className="px-3 py-1.5 text-sm text-soviet-100 hover:text-gold-400 hover:bg-soviet-800 rounded-lg transition-colors">Zurueck</button>
            )}
            <button onClick={() => navigateTo('import')} className="px-3 py-1.5 text-sm text-soviet-100 hover:text-gold-400 hover:bg-soviet-800 rounded-lg transition-colors">Import</button>
            <button onClick={() => navigateTo('settings')} className="px-3 py-1.5 text-sm text-soviet-100 hover:text-gold-400 hover:bg-soviet-800 rounded-lg transition-colors">Einstellungen</button>
            <AuthButton user={user} syncing={syncing} />
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden flex flex-col gap-1.5 p-2"
          >
            <span className={`w-5 h-0.5 bg-gold-400 transition-transform ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`w-5 h-0.5 bg-gold-400 transition-opacity ${menuOpen ? 'opacity-0' : ''}`} />
            <span className={`w-5 h-0.5 bg-gold-400 transition-transform ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </button>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div className="md:hidden bg-soviet-800 border-t border-soviet-600 px-4 py-3 space-y-2">
            {view !== 'dashboard' && (
              <button onClick={() => navigateTo('dashboard')} className="block w-full text-left px-3 py-2 text-sm text-soviet-100 hover:text-gold-400 hover:bg-soviet-900 rounded-lg transition-colors">Zurueck</button>
            )}
            <button onClick={() => navigateTo('import')} className="block w-full text-left px-3 py-2 text-sm text-soviet-100 hover:text-gold-400 hover:bg-soviet-900 rounded-lg transition-colors">Import</button>
            <button onClick={() => navigateTo('settings')} className="block w-full text-left px-3 py-2 text-sm text-soviet-100 hover:text-gold-400 hover:bg-soviet-900 rounded-lg transition-colors">Einstellungen</button>
            <div className="pt-2 border-t border-soviet-700">
              <AuthButton user={user} syncing={syncing} />
            </div>
          </div>
        )}
      </header>

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
