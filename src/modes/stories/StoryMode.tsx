import { useState, useCallback } from 'react';
import type { VocabWord } from '../../data/vocabulary';
import { updateWord, recordAnswer, getPracticeWords } from '../../data/vocabulary';
import { recordStudy, recordStoryCompleted } from '../../data/progress';
import { addXP, XP_REWARDS } from '../../data/ranks';
import { sendMessage } from '../../ai/client';
import { storyPrompt } from '../../ai/prompts';

interface Props { words: VocabWord[]; onDone: () => void; }
interface StorySentence { russian: string; german: string; blankWord: string; options: string[]; }
interface Story { title: string; sentences: StorySentence[]; summary: string; }

export default function StoryMode({ words: _words, onDone }: Props) {
  void _words;
  const [story, setStory] = useState<Story | null>(null);
  const [currentSentence, setCurrentSentence] = useState(0);
  const [answers, setAnswers] = useState<(string | null)[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [storyWords, setStoryWords] = useState<VocabWord[]>([]);

  const generateStory = useCallback(async () => {
    setLoading(true); setError(null); setStory(null); setCurrentSentence(0); setAnswers([]); setShowResult(false); setScore(0);
    try {
      const practiceWords = await getPracticeWords(5);
      setStoryWords(practiceWords);
      const response = await sendMessage(storyPrompt(practiceWords, 'easy'), [{ role: 'user', content: 'Erstelle eine Geschichte.' }]);
      const parsed = JSON.parse(response) as Story;
      setStory(parsed); setAnswers(new Array(parsed.sentences.length).fill(null));
    } catch (e) { setError(e instanceof Error ? e.message : 'Unbekannter Fehler'); }
    finally { setLoading(false); }
  }, []);

  const handleAnswer = async (option: string) => {
    if (!story) return;
    const sentence = story.sentences[currentSentence];
    const correct = option === sentence.blankWord;
    setAnswers(prev => { const u = [...prev]; u[currentSentence] = option; return u; });
    if (correct) setScore(prev => prev + 1);
    const matchingWord = storyWords.find(w => w.russian === sentence.blankWord || w.russian.includes(sentence.blankWord));
    if (matchingWord) await updateWord(recordAnswer(matchingWord, correct));
    recordStudy(correct);
    addXP(correct ? XP_REWARDS.correctAnswer : XP_REWARDS.incorrectAnswer);
    setTimeout(() => {
      if (currentSentence < story.sentences.length - 1) setCurrentSentence(prev => prev + 1);
      else { setShowResult(true); recordStoryCompleted(); addXP(XP_REWARDS.storyCompleted); }
    }, 1200);
  };

  if (!story && !loading && !error) {
    return (
      <div className="max-w-lg mx-auto text-center py-12 space-y-4">
        <h2 className="font-['Oswald'] text-xl font-bold text-gold-400 uppercase tracking-wide">Mini-Geschichten</h2>
        <p className="text-soviet-300">Claude erstellt eine kurze Geschichte mit deinen Vokabeln.</p>
        <button onClick={generateStory} className="px-6 py-3 bg-soviet-600 text-gold-400 rounded-lg hover:bg-soviet-500 transition-colors font-['Oswald'] font-bold uppercase border-2 border-gold-500">Geschichte generieren</button>
        <button onClick={onDone} className="block mx-auto mt-2 text-soviet-500 hover:text-soviet-300 text-sm">Zurueck</button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <div className="animate-spin w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-soviet-300">Geschichte wird erstellt...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-lg mx-auto text-center py-12 space-y-4">
        <p className="text-soviet-400">{error}</p>
        <div className="flex gap-3 justify-center">
          <button onClick={generateStory} className="px-5 py-2.5 bg-soviet-600 text-gold-400 rounded-lg hover:bg-soviet-500 transition-colors font-['Oswald'] font-bold uppercase border border-gold-500">Nochmal</button>
          <button onClick={onDone} className="px-5 py-2.5 text-soviet-300 hover:bg-soviet-800 rounded-lg transition-colors">Zurueck</button>
        </div>
      </div>
    );
  }

  if (showResult && story) {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <div className="text-center py-6">
          <p className="text-gold-400 text-5xl mb-3">&#9733;</p>
          <h3 className="font-['Oswald'] text-xl font-bold text-soviet-100 uppercase">Geschichte abgeschlossen!</h3>
          <p className="text-soviet-300 mt-2">{score} von {story.sentences.length} richtig</p>
        </div>
        <div className="bg-soviet-900/60 rounded-lg p-6 border border-soviet-700 space-y-3">
          <h4 className="font-medium text-gold-400">{story.title}</h4>
          {story.sentences.map((s, i) => (
            <div key={i} className="text-sm"><p className="text-soviet-100">{s.russian}</p><p className="text-soviet-400">{s.german}</p></div>
          ))}
          <p className="text-sm text-soviet-300 mt-4 pt-4 border-t border-soviet-700">{story.summary}</p>
        </div>
        <div className="flex gap-3 justify-center">
          <button onClick={generateStory} className="px-5 py-2.5 bg-soviet-600 text-gold-400 rounded-lg hover:bg-soviet-500 transition-colors font-['Oswald'] font-bold uppercase border border-gold-500">Neue Geschichte</button>
          <button onClick={onDone} className="px-5 py-2.5 text-soviet-300 hover:bg-soviet-800 rounded-lg transition-colors">Zurueck</button>
        </div>
      </div>
    );
  }

  if (!story) return null;
  const sentence = story.sentences[currentSentence];
  const currentAnswer = answers[currentSentence];
  const isAnswered = currentAnswer !== null;
  const isCorrect = currentAnswer === sentence.blankWord;
  const displaySentence = sentence.russian.replace(sentence.blankWord, isAnswered ? currentAnswer! : '________');

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-['Oswald'] text-lg font-bold text-gold-400 uppercase">{story.title}</h2>
        <span className="text-sm text-soviet-400">{currentSentence + 1}/{story.sentences.length}</span>
      </div>
      <div className="flex gap-1.5 mb-6">
        {story.sentences.map((_, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${
            i < currentSentence ? (answers[i] === story.sentences[i].blankWord ? 'bg-gold-500' : 'bg-soviet-500') : i === currentSentence ? 'bg-soviet-400' : 'bg-soviet-800'
          }`} />
        ))}
      </div>
      <div className="bg-soviet-900/60 rounded-lg p-6 border border-soviet-700 space-y-6">
        <div className="text-center">
          <p className={`text-xl font-medium ${isAnswered ? (isCorrect ? 'text-gold-400' : 'text-soviet-400') : 'text-soviet-100'}`}>{displaySentence}</p>
          <p className="text-sm text-soviet-400 mt-2">{sentence.german}</p>
        </div>
        {!isAnswered && (
          <div className="grid grid-cols-2 gap-3">
            {sentence.options.map((option, i) => (
              <button key={i} onClick={() => handleAnswer(option)} className="p-3 rounded-lg border-2 border-soviet-700 text-soviet-200 font-medium hover:border-gold-500/50 transition-colors cursor-pointer">{option}</button>
            ))}
          </div>
        )}
        {isAnswered && !isCorrect && <p className="text-center text-sm text-soviet-400">Richtig: <span className="font-medium text-gold-400">{sentence.blankWord}</span></p>}
      </div>
    </div>
  );
}
