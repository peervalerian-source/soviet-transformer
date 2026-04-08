import { useState } from 'react';
import { getApiKey, setApiKey, removeApiKey } from '../ai/client';

interface Props {
  onApiKeyChange: () => void;
  onBack: () => void;
}

export default function Settings({ onApiKeyChange, onBack }: Props) {
  const [key, setKey] = useState(getApiKey() || '');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    if (key.trim()) {
      setApiKey(key.trim());
    } else {
      removeApiKey();
    }
    onApiKeyChange();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h2 className="font-['Oswald'] text-2xl font-bold text-gold-400 uppercase tracking-wide">Einstellungen</h2>

      <div className="bg-soviet-900/60 rounded-lg p-6 border border-soviet-700 space-y-4">
        <div>
          <label className="block text-sm font-medium text-soviet-200 mb-1.5">Claude API Key</label>
          <p className="text-sm text-soviet-400 mb-3">
            Wird fuer Mini-Geschichten und Chat-Simulation benoetigt. Nur lokal gespeichert.
          </p>
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="sk-ant-..."
            className="w-full px-4 py-2.5 bg-soviet-800 border border-soviet-600 rounded-lg text-soviet-100 placeholder:text-soviet-600 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleSave} className="px-5 py-2.5 bg-soviet-600 text-gold-400 rounded-lg hover:bg-soviet-500 transition-colors font-['Oswald'] font-bold uppercase tracking-wider border border-gold-500">
            Speichern
          </button>
          {saved && <span className="text-sm text-gold-400 animate-pulse">Gespeichert!</span>}
        </div>
      </div>

      <button onClick={onBack} className="px-5 py-2.5 text-soviet-300 hover:bg-soviet-800 rounded-lg transition-colors">
        Zurueck
      </button>
    </div>
  );
}
