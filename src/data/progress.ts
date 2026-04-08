interface DailyStats {
  date: string;
  wordsStudied: number;
  correctAnswers: number;
  totalAnswers: number;
  gamesPlayed: number;
  storiesCompleted: number;
  chatsCompleted: number;
}

const STATS_KEY = 'russfun_stats';
const STREAK_KEY = 'russfun_streak';

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function loadStats(): Record<string, DailyStats> {
  const raw = localStorage.getItem(STATS_KEY);
  return raw ? JSON.parse(raw) : {};
}

function saveStats(stats: Record<string, DailyStats>) {
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

export function getTodayStats(): DailyStats {
  const stats = loadStats();
  const today = getTodayKey();
  return stats[today] || {
    date: today,
    wordsStudied: 0,
    correctAnswers: 0,
    totalAnswers: 0,
    gamesPlayed: 0,
    storiesCompleted: 0,
    chatsCompleted: 0,
  };
}

export function recordStudy(correct: boolean) {
  const stats = loadStats();
  const today = getTodayKey();
  const todayStats = stats[today] || {
    date: today,
    wordsStudied: 0,
    correctAnswers: 0,
    totalAnswers: 0,
    gamesPlayed: 0,
    storiesCompleted: 0,
    chatsCompleted: 0,
  };
  todayStats.totalAnswers++;
  if (correct) todayStats.correctAnswers++;
  todayStats.wordsStudied++;
  stats[today] = todayStats;
  saveStats(stats);
  updateStreak();
}

export function recordGamePlayed() {
  const stats = loadStats();
  const today = getTodayKey();
  const todayStats = stats[today] || getTodayStats();
  todayStats.gamesPlayed++;
  stats[today] = todayStats;
  saveStats(stats);
}

export function recordStoryCompleted() {
  const stats = loadStats();
  const today = getTodayKey();
  const todayStats = stats[today] || getTodayStats();
  todayStats.storiesCompleted++;
  stats[today] = todayStats;
  saveStats(stats);
}

export function recordChatCompleted() {
  const stats = loadStats();
  const today = getTodayKey();
  const todayStats = stats[today] || getTodayStats();
  todayStats.chatsCompleted++;
  stats[today] = todayStats;
  saveStats(stats);
}

function updateStreak() {
  const stats = loadStats();
  const dates = Object.keys(stats).sort().reverse();
  let streak = 0;
  const today = new Date();

  for (let i = 0; i < dates.length; i++) {
    const expected = new Date(today);
    expected.setDate(expected.getDate() - i);
    const expectedKey = expected.toISOString().slice(0, 10);

    if (dates[i] === expectedKey && stats[dates[i]].totalAnswers > 0) {
      streak++;
    } else {
      break;
    }
  }

  localStorage.setItem(STREAK_KEY, String(streak));
}

export function getStreak(): number {
  return parseInt(localStorage.getItem(STREAK_KEY) || '0', 10);
}

export function getWeeklyStats(): DailyStats[] {
  const stats = loadStats();
  const result: DailyStats[] = [];
  const today = new Date();

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    result.push(stats[key] || {
      date: key,
      wordsStudied: 0,
      correctAnswers: 0,
      totalAnswers: 0,
      gamesPlayed: 0,
      storiesCompleted: 0,
      chatsCompleted: 0,
    });
  }

  return result;
}
