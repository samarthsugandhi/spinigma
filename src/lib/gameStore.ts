import { db } from './firebase';
import { collection, getDocs, setDoc, doc, writeBatch, query, orderBy, deleteDoc } from 'firebase/firestore';
import { Question, DEFAULT_QUESTIONS } from './questions';

const ADMIN_PASSPHRASE = import.meta.env.VITE_ADMIN_PASSPHRASE || 'Z9@vT#4qLp!8Xr$2';

let _teamsCache: Record<string, any> = {};
let _qCache: Question[] | null = null;

export const getSettings = (): any => {
  try { return JSON.parse(localStorage.getItem('rmSettings') || '{}'); } catch { return {}; }
};
export const saveSettings_ = (s: any) => localStorage.setItem('rmSettings', JSON.stringify(s));
export const getAdminPass = () => ADMIN_PASSPHRASE;

export async function fetchTeams(): Promise<Record<string, any>> {
  try {
    const querySnapshot = await getDocs(collection(db, 'teams'));
    const teams: Record<string, any> = {};
    if (!querySnapshot.empty) {
      querySnapshot.forEach(docSnap => {
        const row = docSnap.data();
        teams[row.name] = {
          name: row.name,
          lead: row.lead,
          score: row.score,
          answered: row.answered,
          skippedCount: row.skipped_count,
          correctCount: row.correct_count,
          wrongCount: row.wrong_count,
          spinCount: row.spin_count,
          usedDivisions: row.used_divisions || [],
          attemptLog: row.attempt_log || [],
          finished: row.finished,
          joinedAt: row.joined_at,
          globalElapsed: row.global_elapsed,
          tabSwitchCount: row.tab_switch_count || 0,
          tabSwitches: row.tab_switches || [],
        };
      });
    }
    _teamsCache = teams;
    return teams;
  } catch (e) {
    console.error('fetchTeams error:', e);
    return _teamsCache;
  }
}

export async function saveTeamData(teams: Record<string, any>): Promise<boolean> {
  _teamsCache = teams;
  try {
    const batch = writeBatch(db);
    for (const [name, t] of Object.entries(teams)) {
      const row = {
        name,
        lead: t.lead || '',
        score: t.score || 0,
        answered: t.answered || 0,
        skipped_count: t.skippedCount || 0,
        correct_count: t.correctCount || 0,
        wrong_count: t.wrongCount || 0,
        spin_count: t.spinCount || 0,
        used_divisions: t.usedDivisions || [],
        attempt_log: t.attemptLog || [],
        finished: t.finished || false,
        global_elapsed: t.globalElapsed || 0,
        joined_at: t.joinedAt || Date.now(),
        tab_switch_count: t.tabSwitchCount || 0,
        tab_switches: t.tabSwitches || [],
      };
      const docRef = doc(db, 'teams', name);
      batch.set(docRef, row, { merge: true });
    }
    await batch.commit();
    return true;
  } catch (e) {
    console.error('saveTeamData error:', e);
    return false;
  }
}

export function getTeamsCache() { return _teamsCache; }

export async function fetchQuestions(): Promise<Question[]> {
  try {
    const qInfo = query(collection(db, 'questions'), orderBy('sort_order', 'asc'));
    const snap = await getDocs(qInfo);
    if (!snap.empty) {
      const qs: Question[] = [];
      snap.forEach(d => {
        const r = d.data();
        qs.push({
          text: r.text,
          type: r.type as 'mcq' | 'tite',
          diff: r.diff as 'easy' | 'medium' | 'hard',
          opts: r.opts || undefined,
          ans: r.type === 'mcq' ? Number(r.ans) : r.ans,
          hint: r.hint,
          code: r.code || null,
        });
      });
      _qCache = qs;
      return qs;
    }
  } catch (e) {
    console.error('fetchQuestions error:', e);
  }
  _qCache = DEFAULT_QUESTIONS;
  return DEFAULT_QUESTIONS;
}

export function getQCache(): Question[] { return _qCache || DEFAULT_QUESTIONS; }

export async function saveQuestions(qs: Question[]): Promise<void> {
  _qCache = qs;
  try {
    const questionsRef = collection(db, 'questions');
    const existing = await getDocs(questionsRef);
    const batch = writeBatch(db);
    
    // Delete existing questions
    existing.forEach(d => batch.delete(d.ref));
    
    // Insert new ones
    qs.forEach((q, i) => {
      const newRef = doc(questionsRef);
      batch.set(newRef, {
        text: q.text,
        type: q.type,
        diff: q.diff,
        opts: q.opts || null,
        ans: String(q.ans),
        hint: q.hint,
        code: q.code || null,
        sort_order: i,
      });
    });
    await batch.commit();
  } catch (e) {
    console.error('saveQuestions error:', e);
  }
}
