import { useState, useEffect, useCallback, useRef } from 'react';
import type { VocabWord } from '../../data/vocabulary';
import { updateWord, recordAnswer } from '../../data/vocabulary';
import { recordStudy, recordGamePlayed } from '../../data/progress';
import { addXP, XP_REWARDS } from '../../data/ranks';

interface Props {
  words: VocabWord[];
  onDone: () => void;
}

export default function SpeedRound({ words, onDone }: Props) {
  const [gameStarted, setGameStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [currentWord, setCurrentWord] = useState<VocabWord | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const timerRef = useRef<number>(0);
  const usedWords = useRef<Set<string>>(new Set());

  const nextWord = useCallback(() => {
    const available = words.filter(w => !usedWords.current.has(w.id));
    if (available.length === 0) { usedWords.current.clear(); return nextWord(); }
    const word = available[Math.floor(Math.random() * available.length)];
    usedWords.current.add(word.id);
    setCurrentWord(word);
    const others = words.filter(w => w.id !== word.id);
    const wrongOptions = others.sort(() => Math.random() - 0.5).slice(0, 3).map(w => w.german);
    setOptions([...wrongOptions, word.german].sort(() => Math.random() - 0.5));
    setFeedback(null);
  }, [words]);

  const startGame = () => {
    setGameStarted(true); setTimeLeft(60); setScore(0); setTotal(0); setIsComplete(false);
    usedWords.current.clear(); nextWord();
    timerRef.current = window.setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); setIsComplete(true); recordGamePlayed(); addXP(XP_REWARDS.gameCompleted); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const handleAnswer = async (answer: string) => {
    if (feedback || !currentWord) return;
    const correct = answer === currentWord.german;
    setFeedback(correct ? 'correct' : 'wrong');
    setTotal(prev => prev + 1);
    if (correct) setScore(prev => prev + 1);
    await updateWord(recordAnswer(currentWord, correct));
    recordStudy(correct);
    addXP(correct ? XP_REWARDS.correctAnswer : XP_REWARDS.incorrectAnswer);
    setTimeout(() => { if (timeLeft > 0) nextWord(); }, 400);
  };

  if (!gameStarted) {
    return (
      <div className="max-w-lg mx-auto text-center py-12 space-y-4">
        <h2 className="font-['Oswald'] text-xl font-bold text-gold-400 uppercase tracking-wide">Speed-Round</h2>
        <p className="text-soviet-300">Uebersetze so viele Woerter wie moeglich in 60 Sekunden!</p>
        <button onClick={startGame} className="px-6 py-3 bg-soviet-600 text-gold-400 rounded-lg hover:bg-soviet-500 transition-colors font-['Oswald'] font-bold text-lg uppercase border-2 border-gold-500">
          Start!
        </button>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="max-w-lg mx-auto text-center py-12 space-y-4">
        <p className="text-gold-400 text-5xl">&#9733;</p>
        <h3 className="font-['Oswald'] text-xl font-bold text-soviet-100 uppercase">Zeit abgelaufen!</h3>
        <p className="text-3xl font-bold text-gold-400 font-['Oswald']">{score}/{total}</p>
        <p className="text-soviet-300">Woerter richtig</p>
        <div className="flex gap-3 justify-center mt-6">
          <button onClick={startGame} className="px-5 py-2.5 bg-soviet-600 text-gold-400 rounded-lg hover:bg-soviet-500 transition-colors font-['Oswald'] font-bold uppercase border border-gold-500">Nochmal</button>
          <button onClick={onDone} className="px-5 py-2.5 text-soviet-300 hover:bg-soviet-800 rounded-lg transition-colors">Zurueck</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <span className={`text-2xl font-bold font-['Oswald'] ${timeLeft <= 10 ? 'text-soviet-400 animate-pulse' : 'text-soviet-100'}`}>{timeLeft}s</span>
        <span className="text-lg font-bold text-gold-400 font-['Oswald']">{score} Punkte</span>
      </div>

      <div className="w-full h-2 bg-soviet-800 rounded-full mb-6">
        <div className={`h-full rounded-full transition-all duration-1000 ${timeLeft <= 10 ? 'bg-soviet-400' : 'bg-soviet-500'}`} style={{ width: `${(timeLeft / 60) * 100}%` }} />
      </div>

      {currentWord && (
        <div className="bg-soviet-900/60 rounded-lg p-8 border border-soviet-700 space-y-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-gold-400">{currentWord.russian}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {options.map((option, i) => (
              <button
                key={i}
                onClick={() => handleAnswer(option)}
                className={`p-4 rounded-lg border-2 text-center font-medium transition-all duration-200 ${
                  feedback === 'correct' && option === currentWord.german ? 'bg-gold-500/20 border-gold-500 text-gold-400'
                  : feedback === 'wrong' && option === currentWord.german ? 'bg-gold-500/20 border-gold-500 text-gold-400'
                  : feedback ? 'border-soviet-700 text-soviet-500'
                  : 'border-soviet-700 hover:border-gold-500/50 cursor-pointer text-soviet-200'
                }`}
              >{option}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
