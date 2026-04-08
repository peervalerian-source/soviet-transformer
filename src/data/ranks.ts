export interface Rank {
  id: string;
  name: string;
  nameRu: string;
  minXP: number;
  icon: string;
}

export const RANKS: Rank[] = [
  { id: 'recruit',    name: 'Rekrut',           nameRu: 'Рекрут',          minXP: 0,      icon: '🔰' },
  { id: 'private',    name: 'Soldat',           nameRu: 'Рядовой',         minXP: 200,    icon: '⭐' },
  { id: 'corporal',   name: 'Gefreiter',        nameRu: 'Ефрейтор',        minXP: 600,    icon: '⭐' },
  { id: 'sergeant',   name: 'Sergeant',         nameRu: 'Сержант',         minXP: 1500,   icon: '🎖️' },
  { id: 'starshina',  name: 'Feldwebel',        nameRu: 'Старшина',        minXP: 3000,   icon: '🎖️' },
  { id: 'lieutenant', name: 'Leutnant',         nameRu: 'Лейтенант',       minXP: 5500,   icon: '🏅' },
  { id: 'captain',    name: 'Hauptmann',        nameRu: 'Капитан',         minXP: 9000,   icon: '🏅' },
  { id: 'major',      name: 'Major',            nameRu: 'Майор',           minXP: 15000,  icon: '🎗️' },
  { id: 'colonel',    name: 'Oberst',           nameRu: 'Полковник',       minXP: 25000,  icon: '🎗️' },
  { id: 'general',    name: 'General',          nameRu: 'Генерал',         minXP: 40000,  icon: '⚔️' },
  { id: 'marshal',    name: 'Marschall',        nameRu: 'Маршал',          minXP: 70000,  icon: '🔱' },
  { id: 'hero',       name: 'Held der Sprache', nameRu: 'Герой Языка',     minXP: 120000, icon: '🌟' },
];

const XP_KEY = 'russfun_xp';
const RANK_NOTIF_KEY = 'russfun_last_rank';

export function getXP(): number {
  return parseInt(localStorage.getItem(XP_KEY) || '0', 10);
}

export function addXP(amount: number): { newXP: number; rankUp: Rank | null } {
  const oldXP = getXP();
  const newXP = oldXP + amount;
  localStorage.setItem(XP_KEY, String(newXP));

  const oldRank = getRankForXP(oldXP);
  const newRank = getRankForXP(newXP);

  const rankUp = newRank.id !== oldRank.id ? newRank : null;
  if (rankUp) {
    localStorage.setItem(RANK_NOTIF_KEY, rankUp.id);
  }

  return { newXP, rankUp };
}

export function getRankForXP(xp: number): Rank {
  let current = RANKS[0];
  for (const rank of RANKS) {
    if (xp >= rank.minXP) current = rank;
    else break;
  }
  return current;
}

export function getCurrentRank(): Rank {
  return getRankForXP(getXP());
}

export function getNextRank(): Rank | null {
  const current = getCurrentRank();
  const idx = RANKS.findIndex(r => r.id === current.id);
  return idx < RANKS.length - 1 ? RANKS[idx + 1] : null;
}

export function getProgressToNextRank(): number {
  const xp = getXP();
  const current = getCurrentRank();
  const next = getNextRank();
  if (!next) return 100;
  const range = next.minXP - current.minXP;
  const progress = xp - current.minXP;
  return Math.min(Math.round((progress / range) * 100), 100);
}

// XP rewards
export const XP_REWARDS = {
  correctAnswer: 5,
  incorrectAnswer: 1,  // still get a little for trying
  gameCompleted: 20,
  storyCompleted: 30,
  chatCompleted: 25,
  perfectGame: 50,     // bonus for no mistakes in a game
};

export function checkPendingRankUp(): Rank | null {
  const pending = localStorage.getItem(RANK_NOTIF_KEY);
  if (pending) {
    localStorage.removeItem(RANK_NOTIF_KEY);
    return RANKS.find(r => r.id === pending) || null;
  }
  return null;
}
