import { useState, useEffect, useCallback, useRef } from 'react';
import type { VocabWord } from '../../data/vocabulary';
import { updateWord, recordAnswer, getPracticedWords } from '../../data/vocabulary';
import { recordStudy, recordGamePlayed } from '../../data/progress';
import { addXP, XP_REWARDS } from '../../data/ranks';
import { playCorrect, playWrong, playComplete, flashScreen } from '../../utils/sounds';

interface Props {
  words: VocabWord[];
  onDone: () => void;
}

type Direction = 'ru-de' | 'de-ru';

interface Question {
  word: VocabWord;
  direction: Direction;
  prompt: string;
  correctAnswer: string;
  options: string[];
}

export default function ReviewMode({ words: _words, onDone }: Props) {
  void _words;
  const [loading, setLoading] = useState(true);
  const [practicedWords, setPracticedWords] = useState<VocabWord[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const totalQuestions = useRef(10);

  useEffect(() => {
    const load = async () => {
      const practiced = await getPracticedWords();
      setPracticedWords(practiced);
      if (practiced.length >= 4) {
        buildQuestions(practiced);
      }
      setLoading(false);
    };
    load();
  }, []);

  const buildQuestions = useCallback((practiced: VocabWord[]) => {
    const count = Math.min(totalQuestions.current, practiced.length);
    // Pick random words, each gets a random direction
    const shuffled = [...practiced].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, count);

    const qs: Question[] = selected.map(word => {
      const direction: Direction = Math.random() < 0.5 ? 'ru-de' : 'de-ru';
      const prompt = direction === 'ru-de' ? word.russian : word.german;
      const correctAnswer = direction === 'ru-de' ? word.german : word.russian;

      // Get wrong options from the same pool
      const others = practiced.filter(w => w.id !== word.id);
      const wrongWords = others.sort(() => Math.random() - 0.5).slice(0, 3);
      const wrongOptions = wrongWords.map(w => direction === 'ru-de' ? w.german : w.russian);
      const options = [...wrongOptions, correctAnswer].sort(() => Math.random() - 0.5);

      return { word, direction, prompt, correctAnswer, options };
    });

    setQuestions(qs);
    setCurrentIdx(0);
    setScore(0);
    setIsComplete(false);
    setFeedback(null);
    setSelectedAnswer(null);
  }, []);

  const handleAnswer = async (answer: string) => {
    if (feedback) return;
    const q = questions[currentIdx];
    const correct = answer === q.correctAnswer;
    setFeedback(correct ? 'correct' : 'wrong');
    setSelectedAnswer(answer);
    if (correct) setScore(prev => prev + 1);

    await updateWord(recordAnswer(q.word, correct));
    recordStudy(correct);
    addXP(correct ? XP_REWARDS.correctAnswer : XP_REWARDS.incorrectAnswer);
    if (correct) { playCorrect(); flashScreen(true); }
    else { playWrong(); flashScreen(false); }

    setTimeout(() => {
      if (currentIdx + 1 >= questions.length) {
        setIsComplete(true);
        recordGamePlayed();
        addXP(XP_REWARDS.gameCompleted);
        if (score + (correct ? 1 : 0) === questions.length) addXP(XP_REWARDS.perfectGame);
        playComplete();
      } else {
        setCurrentIdx(prev => prev + 1);
        setFeedback(null);
        setSelectedAnswer(null);
      }
    }, 800);
  };

  const restart = () => {
    if (practicedWords.length >= 4) {
      buildQuestions(practicedWords);
    }
  };

  if (loading) {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <p className="text-soviet-300">Lade geuebte Vokabeln...</p>
      </div>
    );
  }

  if (practicedWords.length < 4) {
    return (
      <div className="max-w-lg mx-auto text-center py-12 space-y-4">
        <p className="text-gold-400 text-5xl">&#9888;</p>
        <h3 className="font-['Oswald'] text-xl font-bold text-soviet-100 uppercase">Zu wenige Vokabeln</h3>
        <p className="text-soviet-300">
          Du brauchst mindestens 4 geuebte Vokabeln fuer die Wiederholung.
          Spiele zuerst ein paar andere Modi!
        </p>
        <p className="text-soviet-400 text-sm">Aktuell geuebt: {practicedWords.length} Woerter</p>
        <button onClick={onDone} className="px-5 py-2.5 text-soviet-300 hover:bg-soviet-800 rounded-lg transition-colors mt-4">Zurueck</button>
      </div>
    );
  }

  if (isComplete) {
    const perfect = score === questions.length;
    return (
      <div className="max-w-lg mx-auto text-center py-12 space-y-4">
        <p className="text-gold-400 text-5xl">{perfect ? '\u2605' : '\u2606'}</p>
        <h3 className="font-['Oswald'] text-xl font-bold text-soviet-100 uppercase">Wiederholung abgeschlossen!</h3>
        <p className="text-3xl font-bold text-gold-400 font-['Oswald']">{score}/{questions.length}</p>
        <p className="text-soviet-300">richtig beantwortet</p>
        {perfect && <p className="text-gold-400 font-['Oswald'] uppercase tracking-wide">Perfekt, Genosse!</p>}
        <div className="flex gap-3 justify-center mt-6">
          <button onClick={restart} className="px-5 py-2.5 bg-soviet-600 text-gold-400 rounded-lg hover:bg-soviet-500 transition-colors font-['Oswald'] font-bold uppercase border border-gold-500">Nochmal</button>
          <button onClick={onDone} className="px-5 py-2.5 text-soviet-300 hover:bg-soviet-800 rounded-lg transition-colors">Zurueck</button>
        </div>
      </div>
    );
  }

  const q = questions[currentIdx];
  const dirLabel = q.direction === 'ru-de' ? 'Russisch \u2192 Deutsch' : 'Deutsch \u2192 Russisch';

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-soviet-400 font-['Oswald'] uppercase">{dirLabel}</span>
        <span className="text-sm text-soviet-400 font-['Oswald']">{currentIdx + 1}/{questions.length}</span>
      </div>

      <div className="w-full h-2 bg-soviet-800 rounded-full mb-6">
        <div className="h-full bg-soviet-500 rounded-full transition-all duration-300" style={{ width: `${((currentIdx) / questions.length) * 100}%` }} />
      </div>

      <div className="bg-soviet-900/60 rounded-lg p-8 border border-soviet-700 space-y-6">
        <div className="text-center">
          <p className="text-3xl font-bold text-gold-400">{q.prompt}</p>
          {q.direction === 'ru-de' && q.word.transliteration && (
            <p className="text-sm text-soviet-500 mt-1">({q.word.transliteration})</p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3">
          {q.options.map((option, i) => {
            let cls = 'border-soviet-700 hover:border-gold-500/50 cursor-pointer text-soviet-200';
            if (feedback) {
              if (option === q.correctAnswer) {
                cls = 'bg-gold-500/20 border-gold-500 text-gold-400';
              } else if (option === selectedAnswer && feedback === 'wrong') {
                cls = 'bg-soviet-500/20 border-soviet-400 text-soviet-400';
              } else {
                cls = 'border-soviet-700 text-soviet-500';
              }
            }
            return (
              <button
                key={i}
                onClick={() => handleAnswer(option)}
                className={`p-4 rounded-lg border-2 text-center font-medium transition-all duration-200 ${cls}`}
              >
                {option}
              </button>
            );
          })}
        </div>
      </div>

      <div className="text-center mt-4">
        <span className="text-sm text-soviet-500">Punkte: {score}</span>
      </div>
    </div>
  );
}
