import { useState, useCallback } from 'react';
import { parseCSV } from '../data/importer';
import { addWords, clearAllWords, getAllWords } from '../data/vocabulary';

interface Props {
  onDone: () => void;
}

export default function ImportView({ onDone }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const [result, setResult] = useState<{ added: number; errors: string[] } | null>(null);
  const [loading, setLoading] = useState(false);

  const processFile = useCallback(async (text: string) => {
    setLoading(true);
    const { words, errors } = parseCSV(text);
    if (words.length > 0) await addWords(words);
    setResult({ added: words.length, errors });
    setLoading(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) file.text().then(processFile);
  }, [processFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) file.text().then(processFile);
  }, [processFile]);

  const handleClearAll = async () => {
    if (confirm('Alle Vokabeln loeschen? Der Fortschritt geht verloren.')) {
      await clearAllWords();
      onDone();
    }
  };

  const handleShowCount = async () => {
    const all = await getAllWords();
    alert(`${all.length} Woerter in der Datenbank.`);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h2 className="font-['Oswald'] text-2xl font-bold text-gold-400 uppercase tracking-wide">Vokabeln importieren</h2>
      <p className="text-soviet-300">
        Exportiere dein Anki-Deck als CSV oder TXT. Zwei Spalten: Russisch und Deutsch.
      </p>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer ${
          dragOver ? 'border-gold-500 bg-soviet-800/50' : 'border-soviet-600 hover:border-gold-500/50'
        }`}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <input id="file-input" type="file" accept=".csv,.txt,.tsv" onChange={handleFileSelect} className="hidden" />
        {loading ? (
          <p className="text-soviet-300">Importiere...</p>
        ) : (
          <>
            <p className="text-lg text-soviet-200 mb-2">Datei hierher ziehen oder klicken</p>
            <p className="text-sm text-soviet-500">CSV, TSV oder TXT</p>
          </>
        )}
      </div>

      {result && (
        <div className={`rounded-lg p-4 border ${
          result.errors.length > 0 ? 'bg-gold-500/10 border-gold-500/30' : 'bg-success-500/10 border-success-500/30'
        }`}>
          <p className="font-medium text-soviet-100">{result.added} Woerter importiert!</p>
          {result.errors.length > 0 && (
            <div className="mt-2">
              <p className="text-sm text-soviet-300 mb-1">{result.errors.length} Fehler:</p>
              <ul className="text-sm text-soviet-400 list-disc ml-5">
                {result.errors.slice(0, 5).map((err, i) => <li key={i}>{err}</li>)}
                {result.errors.length > 5 && <li>...und {result.errors.length - 5} weitere</li>}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="bg-soviet-900/60 rounded-lg p-5 border border-soviet-700">
        <h3 className="font-medium text-soviet-200 mb-2">Beispiel-Format</h3>
        <pre className="text-sm text-soviet-300 bg-soviet-800 rounded-lg p-3 overflow-x-auto">
{`russisch\tdeutsch
привет\tHallo
спасибо\tDanke
до свидания\tAuf Wiedersehen`}
        </pre>
      </div>

      <div className="flex gap-3">
        <button onClick={onDone} className="px-5 py-2.5 bg-soviet-600 text-gold-400 rounded-lg hover:bg-soviet-500 transition-colors font-['Oswald'] font-bold uppercase tracking-wider border border-gold-500">
          Fertig
        </button>
        <button onClick={handleShowCount} className="px-5 py-2.5 text-soviet-300 hover:bg-soviet-800 rounded-lg transition-colors">
          Anzahl anzeigen
        </button>
        <button onClick={handleClearAll} className="px-5 py-2.5 text-soviet-400 hover:bg-soviet-800 hover:text-soviet-200 rounded-lg transition-colors">
          Alle loeschen
        </button>
      </div>
    </div>
  );
}
