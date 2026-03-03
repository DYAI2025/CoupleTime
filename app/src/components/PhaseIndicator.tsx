import { useTranslation } from "@/hooks/useTranslation";
import type { Speaker } from "@/domain/Speaker";
import type { PhaseType } from "@/domain/PhaseType";

export interface PhaseIndicatorProps {
  phaseName: PhaseType | string | null;
  speaker?: Speaker | null;
  isPaused?: boolean;
}

export const PhaseIndicator: React.FC<PhaseIndicatorProps> = ({
  phaseName,
  speaker = null,
  isPaused = false,
}) => {
  const { t } = useTranslation();

  const getPhaseLabel = (phase: string | null): string => {
    if (!phase) return t("phase.unknown", "Unbekannt");
    return t(`phase.${phase}`, phase);
  };

  const getPhaseColor = () => {
    if (isPaused) return "bg-slate-300";
    if (speaker === "A") return "bg-red-500";
    if (speaker === "B") return "bg-sky-500";
    return "bg-slate-500";
  };

  const getSpeakerLabel = () => {
    if (!speaker) return null;
    return t(`speaker.${speaker.toLowerCase()}`, `Partner ${speaker}`);
  };

  return (
    <div className="flex flex-col items-center gap-3 animate-fade-in-down">
      {/* Phase badge */}
      <div className="flex items-center gap-3">
        <div
          className={`w-3 h-3 rounded-full ${getPhaseColor()} ${
            !isPaused ? "animate-pulse-slow" : ""
          }`}
        />
        <span className="text-lg font-medium text-slate-700">
          {getPhaseLabel(phaseName)}
        </span>
      </div>

      {/* Speaker badge */}
      {speaker && (
        <span
          className={`px-4 py-1.5 rounded-full text-sm font-medium ${
            speaker === "A"
              ? "bg-red-100 text-red-700"
              : "bg-sky-100 text-sky-700"
          }`}
        >
          {getSpeakerLabel()}
        </span>
      )}
    </div>
  );
};

export default PhaseIndicator;
