import { useState, useRef, useEffect } from 'react';
import type { VocabWord } from '../../data/vocabulary';
import { getPracticeWords } from '../../data/vocabulary';
import { recordChatCompleted } from '../../data/progress';
import { addXP, XP_REWARDS } from '../../data/ranks';
import { sendMessage } from '../../ai/client';
import type { ChatMessage } from '../../ai/client';
import { chatPrompt, CHAT_SCENARIOS } from '../../ai/prompts';

interface Props { words: VocabWord[]; onDone: () => void; }

interface ChatEntry {
  role: 'user' | 'assistant';
  russian: string; german: string; correction?: string | null;
  suggestions?: string[]; suggestionsTranslation?: string[];
}

export default function ChatMode({ words: _words, onDone }: Props) {
  void _words;
  const [scenario, setScenario] = useState<string | null>(null);
  const [chat, setChat] = useState<ChatEntry[]>([]);
  const [apiMessages, setApiMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState('');
  const [systemPromptText, setSystemPromptText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chat]);

  const startChat = async (scenarioId: string) => {
    setScenario(scenarioId); setChat([]); setApiMessages([]); setLoading(true); setError(null);
    try {
      const practiceWords = await getPracticeWords(10);
      const scenarioInfo = CHAT_SCENARIOS.find(s => s.id === scenarioId)!;
      const sysPrompt = chatPrompt(scenarioInfo.name + ': ' + scenarioInfo.description, practiceWords);
      setSystemPromptText(sysPrompt);
      const firstMessage: ChatMessage = { role: 'user', content: 'Starte das Gespraech. Begruesse mich.' };
      const response = await sendMessage(sysPrompt, [firstMessage]);
      let parsed: { response: string; translation: string; correction?: string | null; suggestions?: string[]; suggestionsTranslation?: string[] };
      try { parsed = JSON.parse(response); } catch { throw new Error('Antwort konnte nicht gelesen werden. Bitte nochmal versuchen.'); }
      setChat([{ role: 'assistant', russian: parsed.response, german: parsed.translation, correction: parsed.correction, suggestions: parsed.suggestions, suggestionsTranslation: parsed.suggestionsTranslation }]);
      setApiMessages([firstMessage, { role: 'assistant', content: response }]);
    } catch (e) { setError(e instanceof Error ? e.message : 'Fehler'); }
    finally { setLoading(false); }
  };

  const sendUserMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    setInput('');
    setChat(prev => [...prev, { role: 'user', russian: text, german: '' }]);
    const newMsg: ChatMessage = { role: 'user', content: text };
    const updated = [...apiMessages, newMsg];
    setApiMessages(updated); setLoading(true); setError(null);
    try {
      const response = await sendMessage(systemPromptText, updated);
      let parsed: { response: string; translation: string; correction?: string | null; suggestions?: string[]; suggestionsTranslation?: string[] };
      try { parsed = JSON.parse(response); } catch { throw new Error('Antwort konnte nicht gelesen werden.'); }
      setChat(prev => [...prev, { role: 'assistant', russian: parsed.response, german: parsed.translation, correction: parsed.correction, suggestions: parsed.suggestions, suggestionsTranslation: parsed.suggestionsTranslation }]);
      setApiMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (e) { setError(e instanceof Error ? e.message : 'Fehler'); }
    finally { setLoading(false); }
  };

  if (!scenario) {
    return (
      <div className="max-w-lg mx-auto">
        <h2 className="font-['Oswald'] text-xl font-bold text-gold-400 mb-6 uppercase tracking-wide">Chat-Simulation</h2>
        <p className="text-soviet-300 mb-6">Waehle ein Szenario:</p>
        <div className="grid grid-cols-1 gap-3">
          {CHAT_SCENARIOS.map(s => (
            <button key={s.id} onClick={() => startChat(s.id)}
              className="text-left p-5 rounded-lg bg-soviet-900/60 border border-soviet-700 hover:border-gold-500 hover:shadow-[0_0_15px_rgba(204,0,0,0.3)] transition-all cursor-pointer">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{s.icon}</span>
                <div>
                  <h4 className="font-['Oswald'] font-medium text-soviet-100 uppercase">{s.name}</h4>
                  <p className="text-sm text-soviet-400">{s.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
        <button onClick={onDone} className="mt-6 text-soviet-500 hover:text-soviet-300 text-sm">Zurueck</button>
      </div>
    );
  }

  const scenarioInfo = CHAT_SCENARIOS.find(s => s.id === scenario)!;

  return (
    <div className="max-w-lg mx-auto flex flex-col" style={{ height: 'calc(100vh - 140px)' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">{scenarioInfo.icon}</span>
          <h2 className="font-['Oswald'] text-lg font-bold text-gold-400 uppercase">{scenarioInfo.name}</h2>
        </div>
        <button onClick={() => { recordChatCompleted(); addXP(XP_REWARDS.chatCompleted); onDone(); }} className="text-sm text-soviet-500 hover:text-soviet-300">Beenden</button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {chat.map((entry, i) => (
          <div key={i} className={`flex ${entry.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-lg p-4 ${
              entry.role === 'user' ? 'bg-soviet-600 border border-soviet-500' : 'bg-soviet-900/60 border border-soviet-700'
            }`}>
              <p className={`font-medium ${entry.role === 'user' ? 'text-soviet-100' : 'text-gold-400'}`}>{entry.russian}</p>
              {entry.german && <p className={`text-sm mt-1 ${entry.role === 'user' ? 'text-soviet-300' : 'text-soviet-400'}`}>{entry.german}</p>}
              {entry.correction && <p className="text-sm mt-2 text-gold-500 bg-gold-500/10 rounded-lg p-2">Korrektur: {entry.correction}</p>}
            </div>
          </div>
        ))}

        {chat.length > 0 && chat[chat.length - 1].role === 'assistant' && !loading && (
          <div className="space-y-2">
            <p className="text-xs text-soviet-500 ml-1">Vorschlaege:</p>
            {chat[chat.length - 1].suggestions?.map((s, i) => (
              <button key={i} onClick={() => sendUserMessage(s)}
                className="block w-full text-left p-3 rounded-lg border border-soviet-700 hover:border-gold-500/50 transition-colors text-sm">
                <span className="text-soviet-200">{s}</span>
                {chat[chat.length - 1].suggestionsTranslation?.[i] && (
                  <span className="text-soviet-500 ml-2">({chat[chat.length - 1].suggestionsTranslation![i]})</span>
                )}
              </button>
            ))}
          </div>
        )}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-soviet-900/60 border border-soviet-700 rounded-lg p-4">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gold-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-gold-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-gold-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        {error && <p className="text-center text-sm text-soviet-400">{error}</p>}
        <div ref={chatEndRef} />
      </div>

      <div className="flex gap-2">
        <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendUserMessage(input)}
          placeholder="Auf Russisch antworten..."
          className="flex-1 px-4 py-3 bg-soviet-800 border border-soviet-600 rounded-lg text-soviet-100 placeholder:text-soviet-600 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent" />
        <button onClick={() => sendUserMessage(input)} disabled={!input.trim() || loading}
          className="px-5 py-3 bg-soviet-600 text-gold-400 rounded-lg hover:bg-soviet-500 transition-colors font-['Oswald'] font-bold uppercase border border-gold-500 disabled:opacity-50 disabled:cursor-not-allowed">
          Senden
        </button>
      </div>
    </div>
  );
}
