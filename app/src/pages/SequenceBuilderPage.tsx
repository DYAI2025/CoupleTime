import { useState, useCallback, useEffect } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import type { SessionMode } from "@/domain/SessionMode";
import { isValidSessionMode, createSessionMode } from "@/domain/SessionMode";
import { createPhaseConfig, formatDuration } from "@/domain/PhaseConfig";
import type { PhaseType } from "@/domain/PhaseType";
import { useModeSelection } from "@/viewModel/useModeSelection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  ChevronLeft,
  Plus,
  Trash2,
  GripVertical,
  Clock,
  Check,
  X,
} from "lucide-react";

interface LocationState {
  mode?: SessionMode;
  isNew?: boolean;
}

const PHASE_TYPE_OPTIONS: { value: PhaseType; label: string }[] = [
  { value: "prep", label: "phase.prep" },
  { value: "slotA", label: "phase.slotA" },
  { value: "slotB", label: "phase.slotB" },
  { value: "transition", label: "phase.transition" },
  { value: "closingA", label: "phase.closingA" },
  { value: "closingB", label: "phase.closingB" },
  { value: "cooldown", label: "phase.cooldown" },
];

export default function SequenceBuilderPage() {
  const { t } = useTranslation();
  const { updateCustomMode } = useModeSelection();

  // Parse state from URL
  const [locationState, setLocationState] = useState<LocationState>({});
  
  useEffect(() => {
    const hash = window.location.hash;
    const stateMatch = hash.match(/state=([^&]+)/);
    if (stateMatch) {
      try {
        const parsed = JSON.parse(decodeURIComponent(stateMatch[1]));
        setLocationState(parsed);
      } catch {
        setLocationState({});
      }
    }
  }, []);

  const { mode: initialMode, isNew } = locationState;

  const [mode, setMode] = useState<SessionMode>(
    initialMode || createSessionMode(`custom-${Date.now()}`, "", [], "moderate")
  );
  const [modeName, setModeName] = useState(
    isNew ? "" : t(initialMode?.name || "", initialMode?.name || "")
  );
  const [showAddPhase, setShowAddPhase] = useState(false);
  const [selectedPhaseType, setSelectedPhaseType] = useState<PhaseType>("slotA");

  const isValid = isValidSessionMode(mode) && modeName.trim().length > 0;

  const handleAddPhase = useCallback(() => {
    const newPhase = createPhaseConfig(
      `phase-${Date.now()}`,
      selectedPhaseType,
      selectedPhaseType === "slotA" || selectedPhaseType === "slotB" ? 300 : 60
    );
    setMode((prev) => ({
      ...prev,
      phases: [...prev.phases, newPhase],
    }));
    setShowAddPhase(false);
  }, [selectedPhaseType]);

  const handleRemovePhase = useCallback((phaseId: string) => {
    setMode((prev) => ({
      ...prev,
      phases: prev.phases.filter((p) => p.id !== phaseId),
    }));
  }, []);

  const handleUpdatePhaseDuration = useCallback(
    (phaseId: string, duration: number) => {
      setMode((prev) => ({
        ...prev,
        phases: prev.phases.map((p) =>
          p.id === phaseId ? { ...p, duration } : p
        ),
      }));
    },
    []
  );

  const handleMovePhase = useCallback((index: number, direction: -1 | 1) => {
    setMode((prev) => {
      const newPhases = [...prev.phases];
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= newPhases.length) return prev;
      
      const temp = newPhases[index];
      newPhases[index] = newPhases[newIndex];
      newPhases[newIndex] = temp;
      
      return { ...prev, phases: newPhases };
    });
  }, []);

  const handleSave = useCallback(async () => {
    if (!isValid) return;

    const updatedMode: SessionMode = {
      ...mode,
      name: modeName.trim(),
    };

    try {
      await updateCustomMode(updatedMode);
      window.location.href = "/#/";
    } catch (error) {
      console.error("Failed to save mode:", error);
    }
  }, [mode, modeName, isValid, updateCustomMode]);

  const totalDuration = mode.phases.reduce((sum, p) => sum + p.duration, 0);
  const hasSlotA = mode.phases.some((p) => p.type === "slotA");
  const hasSlotB = mode.phases.some((p) => p.type === "slotB");

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => window.location.href = "/#/"}
              className="text-slate-500"
            >
              <ChevronLeft className="w-5 h-5 mr-1" />
              {t("builder.back", "Zurück")}
            </Button>
            <h1 className="text-lg font-semibold text-slate-800">
              {isNew
                ? t("builder.newMode", "Neuer Modus")
                : t("builder.editMode", "Modus bearbeiten")}
            </h1>
            <div className="w-20" />
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Mode Name */}
        <section className="mb-8">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            {t("builder.modeName", "Name des Modus")}
          </label>
          <Input
            type="text"
            value={modeName}
            onChange={(e) => setModeName(e.target.value)}
            placeholder={t("builder.modeNamePlaceholder", "z.B. Unser Weekly")}
            className="w-full"
          />
        </section>

        {/* Stats */}
        <section className="mb-6 flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Clock className="w-4 h-4" />
            <span>{formatDuration(totalDuration)}</span>
          </div>
          <div className="flex items-center gap-2">
            {!hasSlotA && (
              <span className="text-xs text-amber-600 bg-amber-100 px-2 py-1 rounded-full">
                {t("builder.missingSlotA", "Slot A fehlt")}
              </span>
            )}
            {!hasSlotB && (
              <span className="text-xs text-amber-600 bg-amber-100 px-2 py-1 rounded-full">
                {t("builder.missingSlotB", "Slot B fehlt")}
              </span>
            )}
          </div>
        </section>

        {/* Phases List */}
        <section className="mb-8">
          <h2 className="text-sm font-medium text-slate-700 mb-4">
            {t("builder.phases", "Phasen")}
          </h2>

          {mode.phases.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-slate-200">
              <p className="text-slate-400 mb-4">
                {t("builder.noPhases", "Noch keine Phasen")}
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddPhase(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                {t("builder.addFirstPhase", "Erste Phase hinzufügen")}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {mode.phases.map((phase, index) => (
                <div
                  key={phase.id}
                  className="bg-white rounded-xl border border-slate-200 p-4 animate-fade-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => handleMovePhase(index, -1)}
                        disabled={index === 0}
                        className="p-1 rounded hover:bg-slate-100 disabled:opacity-30"
                      >
                        <ChevronLeft className="w-4 h-4 text-slate-400 -rotate-90" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMovePhase(index, 1)}
                        disabled={index === mode.phases.length - 1}
                        className="p-1 rounded hover:bg-slate-100 disabled:opacity-30"
                      >
                        <ChevronLeft className="w-4 h-4 text-slate-400 rotate-90" />
                      </button>
                    </div>
                    <GripVertical className="w-5 h-5 text-slate-300" />
                    <span className="font-medium text-slate-700">
                      {t(`phase.${phase.type}`, phase.type)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemovePhase(phase.id)}
                      className="ml-auto p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                      aria-label={t("builder.removePhase", "Phase entfernen")}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="pl-12">
                    <div className="flex items-center gap-4">
                      <Slider
                        value={[phase.duration]}
                        onValueChange={([value]) =>
                          handleUpdatePhaseDuration(phase.id, value)
                        }
                        min={phase.allowedRange.min}
                        max={phase.allowedRange.max}
                        step={10}
                        className="flex-1"
                      />
                      <span className="text-sm text-slate-500 w-16 text-right">
                        {formatDuration(phase.duration)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-400 mt-1">
                      <span>{formatDuration(phase.allowedRange.min)}</span>
                      <span>{formatDuration(phase.allowedRange.max)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Phase Button */}
          {mode.phases.length > 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAddPhase(true)}
              className="w-full mt-4"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t("builder.addPhase", "Phase hinzufügen")}
            </Button>
          )}
        </section>

        {/* Save Button */}
        <Button
          type="button"
          size="lg"
          onClick={handleSave}
          disabled={!isValid}
          className={`w-full rounded-xl py-6 ${
            isValid
              ? "bg-sky-500 hover:bg-sky-600 text-white"
              : "bg-slate-200 text-slate-400 cursor-not-allowed"
          }`}
        >
          <Check className="w-5 h-5 mr-2" />
          {t("builder.save", "Speichern")}
        </Button>
      </div>

      {/* Add Phase Modal */}
      {showAddPhase && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in"
          onClick={() => setShowAddPhase(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-sm animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800">
                {t("builder.selectPhaseType", "Phasentyp wählen")}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddPhase(false)}
                className="p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-2 mb-6">
              {PHASE_TYPE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setSelectedPhaseType(option.value)}
                  className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${
                    selectedPhaseType === option.value
                      ? "border-sky-500 bg-sky-50 text-sky-700"
                      : "border-slate-200 hover:border-slate-300 text-slate-700"
                  }`}
                >
                  {t(option.label, option.value)}
                </button>
              ))}
            </div>

            <Button type="button" onClick={handleAddPhase} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              {t("builder.add", "Hinzufügen")}
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}
