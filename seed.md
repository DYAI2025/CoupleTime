# path: superpowers/SEED.md
---
name: couples-timer-web
description: Seed-Datei für Umsetzung der Couples Timer Web App (Zwiegespräch nach Moeller)
role: project-seed
version: 0.1.0
---

## 0. Agent-Start (WICHTIG)

Du bist ein **Implementation-Agent**.  
Deine Aufgabe: Implementiere die **Couples Timer Web App** gemäß dieser Seed-Datei.

**Vorgehen:**

1. **Lies diese Datei vollständig.**
2. Richte eine moderne Web-App mit **React + TypeScript + Vite + Tailwind** ein.
3. Implementiere die in Abschnitt **2–4** beschriebenen Anforderungen & Architektur.
4. Halte dich strikt an:
   - Funktionale Anforderungen (FR)
   - Nicht-funktionale Anforderungen (NFR)
   - Erfolgskriterien (SC)
5. Strukturiere deine Arbeit in Phasen (Setup → Domain → Services → State Machine → UI → Custom Editor → Tests & Deployment).
6. Schreibe **Tests** (Unit, Component, E2E), bis die Erfolgskriterien erfüllt sind.
7. Führe keine weiteren „Brainstormings“ durch – diese Datei ist die freigegebene Entwicklungsbeauftragung.

---

## 1. Seed / Problem-Statement

Die **Couples Timer Web App** bildet das partnerschaftliche Zwiegespräch nach **Moeller** im Browser ab.

- Die App stellt einen neutralen, „unbestechlichen“ Rahmen für Paare dar.
- Sie strukturiert Redezeiten, Reihenfolge und Pausen.
- Sie schützt die therapeutische Struktur, indem sie **Rede-Slots strikt taktet** und **kein vorzeitiges Beenden von Slots** zulässt.
- Die App fungiert als **„dritte Instanz“**: Sie entscheidet über Zeit und Reihenfolge, nicht die Partner:innen.

**Modi (Session-Typen):**

1. **Maintain**  
2. **Commitment**  
3. **Listening**  
4. **Custom** (frei konfigurierbare Sequenz)

Jeder Modus besteht aus Phasen wie:

- `prep`
- `slotA`, `slotB` (Sprechphasen Partner A/B)
- `transition`
- `closingA`, `closingB`
- `cooldown`

---

## 2. Anforderungen (Kurzfassung)

### 2.1 Funktionale Anforderungen (FR)

- **FR-1 – Vier Modi & Phasen**  
  Die Web-App bietet die vier Modi (Maintain, Commitment, Listening, Custom) mit definierten Phasen (prep, slotA/B, transition, closing, cooldown).

- **FR-2 – Deterministische State Machine**  
  Eine zentrale State Machine steuert den Session-Ablauf. Phasen werden in fixer Reihenfolge ohne Überspringen durchlaufen.

- **FR-3 – Symmetrische A/B-Slots & Validierung**  
  In allen Modi existieren **Sprechphasen für A und B**.  
  Ein Custom-Modus ist nur gültig, wenn mindestens ein `slotA` und ein `slotB` vorhanden sind.

- **FR-4 – Countdown-Timer & Anzeige**  
  Jede Phase hat einen Countdown-Timer mit:
  - klarer digitaler Anzeige (`MM:SS` bzw. `H:MM:SS`)
  - grafischem Fortschrittsring (Kreis, der sich füllt/leert).

- **FR-5 – Keine vorzeitige Slot-Abgabe**  
  Es gibt **keine UI-Aktion**, um eine einzelne Sprechphase zu überspringen oder früher zu beenden.  
  Zulässig: **Pause**, **Resume**, **Stop** der **gesamten Session**.

- **FR-6 – Klangschalen-Audio**  
  Sechs definierte Klangschalen-Sounds werden bei Events abgespielt:
  - Session-Start
  - Slot-Ende
  - Transition-Ende
  - Start Closing
  - Start Cooldown
  - Cooldown-Ende

- **FR-7 – Guidance-Tipps**  
  Je nach `GuidanceLevel` (minimal, moderate, high) werden in bestimmten Phasen Hinweise eingeblendet:
  - Prep-Phase
  - Transition-Phasen
  - Cooldown (immer mit Tipps)

- **FR-8 – Custom-Sequenz-Builder**  
  User können einen Custom-Modus konfigurieren:
  - Phasen hinzufügen, löschen, umsortieren
  - Dauer pro Phase anpassen (innerhalb erlaubter Min/Max-Werte)
  - Validität wird angezeigt (z. B. Warnung, wenn kein A/B-Slot vorhanden).

- **FR-9 – Persistenz der Custom-Modi**  
  Custom-Modi werden im Browser gespeichert (**localStorage / IndexedDB**) und beim Start geladen.  
  User können:
  - Custom-Modi auswählen
  - bearbeiten
  - löschen.

- **FR-10 – Cooldown-Ansicht**  
  Während der Cooldown-Phase wird eine eigene Ansicht mit:
  - „Kein Nachgespräch“-Hinweis
  - verbleibender Cooldown-Zeit
  angezeigt.

- **FR-11 – DE/EN Lokalisierung**  
  Alle User-facing Texte sind in mindestens **Deutsch und Englisch** lokalisiert.  
  Sprache orientiert sich an:
  - Browser-Sprache (Default)
  - optionaler manueller Auswahl in der UI.

- **FR-12 – Visuelle Sprecher-Hervorhebung**  
  Der aktuelle Sprecher (A oder B) wird optisch hervorgehoben:
  - Farbschema (z. B. Blau für A, Violett für B)
  - Badge / Label
  - subtiler Hintergrund.

---

### 2.2 Nicht-funktionale Anforderungen (NFR)

- **NFR-1 – Timer-Genauigkeit**  
  Abweichung max. **±1 Sekunde pro 30 Minuten** bei normaler Nutzung (Foreground-Tab, moderne Browser).

- **NFR-2 – Cross-Browser**  
  Unterstützung für aktuelle Stable-Versionen von:
  - Chrome
  - Safari
  - Firefox
  - Edge

- **NFR-3 – Responsives Design**  
  Gute Nutzbarkeit auf:
  - Smartphones (ab 320 px Breite)
  - Laptops/Desktops (bis ca. 1440 px Breite).

- **NFR-4 – Accessibility**  
  WCAG 2.1 AA-orientiert:
  - ausreichend Kontrast
  - sinnvolle Fokus-Reihenfolge
  - ARIA-Labels für zentrale Controls.

- **NFR-5 – Audio-Policies**  
  Audio startet nur nach expliziter User-Interaktion (z. B. „Session starten“-Tap) und fällt bei Blockaden freundlich zurück (Hinweistext).

- **NFR-6 – Testbarkeit**  
  Domain-Modelle und State Machine sind **UI-unabhängig testbar**; Testabdeckung Domain/Engine ≥ 80 %.

- **NFR-7 – Performance**  
  Produktions-Bundle (JS) bleibt schlank; schnelle initiale Ladezeit (Ziel: LCP < 2 s auf typischer Verbindung).

- **NFR-8 – Persistenz-Performance**  
  Laden/Speichern von Custom-Modi dauert bei normaler Datenmenge < 50 ms (subjektiv „instantan“).

---

### 2.3 Erfolgskriterien (SC)

- **SC-1**: Alle vier Modi (Maintain, Commitment, Listening, Custom) sind end-to-end in Desktop- und Mobile-Browsern durchspielbar.
- **SC-2**: Bei 30-Minuten-Sessions liegt die gemessene Abweichung der Session-Endzeit in ≥95 % der Fälle bei ≤ ±1 s.
- **SC-3**: Es existiert keine UI-Aktion, um einzelne Sprechphasen zu skippen oder zu verkürzen (nur Session-Stop).
- **SC-4**: In 100 Testläufen werden Audio-Events in ≥99 % der Fälle korrekt (richtiger Sound, richtiger Zeitpunkt) abgespielt.
- **SC-5**: Mindestens drei Custom-Modi können erstellt, bearbeitet, gespeichert, neu geladen und erfolgreich ausgeführt werden.
- **SC-6**: In einem kleinen UX-Test (3–5 Personen) bewerten ≥80 % die UI-Ästhetik & Klarheit mit mindestens 4/5.
- **SC-7**: DE/EN-Umschaltung ändert sämtliche UI-Texte ohne Reload; keine hartkodierten Strings verbleiben.

---

## 3. Technischer Rahmen (Kurzfassung)

**Tech-Stack (umzusetzen):**

- React 18+
- TypeScript 5+
- Vite als Build-Tool
- Tailwind CSS für Layout/Design
- Framer Motion für Animationen
- i18next + react-i18next für Lokalisierung
- Vitest + React Testing Library für Unit/Component-Tests
- Playwright für E2E-Tests

**Architektur-Layer:**

1. **Domain (`src/domain`)**
   - `PhaseType`, `Speaker`, `PhaseConfig`, `GuidanceLevel`, `SessionMode`, `SessionState`, `AudioEvent`
   - `SessionEngine` als State Machine

2. **Services (`src/services`)**
   - `AudioService` (Web Audio API)
   - `GuidanceService`
   - `PersistenceService` (localStorage)
   - `TimerService` (tickende Zeitquelle, drift-arm)

3. **View-State (`src/viewModel` oder `src/context`)**
   - React Context / Hooks (`useSession`, `useModeSelection`) zur Anbindung der Engine an die UI.

4. **UI (`src/components`, `src/pages`)**
   - Views: ModeSelectionPage, SessionPage, SequenceBuilderPage
   - Components: TimerDisplay, PhaseIndicator, GuidanceTip, ModeCard, CooldownView, PhaseRow usw.

5. **i18n (`src/i18n`)**
   - `en/translation.json`, `de/translation.json` mit allen Strings.

---

## 4. Work-Plan (High-Level für den Agenten)

Der Implementation-Agent sollte in etwa dieser Reihenfolge arbeiten:

1. **Setup**
   - Vite + React + TS + Tailwind einrichten.
   - Grundlayout & Theme definieren.

2. **Domain-Modelle**
   - Enums/Typen & `SessionMode`-Presets implementieren.
   - Tests für alle Domain-Funktionen schreiben.

3. **Services**
   - `AudioService`, `TimerService`, `GuidanceService`, `PersistenceService` umsetzen und testen.

4. **SessionEngine**
   - State Machine implementieren (Start/Stop/Pause/Resume, Phasenfortschritt, Audio-Events).
   - Zeit-Tracking und Genauigkeitstests.

5. **View-State / Context**
   - Hooks/Context, die Engine-State in UI-Friendly Props übersetzen.

6. **UI-Komponenten**
   - TimerDisplay, PhaseIndicator, GuidanceTip, ModeCard, CooldownView.

7. **Pages & Routing**
   - ModeSelectionPage, SessionPage, SequenceBuilderPage.
   - Navigationsfluss: Auswahl → Session → Cooldown → zurück.

8. **Tests & Deployment**
   - Unit-/Component-/E2E-Tests.
   - Build & Deployment (z. B. Vercel/Netlify).

---

## 5. Fertig-Bedingung

Das Projekt gilt als **fertig**, wenn:

- Alle Anforderungen (FR-1 bis FR-12, NFR-1 bis NFR-8) erfüllt sind.
- Alle Erfolgskriterien (SC-1 bis SC-7) verifiziert wurden.
- Domain-Tests, Engine-Tests, UI-Tests und E2E-Tests in CI grün sind.
- Ein Produktiv-Build online ist und eine vollständige Session in Browsern (Desktop & Mobile) problemlos durchgespielt werden kann.