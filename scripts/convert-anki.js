import { readFileSync, writeFileSync } from 'fs';

const raw = readFileSync('/Users/peervalerian/Desktop/aRussisch.txt', 'utf-8');
const lines = raw.trim().split('\n');

const words = [];
let id = 1;

for (const line of lines) {
  // Skip header lines
  if (line.startsWith('#')) continue;

  const parts = line.split('\t');
  if (parts.length < 2) continue;

  const german = parts[0].trim();
  let russianRaw = parts[1].trim();

  // Extract example sentence if present
  let example = undefined;
  const exampleMatch = russianRaw.match(/Beispiel:\s*🇷🇺\s*(.+?)\s*🇩🇪/);
  if (exampleMatch) {
    example = exampleMatch[1].trim();
  }

  // Remove everything after "Beispiel:"
  russianRaw = russianRaw.replace(/\s*Beispiel:.*$/, '').trim();

  // Extract transliteration from () or []
  let transliteration = undefined;
  const translitMatch = russianRaw.match(/[\(\[]\s*([^)\]]+)\s*[\)\]]\s*$/);
  if (translitMatch) {
    transliteration = translitMatch[1].trim();
    russianRaw = russianRaw.replace(/\s*[\(\[].*[\)\]]\s*$/, '').trim();
  }

  if (!german || !russianRaw) continue;

  words.push({
    id: String(id++),
    russian: russianRaw,
    german: german,
    transliteration: transliteration || undefined,
    example: example || undefined,
  });
}

console.log(`Parsed ${words.length} words`);

// Write as TypeScript module
const tsContent = `// Auto-generated from Anki export - ${words.length} words
import type { VocabWord } from './vocabulary';

interface AnkiEntry {
  id: string;
  russian: string;
  german: string;
  transliteration?: string;
  example?: string;
}

const ANKI_DATA: AnkiEntry[] = ${JSON.stringify(words, null, 2)};

export function getDefaultVocabulary(): VocabWord[] {
  return ANKI_DATA.map(entry => ({
    id: entry.id,
    russian: entry.russian,
    german: entry.german,
    example: entry.example,
    tags: [],
    mastery: 'new' as const,
    correctCount: 0,
    incorrectCount: 0,
  }));
}

export function getTransliteration(russian: string): string | undefined {
  return ANKI_DATA.find(e => e.russian === russian)?.transliteration;
}

export { ANKI_DATA };
`;

writeFileSync('src/data/anki-deck.ts', tsContent);
console.log('Written to src/data/anki-deck.ts');
