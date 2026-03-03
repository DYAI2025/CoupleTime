import { useEffect, useState } from "react";
import { Heart, Flame, ArrowRight } from "lucide-react";
import { getStreakService } from "@/services/StreakService";
import { Button } from "@/components/ui/button";

interface Props {
  onDone: () => void;
}

export function SessionCompletedView({ onDone }: Props) {
  const [stats, setStats] = useState({ currentStreak: 0, totalSessions: 0, todayCompleted: false });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const s = getStreakService().getStats();
    setStats(s);
    // Trigger entrance animation
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  const isStreakMilestone = stats.currentStreak > 0 && stats.currentStreak % 7 === 0;
  const isFirstSession = stats.totalSessions === 1;

  return (
    <div
      className={`flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-rose-50 via-white to-sky-50 p-6 transition-all duration-700 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
    >
      {/* Animated hearts */}
      <div className="relative mb-8">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-rose-100 to-sky-100 flex items-center justify-center">
          <Heart className="w-12 h-12 text-rose-400 animate-pulse" />
        </div>
        <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center animate-bounce">
          <span className="text-sm">✨</span>
        </div>
      </div>

      {/* Title */}
      <h2 className="text-3xl font-light text-slate-800 mb-2 text-center">
        {isFirstSession ? "Euer erstes Zwiegespräch!" : "Gut gemacht!"}
      </h2>
      <p className="text-slate-500 text-center mb-8 max-w-xs">
        {isFirstSession
          ? "Herzlich willkommen. Ein wunderbarer erster Schritt."
          : "Ihr habt euch Zeit füreinander genommen – das zählt."}
      </p>

      {/* Streak card */}
      {stats.currentStreak > 0 && (
        <div className={`rounded-2xl p-5 mb-6 text-center w-full max-w-xs ${
          isStreakMilestone
            ? "bg-gradient-to-r from-amber-400 to-orange-500 text-white"
            : "bg-white border border-slate-200"
        }`}>
          <div className="flex items-center justify-center gap-2 mb-1">
            <Flame className={`w-5 h-5 ${isStreakMilestone ? "text-white" : "text-amber-500"}`} />
            <span className={`text-sm font-medium ${isStreakMilestone ? "text-white/80" : "text-slate-500"}`}>
              Euer Streak
            </span>
          </div>
          <p className={`text-4xl font-bold ${isStreakMilestone ? "text-white" : "text-slate-800"}`}>
            {stats.currentStreak}
            <span className={`text-xl font-normal ml-1 ${isStreakMilestone ? "text-white/80" : "text-slate-500"}`}>
              {stats.currentStreak === 1 ? "Tag" : "Tage"}
            </span>
          </p>
          {isStreakMilestone && (
            <p className="text-white/90 text-sm mt-2">
              🎉 {stats.currentStreak} Tage in Folge! Ihr seid unschlagbar!
            </p>
          )}
        </div>
      )}

      {/* Return button */}
      <Button
        type="button"
        size="lg"
        onClick={onDone}
        className="w-full max-w-xs rounded-xl py-6 bg-gradient-to-r from-rose-400 to-sky-500 hover:from-rose-500 hover:to-sky-600 text-white shadow-lg"
      >
        Zurück zur Übersicht
        <ArrowRight className="w-5 h-5 ml-2" />
      </Button>

      <p className="text-slate-400 text-xs mt-4 text-center">
        Die Session wurde in eurem Streak gespeichert.
      </p>
    </div>
  );
}
