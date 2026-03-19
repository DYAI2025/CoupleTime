import { useState } from "react";
import { X } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import type { SoundType } from "@/domain/PhaseConfig";
import { SOUND_LABELS } from "@/services/AudioService";

export type BuilderSlotType = "speaker" | "transition" | "preparation" | "cooldown" | "custom";

export interface SlotConfigResult {
  label: string;
  speakerKey?: "A" | "B";
  soundType: SoundType;
  color?: string;
  description?: string;
}

interface Props {
  slotType: BuilderSlotType;
  nameA: string;
  nameB: string;
  onConfirm: (config: SlotConfigResult) => void;
  onCancel: () => void;
}

const COLORS = ["#3b82f6", "#e11d48", "#f59e0b", "#10b981", "#8b5cf6", "#64748b"];

export function SlotConfigPopup({ slotType, nameA, nameB, onConfirm, onCancel }: Props) {
  const { t } = useTranslation();
  const [label, setLabel] = useState("");
  const [speakerKey, setSpeakerKey] = useState<"A" | "B">("A");
  const [soundType, setSoundType] = useState<SoundType>("SINGING_BOWL");
  const [color, setColor] = useState(COLORS[0]);
  const [description, setDescription] = useState("");

  const handleConfirm = () => {
    onConfirm({
      label,
      speakerKey: slotType === "speaker" ? speakerKey : undefined,
      soundType,
      color: slotType === "custom" ? color : undefined,
      description: slotType === "custom" ? description : undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-800">
            {t(`builder.palette.${slotType}`)}
          </h3>
          <button type="button" onClick={onCancel} className="p-1 rounded-lg hover:bg-slate-100">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Name */}
        <div>
          <label className="block text-xs text-slate-500 mb-1">{t("builder.popup.name")}</label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={t(`builder.palette.${slotType}`)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
          />
        </div>

        {/* Speaker (only for speaker type) */}
        {slotType === "speaker" && (
          <div>
            <label className="block text-xs text-slate-500 mb-1">{t("builder.popup.speaker")}</label>
            <div className="flex gap-2">
              {(["A", "B"] as const).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSpeakerKey(key)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    speakerKey === key
                      ? "bg-sky-500 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {key === "A" ? nameA || "Partner A" : nameB || "Partner B"}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Sound */}
        <div>
          <label className="block text-xs text-slate-500 mb-1">{t("builder.popup.sound")}</label>
          <select
            value={soundType}
            onChange={(e) => setSoundType(e.target.value as SoundType)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
          >
            {Object.entries(SOUND_LABELS).map(([key, lbl]) => (
              <option key={key} value={key}>{lbl}</option>
            ))}
          </select>
        </div>

        {/* Custom-only fields */}
        {slotType === "custom" && (
          <>
            <div>
              <label className="block text-xs text-slate-500 mb-1">{t("builder.popup.color")}</label>
              <div className="flex gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-full border-2 transition-transform ${
                      color === c ? "border-slate-800 scale-110" : "border-transparent"
                    }`}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">{t("builder.popup.description")}</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                maxLength={300}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-sky-300"
              />
            </div>
          </>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            {t("builder.popup.cancel")}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-sky-500 hover:bg-sky-600 transition-colors"
          >
            {t("builder.popup.confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}
