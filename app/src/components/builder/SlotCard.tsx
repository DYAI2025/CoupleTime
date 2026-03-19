import { Trash2, Mic, ArrowRightLeft, Leaf, Wind, Pencil } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import type { BuilderSlotType } from "./SlotConfigPopup";

export interface PlacedSlot {
  id: string;
  slotType: BuilderSlotType;
  phaseType: string;
  label: string;
  speakerKey?: "A" | "B";
  soundType: string;
  minutes: number;
  seconds: number;
  color?: string;
  description?: string;
}

interface Props {
  slot: PlacedSlot;
  nameA: string;
  nameB: string;
  onDurationChange: (minutes: number, seconds: number) => void;
  onDelete: () => void;
}

const SLOT_ICONS: Record<BuilderSlotType, typeof Mic> = {
  speaker: Mic,
  transition: ArrowRightLeft,
  preparation: Leaf,
  cooldown: Wind,
  custom: Pencil,
};

const SLOT_COLORS: Record<BuilderSlotType, string> = {
  speaker: "#3b82f6",
  transition: "#f59e0b",
  preparation: "#10b981",
  cooldown: "#64748b",
  custom: "#8b5cf6",
};

export function SlotCard({ slot, nameA, nameB, onDurationChange, onDelete }: Props) {
  const { t } = useTranslation();
  const Icon = SLOT_ICONS[slot.slotType];
  const color = slot.color || SLOT_COLORS[slot.slotType];
  const speakerName = slot.speakerKey === "A" ? (nameA || "Partner A") : slot.speakerKey === "B" ? (nameB || "Partner B") : null;
  const displayLabel = slot.label || t(`builder.palette.${slot.slotType}`);

  return (
    <div
      className="rounded-xl border bg-white shadow-sm overflow-hidden"
      style={{ borderLeft: `4px solid ${color}` }}
    >
      <div className="flex items-center justify-between px-3 py-2.5">
        {/* Left: icon + label + speaker */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: `${color}20` }}
          >
            <Icon className="w-4 h-4" style={{ color }} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-800 truncate">{displayLabel}</p>
            {speakerName && (
              <p className="text-xs text-slate-400">{speakerName}</p>
            )}
          </div>
        </div>

        {/* Right: duration stepper + delete */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1 bg-slate-50 rounded-lg px-2 py-1">
            <input
              type="number"
              min={0}
              max={60}
              value={slot.minutes}
              onChange={(e) => onDurationChange(Math.max(0, Math.min(60, +e.target.value || 0)), slot.seconds)}
              className="w-10 text-center text-sm font-mono bg-transparent focus:outline-none"
            />
            <span className="text-xs text-slate-400">{t("builder.duration.minutes")}</span>
            <input
              type="number"
              min={0}
              max={59}
              value={slot.seconds}
              onChange={(e) => onDurationChange(slot.minutes, Math.max(0, Math.min(59, +e.target.value || 0)))}
              className="w-10 text-center text-sm font-mono bg-transparent focus:outline-none"
            />
            <span className="text-xs text-slate-400">{t("builder.duration.seconds")}</span>
          </div>
          <button
            type="button"
            onClick={onDelete}
            className="p-1.5 rounded-lg text-red-300 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
