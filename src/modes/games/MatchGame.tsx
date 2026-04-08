import { useState, useEffect, useCallback } from 'react';
import type { VocabWord } from '../../data/vocabulary';
import { updateWord, recordAnswer } from '../../data/vocabulary';
import { recordStudy, recordGamePlayed } from '../../data/progress';
import { addXP, XP_REWARDS } from '../../data/ranks';
import { playMatch, playWrong, playComplete, flashScreen } from '../../utils/sounds';

interface Props {
  words: VocabWord[];
  onDone: () => void;
}

interface Card {
  id: string;
  text: string;
  hint?: string;
  wordId: string;
  type: 'russian' | 'german';
  matched: boolean;
}

export default function MatchGame({ words, onDone }: Props) {
  const [cards, setCards] = useState<Card[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [wrongPair, setWrongPair] = useState<string[]>([]);
  const [matchedCount, setMatchedCount] = useState(0);
  const [totalPairs, setTotalPairs] = useState(0);
  const [gameWords, setGameWords] = useState<VocabWord[]>([]);

  const startGame = useCallback(() => {
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(6, words.length));
    setGameWords(selected);
    const newCards: Card[] = [];
    selected.forEach(w => {
      newCards.push({ id: `ru-${w.id}`, text: w.russian, hint: w.transliteration, wordId: w.id, type: 'russian', matched: false });
      newCards.push({ id: `de-${w.id}`, text: w.german, wordId: w.id, type: 'german', matched: false });
    });
    setCards(newCards.sort(() => Math.random() - 0.5));
    setSelected(null);
    setWrongPair([]);
    setMatchedCount(0);
    setTotalPairs(selected.length);
  }, [words]);

  useEffect(() => { startGame(); }, [startGame]);

  const handleClick = async (cardId: string) => {
    const card = cards.find(c => c.id === cardId);
    if (!card || card.matched || wrongPair.length > 0) return;
    if (!selected) { setSelected(cardId); return; }
    if (selected === cardId) { setSelected(null); return; }
    const firstCard = cards.find(c => c.id === selected)!;
    if (firstCard.wordId === card.wordId && firstCard.type !== card.type) {
      // Brief green flash, then remove
      setCards(prev => prev.map(c => c.wordId === card.wordId ? { ...c, matched: true } : c));
      setSelected(null);
      setTimeout(() => {
        setCards(prev => prev.filter(c => c.wordId !== card.wordId));
        setMatchedCount(prev => prev + 1);
      }, 500);
      const word = gameWords.find(w => w.id === card.wordId)!;
      await updateWord(recordAnswer(word, true));
      recordStudy(true);
      addXP(XP_REWARDS.correctAnswer);
      playMatch();
      flashScreen(true);
    } else {
      setWrongPair([selected, cardId]);
      setTimeout(() => { setWrongPair([]); setSelected(null); }, 800);
      const word = gameWords.find(w => w.id === firstCard.wordId)!;
      await updateWord(recordAnswer(word, false));
      recordStudy(false);
      addXP(XP_REWARDS.incorrectAnswer);
      playWrong();
      flashScreen(false);
    }
  };

  const isComplete = matchedCount === totalPairs && totalPairs > 0;
  if (isComplete) {
    recordGamePlayed();
    addXP(XP_REWARDS.gameCompleted);
    playComplete();
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-['Oswald'] text-xl font-bold text-gold-400 uppercase tracking-wide">Wort-Match</h2>
        <span className="text-sm text-soviet-400">{matchedCount}/{totalPairs} Paare</span>
      </div>

      {isComplete ? (
        <div className="text-center py-12 space-y-4">
          <p className="text-gold-400 text-5xl">&#9733;</p>
          <h3 className="font-['Oswald'] text-xl font-bold text-soviet-100 uppercase">Geschafft!</h3>
          <p className="text-soviet-300">Alle Paare gefunden!</p>
          <div className="flex gap-3 justify-center mt-6">
            <button onClick={startGame} className="px-5 py-2.5 bg-soviet-600 text-gold-400 rounded-lg hover:bg-soviet-500 transition-colors font-['Oswald'] font-bold uppercase border border-gold-500">
              Nochmal
            </button>
            <button onClick={onDone} className="px-5 py-2.5 text-soviet-300 hover:bg-soviet-800 rounded-lg transition-colors">
              Zurueck
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
          {cards.map(card => {
            const isSelected = selected === card.id;
            const isWrong = wrongPair.includes(card.id);
            let style = 'bg-soviet-900/60 border-soviet-700 hover:border-gold-500/50 cursor-pointer';
            if (card.matched) style = 'bg-gold-500/15 border-gold-500 cursor-default';
            else if (isWrong) style = 'bg-soviet-500/20 border-soviet-400';
            else if (isSelected) style = 'bg-soviet-700/50 border-gold-400 ring-2 ring-gold-500/30';
            return (
              <button
                key={card.id}
                onClick={() => handleClick(card.id)}
                disabled={card.matched}
                className={`p-4 rounded-lg border-2 text-center transition-all duration-200 min-h-[70px] flex items-center justify-center ${style}`}
              >
                <span className="flex flex-col items-center">
                  <span className={`text-sm font-medium ${card.type === 'russian' ? 'text-gold-400' : 'text-soviet-200'}`}>
                    {card.text}
                  </span>
                  {card.hint && (
                    <span className="text-xs text-soviet-500 mt-0.5">({card.hint})</span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
