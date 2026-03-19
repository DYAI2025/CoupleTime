# Language Switch & Custom Builder Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a DE/EN language toggle to the header and replace the SequenceBuilderPage with an intuitive drag-and-drop slot-based builder.

**Architecture:** Two independent features. Feature 1 fixes the broken `useTranslation` hook and adds a `LanguageToggle` component to all page headers. Feature 2 replaces `SequenceBuilderPage.tsx` with a new 3-zone layout: palette (5 slot types) → timeline (drop targets) → save footer. Uses Framer Motion for drag-and-drop. Existing domain types (`PhaseConfig`, `SessionMode`) and persistence (`PersistenceService`, IndexedDB) stay unchanged.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Framer Motion (`motion.div`, `Reorder`), Vitest + jsdom

---

## Feature 1: Language Switch

### Task 1: Fix useTranslation Hook

**Files:**
- Modify: `app/src/hooks/useTranslation.ts`
- Test: `app/src/hooks/__tests__/useTranslation.test.ts`

**Step 1: Write the failing test**

```typescript
// app/src/hooks/__tests__/useTranslation.test.ts
// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTranslation } from "../useTranslation";

beforeEach(() => localStorage.clear());

describe("useTranslation", () => {
  it("defaults to browser language or de", () => {
    const { result } = renderHook(() => useTranslation());
    expect(["de", "en"]).toContain(result.current.i18n.language);
  });

  it("changeLanguage updates language and persists", () => {
    const { result } = renderHook(() => useTranslation());
    act(() => result.current.i18n.changeLanguage("en"));
    expect(result.current.i18n.language).toBe("en");
    expect(localStorage.getItem("app-language")).toBe("en");
  });

  it("reads persisted language from localStorage", () => {
    localStorage.setItem("app-language", "en");
    const { result } = renderHook(() => useTranslation());
    expect(result.current.i18n.language).toBe("en");
  });

  it("t() returns translated string for current language", () => {
    const { result } = renderHook(() => useTranslation());
    act(() => result.current.i18n.changeLanguage("en"));
    expect(result.current.t("app.title")).toBe("Couples Timer");
    act(() => result.current.i18n.changeLanguage("de"));
    expect(result.current.t("app.title")).toBe("Zwiegespräch");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd app && npx vitest run src/hooks/__tests__/useTranslation.test.ts`
Expected: FAIL — changeLanguage is a no-op

**Step 3: Write implementation**

Replace `app/src/hooks/useTranslation.ts`:

```typescript
import { useState, useCallback } from "react";
import deTranslations from "@/i18n/locales/de/translation.json";
import enTranslations from "@/i18n/locales/en/translation.json";

type Translations = typeof deTranslations;

const STORAGE_KEY = "app-language";

const translations: Record<string, Translations> = {
  de: deTranslations,
  en: enTranslations,
};

function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const keys = path.split(".");
  let value: unknown = obj;
  for (const key of keys) {
    if (value && typeof value === "object" && key in value) {
      value = (value as Record<string, unknown>)[key];
    } else {
      return path;
    }
  }
  return typeof value === "string" ? value : path;
}

function detectLanguage(): string {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "de" || stored === "en") return stored;
  const browserLang = navigator.language.split("-")[0];
  return browserLang === "de" ? "de" : "en";
}

export function useTranslation() {
  const [language, setLanguage] = useState(detectLanguage);

  const t = useCallback(
    (key: string, defaultValue?: string, options?: Record<string, string | number>) => {
      const currentTranslations = translations[language] || translations.en;
      let value = getNestedValue(currentTranslations as Record<string, unknown>, key);
      if (value === key && defaultValue) {
        value = defaultValue;
      }
      if (options) {
        Object.entries(options).forEach(([k, v]) => {
          value = value.replace(new RegExp(`{{${k}}}`, "g"), String(v));
        });
      }
      return value;
    },
    [language]
  );

  const changeLanguage = useCallback((lang: string) => {
    const resolved = lang === "de" || lang === "en" ? lang : "en";
    localStorage.setItem(STORAGE_KEY, resolved);
    setLanguage(resolved);
  }, []);

  return {
    t,
    i18n: { language, changeLanguage },
  };
}
```

**Step 4: Run test to verify it passes**

Run: `cd app && npx vitest run src/hooks/__tests__/useTranslation.test.ts`
Expected: PASS (4 tests)

**Step 5: Commit**

```bash
git add app/src/hooks/useTranslation.ts app/src/hooks/__tests__/useTranslation.test.ts
git commit -m "feat: fix useTranslation hook — persist language to localStorage"
```

---

### Task 2: LanguageToggle Component

**Files:**
- Create: `app/src/components/LanguageToggle.tsx`

**Step 1: Write the component**

```typescript
// app/src/components/LanguageToggle.tsx
import { useTranslation } from "@/hooks/useTranslation";

export function LanguageToggle() {
  const { i18n } = useTranslation();

  return (
    <div className="flex items-center rounded-lg bg-slate-100 p-0.5 text-xs font-medium">
      <button
        type="button"
        onClick={() => i18n.changeLanguage("de")}
        className={`px-2 py-1 rounded-md transition-colors ${
          i18n.language === "de"
            ? "bg-white text-sky-600 shadow-sm"
            : "text-slate-400 hover:text-slate-600"
        }`}
      >
        DE
      </button>
      <button
        type="button"
        onClick={() => i18n.changeLanguage("en")}
        className={`px-2 py-1 rounded-md transition-colors ${
          i18n.language === "en"
            ? "bg-white text-sky-600 shadow-sm"
            : "text-slate-400 hover:text-slate-600"
        }`}
      >
        EN
      </button>
    </div>
  );
}
```

**Step 2: Verify build**

Run: `cd app && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add app/src/components/LanguageToggle.tsx
git commit -m "feat: add LanguageToggle pill component"
```

---

### Task 3: Place LanguageToggle in All Headers

**Files:**
- Modify: `app/src/pages/ModeSelectionPage.tsx` (header nav area, ~line 57)
- Modify: `app/src/pages/AboutPage.tsx` (header)
- Modify: `app/src/pages/PrivacyPage.tsx` (header)
- Modify: `app/src/pages/ImpressumPage.tsx` (header)

**Step 1: Add to ModeSelectionPage**

In `app/src/pages/ModeSelectionPage.tsx`:
- Add import: `import { LanguageToggle } from "@/components/LanguageToggle";`
- In the header `<nav>` section (~line 57), add `<LanguageToggle />` as the last child inside the nav

**Step 2: Add to AboutPage, PrivacyPage, ImpressumPage**

Same pattern: import `LanguageToggle`, add it to the header div, positioned right of the back button area.

**Step 3: Verify build**

Run: `cd app && npm run build`
Expected: Clean build

**Step 4: Commit**

```bash
git add app/src/pages/ModeSelectionPage.tsx app/src/pages/AboutPage.tsx app/src/pages/PrivacyPage.tsx app/src/pages/ImpressumPage.tsx
git commit -m "feat: place LanguageToggle in all page headers"
```

---

### Task 4: Add Builder Translation Keys

**Files:**
- Modify: `app/src/i18n/locales/de/translation.json`
- Modify: `app/src/i18n/locales/en/translation.json`

**Step 1: Add builder keys to both translation files**

Add to DE `translation.json`:
```json
"builder": {
  "title": "Session erstellen",
  "editTitle": "Session bearbeiten",
  "palette": {
    "speaker": "Sprecher",
    "transition": "Übergang",
    "preparation": "Vorbereitung",
    "cooldown": "Cooldown",
    "custom": "Custom"
  },
  "timeline": {
    "empty": "Ziehe einen Slot hierher oder klicke",
    "total": "Gesamt",
    "minDuration": "Mind. 30 Sekunden pro Slot"
  },
  "popup": {
    "name": "Name (optional)",
    "speaker": "Sprecher",
    "sound": "Ton am Ende",
    "category": "Kategorie",
    "description": "Beschreibung",
    "color": "Farbe",
    "confirm": "Hinzufügen",
    "cancel": "Abbrechen"
  },
  "save": "Speichern & Erstellen",
  "update": "Änderungen speichern",
  "namePrompt": "Name der Session",
  "namePlaceholder": "Session_01",
  "needsSpeaker": "Mindestens ein Sprecher-Slot erforderlich",
  "duration": {
    "minutes": "Min",
    "seconds": "Sek"
  }
}
```

Add equivalent EN keys:
```json
"builder": {
  "title": "Create Session",
  "editTitle": "Edit Session",
  "palette": {
    "speaker": "Speaker",
    "transition": "Transition",
    "preparation": "Preparation",
    "cooldown": "Cooldown",
    "custom": "Custom"
  },
  "timeline": {
    "empty": "Drag a slot here or click",
    "total": "Total",
    "minDuration": "Min. 30 seconds per slot"
  },
  "popup": {
    "name": "Name (optional)",
    "speaker": "Speaker",
    "sound": "End sound",
    "category": "Category",
    "description": "Description",
    "color": "Color",
    "confirm": "Add",
    "cancel": "Cancel"
  },
  "save": "Save & Create",
  "update": "Save Changes",
  "namePrompt": "Session name",
  "namePlaceholder": "Session_01",
  "needsSpeaker": "At least one speaker slot required",
  "duration": {
    "minutes": "Min",
    "seconds": "Sec"
  }
}
```

**Step 2: Commit**

```bash
git add app/src/i18n/locales/de/translation.json app/src/i18n/locales/en/translation.json
git commit -m "feat: add builder i18n keys for DE and EN"
```

---

## Feature 2: Custom Builder Redesign

### Task 5: Install Framer Motion

**Step 1: Install dependency**

Run: `cd app && npm install framer-motion`

**Step 2: Verify build**

Run: `cd app && npm run build`
Expected: Clean build

**Step 3: Commit**

```bash
git add app/package.json app/package-lock.json
git commit -m "chore: add framer-motion for drag-and-drop builder"
```

---

### Task 6: SlotConfigPopup Component

**Files:**
- Create: `app/src/components/builder/SlotConfigPopup.tsx`

**Step 1: Write the popup component**

This popup appears after a slot is placed. Fields depend on slot type.

```typescript
// app/src/components/builder/SlotConfigPopup.tsx
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
  // custom-only
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
            {Object.entries(SOUND_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
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
```

**Step 2: Verify build**

Run: `cd app && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add app/src/components/builder/SlotConfigPopup.tsx
git commit -m "feat: add SlotConfigPopup component for builder"
```

---

### Task 7: SlotCard Component (Placed Slot in Timeline)

**Files:**
- Create: `app/src/components/builder/SlotCard.tsx`

**Step 1: Write the placed slot card**

Shows type icon + color, name, speaker, duration stepper, delete button.

```typescript
// app/src/components/builder/SlotCard.tsx
import { Trash2, Mic, ArrowRightLeft, Leaf, Wind, Pencil } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import type { BuilderSlotType } from "./SlotConfigPopup";

export interface PlacedSlot {
  id: string;
  slotType: BuilderSlotType;
  phaseType: string; // maps to PhaseType for domain
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
```

**Step 2: Verify build**

Run: `cd app && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add app/src/components/builder/SlotCard.tsx
git commit -m "feat: add SlotCard component with inline duration stepper"
```

---

### Task 8: New SequenceBuilderPage — Palette + Timeline + Save

**Files:**
- Modify: `app/src/pages/SequenceBuilderPage.tsx` (full rewrite)

**Step 1: Rewrite SequenceBuilderPage**

This is the core task. The new page has:
1. Slot palette (5 draggable/clickable cards)
2. Timeline (vertical list with empty drop targets)
3. Sticky save footer

The full component is ~300 lines. Key behaviors:
- `placedSlots` state: `PlacedSlot[]`
- `popupState`: which slot type is being configured, or null
- Click empty box OR drag from palette → set `popupState` → on confirm, add to `placedSlots`
- Reorder via Framer Motion `Reorder.Group`
- Save: validate ≥1 speaker slot, prompt for name, persist via existing `PersistenceService`, redirect to `/`

```typescript
// app/src/pages/SequenceBuilderPage.tsx
import { useState, useMemo } from "react";
import { Reorder, AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, Mic, ArrowRightLeft, Leaf, Wind, Pencil, Plus, Save } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useSession } from "@/viewModel/SessionContext";
import { LanguageToggle } from "@/components/LanguageToggle";
import { SlotConfigPopup, type BuilderSlotType, type SlotConfigResult } from "@/components/builder/SlotConfigPopup";
import { SlotCard, type PlacedSlot } from "@/components/builder/SlotCard";
import { createPhaseConfig, formatDurationShort } from "@/domain/PhaseConfig";
import type { PhaseType } from "@/domain/PhaseType";
import type { SoundType } from "@/domain/PhaseConfig";
import { createSessionMode } from "@/domain/SessionMode";
import type { SessionMode } from "@/domain/SessionMode";
import { PersistenceService } from "@/services/PersistenceService";

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
    case "custom":      return "prep"; // custom uses prep as base type
  }
}

export default function SequenceBuilderPage() {
  const { t } = useTranslation();

  // Parse state from URL (edit mode)
  const params = new URLSearchParams(window.location.hash.split("?")[1] || "");
  const stateParam = params.get("state");
  const parsed = stateParam ? JSON.parse(decodeURIComponent(stateParam)) : null;
  const editMode = parsed && !parsed.isNew;
  const existingMode: SessionMode | null = parsed?.mode ?? null;

  // Partner names from session context
  const { participantA, participantB } = useSession();
  const nameA = participantA || "Partner A";
  const nameB = participantB || "Partner B";

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
    const persistence = new PersistenceService();
    if (editMode && existingMode) {
      await persistence.updateCustomMode(mode);
    } else {
      await persistence.saveCustomMode(mode);
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

          {/* Empty drop target */}
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
```

**Step 2: Verify build**

Run: `cd app && npm run build`
Expected: Clean build

Note: The `useSession` hook must expose `participantA` and `participantB`. If not available, check `SessionContext` and adjust the destructured properties. The existing `SetupPage` collects partner names — verify how they're stored and access them in the builder.

**Step 3: Commit**

```bash
git add app/src/pages/SequenceBuilderPage.tsx
git commit -m "feat: rewrite SequenceBuilderPage with drag-drop slot builder"
```

---

### Task 9: Verify PersistenceService API

**Files:**
- Read: `app/src/services/PersistenceService.ts`

**Step 1: Check that `saveCustomMode` and `updateCustomMode` exist**

The new builder calls `persistence.saveCustomMode(mode)` and `persistence.updateCustomMode(mode)`. Verify these methods exist in PersistenceService. If the API differs (e.g. different method names or needs mode ID), update the `handleSave` function in Task 8 accordingly.

**Step 2: Check SessionContext for partner names**

The builder reads `participantA` and `participantB` from `useSession()`. Verify these are exposed by SessionContext. If not, check `ParticipantPersistenceService` and read from localStorage directly.

**Step 3: Fix any API mismatches and rebuild**

Run: `cd app && npm run build`
Expected: Clean build

**Step 4: Commit (if fixes needed)**

```bash
git add app/src/pages/SequenceBuilderPage.tsx
git commit -m "fix: align builder with PersistenceService and SessionContext APIs"
```

---

### Task 10: Final Verification

**Step 1: Run full build**

Run: `cd app && npm run build`
Expected: Clean build

**Step 2: Run all tests**

Run: `cd app && npx vitest run`
Expected: All tests pass (useTranslation + useConsent + any existing)

**Step 3: Manual test checklist**

- [ ] Language toggle visible in ModeSelectionPage header
- [ ] Clicking DE/EN switches all UI strings instantly
- [ ] Language persists across page refreshes
- [ ] Builder opens from "Erstellen" button on home page
- [ ] 5 palette cards visible and clickable
- [ ] Clicking palette card opens config popup
- [ ] Popup has correct fields per type (speaker shows partner selector)
- [ ] Confirming popup places slot card in timeline
- [ ] Duration stepper works on placed cards
- [ ] Delete removes cards
- [ ] Drag reorders cards
- [ ] "Speichern & Erstellen" disabled until ≥1 speaker slot
- [ ] Save prompts for name, persists, redirects to home
- [ ] Edit mode pre-fills timeline from existing custom mode

**Step 4: Commit**

```bash
git add -A
git commit -m "fix: final verification adjustments"
```

---

## Post-Implementation Notes

- The old SequenceBuilderPage code is fully replaced — no migration needed
- Framer Motion's `Reorder.Group` handles drag reorder natively
- Touch drag works out of the box with Framer Motion
- The empty box always clicking "speaker" as default is intentional — it's the most common action
- Partner names come from the session setup flow (SetupPage stores them)
