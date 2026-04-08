import { doc, setDoc, getDoc, collection, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { getAllWords, addWords } from './vocabulary';
import type { VocabWord } from './vocabulary';
import { getXP } from './ranks';
import { getStreak, getTodayStats } from './progress';

let syncTimeout: ReturnType<typeof setTimeout> | null = null;

/** Sync all local data to Firestore */
export async function syncToCloud(uid: string): Promise<void> {
  // Debounce: wait 2s after last change before syncing
  if (syncTimeout) clearTimeout(syncTimeout);
  return new Promise((resolve) => {
    syncTimeout = setTimeout(async () => {
      try {
        // Sync profile (XP, streak)
        await setDoc(doc(db, 'users', uid, 'profile', 'main'), {
          xp: getXP(),
          streak: getStreak(),
          lastActive: Date.now(),
        });

        // Sync today's stats
        const todayStats = getTodayStats();
        await setDoc(doc(db, 'users', uid, 'stats', todayStats.date), todayStats);

        // Sync vocabulary (batch write for efficiency)
        const words = await getAllWords();
        // Only sync words that have been practiced (not all 1834)
        const practiced = words.filter(w => w.mastery !== 'new' || w.correctCount > 0 || w.incorrectCount > 0);

        if (practiced.length > 0) {
          // Firestore batch limit is 500
          for (let i = 0; i < practiced.length; i += 400) {
            const batch = writeBatch(db);
            const chunk = practiced.slice(i, i + 400);
            for (const word of chunk) {
              const ref = doc(db, 'users', uid, 'vocabulary', word.id);
              batch.set(ref, {
                russian: word.russian,
                german: word.german,
                transliteration: word.transliteration || null,
                mastery: word.mastery,
                correctCount: word.correctCount,
                incorrectCount: word.incorrectCount,
                lastPracticed: word.lastPracticed || null,
              });
            }
            await batch.commit();
          }
        }
        resolve();
      } catch (e) {
        console.error('Sync to cloud failed:', e);
        resolve();
      }
    }, 2000);
  });
}

/** Load data from Firestore and merge with local */
export async function syncFromCloud(uid: string): Promise<void> {
  try {
    // Load profile
    const profileDoc = await getDoc(doc(db, 'users', uid, 'profile', 'main'));
    if (profileDoc.exists()) {
      const cloudProfile = profileDoc.data();
      const localXP = getXP();
      // Keep the higher XP value
      if (cloudProfile.xp > localXP) {
        localStorage.setItem('russfun_xp', String(cloudProfile.xp));
      }
      if (cloudProfile.streak > getStreak()) {
        localStorage.setItem('russfun_streak', String(cloudProfile.streak));
      }
    }

    // Load vocabulary progress
    const vocabSnap = await getDocs(collection(db, 'users', uid, 'vocabulary'));
    if (!vocabSnap.empty) {
      const cloudWords: Record<string, { mastery: string; correctCount: number; incorrectCount: number; lastPracticed: number | null }> = {};
      vocabSnap.forEach(d => {
        cloudWords[d.id] = d.data() as typeof cloudWords[string];
      });

      // Merge with local: higher progress wins
      const localWords = await getAllWords();
      const updated: VocabWord[] = [];

      for (const word of localWords) {
        const cloud = cloudWords[word.id];
        if (cloud) {
          const mergedWord = { ...word };
          // Higher correctCount wins
          if (cloud.correctCount > word.correctCount) {
            mergedWord.correctCount = cloud.correctCount;
          }
          if (cloud.incorrectCount > word.incorrectCount) {
            mergedWord.incorrectCount = cloud.incorrectCount;
          }
          // Better mastery wins
          const masteryOrder = { 'new': 0, 'learning': 1, 'mastered': 2 };
          const cloudMastery = cloud.mastery as VocabWord['mastery'];
          if (masteryOrder[cloudMastery] > masteryOrder[word.mastery]) {
            mergedWord.mastery = cloudMastery;
          }
          if (cloud.lastPracticed && (!word.lastPracticed || cloud.lastPracticed > word.lastPracticed)) {
            mergedWord.lastPracticed = cloud.lastPracticed;
          }
          updated.push(mergedWord);
        } else {
          updated.push(word);
        }
      }

      await addWords(updated);
    }

    // Load stats
    const statsSnap = await getDocs(collection(db, 'users', uid, 'stats'));
    if (!statsSnap.empty) {
      const localStats = JSON.parse(localStorage.getItem('russfun_stats') || '{}');
      statsSnap.forEach(d => {
        const cloudStat = d.data();
        const localStat = localStats[d.id];
        if (!localStat || cloudStat.totalAnswers > localStat.totalAnswers) {
          localStats[d.id] = cloudStat;
        }
      });
      localStorage.setItem('russfun_stats', JSON.stringify(localStats));
    }
  } catch (e) {
    console.error('Sync from cloud failed:', e);
  }
}

/** Quick sync - call after each game action */
export function triggerSync(uid: string | null) {
  if (!uid) return;
  syncToCloud(uid);
}
