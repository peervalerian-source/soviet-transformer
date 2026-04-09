// Spaced Repetition System (SM-2 inspired)
// Stores review data separately from VocabWord in localStorage

export interface SRCard {
  wordId: string;
  interval: number;      // days until next review
  easeFactor: number;    // difficulty multiplier (min 1.3)
  repetitions: number;   // consecutive correct reviews
  nextReview: number;    // timestamp of next scheduled review
  lastReview: number;    // timestamp of last review
}

export type Rating = 'again' | 'hard' | 'good' | 'easy';

const SR_KEY = 'russfun_sr';

function loadSRData(): Record<string, SRCard> {
  const raw = localStorage.getItem(SR_KEY);
  return raw ? JSON.parse(raw) : {};
}

function saveSRData(data: Record<string, SRCard>) {
  localStorage.setItem(SR_KEY, JSON.stringify(data));
}

export function getSRCard(wordId: string): SRCard | null {
  const data = loadSRData();
  return data[wordId] || null;
}

export function reviewCard(wordId: string, rating: Rating): SRCard {
  const data = loadSRData();
  const now = Date.now();

  const existing = data[wordId] || {
    wordId,
    interval: 0,
    easeFactor: 2.5,
    repetitions: 0,
    nextReview: now,
    lastReview: now,
  };

  let { interval, easeFactor, repetitions } = existing;

  switch (rating) {
    case 'again':
      // Reset - show again soon
      repetitions = 0;
      interval = 0; // Will show again in this session
      easeFactor = Math.max(1.3, easeFactor - 0.2);
      break;

    case 'hard':
      // Slight increase, lower ease
      if (repetitions === 0) {
        interval = 1;
      } else {
        interval = Math.max(1, Math.round(interval * 1.2));
      }
      repetitions++;
      easeFactor = Math.max(1.3, easeFactor - 0.15);
      break;

    case 'good':
      // Normal progression
      if (repetitions === 0) {
        interval = 1;
      } else if (repetitions === 1) {
        interval = 3;
      } else {
        interval = Math.round(interval * easeFactor);
      }
      repetitions++;
      break;

    case 'easy':
      // Accelerated progression
      if (repetitions === 0) {
        interval = 3;
      } else if (repetitions === 1) {
        interval = 7;
      } else {
        interval = Math.round(interval * easeFactor * 1.3);
      }
      repetitions++;
      easeFactor = Math.min(3.0, easeFactor + 0.15);
      break;
  }

  const card: SRCard = {
    wordId,
    interval,
    easeFactor,
    repetitions,
    nextReview: now + interval * 24 * 60 * 60 * 1000,
    lastReview: now,
  };

  data[wordId] = card;
  saveSRData(data);
  return card;
}

/**
 * Get words due for review, sorted by urgency.
 * Words with no SR data are "new" and have highest priority.
 * Words past their nextReview are "due".
 * Returns { newCards, dueCards } filtered from given word IDs.
 */
export function getDueCards(wordIds: string[]): { newIds: string[]; dueIds: string[]; futureIds: string[] } {
  const data = loadSRData();
  const now = Date.now();

  const newIds: string[] = [];
  const dueIds: string[] = [];
  const futureIds: string[] = [];

  for (const id of wordIds) {
    const card = data[id];
    if (!card) {
      newIds.push(id);
    } else if (card.nextReview <= now || card.interval === 0) {
      dueIds.push(id);
    } else {
      futureIds.push(id);
    }
  }

  // Sort due cards by most overdue first
  dueIds.sort((a, b) => {
    const ca = data[a]!;
    const cb = data[b]!;
    return ca.nextReview - cb.nextReview;
  });

  return { newIds, dueIds, futureIds };
}

export function getSRStats(wordIds: string[]): { newCount: number; dueCount: number; learnedCount: number } {
  const { newIds, dueIds, futureIds } = getDueCards(wordIds);
  return {
    newCount: newIds.length,
    dueCount: dueIds.length,
    learnedCount: futureIds.length,
  };
}
