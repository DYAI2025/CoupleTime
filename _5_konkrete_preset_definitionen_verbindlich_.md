# Konkrete Preset-Definitionen (VERBINDLICH)

## Maintain Mode (Präventiv, Standard)
**Zweck:** Wöchentliches Beziehungshygiene-Gespräch
**Frequenz:** 1x pro Woche
**Gesamtdauer:** ~90 Minuten
**Runden:** 3
**GuidanceLevel:** moderate

```
Phasen-Sequenz:
prep(120s) → slotA(900s) → slotB(900s) → transition(60s) → slotA(900s) → slotB(900s) → transition(60s) → slotA(900s) → slotB(900s) → closingA(180s) → closingB(180s) → cooldown(600s)
```

| Phase | Dauer | Beschreibung |
|-------|-------|--------------|
| prep | 120s (2 min) | Ankommen, Einstimmung |
| slotA | 900s (15 min) | Partner A spricht |
| slotB | 900s (15 min) | Partner B spricht |
| transition | 60s (1 min) | Kurze Pause zwischen Runden |
| closingA | 180s (3 min) | Abschluss Partner A |
| closingB | 180s (3 min) | Abschluss Partner B |
| cooldown | 600s (10 min) | Kein Nachgespräch |

---

## Commitment Mode (Krisenphase/Stabilisierung)
**Zweck:** Stabilisierung in instabilen Phasen
**Frequenz:** 2x pro Woche empfohlen
**Gesamtdauer:** ~60 Minuten
**Runden:** 3
**GuidanceLevel:** moderate

```
Phasen-Sequenz:
prep(120s) → slotA(600s) → slotB(600s) → transition(60s) → slotA(600s) → slotB(600s) → transition(60s) → slotA(600s) → slotB(600s) → closingA(120s) → closingB(120s) → cooldown(600s)
```

| Phase | Dauer | Beschreibung |
|-------|-------|--------------|
| prep | 120s (2 min) | Ankommen, Einstimmung |
| slotA | 600s (10 min) | Partner A spricht |
| slotB | 600s (10 min) | Partner B spricht |
| transition | 60s (1 min) | Kurze Pause zwischen Runden |
| closingA | 120s (2 min) | Abschluss Partner A |
| closingB | 120s (2 min) | Abschluss Partner B |
| cooldown | 600s (10 min) | Kein Nachgespräch |

---

## Listening Mode (Einsteiger/Fokus)
**Zweck:** Einstieg für Anfänger, Fokus auf aktives Zuhören
**Frequenz:** Nach Bedarf
**Gesamtdauer:** ~45 Minuten
**Runden:** 2
**GuidanceLevel:** high

```
Phasen-Sequenz:
prep(90s) → slotA(600s) → slotB(600s) → transition(90s) → slotA(600s) → slotB(600s) → closingA(120s) → closingB(120s) → cooldown(600s)
```

| Phase | Dauer | Beschreibung |
|-------|-------|--------------|
| prep | 90s (1.5 min) | Ankommen, Einstimmung |
| slotA | 600s (10 min) | Partner A spricht |
| slotB | 600s (10 min) | Partner B spricht |
| transition | 90s (1.5 min) | Reflexionspause |
| closingA | 120s (2 min) | Abschluss Partner A |
| closingB | 120s (2 min) | Abschluss Partner B |
| cooldown | 600s (10 min) | Kein Nachgespräch |

---

## Audio-Mapping (VERBINDLICH)

| Event | Datei / Web Audio | Beschreibung |
|-------|-------------------|--------------|
| sessionStart | bowl_deep_single | Tiefer, einzelner Klang - Session beginnt |
| slotEnd | bowl_rising | Aufsteigender Ton - Sprechzeit endet |
| transitionEnd | bowl_clear | Klarer Ton - Übergang endet |
| closingStart | bowl_double | Doppelter Klang - Abschlussphase beginnt |
| cooldownStart | bowl_fade | Ausklingender Ton - Cooldown beginnt |
| cooldownEnd | bowl_triple | Dreifacher Klang - Session komplett beendet |

**Audio-Implementierung:** Web Audio API generierte Klangschalen-Töne (Sinus + Obertöne mit Decay)

---

## GuidanceLevel Verhalten

| Level | Prep-Tipps | Transition-Tipps | Cooldown-Tipps |
|-------|------------|------------------|----------------|
| minimal | Nein | Nein | Ja (immer) |
| moderate | Nein | Ja | Ja |
| high | Ja | Ja | Ja |

---

## Custom Mode Validierung

Ein Custom Mode ist **nur gültig** wenn:
- Mindestens 1× slotA vorhanden
- Mindestens 1× slotB vorhanden
- Alle Phasen-Dauern innerhalb erlaubter Bereiche:
  - prep: 30s - 600s
  - slotA/slotB: 300s - 1800s
  - transition: 30s - 300s
  - closingA/closingB: 60s - 600s
  - cooldown: 300s - 1800s
