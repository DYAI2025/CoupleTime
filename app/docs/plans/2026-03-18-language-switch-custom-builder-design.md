# Language Switch & Intuitive Custom Builder — Design

**Goal:** Add a DE/EN language toggle and replace the overwhelming SequenceBuilderPage with a drag-and-drop slot-based builder.

**Architecture:** Two independent features. Language switch fixes the broken `useTranslation` hook and adds a header toggle. Custom builder replaces SequenceBuilderPage with a palette → timeline → save flow.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Framer Motion (drag), IndexedDB (persistence).

---

## Feature 1: Language Switch

### UX
- Compact pill toggle `DE | EN` in the header bar (right side)
- Active language highlighted (sky-500), inactive greyed out
- Click switches instantly, no reload
- Persisted to `localStorage` key `app-language`
- Priority: localStorage > browser language > fallback `de`

### Technical
- Fix `useTranslation` hook: `changeLanguage()` must update state + write localStorage
- New `LanguageToggle` component (~30 lines)
- Place in header of ModeSelectionPage, AboutPage, PrivacyPage, ImpressumPage

---

## Feature 2: Custom Builder Redesign

### Layout (3 zones, top-down)

**1. Slot Palette (top)** — 5 colored drag cards in horizontal row:
| Type | Color | Icon |
|------|-------|------|
| Sprecher | blue | voice |
| Übergang | amber | arrows |
| Vorbereitung | green | mindfulness |
| Cooldown | slate | dove |
| Custom | purple | pencil |

**2. Timeline (center)** — vertical sequence of slot cards:
- Starts with one empty placeholder box (dashed border, hint text)
- After each placed slot, a new empty box appears below (animated)
- Placed slots show: type icon + color, name, speaker, duration stepper
- Slots can be reordered via drag
- Delete button (X) per slot
- Total duration displayed at top of timeline

**3. Footer (sticky bottom)** — "Speichern & Erstellen" button:
- Disabled until >= 1 Sprecher slot exists
- Click opens name popup (free text, placeholder "Session_01")
- Auto-name "Session_01", "Session_02" etc. if left empty

### Interaction Flow

**Placing a slot:**
1. Drag from palette → drop into empty box → config popup opens
2. OR: Click empty box → inline type grid → select type → config popup opens

**Config popup fields (short, 2-3 fields):**
- **Sprecher type:** Name (optional), Speaker selection (Partner A / Partner B with their entered names)
- **All types:** End sound (dropdown of 6 bowl sounds)
- **Custom type:** Additionally category name, color picker, description text

**Duration is NOT in the popup** — set directly on the placed card via min/sec stepper.

### Validation
- Minimum 1 Sprecher slot required (button disabled otherwise)
- Each slot minimum 30 seconds
- No maximum slots
- Total duration shown at top

### Edit Existing Custom Modes
- Edit button on ModeSelectionPage custom cards (existing behavior)
- Opens builder with pre-filled timeline
- Button changes to "Änderungen speichern" (update, not create)

### Mobile
- Drag via touch (long press + drag)
- Fallback: click into empty box → inline selection (always works)
- Palette scrolls horizontally on small screens

### Not Building (YAGNI)
- No undo/redo
- No template library
- No import/export
- No login/auth (localStorage/IndexedDB sufficient)

---

## Translation Requirements

Both features need DE + EN translations:
- Language toggle labels
- Builder UI strings (palette labels, popup fields, validation messages, button text)
- Empty state hints
