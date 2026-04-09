import { useState, useCallback, useMemo } from 'react';
import type { VocabWord } from '../../data/vocabulary';
import { updateWord, recordAnswer } from '../../data/vocabulary';
import { getFastPaceIds } from '../../data/fast-pace-deck';
import { getDueCards, reviewCard, getSRStats } from '../../data/spaced-repetition';
import type { Rating } from '../../data/spaced-repetition';
import { recordStudy } from '../../data/progress';
import { addXP, XP_REWARDS } from '../../data/ranks';
import { playCorrect, playWrong, playComplete, flashScreen } from '../../utils/sounds';

interface Props {
  words: VocabWord[];
  onDone: () => void;
}

const CARDS_PER_SESSION = 20;
const NEW_CARDS_PER_SESSION = 5;

export default function FlashcardMode({ words, onDone }: Props) {
  // Always use Fast Pace words for flashcards
  const fpIds = getFastPaceIds();
  const fpWords = useMemo(() => words.filter(w => fpIds.has(w.id)), [words, fpIds]);
  const wordMap = useMemo(() => {
    const m = new Map<string, VocabWord>();
    fpWords.forEach(w => m.set(w.id, w));
    return m;
  }, [fpWords]);

  const allFpIds = useMemo(() => fpWords.map(w => w.id), [fpWords]);
  const initialStats = useMemo(() => getSRStats(allFpIds), [allFpIds]);

  // Build session queue: due cards first, then new cards
  const [sessionQueue, setSessionQueue] = useState<string[]>(() => {
    const { newIds, dueIds } = getDueCards(allFpIds);
    const shuffledNew = [...newIds].sort(() => Math.random() - 0.5).slice(0, NEW_CARDS_PER_SESSION);
    const shuffledDue = [...dueIds].sort(() => Math.random() - 0.5);
    const queue = [...shuffledDue, ...shuffledNew].slice(0, CARDS_PER_SESSION);
    return queue;
  });

  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [direction, setDirection] = useState<'ru-de' | 'de-ru'>(() => Math.random() < 0.5 ? 'ru-de' : 'de-ru');
  const [sessionScore, setSessionScore] = useState({ good: 0, again: 0, total: 0 });
  const [isComplete, setIsComplete] = useState(false);
  // Track "again" cards to re-add to queue
  const [againQueue, setAgainQueue] = useState<string[]>([]);

  const currentWordId = sessionQueue[currentIdx] ?? againQueue[currentIdx - sessionQueue.length];
  const currentWord = currentWordId ? wordMap.get(currentWordId) : undefined;
  const totalCards = sessionQueue.length + againQueue.length;

  const flip = () => setFlipped(true);

  const handleRating = useCallback(async (rating: Rating) => {
    if (!currentWord) return;

    // Update SR data
    reviewCard(currentWord.id, rating);

    // Track in vocabulary system too
    const isCorrect = rating === 'good' || rating === 'easy';
    await updateWord(recordAnswer(currentWord, isCorrect));
    recordStudy(isCorrect);
    addXP(isCorrect ? XP_REWARDS.correctAnswer : XP_REWARDS.incorrectAnswer);

    if (isCorrect) { playCorrect(); flashScreen(true); }
    else { playWrong(); flashScreen(false); }

    // If "again", re-add to end of queue
    if (rating === 'again') {
      setAgainQueue(prev => [...prev, currentWord.id]);
      setSessionScore(prev => ({ ...prev, again: prev.again + 1, total: prev.total + 1 }));
    } else {
      setSessionScore(prev => ({ ...prev, good: prev.good + 1, total: prev.total + 1 }));
    }

    // Next card
    const nextIdx = currentIdx + 1;
    const nextTotal = sessionQueue.length + (rating === 'again' ? againQueue.length + 1 : againQueue.length);

    if (nextIdx >= nextTotal) {
      setIsComplete(true);
      addXP(XP_REWARDS.gameCompleted);
      playComplete();
    } else {
      setCurrentIdx(nextIdx);
      setFlipped(false);
      setDirection(Math.random() < 0.5 ? 'ru-de' : 'de-ru');
    }
  }, [currentWord, currentIdx, sessionQueue, againQueue]);

  const restart = useCallback(() => {
    const { newIds, dueIds } = getDueCards(allFpIds);
    const shuffledNew = [...newIds].sort(() => Math.random() - 0.5).slice(0, NEW_CARDS_PER_SESSION);
    const shuffledDue = [...dueIds].sort(() => Math.random() - 0.5);
    const queue = [...shuffledDue, ...shuffledNew].slice(0, CARDS_PER_SESSION);
    setSessionQueue(queue);
    setAgainQueue([]);
    setCurrentIdx(0);
    setFlipped(false);
    setDirection(Math.random() < 0.5 ? 'ru-de' : 'de-ru');
    setSessionScore({ good: 0, again: 0, total: 0 });
    setIsComplete(false);
  }, [allFpIds]);

  if (fpWords.length === 0) {
    return (
      <div className="max-w-lg mx-auto text-center py-12 space-y-4">
        <p className="text-gold-400 text-5xl">&#9888;</p>
        <h3 className="font-['Oswald'] text-xl font-bold text-soviet-100 uppercase">Keine Karteikarten</h3>
        <p className="text-soviet-300">Fast Pace Vokabeln nicht gefunden.</p>
        <button onClick={onDone} className="px-5 py-2.5 text-soviet-300 hover:bg-soviet-800 rounded-lg transition-colors">Zurueck</button>
      </div>
    );
  }

  if (totalCards === 0 || sessionQueue.length === 0) {
    const stats = getSRStats(allFpIds);
    return (
      <div className="max-w-lg mx-auto text-center py-12 space-y-4">
        <p className="text-gold-400 text-5xl">&#9733;</p>
        <h3 className="font-['Oswald'] text-xl font-bold text-soviet-100 uppercase">Alles gelernt!</h3>
        <p className="text-soviet-300">Keine Karten faellig. Komm spaeter wieder!</p>
        <div className="bg-soviet-900/60 rounded-lg p-4 border border-soviet-700 inline-block mx-auto">
          <div className="flex gap-6 text-sm">
            <div className="text-center">
              <p className="text-gold-400 font-bold text-xl font-['Oswald']">{stats.learnedCount}</p>
              <p className="text-soviet-400">gelernt</p>
            </div>
            <div className="text-center">
              <p className="text-soviet-400 font-bold text-xl font-['Oswald']">{stats.newCount}</p>
              <p className="text-soviet-400">neu</p>
            </div>
          </div>
        </div>
        <div className="pt-4">
          <button onClick={onDone} className="px-5 py-2.5 text-soviet-300 hover:bg-soviet-800 rounded-lg transition-colors">Zurueck</button>
        </div>
      </div>
    );
  }

  if (isComplete) {
    const accuracy = sessionScore.total > 0 ? Math.round((sessionScore.good / sessionScore.total) * 100) : 0;
    const stats = getSRStats(allFpIds);
    return (
      <div className="max-w-lg mx-auto text-center py-12 space-y-4">
        <p className="text-gold-400 text-5xl">{accuracy >= 80 ? '\u2605' : '\u2606'}</p>
        <h3 className="font-['Oswald'] text-xl font-bold text-soviet-100 uppercase">Sitzung abgeschlossen!</h3>
        <p className="text-3xl font-bold text-gold-400 font-['Oswald']">{sessionScore.good}/{sessionScore.total}</p>
        <p className="text-soviet-300">Karten gewusst ({accuracy}%)</p>

        <div className="bg-soviet-900/60 rounded-lg p-4 border border-soviet-700 space-y-2">
          <h4 className="font-['Oswald'] text-gold-400 text-sm uppercase tracking-wide">Gesamtfortschritt</h4>
          <div className="flex gap-1 h-4 rounded overflow-hidden bg-soviet-800">
            {stats.learnedCount > 0 && (
              <div className="bg-gold-500 transition-all" style={{ width: `${(stats.learnedCount / allFpIds.length) * 100}%` }} />
            )}
            {stats.dueCount > 0 && (
              <div className="bg-soviet-500 transition-all" style={{ width: `${(stats.dueCount / allFpIds.length) * 100}%` }} />
            )}
          </div>
          <div className="flex gap-4 text-xs text-soviet-400 justify-center">
            <span>&#9632; Gelernt: {stats.learnedCount}</span>
            <span>&#9632; Faellig: {stats.dueCount}</span>
            <span>&#9632; Neu: {stats.newCount}</span>
          </div>
        </div>

        <div className="flex gap-3 justify-center pt-2">
          <button onClick={restart} className="px-5 py-2.5 bg-soviet-600 text-gold-400 rounded-lg hover:bg-soviet-500 transition-colors font-['Oswald'] font-bold uppercase border border-gold-500">Weiter lernen</button>
          <button onClick={onDone} className="px-5 py-2.5 text-soviet-300 hover:bg-soviet-800 rounded-lg transition-colors">Zurueck</button>
        </div>
      </div>
    );
  }

  if (!currentWord) return null;

  const front = direction === 'ru-de' ? currentWord.russian : currentWord.german;
  const back = direction === 'ru-de' ? currentWord.german : currentWord.russian;
  const dirLabel = direction === 'ru-de' ? 'RU \u2192 DE' : 'DE \u2192 RU';
  const progressNum = Math.min(currentIdx + 1, totalCards);

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gold-400 font-['Oswald'] uppercase tracking-wide">Karteikarten &mdash; {dirLabel}</span>
        <span className="text-sm text-soviet-400 font-['Oswald']">{progressNum}/{totalCards}</span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-soviet-800 rounded-full mb-6">
        <div className="h-full bg-gold-500 rounded-full transition-all duration-300" style={{ width: `${(currentIdx / totalCards) * 100}%` }} />
      </div>

      {/* SR Stats mini */}
      <div className="flex gap-4 justify-center mb-4 text-xs text-soviet-500">
        <span>Neu: {initialStats.newCount}</span>
        <span>Faellig: {initialStats.dueCount}</span>
        <span>Gelernt: {initialStats.learnedCount}</span>
      </div>

      {/* Card */}
      <div
        onClick={!flipped ? flip : undefined}
        className={`relative bg-soviet-900/60 rounded-xl border-2 transition-all duration-300 min-h-[280px] flex flex-col items-center justify-center p-8 ${
          flipped ? 'border-gold-500/50' : 'border-soviet-700 cursor-pointer hover:border-gold-500/30'
        }`}
      >
        {!flipped ? (
          <>
            {/* Front */}
            <p className="text-3xl font-bold text-gold-400 text-center leading-relaxed">{front}</p>
            {direction === 'ru-de' && currentWord.transliteration && (
              <p className="text-sm text-soviet-500 mt-2">({currentWord.transliteration})</p>
            )}
            <p className="text-soviet-500 text-sm mt-6 animate-pulse">Antippen zum Aufdecken</p>
          </>
        ) : (
          <>
            {/* Front (small) */}
            <p className="text-lg text-soviet-400 text-center mb-2">{front}</p>
            {direction === 'ru-de' && currentWord.transliteration && (
              <p className="text-xs text-soviet-600 mb-4">({currentWord.transliteration})</p>
            )}
            {/* Divider */}
            <div className="w-16 h-0.5 bg-gold-500/30 mb-4" />
            {/* Back (big) */}
            <p className="text-3xl font-bold text-soviet-100 text-center leading-relaxed">{back}</p>
            {direction === 'de-ru' && currentWord.transliteration && (
              <p className="text-sm text-soviet-500 mt-2">({currentWord.transliteration})</p>
            )}
          </>
        )}
      </div>

      {/* Rating buttons - only show when flipped */}
      {flipped && (
        <div className="grid grid-cols-4 gap-2 mt-4">
          <button
            onClick={() => handleRating('again')}
            className="p-3 rounded-lg border-2 border-red-700/50 bg-red-900/20 text-red-400 hover:bg-red-900/40 transition-colors text-center"
          >
            <span className="text-lg block">&#10007;</span>
            <span className="text-xs block mt-1 font-['Oswald'] uppercase">Nochmal</span>
          </button>
          <button
            onClick={() => handleRating('hard')}
            className="p-3 rounded-lg border-2 border-orange-700/50 bg-orange-900/20 text-orange-400 hover:bg-orange-900/40 transition-colors text-center"
          >
            <span className="text-lg block">&#9888;</span>
            <span className="text-xs block mt-1 font-['Oswald'] uppercase">Schwer</span>
          </button>
          <button
            onClick={() => handleRating('good')}
            className="p-3 rounded-lg border-2 border-green-700/50 bg-green-900/20 text-green-400 hover:bg-green-900/40 transition-colors text-center"
          >
            <span className="text-lg block">&#10003;</span>
            <span className="text-xs block mt-1 font-['Oswald'] uppercase">Gut</span>
          </button>
          <button
            onClick={() => handleRating('easy')}
            className="p-3 rounded-lg border-2 border-gold-500/50 bg-gold-900/20 text-gold-400 hover:bg-gold-900/40 transition-colors text-center"
          >
            <span className="text-lg block">&#9733;</span>
            <span className="text-xs block mt-1 font-['Oswald'] uppercase">Leicht</span>
          </button>
        </div>
      )}
    </div>
  );
}
