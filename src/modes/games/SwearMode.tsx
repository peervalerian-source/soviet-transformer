import { useState, useMemo } from 'react';
import { SWEAR_DECK } from '../../data/swear-deck';
import type { SwearWord } from '../../data/swear-deck';

interface Props {
  onDone: () => void;
}

type Tab = 'browse' | 'quiz';

export default function SwearMode({ onDone }: Props) {
  const [tab, setTab] = useState<Tab>('browse');
  const [filter, setFilter] = useState<'all' | 'mild' | 'medium' | 'heavy'>('all');

  // Quiz state
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizWords, setQuizWords] = useState<SwearWord[]>([]);
  const [quizOptions, setQuizOptions] = useState<string[]>([]);
  const [quizFeedback, setQuizFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);

  const filtered = useMemo(() => {
    if (filter === 'all') return SWEAR_DECK;
    return SWEAR_DECK.filter(w => w.level === filter);
  }, [filter]);

  const levelColor = (level: string) => {
    switch (level) {
      case 'mild': return 'bg-gold-500/20 text-gold-400 border-gold-500/40';
      case 'medium': return 'bg-soviet-500/20 text-soviet-300 border-soviet-500/40';
      case 'heavy': return 'bg-soviet-700/40 text-soviet-200 border-soviet-400/40';
      default: return '';
    }
  };

  const levelLabel = (level: string) => {
    switch (level) {
      case 'mild': return 'Harmlos';
      case 'medium': return 'Mittel';
      case 'heavy': return 'Heftig';
      default: return '';
    }
  };

  const startQuiz = () => {
    const shuffled = [...SWEAR_DECK].sort(() => Math.random() - 0.5).slice(0, 10);
    setQuizWords(shuffled);
    setQuizIdx(0);
    setQuizScore(0);
    setQuizStarted(true);
    loadQuizQuestion(shuffled, 0);
  };

  const loadQuizQuestion = (words: SwearWord[], idx: number) => {
    const word = words[idx];
    const others = SWEAR_DECK.filter(w => w.russian !== word.russian);
    const wrong = others.sort(() => Math.random() - 0.5).slice(0, 3).map(w => w.german);
    setQuizOptions([...wrong, word.german].sort(() => Math.random() - 0.5));
    setQuizFeedback(null);
  };

  const handleQuizAnswer = (answer: string) => {
    if (quizFeedback) return;
    const correct = answer === quizWords[quizIdx].german;
    setQuizFeedback(correct ? 'correct' : 'wrong');
    if (correct) setQuizScore(prev => prev + 1);
    setTimeout(() => {
      const next = quizIdx + 1;
      if (next >= quizWords.length) {
        setQuizIdx(next);
      } else {
        setQuizIdx(next);
        loadQuizQuestion(quizWords, next);
      }
    }, 1200);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-['Oswald'] text-xl font-bold text-soviet-400 uppercase tracking-wide">
            &#128520; Geheimes Archiv
          </h2>
          <p className="text-sm text-soviet-500">Russische Schimpfwoerter & Flueche</p>
        </div>
        <button onClick={onDone} className="text-sm text-soviet-500 hover:text-soviet-300">Zurueck</button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('browse')}
          className={`px-4 py-2 rounded-lg font-['Oswald'] uppercase text-sm transition-colors ${
            tab === 'browse' ? 'bg-soviet-600 text-gold-400 border border-gold-500' : 'text-soviet-400 hover:bg-soviet-800'
          }`}
        >Woerterbuch</button>
        <button
          onClick={() => { setTab('quiz'); if (!quizStarted) startQuiz(); }}
          className={`px-4 py-2 rounded-lg font-['Oswald'] uppercase text-sm transition-colors ${
            tab === 'quiz' ? 'bg-soviet-600 text-gold-400 border border-gold-500' : 'text-soviet-400 hover:bg-soviet-800'
          }`}
        >Quiz</button>
      </div>

      {tab === 'browse' && (
        <>
          {/* Filter */}
          <div className="flex gap-2 mb-4">
            {(['all', 'mild', 'medium', 'heavy'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  filter === f ? 'bg-soviet-600 text-soviet-100' : 'text-soviet-500 hover:bg-soviet-800'
                }`}
              >
                {f === 'all' ? 'Alle' : levelLabel(f)} ({f === 'all' ? SWEAR_DECK.length : SWEAR_DECK.filter(w => w.level === f).length})
              </button>
            ))}
          </div>

          {/* Word List */}
          <div className="space-y-3">
            {filtered.map((word, i) => (
              <div key={i} className="bg-soviet-900/60 rounded-lg p-4 border border-soviet-700">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-gold-400">{word.russian}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${levelColor(word.level)}`}>
                        {levelLabel(word.level)}
                      </span>
                    </div>
                    <p className="text-sm text-soviet-500 mt-0.5">({word.transliteration})</p>
                    <p className="text-soviet-200 mt-1">{word.german}</p>
                    <p className="text-sm text-soviet-500 mt-1 italic">{word.context}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'quiz' && (
        <>
          {quizIdx >= quizWords.length ? (
            <div className="text-center py-12 space-y-4">
              <p className="text-4xl">&#128520;</p>
              <h3 className="font-['Oswald'] text-xl font-bold text-soviet-100 uppercase">Quiz fertig!</h3>
              <p className="text-soviet-300">{quizScore} von {quizWords.length} richtig</p>
              <p className="text-sm text-soviet-500">
                {quizScore >= 8 ? 'Du fluchst wie ein echter Russe!' : quizScore >= 5 ? 'Nicht schlecht, Genosse!' : 'Da muss noch geuebt werden...'}
              </p>
              <button onClick={startQuiz} className="px-5 py-2.5 bg-soviet-600 text-gold-400 rounded-lg hover:bg-soviet-500 transition-colors font-['Oswald'] font-bold uppercase border border-gold-500">
                Nochmal
              </button>
            </div>
          ) : (
            <div className="bg-soviet-900/60 rounded-lg p-6 border border-soviet-700 space-y-6">
              <div className="flex justify-between text-sm text-soviet-500">
                <span>{quizIdx + 1}/{quizWords.length}</span>
                <span>{quizScore} richtig</span>
              </div>

              <div className="text-center">
                <p className="text-2xl font-bold text-gold-400">{quizWords[quizIdx].russian}</p>
                <p className="text-sm text-soviet-500 mt-1">({quizWords[quizIdx].transliteration})</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {quizOptions.map((option, i) => (
                  <button
                    key={i}
                    onClick={() => handleQuizAnswer(option)}
                    className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                      quizFeedback === 'correct' && option === quizWords[quizIdx].german
                        ? 'bg-gold-500/20 border-gold-500 text-gold-400'
                        : quizFeedback === 'wrong' && option === quizWords[quizIdx].german
                        ? 'bg-gold-500/20 border-gold-500 text-gold-400'
                        : quizFeedback
                        ? 'border-soviet-700 text-soviet-600'
                        : 'border-soviet-700 text-soviet-200 hover:border-gold-500/50 cursor-pointer'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>

              {quizFeedback && (
                <p className="text-center text-sm text-soviet-500 italic">
                  {quizWords[quizIdx].context}
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
