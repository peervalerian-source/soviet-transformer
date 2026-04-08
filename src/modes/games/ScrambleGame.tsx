import { useState, useEffect, useCallback } from 'react';
import type { VocabWord } from '../../data/vocabulary';
import { updateWord, recordAnswer } from '../../data/vocabulary';
import { recordStudy, recordGamePlayed } from '../../data/progress';
import { addXP, XP_REWARDS } from '../../data/ranks';

interface Props {
  words: VocabWord[];
  onDone: () => void;
}

export default function ScrambleGame({ words, onDone }: Props) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [gameWords, setGameWords] = useState<VocabWord[]>([]);
  const [scrambled, setScrambled] = useState<string[]>([]);
  const [answer, setAnswer] = useState<string[]>([]);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);

  const startGame = useCallback(() => {
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(8, words.length));
    setGameWords(selected);
    setCurrentIdx(0);
    setScore(0);
    loadWord(selected[0]);
  }, [words]);

  const loadWord = (word: VocabWord) => {
    const letters = word.russian.split('');
    let shuffledLetters: string[];
    do {
      shuffledLetters = [...letters].sort(() => Math.random() - 0.5);
    } while (shuffledLetters.join('') === word.russian && letters.length > 1);
    setScrambled(shuffledLetters);
    setAnswer([]);
    setIsCorrect(null);
  };

  useEffect(() => { startGame(); }, [startGame]);

  const handleLetterClick = (index: number) => {
    if (isCorrect !== null) return;
    const letter = scrambled[index];
    setAnswer(prev => [...prev, letter]);
    setScrambled(prev => prev.filter((_, i) => i !== index));
  };

  const handleAnswerClick = (index: number) => {
    if (isCorrect !== null) return;
    const letter = answer[index];
    setScrambled(prev => [...prev, letter]);
    setAnswer(prev => prev.filter((_, i) => i !== index));
  };

  const handleCheck = async () => {
    const word = gameWords[currentIdx];
    const correct = answer.join('') === word.russian;
    setIsCorrect(correct);
    if (correct) setScore(prev => prev + 1);
    await updateWord(recordAnswer(word, correct));
    recordStudy(correct);
    addXP(correct ? XP_REWARDS.correctAnswer : XP_REWARDS.incorrectAnswer);
  };

  const handleNext = () => {
    const next = currentIdx + 1;
    if (next >= gameWords.length) { recordGamePlayed(); addXP(XP_REWARDS.gameCompleted); setCurrentIdx(next); }
    else { setCurrentIdx(next); loadWord(gameWords[next]); }
  };

  if (gameWords.length === 0) return null;
  if (currentIdx >= gameWords.length) {
    return (
      <div className="max-w-lg mx-auto text-center py-12 space-y-4">
        <p className="text-gold-400 text-5xl">&#9733;</p>
        <h3 className="font-['Oswald'] text-xl font-bold text-soviet-100 uppercase">Runde fertig!</h3>
        <p className="text-soviet-300">{score} von {gameWords.length} richtig</p>
        <div className="flex gap-3 justify-center mt-6">
          <button onClick={startGame} className="px-5 py-2.5 bg-soviet-600 text-gold-400 rounded-lg hover:bg-soviet-500 transition-colors font-['Oswald'] font-bold uppercase border border-gold-500">Nochmal</button>
          <button onClick={onDone} className="px-5 py-2.5 text-soviet-300 hover:bg-soviet-800 rounded-lg transition-colors">Zurueck</button>
        </div>
      </div>
    );
  }

  const word = gameWords[currentIdx];

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-['Oswald'] text-xl font-bold text-gold-400 uppercase tracking-wide">Buchstaben-Salat</h2>
        <span className="text-sm text-soviet-400">{currentIdx + 1}/{gameWords.length}</span>
      </div>

      <div className="bg-soviet-900/60 rounded-lg p-6 border border-soviet-700 space-y-6">
        <div className="text-center">
          <p className="text-soviet-400 text-sm mb-1">Welches Wort ist das?</p>
          <p className="text-lg font-medium text-soviet-100">{word.german}</p>
          {word.transliteration && (
            <p className="text-sm text-soviet-500 mt-0.5">({word.transliteration})</p>
          )}
        </div>

        <div className="flex gap-2 justify-center min-h-[52px] p-3 bg-soviet-800/50 rounded-lg flex-wrap">
          {answer.length === 0 ? (
            <span className="text-soviet-500 text-sm self-center">Klicke auf die Buchstaben...</span>
          ) : answer.map((letter, i) => (
            <button
              key={i}
              onClick={() => handleAnswerClick(i)}
              className={`w-10 h-10 rounded-lg font-medium text-lg flex items-center justify-center transition-colors ${
                isCorrect === true ? 'bg-gold-500/20 text-gold-400 border border-gold-500'
                : isCorrect === false ? 'bg-soviet-500/20 text-soviet-300 border border-soviet-400'
                : 'bg-soviet-700 text-gold-400 border border-gold-500/50 hover:bg-soviet-600 cursor-pointer'
              }`}
            >{letter}</button>
          ))}
        </div>

        <div className="flex gap-2 justify-center flex-wrap">
          {scrambled.map((letter, i) => (
            <button
              key={i}
              onClick={() => handleLetterClick(i)}
              className="w-10 h-10 rounded-lg bg-soviet-800 border-2 border-soviet-600 font-medium text-lg text-soviet-200 hover:border-gold-500 hover:text-gold-400 transition-colors cursor-pointer flex items-center justify-center"
            >{letter}</button>
          ))}
        </div>

        {isCorrect !== null && (
          <div className={`text-center p-3 rounded-lg ${isCorrect ? 'bg-gold-500/10 text-gold-400' : 'bg-soviet-500/10 text-soviet-300'}`}>
            {isCorrect ? 'Richtig!' : `Falsch! Richtig: ${word.russian}`}
          </div>
        )}

        <div className="flex gap-3 justify-center">
          {isCorrect === null ? (
            <button onClick={handleCheck} disabled={answer.length === 0} className="px-5 py-2.5 bg-soviet-600 text-gold-400 rounded-lg hover:bg-soviet-500 transition-colors font-['Oswald'] font-bold uppercase border border-gold-500 disabled:opacity-50 disabled:cursor-not-allowed">Pruefen</button>
          ) : (
            <button onClick={handleNext} className="px-5 py-2.5 bg-soviet-600 text-gold-400 rounded-lg hover:bg-soviet-500 transition-colors font-['Oswald'] font-bold uppercase border border-gold-500">Weiter</button>
          )}
        </div>
      </div>
    </div>
  );
}
