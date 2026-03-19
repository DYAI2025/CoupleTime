/**
 * SequenceBuilderPage – Drag-and-drop session builder.
 * Palette (5 slot types) → Timeline (vertical slot cards) → Save.
 */
import { useState, useMemo } from "react";
import { Reorder, AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, Mic, ArrowRightLeft, Leaf, Wind, Pencil, Plus, Save } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { LanguageToggle } from "@/components/LanguageToggle";
import { SlotConfigPopup, type BuilderSlotType, type SlotConfigResult } from "@/components/builder/SlotConfigPopup";
import { SlotCard, type PlacedSlot } from "@/components/builder/SlotCard";
import { createPhaseConfig, formatDurationShort } from "@/domain/PhaseConfig";
import type { PhaseType } from "@/domain/PhaseType";
import type { SoundType } from "@/domain/PhaseConfig";
import { createSessionMode } from "@/domain/SessionMode";
import type { SessionMode } from "@/domain/SessionMode";
import { getPersistenceService } from "@/services/PersistenceService";
import { getParticipantService } from "@/services/ParticipantService";

// ── Palette config ──
const PALETTE: Array<{ type: BuilderSlotType; icon: typeof Mic; color: string; defaultMin: number }> = [
  { type: "speaker",     icon: Mic,            color: "#3b82f6", defaultMin: 5 },
  { type: "transition",  icon: ArrowRightLeft, color: "#f59e0b", defaultMin: 1 },
  { type: "preparation", icon: Leaf,           color: "#10b981", defaultMin: 2 },
  { type: "cooldown",    icon: Wind,           color: "#64748b", defaultMin: 5 },
  { type: "custom",      icon: Pencil,         color: "#8b5cf6", defaultMin: 3 },
];

function builderSlotToPhaseType(slotType: BuilderSlotType, speakerKey?: "A" | "B"): PhaseType {
  switch (slotType) {
    case "speaker":     return speakerKey === "B" ? "slotB" : "slotA";
    case "transition":  return "transition";
    case "preparation": return "prep";
    case "cooldown":    return "cooldown";
    case "custom":      return "prep";
  }
}

export default function SequenceBuilderPage() {
  const { t } = useTranslation();
  const participants = getParticipantService().get();
  const nameA = participants.nameA;
  const nameB = participants.nameB;

  // Parse state from URL (edit mode)
  const parsed = useMemo(() => {
    const params = new URLSearchParams(window.location.hash.split("?")[1] || "");
    const stateParam = params.get("state");
    if (!stateParam) return null;
    try { return JSON.parse(decodeURIComponent(stateParam)); }
    catch { return null; }
  }, []);

  const editMode = parsed && !parsed.isNew;
  const existingMode: SessionMode | null = parsed?.mode ?? null;

  // Convert existing mode phases to PlacedSlots for edit mode
  const initialSlots: PlacedSlot[] = useMemo(() => {
    if (!existingMode) return [];
    return existingMode.phases.map((p) => {
      const slotType: BuilderSlotType =
        p.type === "slotA" || p.type === "slotB" ? "speaker" :
        p.type === "transition" ? "transition" :
        p.type === "prep" ? "preparation" :
        p.type === "cooldown" ? "cooldown" : "custom";
      return {
        id: p.id,
        slotType,
        phaseType: p.type,
        label: p.label || "",
        speakerKey: p.type === "slotA" ? "A" as const : p.type === "slotB" ? "B" as const : undefined,
        soundType: p.soundType || "SINGING_BOWL",
        minutes: Math.floor(p.duration / 60),
        seconds: p.duration % 60,
        color: undefined,
        description: p.focusText || "",
      };
    });
  }, [existingMode]);

  const [slots, setSlots] = useState<PlacedSlot[]>(initialSlots);
  const [popupType, setPopupType] = useState<BuilderSlotType | null>(null);
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [sessionName, setSessionName] = useState(existingMode?.name || "");

  const totalSeconds = slots.reduce((s, sl) => s + sl.minutes * 60 + sl.seconds, 0);
  const hasSpeaker = slots.some((s) => s.slotType === "speaker");

  // ── Handlers ──
  const handlePopupConfirm = (config: SlotConfigResult) => {
    if (!popupType) return;
    const paletteItem = PALETTE.find((p) => p.type === popupType)!;
    const newSlot: PlacedSlot = {
      id: `slot-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      slotType: popupType,
      phaseType: builderSlotToPhaseType(popupType, config.speakerKey),
      label: config.label,
      speakerKey: config.speakerKey,
      soundType: config.soundType,
      minutes: paletteItem.defaultMin,
      seconds: 0,
      color: config.color,
      description: config.description,
    };
    setSlots((prev) => [...prev, newSlot]);
    setPopupType(null);
  };

  const handleDurationChange = (id: string, minutes: number, seconds: number) => {
    setSlots((prev) => prev.map((s) => (s.id === id ? { ...s, minutes, seconds } : s)));
  };

  const handleDelete = (id: string) => {
    setSlots((prev) => prev.filter((s) => s.id !== id));
  };

  const handleSave = async () => {
    const name = sessionName.trim() || `Session_${String(Date.now()).slice(-4)}`;
    const phases = slots.map((s) =>
      createPhaseConfig(
        s.id,
        s.phaseType as PhaseType,
        s.minutes * 60 + s.seconds,
        undefined,
        {
          label: s.label || undefined,
          focusText: s.description || undefined,
          soundType: s.soundType as SoundType,
        }
      )
    );
    const mode = createSessionMode(
      existingMode?.id || `custom-${Date.now()}`,
      name,
      phases,
      "moderate",
      false,
      false,
      undefined,
      30
    );

    const persistence = getPersistenceService();
    const existing = await persistence.loadCustomModes();

    if (editMode && existingMode) {
      const updated = existing.map((m) => (m.id === mode.id ? mode : m));
      await persistence.saveCustomModes(updated);
    } else {
      await persistence.saveCustomModes([...existing, mode]);
    }

    window.location.href = "/#/";
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-24">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => (window.location.href = "/#/")}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold text-slate-800">
              {editMode ? t("builder.editTitle") : t("builder.title")}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-400">
              {t("builder.timeline.total")}: {formatDurationShort(totalSeconds)}
            </span>
            <LanguageToggle />
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* ── PALETTE ── */}
        <section>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {PALETTE.map(({ type, icon: Icon, color }) => (
              <button
                key={type}
                type="button"
                onClick={() => setPopupType(type)}
                className="flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl border-2 border-dashed hover:border-solid transition-all shrink-0"
                style={{ borderColor: color }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ background: `${color}15` }}
                >
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <span className="text-xs font-medium" style={{ color }}>
                  {t(`builder.palette.${type}`)}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* ── TIMELINE ── */}
        <section className="space-y-3">
          {slots.length > 0 && (
            <Reorder.Group
              axis="y"
              values={slots}
              onReorder={setSlots}
              className="space-y-3"
            >
              <AnimatePresence>
                {slots.map((slot) => (
                  <Reorder.Item key={slot.id} value={slot}>
                    <SlotCard
                      slot={slot}
                      nameA={nameA}
                      nameB={nameB}
                      onDurationChange={(m, s) => handleDurationChange(slot.id, m, s)}
                      onDelete={() => handleDelete(slot.id)}
                    />
                  </Reorder.Item>
                ))}
              </AnimatePresence>
            </Reorder.Group>
          )}

          {/* Empty drop target — always visible */}
          <motion.button
            type="button"
            onClick={() => setPopupType("speaker")}
            className="w-full py-8 rounded-xl border-2 border-dashed border-slate-200 hover:border-sky-300 hover:bg-sky-50/50 transition-colors flex flex-col items-center gap-2"
            whileHover={{ scale: 1.01 }}
          >
            <Plus className="w-6 h-6 text-slate-300" />
            <span className="text-sm text-slate-400">{t("builder.timeline.empty")}</span>
          </motion.button>
        </section>
      </div>

      {/* ── POPUP ── */}
      {popupType && (
        <SlotConfigPopup
          slotType={popupType}
          nameA={nameA}
          nameB={nameB}
          onConfirm={handlePopupConfirm}
          onCancel={() => setPopupType(null)}
        />
      )}

      {/* ── NAME PROMPT ── */}
      {showNamePrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5 space-y-4">
            <h3 className="text-base font-semibold text-slate-800">{t("builder.namePrompt")}</h3>
            <input
              type="text"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              placeholder={t("builder.namePlaceholder")}
              maxLength={50}
              autoFocus
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowNamePrompt(false)}
                className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200"
              >
                {t("builder.popup.cancel")}
              </button>
              <button
                type="button"
                onClick={() => { setShowNamePrompt(false); handleSave(); }}
                className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-sky-500 hover:bg-sky-600"
              >
                {editMode ? t("builder.update") : t("builder.save")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── STICKY FOOTER ── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 p-4 z-10">
        <div className="max-w-2xl mx-auto">
          {!hasSpeaker && slots.length > 0 && (
            <p className="text-xs text-amber-600 text-center mb-2">{t("builder.needsSpeaker")}</p>
          )}
          <button
            type="button"
            disabled={!hasSpeaker}
            onClick={() => setShowNamePrompt(true)}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-sky-500 hover:bg-sky-600 disabled:bg-slate-200 disabled:text-slate-400 transition-colors flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            {editMode ? t("builder.update") : t("builder.save")}
          </button>
        </div>
      </div>
    </main>
  );
}
