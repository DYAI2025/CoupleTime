# Couples Timer - Zwiegespräch nach Moeller

Eine Web-Anwendung für strukturierte Partnergespräche basierend auf der **Moeller-Methode** ("Zwiegespräch"). Die App fungiert als neutrale dritte Instanz, die Sprechzeiten, Reihenfolge und Pausen verwaltet – so können sich beide Partner vollständig auf den Inhalt konzentrieren, ohne auf die Zeit achten zu müssen.

## 📖 Inhaltsverzeichnis

- [Was ist das Zwiegespräch?](#was-ist-das-zwiegespräch)
- [Funktionsweise](#funktionsweise)
- [Gesprächsmodi](#gesprächsmodi)
- [Anleitung](#anleitung)
- [Features](#features)
- [Installation & Entwicklung](#installation--entwicklung)
- [Technischer Stack](#technischer-stack)
- [Architektur](#architektur)
- [Tests](#tests)
- [Lizenz](#lizenz)

---

## 🎯 Was ist das Zwiegespräch?

Das **Zwiegespräch** nach Michael Lukas Moeller ist eine strukturierte Kommunikationsmethode für Paare, bei der beide Partner in festgelegten Zeitabschnitten sprechen. Die Regeln sind einfach, aber wirkungsvoll:

- **Einer spricht, der andere hört zu** – ohne zu unterbrechen
- **Feste Zeitfenster** – jeder Partner erhält gleich viel Redezeit
- **Keine Diskussion während der Slots** – erst am Ende gibt es Raum für Dialog
- **Regelmäßigkeit** – idealerweise wöchentlich oder zweimal wöchentlich

Diese Methode schafft einen geschützten Raum für **tiefere Verbindung**, **emotionale Intimität** und **präventive Beziehungspflege**.

---

## ⚙️ Funktionsweise

### 1. Phasenablauf

Jede Session besteht aus mehreren aufeinanderfolgenden **Phasen**:

| Phase | Beschreibung |
|-------|--------------|
| **Prep** (Vorbereitung) | Ankommen, Einstimmung in das Gespräch (1-2 Minuten) |
| **Slot A** | Partner A spricht, Partner B hört zu (10-15 Minuten) |
| **Slot B** | Partner B spricht, Partner A hört zu (10-15 Minuten) |
| **Transition** (Übergang) | Kurze Pause zwischen den Runden (1-1,5 Minuten) |
| **Closing A/B** (Abschluss) | Abschließende Gedanken beider Partner (2-3 Minuten) |
| **Cooldown** | Gemeinsame stille Nachbereitungszeit (10 Minuten) |

### 2. Runden-System

Die meisten Modi arbeiten mit **mehreren Runden** (z. B. 2-3 Runden à Slot A + Slot B). Dies ermöglicht:
- Wiederholtes Sprechen und Vertiefen
- Reagieren auf Gehörtes (ohne direkt zu antworten)
- Natürlicher Gesprächsfluss durch Iteration

### 3. Audio-Signale

Die App nutzt **Klangschalen-Töne** (Web Audio API), um Phasenübergänge sanft anzuzeigen:

- 🔔 **Tiefer Einzelton** – Session startet
- 🔔 **Aufsteigender Ton** – Sprechzeit endet
- 🔔 **Klarer Ton** – Übergang endet
- 🔔 **Doppelter Klang** – Abschlussphase beginnt
- 🔔 **Ausklingend** – Cooldown startet
- 🔔 **Dreifacher Klang** – Session komplett beendet

**Wichtig:** Audio wird erst nach expliziter Nutzerinteraktion abgespielt (Browser-Policy).

### 4. Guidance-System

Je nach **Guidance-Level** zeigt die App hilfreiche Tipps während der Phasen:

- **Minimal** – nur Cooldown-Tipps
- **Moderate** – zusätzlich Transition-Tipps
- **High** – auch Prep-Tipps (Einsteiger-Modus)

---

## 🎭 Gesprächsmodi

Die App bietet vier vordefinierte Modi plus einen vollständig anpassbaren **Custom Mode**:

### 1. **Maintain Mode** (Präventiv, Standard)
- **Zweck:** Wöchentliche Beziehungshygiene
- **Dauer:** ~90 Minuten
- **Runden:** 3 × 15 Minuten
- **Frequenz:** 1× pro Woche
- **Guidance:** Moderate

Ideal für etablierte Paare zur regelmäßigen Pflege der Beziehung.

### 2. **Commitment Mode** (Krisenphase)
- **Zweck:** Stabilisierung in instabilen Phasen
- **Dauer:** ~60 Minuten
- **Runden:** 3 × 10 Minuten
- **Frequenz:** 2× pro Woche empfohlen
- **Guidance:** Moderate

Kürzere Sessions bei höherer Frequenz, ideal bei Konflikten oder Krisen.

### 3. **Listening Mode** (Einsteiger)
- **Zweck:** Einstieg für Anfänger, Fokus auf aktives Zuhören
- **Dauer:** ~45 Minuten
- **Runden:** 2 × 10 Minuten
- **Frequenz:** Nach Bedarf
- **Guidance:** High

Kompakterer Einstieg mit mehr Hilfestellungen während des Gesprächs.

### 4. **Custom Mode** (Individuell)
- **Zweck:** Vollständig anpassbare Phasen und Dauern
- **Validierung:** Mindestens 1× Slot A und 1× Slot B erforderlich
- **Guidance:** Wählbar (minimal, moderate, high)

Für fortgeschrittene Nutzer, die eigene Zeitstrukturen entwickeln möchten.

---

## 📱 Anleitung

### Erstnutzung

1. **App öffnen** – Navigate zu [couples-timer.app] (oder lokal via `npm run dev`)
2. **Onboarding durchlaufen** – Einführung in die Methode und App-Nutzung
3. **Sprache wählen** – Deutsch oder Englisch
4. **Partnerprofile anlegen** – Namen für beide Partner eingeben (z. B. "Anna & Max")

### Session starten

1. **Modus auswählen**
   - Klicke auf eine der vier Karten (Maintain, Commitment, Listening, Custom)
   - Lies die Beschreibung und Gesamtdauer

2. **Einstellungen anpassen** (optional)
   - Guidance-Level ändern (minimal/moderate/high)
   - Audio aktivieren/deaktivieren
   - Bei Custom Mode: Phasen hinzufügen, entfernen, Reihenfolge ändern

3. **Session starten**
   - Klicke auf "Start Session"
   - Bereite dich während der Prep-Phase vor
   - Die App leitet dich automatisch durch alle Phasen

### Während der Session

- **Timer** – Zeigt verbleibende Zeit der aktuellen Phase
- **Phasen-Indikator** – Zeigt aktuellen und nächsten Schritt
- **Guidance-Tipps** – Erscheinen je nach Level und Phase
- **Pause/Resume** – Pausiere die gesamte Session bei Bedarf
- **Stop** – Beende die Session vorzeitig (Bestätigung erforderlich)

**Wichtig:** Einzelne Phasen können **nicht übersprungen** werden – dies ist zentral für die Methode!

### Nach der Session

- **Cooldown** – 10 Minuten stilles Nachspüren (kein Nachgespräch!)
- **Session abschließen** – App kehrt automatisch zur Startseite zurück
- **Wiederholung planen** – Regelmäßigkeit ist der Schlüssel zum Erfolg

### Custom Mode erstellen

1. Wähle "Custom" auf der Startseite
2. Klicke "Create New Custom Sequence"
3. **Phasen hinzufügen:**
   - Klicke "+Add Phase"
   - Wähle Phase-Typ (prep, slotA, slotB, transition, closing, cooldown)
   - Setze Dauer (per Slider oder Eingabefeld)
4. **Reihenfolge anpassen:**
   - Drag & Drop zum Verschieben von Phasen
5. **Guidance-Level wählen:** minimal/moderate/high
6. **Speichern:** Deine Sequenz wird im Browser persistiert
7. **Starten:** Nutze die Sequenz wie einen Preset-Modus

**Validierung:** Mindestens 1× Slot A und 1× Slot B erforderlich.

---

## ✨ Features

### Kernfunktionen
- ✅ **4 wissenschaftlich fundierte Preset-Modi** (Maintain, Commitment, Listening, Custom)
- ✅ **Präziser Timer** (Genauigkeit: ±1 Sekunde pro 30 Minuten)
- ✅ **Audio-Signale** (Klangschalen via Web Audio API)
- ✅ **Guidance-System** (3 Stufen: minimal, moderate, high)
- ✅ **Zweisprachig** (Deutsch/English mit i18next)
- ✅ **Onboarding** für Erstnutzer
- ✅ **Partnernamen** individuell anpassbar

### Technische Features
- ✅ **Offline-fähig** (keine Server-Abhängigkeit)
- ✅ **Persistierung** (LocalStorage für Custom Modes und Einstellungen)
- ✅ **Responsive Design** (Mobile & Desktop)
- ✅ **Animations** (Framer Motion für sanfte Übergänge)
- ✅ **Type-safe** (TypeScript 5+)
- ✅ **Getestet** (Vitest + Playwright E2E)

### Design-Prinzipien
- 🚫 **Keine Skip-Buttons** – Methoden-Treue
- 🎯 **Klare Phasen-Logik** – SessionEngine als Zustandsmaschine
- 🔇 **Audio-Consent** – Explizite Nutzer-Aktivierung erforderlich
- 📏 **Strikte Validierung** – Custom Modes müssen Regeln einhalten

---

## 🛠️ Installation & Entwicklung

### Voraussetzungen
- Node.js 18+ und npm
- Git

### Lokale Installation

```bash
# Repository klonen
git clone https://github.com/DYAI2025/CoupleTime.git
cd CoupleTime

# Dependencies installieren
npm install

# Dev-Server starten (Port 5173)
npm run dev
```

### Verfügbare Befehle

```bash
# Entwicklung
npm run dev           # Vite Dev-Server starten
npm run build         # Production Build erstellen
npm run preview       # Build lokal testen

# Testing
npm run test          # Vitest Unit-Tests ausführen
npm run test:run      # Tests einmalig laufen (CI)
npm run test:e2e      # Playwright E2E-Tests

# Code-Qualität
npm run lint          # ESLint prüfen
npm run format        # Prettier formatieren

# Deployment
npm run deploy        # Build + gh-pages deployment
```

---

## 🔧 Technischer Stack

### Frontend
- **React 19.2** – UI-Framework
- **TypeScript 5.9** – Type-safe Development
- **Vite 7** – Build-Tool (schnell, modern)
- **Tailwind CSS 3.4** – Utility-First Styling
- **Framer Motion 12** – Animations

### State Management & Logic
- **React Context/Hooks** – UI-State
- **SessionEngine** – Domain-Logik (pure TypeScript)
- **LocalStorage** – Persistierung (PersistenceService)

### Audio & Services
- **Web Audio API** – Klangschalen-Generierung (AudioService)
- **performance.now()** – Timer-Genauigkeit (TimerService)
- **i18next** – Internationalisierung (DE/EN)

### Testing & Tooling
- **Vitest** – Unit & Component Tests
- **@testing-library/react** – React-Testing Utils
- **Playwright** – E2E-Tests
- **ESLint + Prettier** – Code-Qualität

---

## 🏗️ Architektur

### Verzeichnisstruktur

```
src/
├── domain/              # Pure TypeScript Domain Models (UI-unabhängig)
│   ├── SessionEngine.ts    # Zentrale Zustandsmaschine
│   ├── SessionMode.ts      # Mode-Definitionen
│   ├── PhaseType.ts        # prep, slotA, slotB, transition, closing, cooldown
│   ├── AudioEvent.ts       # Audio-Event-Typen
│   ├── GuidanceLevel.ts    # minimal, moderate, high
│   └── ...
├── services/            # Browser APIs & Side Effects
│   ├── AudioService.ts     # Web Audio API Integration
│   ├── TimerService.ts     # Drift-korrigierter Timer
│   ├── GuidanceService.ts  # Tipp-Logik pro Phase
│   └── PersistenceService.ts  # LocalStorage CRUD
├── viewModel/           # React Context & Hooks (Domain ↔ UI Bridge)
│   ├── useSession.ts       # Session-State Management
│   └── useModeSelection.ts # Mode-Auswahl & Custom-Sequenzen
├── components/          # UI-Komponenten
│   ├── TimerDisplay/       # Countdown-Anzeige
│   ├── PhaseIndicator/     # Aktueller + Nächster Schritt
│   ├── GuidanceTip/        # Kontext-sensitive Tipps
│   ├── ModeCard/           # Mode-Karten auf Startseite
│   ├── onboarding/         # Onboarding-Flow
│   └── ...
├── pages/               # Views (Routing)
│   ├── ModeSelectionPage.tsx   # Startseite mit 4 Modi
│   ├── SessionPage.tsx         # Aktive Session-View
│   └── SequenceBuilderPage.tsx # Custom Mode Editor
├── i18n/                # Übersetzungen
│   ├── de/translation.json
│   └── en/translation.json
└── public/audio/        # Singing Bowl Sounds (6 WAV-Dateien)
```

### Domain-Driven Design

- **Domain Layer** – Vollständig UI-unabhängig, testbar ohne React
- **Service Layer** – Kapselt Browser-APIs (Audio, Timer, Storage)
- **ViewModel Layer** – React-spezifische Logik, bindet Domain an UI
- **View Layer** – Präsentationskomponenten, keine Business-Logik

### SessionEngine (Zustandsmaschine)

Die zentrale Logik sitzt in `SessionEngine.ts`:

```typescript
class SessionEngine {
  start(): void              // Session starten
  pause(): void              // Session pausieren
  resume(): void             // Session fortsetzen
  stop(): void               // Session beenden
  tick(deltaMs: number): void // Timer-Tick verarbeiten
  getCurrentPhase(): PhaseConfig
  getProgress(): number      // 0.0 - 1.0
  // ...
}
```

**Key Features:**
- Drift-Korrektur via `performance.now()`
- Event-Emitter für Audio-Trigger
- Strikte Phase-Sequenz-Validierung
- Immutable State-Updates

---

## 🧪 Tests

### Unit & Component Tests (Vitest)

```bash
npm run test
```

**Coverage-Ziele:**
- Domain Models & SessionEngine: ≥80%
- Services: ≥70%
- UI-Components: ≥60%

### E2E-Tests (Playwright)

```bash
npm run test:e2e
```

**Testszenarien:**
- Alle 4 Preset-Modi durchlaufen
- Custom Mode: Erstellen, Bearbeiten, Speichern, Laden, Ausführen
- Pause/Resume während Session
- Sprach-Switch (DE ↔ EN)
- Onboarding-Flow

---

## 🌐 Deployment

### GitHub Pages (automatisch)

```bash
npm run deploy
```

Build wird nach `dist/` erstellt und via `gh-pages` deployed.

### Andere Plattformen

- **Netlify/Vercel:** Repository verbinden, Build-Command: `npm run build`, Output: `dist/`
- **Docker:** Optional Dockerfile erstellen (nginx + dist)

---

## 🤝 Beitragen

Contributions sind willkommen! Bitte beachte:

1. **Issues:** Beschreibe Bugs oder Feature-Requests im GitHub Issue Tracker
2. **Pull Requests:**
   - Fork das Repo
   - Erstelle einen Feature-Branch (`git checkout -b feature/AmazingFeature`)
   - Committe deine Änderungen (`git commit -m 'Add AmazingFeature'`)
   - Pushe den Branch (`git push origin feature/AmazingFeature`)
   - Öffne einen Pull Request

3. **Code-Standards:**
   - TypeScript strict mode
   - Prettier + ESLint befolgen
   - Tests für neue Features schreiben
   - Commits in Englisch

---

## 📚 Ressourcen

### Moeller-Methode
- Michael Lukas Moeller: *"Die Wahrheit beginnt zu zweit"*
- [Wikipedia: Zwiegespräch](https://de.wikipedia.org/wiki/Zwiegespr%C3%A4ch)

### Technische Docs
- [React 19 Docs](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vite.dev/guide/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Framer Motion](https://www.framer.com/motion/)

---

## 📄 Lizenz

Dieses Projekt ist Open Source und unter der **MIT License** lizenziert. Siehe [LICENSE](LICENSE) für Details.

---

## 🙏 Danksagungen

- **Michael Lukas Moeller** – für die Zwiegespräch-Methode
- **React & TypeScript Community** – für großartige Tools
- **Alle Contributors** – die dieses Projekt verbessern

---

**Made with ❤️ for better relationships**

Bei Fragen oder Feedback: [GitHub Issues](https://github.com/DYAI2025/CoupleTime/issues)
