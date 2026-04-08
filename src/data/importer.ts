import type { VocabWord } from './vocabulary';

export interface ImportResult {
  words: VocabWord[];
  errors: string[];
}

export function parseCSV(text: string): ImportResult {
  const lines = text.trim().split('\n');
  const words: VocabWord[] = [];
  const errors: string[] = [];

  // Detect separator: tab, semicolon, or comma
  const firstLine = lines[0];
  let separator = '\t';
  if (!firstLine.includes('\t')) {
    separator = firstLine.includes(';') ? ';' : ',';
  }

  // Check if first line is a header
  const firstCols = firstLine.split(separator).map(c => c.trim().toLowerCase());
  const hasHeader = firstCols.some(c =>
    ['russian', 'russisch', 'german', 'deutsch', 'front', 'back', 'vorderseite', 'rückseite'].includes(c)
  );

  const startIdx = hasHeader ? 1 : 0;
  let russianCol = 0;
  let germanCol = 1;
  let exampleCol = -1;

  if (hasHeader) {
    russianCol = firstCols.findIndex(c => ['russian', 'russisch', 'front', 'vorderseite'].includes(c));
    germanCol = firstCols.findIndex(c => ['german', 'deutsch', 'back', 'rückseite'].includes(c));
    exampleCol = firstCols.findIndex(c => ['example', 'beispiel', 'satz'].includes(c));
    if (russianCol === -1) russianCol = 0;
    if (germanCol === -1) germanCol = 1;
  }

  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = line.split(separator).map(c => c.trim());

    if (cols.length < 2) {
      errors.push(`Zeile ${i + 1}: Zu wenig Spalten`);
      continue;
    }

    const russian = cols[russianCol]?.replace(/^"|"$/g, '');
    const german = cols[germanCol]?.replace(/^"|"$/g, '');

    if (!russian || !german) {
      errors.push(`Zeile ${i + 1}: Leere Felder`);
      continue;
    }

    const word: VocabWord = {
      id: crypto.randomUUID(),
      russian,
      german,
      example: exampleCol >= 0 ? cols[exampleCol]?.replace(/^"|"$/g, '') : undefined,
      tags: [],
      mastery: 'new',
      correctCount: 0,
      incorrectCount: 0,
    };
    words.push(word);
  }

  return { words, errors };
}
