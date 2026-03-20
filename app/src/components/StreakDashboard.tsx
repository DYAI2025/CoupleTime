import { useEffect, useState } from "react";
import { Flame, Trophy, Clock, Calendar } from "lucide-react";
import { getStreakService, type StreakStats } from "@/services/StreakService";
import { useTranslation } from "@/hooks/useTranslation";

interface Props {
  refreshTrigger?: number;
}

export function StreakDashboard({ refreshTrigger = 0 }: Props) {
  const [stats, setStats] = useState<StreakStats | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    const s = getStreakService().getStats();
    setStats(s);
  }, [refreshTrigger]);

  if (!stats || stats.totalSessions === 0) {
    return (
      <div className="bg-gradient-to-r from-sky-50 to-rose-50 rounded-2xl border border-slate-200 p-5 text-center">
        <p className="text-slate-400 text-sm">
          {t("streak.empty")}
        </p>
      </div>
    );
  }

  const streakColor =
    stats.currentStreak >= 7
      ? "from-amber-400 to-orange-500"
      : stats.currentStreak >= 3
      ? "from-sky-400 to-blue-500"
      : "from-rose-400 to-pink-500";

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className={`bg-gradient-to-r ${streakColor} p-4 text-white`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-6 h-6" />
            <div>
              <p className="text-xs font-medium opacity-80">{t("streak.title")}</p>
              <p className="text-3xl font-bold leading-none">
                {stats.currentStreak}
                <span className="text-lg font-normal ml-1">
                  {stats.currentStreak === 1 ? t("streak.daySingular") : t("streak.dayPlural")}
                </span>
              </p>
            </div>
          </div>
          {stats.todayCompleted && (
            <div className="bg-white/20 rounded-full px-3 py-1 text-xs font-medium">
              {t("streak.todayDone")}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 divide-x divide-slate-100 p-1">
        <StatCell
          icon={<Trophy className="w-4 h-4 text-amber-500" />}
          label={t("streak.bestStreak")}
          value={`${stats.longestStreak}T`}
        />
        <StatCell
          icon={<Clock className="w-4 h-4 text-sky-500" />}
          label={t("streak.total")}
          value={`${stats.totalMinutes}m`}
        />
        <StatCell
          icon={<Calendar className="w-4 h-4 text-rose-500" />}
          label={t("streak.thisWeek")}
          value={`${stats.sessionsThisWeek}×`}
        />
      </div>

      <WeeklyCalendar />
    </div>
  );
}

function StatCell({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col items-center py-3 gap-1">
      {icon}
      <p className="text-lg font-semibold text-slate-800">{value}</p>
      <p className="text-xs text-slate-400">{label}</p>
    </div>
  );
}

function WeeklyCalendar() {
  const { t, i18n } = useTranslation();
  const days = i18n.language === "de"
    ? ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"]
    : ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
  const records = getStreakService().getRecentRecords(30);

  const completedDates = new Set(records.map((r) => r.date));

  const today = new Date();
  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;
    return { label: days[i], dateStr, isToday: dateStr === formatToday() };
  });

  return (
    <div className="px-4 pb-4">
      <p className="text-xs text-slate-400 mb-2">{t("streak.thisWeek")}</p>
      <div className="flex justify-between">
        {weekDays.map(({ label, dateStr, isToday }) => {
          const done = completedDates.has(dateStr);
          return (
            <div key={dateStr} className="flex flex-col items-center gap-1">
              <p className={`text-xs ${isToday ? "font-semibold text-slate-700" : "text-slate-400"}`}>
                {label}
              </p>
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs transition-all ${
                  done
                    ? "bg-gradient-to-br from-rose-400 to-sky-400 text-white shadow-sm"
                    : isToday
                    ? "border-2 border-sky-300 text-slate-400"
                    : "bg-slate-100 text-slate-300"
                }`}
              >
                {done ? "♥" : "·"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
