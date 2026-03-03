import { useState, useEffect } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { Lightbulb, X } from "lucide-react";

export interface GuidanceTipProps {
  tips: string[];
  autoDismissMs?: number;
}

export const GuidanceTip: React.FC<GuidanceTipProps> = ({
  tips,
  autoDismissMs = 15000,
}) => {
  const { t } = useTranslation();
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (tips.length === 0 || isDismissed) return;

    // Auto-dismiss after specified time
    const dismissTimer = setTimeout(() => {
      setIsVisible(false);
    }, autoDismissMs);

    // Rotate through tips every 8 seconds
    const rotationTimer = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % tips.length);
    }, 8000);

    return () => {
      clearTimeout(dismissTimer);
      clearInterval(rotationTimer);
    };
  }, [tips, autoDismissMs, isDismissed]);

  // Reset when tips change
  useEffect(() => {
    setCurrentTipIndex(0);
    setIsVisible(true);
    setIsDismissed(false);
  }, [tips.join(",")]);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
  };

  if (tips.length === 0 || isDismissed) return null;

  const currentTip = tips[currentTipIndex];

  return (
    <div
      className={`relative max-w-sm mx-auto transition-all duration-400 ${
        isVisible
          ? "opacity-100 translate-y-0 scale-100"
          : "opacity-0 -translate-y-2 scale-95 pointer-events-none"
      }`}
    >
      <div className="bg-white/80 backdrop-blur-sm border border-amber-200 rounded-2xl p-4 shadow-lg shadow-amber-100/50">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <Lightbulb className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-medium text-amber-600 uppercase tracking-wider">
            {t("guidance.title", "Tipp")}
          </span>
          <button
            type="button"
            onClick={handleDismiss}
            className="ml-auto p-1 rounded-full hover:bg-amber-100 transition-colors"
            aria-label={t("guidance.dismiss", "Schließen")}
          >
            <X className="w-3 h-3 text-amber-400" />
          </button>
        </div>

        {/* Tip content */}
        <p
          key={currentTipIndex}
          className="text-sm text-slate-600 leading-relaxed transition-all duration-300"
        >
          {t(currentTip, currentTip)}
        </p>

        {/* Pagination dots */}
        {tips.length > 1 && (
          <div className="flex justify-center gap-1.5 mt-3">
            {tips.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setCurrentTipIndex(index)}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  index === currentTipIndex
                    ? "bg-amber-400"
                    : "bg-amber-200 hover:bg-amber-300"
                }`}
                aria-label={t("guidance.goToTip", "Zu Tipp {{number}}", {
                  number: index + 1,
                })}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GuidanceTip;
