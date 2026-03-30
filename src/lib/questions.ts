export interface Question {
  text: string;
  type: 'mcq' | 'tite';
  diff: 'easy' | 'medium' | 'hard';
  opts?: string[];
  ans: number | string;
  hint: string;
  code?: string | null;
}

export const DEFAULT_QUESTIONS: Question[] = [];

export const Q_TIMERS: Record<string, number> = { easy: 30, medium: 45, hard: 60 };
export const MAX_SPINS = 30;
export const TOTAL_DIVISIONS = 35;

export function seededShuffle<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  let s = seed;
  const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function hashStr(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function getTeamQuestions(name: string, bank: Question[]): Question[] {
  return seededShuffle(bank, hashStr(name)).slice(0, Math.min(TOTAL_DIVISIONS, bank.length));
}

export function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
}
