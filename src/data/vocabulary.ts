export interface VocabWord {
  id: string;
  russian: string;
  german: string;
  transliteration?: string;
  example?: string;
  tags: string[];
  mastery: 'new' | 'learning' | 'mastered';
  correctCount: number;
  incorrectCount: number;
  lastPracticed?: number;
}

const DB_NAME = 'russfun';
const DB_VERSION = 1;
const STORE_NAME = 'vocabulary';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('mastery', 'mastery');
        store.createIndex('lastPracticed', 'lastPracticed');
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getAllWords(): Promise<VocabWord[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function addWords(words: VocabWord[]): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  for (const word of words) {
    store.put(word);
  }
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function updateWord(word: VocabWord): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  tx.objectStore(STORE_NAME).put(word);
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function clearAllWords(): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  tx.objectStore(STORE_NAME).clear();
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getWordsByMastery(mastery: VocabWord['mastery']): Promise<VocabWord[]> {
  const all = await getAllWords();
  return all.filter(w => w.mastery === mastery);
}

export async function getRandomWords(count: number, exclude: string[] = []): Promise<VocabWord[]> {
  const all = await getAllWords();
  const filtered = all.filter(w => !exclude.includes(w.id));
  const shuffled = filtered.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export async function getPracticeWords(count: number): Promise<VocabWord[]> {
  const all = await getAllWords();
  // Prioritize: new words and words with low mastery / high error rate
  const scored = all.map(w => {
    let score = 0;
    if (w.mastery === 'new') score += 10;
    if (w.mastery === 'learning') score += 5;
    score += w.incorrectCount * 2;
    score -= w.correctCount;
    if (w.lastPracticed) {
      const hoursSince = (Date.now() - w.lastPracticed) / (1000 * 60 * 60);
      score += Math.min(hoursSince, 48);
    } else {
      score += 20;
    }
    return { word: w, score };
  });
  scored.sort((a, b) => b.score - a.score);
  // Take top candidates but add some randomness
  const top = scored.slice(0, Math.max(count * 3, 20));
  const shuffled = top.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map(s => s.word);
}

export function recordAnswer(word: VocabWord, correct: boolean): VocabWord {
  const updated = { ...word, lastPracticed: Date.now() };
  if (correct) {
    updated.correctCount++;
    if (updated.correctCount >= 5 && updated.mastery === 'learning') {
      updated.mastery = 'mastered';
    } else if (updated.mastery === 'new') {
      updated.mastery = 'learning';
    }
  } else {
    updated.incorrectCount++;
    if (updated.mastery === 'mastered') {
      updated.mastery = 'learning';
    }
  }
  return updated;
}
