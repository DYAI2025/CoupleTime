// StreakService – tracks completed sessions and calculates streaks
// All data is stored locally, nothing is sent to servers.

const STORAGE_KEY = "couples-timer-streak-data";

export interface SessionRecord {
  id: string;
  date: string; // YYYY-MM-DD (local date)
  modeId: string;
  modeName: string;
  totalDurationSeconds: number;
  completedAt: number; // Unix timestamp
}

export interface StreakData {
  records: SessionRecord[];
  longestStreak: number;
  lastUpdated: number;
}

export interface StreakStats {
  currentStreak: number;       // consecutive days with at least one session
  longestStreak: number;
  totalSessions: number;
  totalMinutes: number;
  sessionsThisWeek: number;
  lastSessionDate: string | null;
  todayCompleted: boolean;
}

function toLocalDateString(timestamp: number = Date.now()): string {
  const d = new Date(timestamp);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function daysBetween(a: string, b: string): number {
  const da = new Date(a).getTime();
  const db = new Date(b).getTime();
  return Math.round(Math.abs(da - db) / (1000 * 60 * 60 * 24));
}

function calculateStreak(records: SessionRecord[]): number {
  if (records.length === 0) return 0;

  // Get unique dates sorted descending
  const uniqueDates = [...new Set(records.map((r) => r.date))].sort(
    (a, b) => b.localeCompare(a)
  );

  const today = toLocalDateString();
  const yesterday = toLocalDateString(Date.now() - 86400000);

  // Streak must include today or yesterday (otherwise it's broken)
  if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) return 0;

  let streak = 1;
  for (let i = 1; i < uniqueDates.length; i++) {
    if (daysBetween(uniqueDates[i - 1], uniqueDates[i]) === 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

export class StreakService {
  private data: StreakData = { records: [], longestStreak: 0, lastUpdated: 0 };
  private loaded = false;

  private load(): void {
    if (this.loaded) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        this.data = JSON.parse(raw) as StreakData;
      }
    } catch {
      this.data = { records: [], longestStreak: 0, lastUpdated: 0 };
    }
    this.loaded = true;
  }

  private save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch {
      console.error("StreakService: failed to save");
    }
  }

  recordCompletedSession(
    modeId: string,
    modeName: string,
    totalDurationSeconds: number
  ): void {
    this.load();
    const record: SessionRecord = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      date: toLocalDateString(),
      modeId,
      modeName,
      totalDurationSeconds,
      completedAt: Date.now(),
    };
    this.data.records.push(record);
    this.data.lastUpdated = Date.now();

    const current = calculateStreak(this.data.records);
    if (current > this.data.longestStreak) {
      this.data.longestStreak = current;
    }

    this.save();
  }

  getStats(): StreakStats {
    this.load();
    const { records, longestStreak } = this.data;

    const today = toLocalDateString();
    const weekAgo = toLocalDateString(Date.now() - 7 * 86400000);

    const totalSessions = records.length;
    const totalMinutes = Math.round(
      records.reduce((s, r) => s + r.totalDurationSeconds, 0) / 60
    );
    const sessionsThisWeek = records.filter((r) => r.date >= weekAgo).length;
    const todayCompleted = records.some((r) => r.date === today);
    const lastSessionDate =
      records.length > 0 ? records[records.length - 1].date : null;
    const currentStreak = calculateStreak(records);

    return {
      currentStreak,
      longestStreak: Math.max(longestStreak, currentStreak),
      totalSessions,
      totalMinutes,
      sessionsThisWeek,
      lastSessionDate,
      todayCompleted,
    };
  }

  getRecentRecords(count = 7): SessionRecord[] {
    this.load();
    return [...this.data.records]
      .sort((a, b) => b.completedAt - a.completedAt)
      .slice(0, count);
  }

  clearAll(): void {
    this.data = { records: [], longestStreak: 0, lastUpdated: 0 };
    localStorage.removeItem(STORAGE_KEY);
    this.loaded = true;
  }
}

let sharedStreakService: StreakService | null = null;

export function getStreakService(): StreakService {
  if (!sharedStreakService) {
    sharedStreakService = new StreakService();
  }
  return sharedStreakService;
}
