import { useTranslation } from "@/hooks/useTranslation";
import type { SessionMode } from "@/domain/SessionMode";
import {
  getFormattedTotalDuration,
  getRoundCount,
} from "@/domain/SessionMode";
import { Lock, Clock, RotateCcw, Sparkles, Edit3 } from "lucide-react";

export interface ModeCardProps {
  mode: SessionMode;
  isSelected?: boolean;
  onClick?: () => void;
  onEdit?: () => void;
  showEdit?: boolean;
}

export const ModeCard: React.FC<ModeCardProps> = ({
  mode,
  isSelected = false,
  onClick,
  onEdit,
  showEdit = false,
}) => {
  const { t } = useTranslation();

  const getModeIcon = () => {
    if (mode.id === "maintain") return <RotateCcw className="w-5 h-5" />;
    if (mode.id === "commitment") return <Sparkles className="w-5 h-5" />;
    if (mode.id === "listening") return <Clock className="w-5 h-5" />;
    return <Edit3 className="w-5 h-5" />;
  };

  const getModeColor = () => {
    if (mode.id === "maintain") return "border-emerald-200 bg-emerald-50/50";
    if (mode.id === "commitment") return "border-rose-200 bg-rose-50/50";
    if (mode.id === "listening") return "border-violet-200 bg-violet-50/50";
    return "border-amber-200 bg-amber-50/50";
  };

  const getSelectedColor = () => {
    if (mode.id === "maintain") return "ring-emerald-400 border-emerald-400";
    if (mode.id === "commitment") return "ring-rose-400 border-rose-400";
    if (mode.id === "listening") return "ring-violet-400 border-violet-400";
    return "ring-amber-400 border-amber-400";
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative w-full text-left p-5 rounded-2xl border-2 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
        isSelected
          ? `ring-2 ${getSelectedColor()}`
          : `hover:border-slate-300 ${getModeColor()}`
      }`}
      aria-pressed={isSelected}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-xl ${
              mode.id === "maintain"
                ? "bg-emerald-100 text-emerald-600"
                : mode.id === "commitment"
                ? "bg-rose-100 text-rose-600"
                : mode.id === "listening"
                ? "bg-violet-100 text-violet-600"
                : "bg-amber-100 text-amber-600"
            }`}
          >
            {getModeIcon()}
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">
              {t(mode.name, mode.name)}
            </h3>
            {mode.isPreset && (
              <span className="text-xs text-slate-400">
                {t("mode.preset", "Voreingestellt")}
              </span>
            )}
            {!mode.isPreset && (
              <span className="text-xs text-amber-500">
                {t("mode.custom", "Benutzerdefiniert")}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {mode.isLocked && (
            <Lock className="w-4 h-4 text-slate-300" aria-label={t("mode.locked")} />
          )}
          {showEdit && onEdit && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label={t("mode.edit", "Bearbeiten")}
            >
              <Edit3 className="w-4 h-4 text-slate-400" />
            </button>
          )}
        </div>
      </div>

      {/* Description */}
      {mode.description && (
        <p className="text-sm text-slate-500 mb-4 line-clamp-2">
          {t(mode.description, mode.description)}
        </p>
      )}

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1.5 text-slate-500">
          <Clock className="w-4 h-4" />
          <span>{getFormattedTotalDuration(mode)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-500">
          <RotateCcw className="w-4 h-4" />
          <span>
            {getRoundCount(mode)}{" "}
            {t("mode.rounds", "Runden")}
          </span>
        </div>
      </div>

      {/* Selected indicator */}
      {isSelected && (
        <div
          className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center ${
            mode.id === "maintain"
              ? "bg-emerald-500"
              : mode.id === "commitment"
              ? "bg-rose-500"
              : mode.id === "listening"
              ? "bg-violet-500"
              : "bg-amber-500"
          }`}
        >
          <svg
            className="w-4 h-4 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
      )}
    </button>
  );
};

export default ModeCard;
