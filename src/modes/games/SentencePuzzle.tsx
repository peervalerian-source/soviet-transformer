import { useState, useEffect, useCallback } from 'react';
import type { VocabWord } from '../../data/vocabulary';
import { updateWord, recordAnswer } from '../../data/vocabulary';
import { recordStudy, recordGamePlayed } from '../../data/progress';
import { addXP, XP_REWARDS } from '../../data/ranks';

interface Props {
  words: VocabWord[];
  onDone: () => void;
}

interface Puzzle { word: VocabWord; sentence: string; shuffledWords: string[]; }

function generatePuzzle(word: VocabWord): Puzzle {
  const templates = [`Я люблю ${word.russian}`, `Это ${word.russian}`, `Где ${word.russian}?`, `Мне нужен ${word.russian}`, `У меня есть ${word.russian}`, `Дайте мне ${word.russian}`, `Вот ${word.russian}`];
  const sentence = templates[Math.floor(Math.random() * templates.length)];
  const words = sentence.replace('?', '').split(' ');
  return { word, sentence, shuffledWords: [...words].sort(() => Math.random() - 0.5) };
}

export default function SentencePuzzle({ words, onDone }: Props) {
  const [puzzles, setPuzzles] = useState<Puzzle[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [placed, setPlaced] = useState<string[]>([]);
  const [available, setAvailable] = useState<string[]>([]);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);

  const startGame = useCallback(() => {
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(6, words.length));
    const newPuzzles = selected.map(generatePuzzle);
    setPuzzles(newPuzzles); setCurrentIdx(0); setScore(0); loadPuzzle(newPuzzles[0]);
  }, [words]);

  const loadPuzzle = (puzzle: Puzzle) => { setPlaced([]); setAvailable([...puzzle.shuffledWords]); setIsCorrect(null); };
  useEffect(() => { startGame(); }, [startGame]);

  const handleWordClick = (word: string, index: number) => {
    if (isCorrect !== null) return;
    setPlaced(prev => [...prev, word]); setAvailable(prev => prev.filter((_, i) => i !== index));
  };
  const handlePlacedClick = (word: string, index: number) => {
    if (isCorrect !== null) return;
    setAvailable(prev => [...prev, word]); setPlaced(prev => prev.filter((_, i) => i !== index));
  };

  const handleCheck = async () => {
    const puzzle = puzzles[currentIdx];
    const correct = placed.join(' ') === puzzle.sentence.replace('?', '');
    setIsCorrect(correct);
    if (correct) setScore(prev => prev + 1);
    await updateWord(recordAnswer(puzzle.word, correct));
    recordStudy(correct);
    addXP(correct ? XP_REWARDS.correctAnswer : XP_REWARDS.incorrectAnswer);
  };

  const handleNext = () => {
    const next = currentIdx + 1;
    if (next >= puzzles.length) { recordGamePlayed(); addXP(XP_REWARDS.gameCompleted); setCurrentIdx(next); }
    else { setCurrentIdx(next); loadPuzzle(puzzles[next]); }
  };

  if (puzzles.length === 0) return null;
  if (currentIdx >= puzzles.length) {
    return (
      <div className="max-w-lg mx-auto text-center py-12 space-y-4">
        <p className="text-gold-400 text-5xl">&#9733;</p>
        <h3 className="font-['Oswald'] text-xl font-bold text-soviet-100 uppercase">Runde fertig!</h3>
        <p className="text-soviet-300">{score} von {puzzles.length} richtig</p>
        <div className="flex gap-3 justify-center mt-6">
          <button onClick={startGame} className="px-5 py-2.5 bg-soviet-600 text-gold-400 rounded-lg hover:bg-soviet-500 transition-colors font-['Oswald'] font-bold uppercase border border-gold-500">Nochmal</button>
          <button onClick={onDone} className="px-5 py-2.5 text-soviet-300 hover:bg-soviet-800 rounded-lg transition-colors">Zurueck</button>
        </div>
      </div>
    );
  }

  const puzzle = puzzles[currentIdx];
  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-['Oswald'] text-xl font-bold text-gold-400 uppercase tracking-wide">Satz-Puzzle</h2>
        <span className="text-sm text-soviet-400">{currentIdx + 1}/{puzzles.length}</span>
      </div>
      <div className="bg-soviet-900/60 rounded-lg p-6 border border-soviet-700 space-y-6">
        <div className="text-center">
          <p className="text-soviet-400 text-sm mb-1">Bringe die Woerter in die richtige Reihenfolge</p>
          <p className="text-lg font-medium text-soviet-100">{puzzle.word.german}</p>
        </div>
        <div className="flex gap-2 justify-center min-h-[52px] p-3 bg-soviet-800/50 rounded-lg flex-wrap">
          {placed.length === 0 ? (
            <span className="text-soviet-500 text-sm self-center">Klicke auf die Woerter...</span>
          ) : placed.map((word, i) => (
            <button key={i} onClick={() => handlePlacedClick(word, i)}
              className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                isCorrect === true ? 'bg-gold-500/20 text-gold-400 border border-gold-500'
                : isCorrect === false ? 'bg-soviet-500/20 text-soviet-300 border border-soviet-400'
                : 'bg-soviet-700 text-gold-400 border border-gold-500/50 hover:bg-soviet-600 cursor-pointer'
              }`}>{word}</button>
          ))}
        </div>
        <div className="flex gap-2 justify-center flex-wrap">
          {available.map((word, i) => (
            <button key={i} onClick={() => handleWordClick(word, i)}
              className="px-3 py-2 rounded-lg bg-soviet-800 border-2 border-soviet-600 font-medium text-soviet-200 hover:border-gold-500 hover:text-gold-400 transition-colors cursor-pointer">{word}</button>
          ))}
        </div>
        {isCorrect !== null && (
          <div className={`text-center p-3 rounded-lg ${isCorrect ? 'bg-gold-500/10 text-gold-400' : 'bg-soviet-500/10 text-soviet-300'}`}>
            {isCorrect ? 'Richtig!' : `Richtig waere: ${puzzle.sentence}`}
          </div>
        )}
        <div className="flex gap-3 justify-center">
          {isCorrect === null ? (
            <button onClick={handleCheck} disabled={available.length > 0} className="px-5 py-2.5 bg-soviet-600 text-gold-400 rounded-lg hover:bg-soviet-500 transition-colors font-['Oswald'] font-bold uppercase border border-gold-500 disabled:opacity-50 disabled:cursor-not-allowed">Pruefen</button>
          ) : (
            <button onClick={handleNext} className="px-5 py-2.5 bg-soviet-600 text-gold-400 rounded-lg hover:bg-soviet-500 transition-colors font-['Oswald'] font-bold uppercase border border-gold-500">Weiter</button>
          )}
        </div>
      </div>
    </div>
  );
}
