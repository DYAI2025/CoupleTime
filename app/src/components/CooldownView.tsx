import { useTranslation } from "@/hooks/useTranslation";
import { Wind, Heart, Sparkles } from "lucide-react";

export interface CooldownViewProps {
  remainingTime: string;
  progress: number;
}

export const CooldownView: React.FC<CooldownViewProps> = ({
  remainingTime,
  progress,
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto">
      {/* Breathing animation */}
      <div className="relative mb-8">
        <div
          className="w-40 h-40 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 animate-breathing"
        />
        <div
          className="absolute inset-0 w-40 h-40 rounded-full bg-gradient-to-br from-teal-200 to-emerald-200 animate-breathing-delayed"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <Wind className="w-12 h-12 text-emerald-500" />
        </div>
      </div>

      {/* Main message */}
      <div className="text-center mb-6 animate-fade-in">
        <h2 className="text-2xl font-light text-slate-700 mb-2">
          {t("cooldown.title", "Cooldown")}
        </h2>
        <p className="text-slate-500">
          {t("cooldown.noDiscussion", "Kein Nachgespräch")}
        </p>
      </div>

      {/* Remaining time */}
      <div className="text-center mb-8 animate-fade-in-delayed">
        <span className="text-4xl font-light text-emerald-600 tabular-nums">
          {remainingTime}
        </span>
        <p className="text-sm text-slate-400 mt-1">
          {t("cooldown.remaining", "Verbleibende Zeit")}
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-xs h-1 bg-slate-200 rounded-full overflow-hidden mb-8">
        <div
          className="h-full bg-emerald-400 rounded-full transition-all duration-500"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/* Gentle reminders */}
      <div className="flex flex-col items-center gap-4 text-sm text-slate-500 animate-fade-in-delayed-2">
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-rose-400" />
          <span>{t("cooldown.gratitude", "Danke fürs Zuhören")}</span>
        </div>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{t("cooldown.reflect", "Nehmt euch Zeit zum Nachdenken")}</span>
        </div>
      </div>
    </div>
  );
};

export default CooldownView;
