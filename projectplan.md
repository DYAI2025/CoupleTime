Brainstorm-Ergebnis
Faktisch korrekt sage ich, dass ich deine bestehende iOS-Entwicklungsbeauftragung inhaltlich übernehme und für eine webbasierte App mit höchster visueller Qualität (Desktop & Mobile Browser) neu rahme.

Problem Statement
Faktisch korrekt sage ich: Das Projekt soll eine Web-App bereitstellen, die das partnerschaftliche Zwiegespräch nach Moeller strukturiert begleitet. Die App stellt einen neutralen, „unbestechlichen“ Rahmen dar, der Redezeiten, Reihenfolge und Pausen strikt vorgibt, damit Paare sich auf Inhalte und Beziehung fokussieren können, nicht auf Timing oder Meta-Diskussionen.

Objectives & Success Criteria
Logisch scheint mir, dass sich daraus folgende Ziele & KPIs ableiten:

Goal 1: Strukturtreues Abbild des Moeller-Zwiegesprächs in vier Modi (Maintain, Commitment, Listening, Custom) ohne Möglichkeit zur vorzeitigen Slot-Abgabe.

Goal 2: Zuverlässiger, genauer Timer (Fehler ≤ ±1 Sekunde pro 30 Minuten) inkl. Audio-Signalen.

Goal 3: Web-App mit sehr hoher visueller Qualität, die sich „premium“, ruhig und klar anfühlt.

Goal 4: Nutzer:innen können eigene Sequenzen im Custom-Modus bauen, speichern und wiederverwenden.

KPI: 100 % der Sessions laufen ohne technische Unterbrechung/Fehler in aktuellen Browsern.

KPI: >80 % der Testnutzer:innen bewerten Klarheit & Ästhetik der Oberfläche mit ≥ 4/5.

Stakeholders & Users
Faktisch korrekt sage ich:

Primary: Paare, die (ggf. mit therapeutischer Begleitung) das partnerschaftliche Zwiegespräch praktizieren.

Secondary: Therapeut:innen/Coaches, die ihren Klient:innen die Web-App als „dritte Instanz“ empfehlen.

Tertiär: Du selbst als Product Owner / Ideengeber:in.

Constraints
Logisch scheint mir (auf Basis deiner Vorgabe), dass folgende Constraints gelten:

Zeit: Nicht explizit vorgegeben; Annahme: MVP in wenigen Arbeitstagen umsetzbar (subjektive Schätzung, kein harter Rahmen).

Tech stack: Web-App, moderne Frontend-Stacks (React + TypeScript o. ä.), keine native App.

Security: Nur lokale Speicherung (localStorage), keine sensiblen Inhalte auf Servern; keine Benutzerkonten.

Budget: Kein dedizierter Backend-Betrieb; statisches Hosting / einfache Frontend-Deployment-Pipeline.

Org: Keine Integration in bestehende Unternehmenskonten nötig; eigenständige kleine App.

Scope
Faktisch korrekt sage ich, im Scope stehen:

In scope:

Vier Modi (Maintain, Commitment, Listening, Custom) inkl. vordefinierter Sequenzen.

Domain-Modelle & State Machine für Session-Ablauf.

Klangschalen-Audio (6 definierte Sounds) auf Web-Basis.

Guidance-Tipps (insb. Listening-Mode).

Custom-Sequenz-Builder mit Phasen-Konfiguration.

Lokale Persistenz (Browser localStorage / ggf. IndexedDB).

DE/EN Lokalisierung.

Responsive, optisch hochwertige UI inkl. Animationen.

Out of scope:

KI-Analyse von Gesprächen.

Cloud-Sync / Accounts / Multi-Device-Synchronisation.

Spracheingabe/-transkription.

Backend-Services (bis auf statisches Hosting / einfache Telemetrie).

Push-Notifications / komplexe PWA-Features.

Environment
Faktisch korrekt sage ich:

Deployment: Moderne Web-App, idealerweise als SPA/MPA auf einem Static Host (z. B. Vercel/Netlify/S3+CloudFront).

Laufzeitumgebung: Aktuelle Browser (Chrome, Safari, Firefox, Edge), Mobile & Desktop.

Dev-Umgebung: Node.js + Package-Manager, Git, CI (z. B. GitHub Actions).

Solution Concept
Logisch scheint mir als Lösungskonzept:

Eine React/TypeScript-Single-Page-App mit klaren Screens:

ModeSelection (Start).

Session (laufende Sitzung mit Timer).

SequenceBuilder (Custom-Modus).

Optional separate Cooldown-Ansicht oder integraler Teil der Session-View.

Eine pure TypeScript-Domain-Schicht mit:

PhaseType, Speaker, PhaseConfig, GuidanceLevel, SessionMode, AudioEvent, SessionState.

JSON-basierten Preset-Modi (Maintain, Commitment, Listening).

Validierung für Custom-Modus (mindestens ein A- und ein B-Slot).

Eine SessionEngine als zentrale State Machine:

Steuert Phasenablauf, Timer, Audio-Trigger.

Arbeitet deterministisch und UI-unabhängig.

Nutzt hochauflösende Zeitmessung (performance.now()) zur Erfüllung der Genauigkeitsanforderung.

Service-Layer:

AudioService (Web Audio API, Vorladen & Lautstärke).

GuidanceService (lokalisierte Tipps).

PersistenceService (localStorage; Custom-Modi).

UI-Layer mit maximaler visueller Qualität:

Tailwind-basiertes Designsystem (Typografie, Color System, Spacing, Radii).

Kreisförmiger Timer mit weichen Animationsübergängen (Framer Motion).

Klare Speaker-Badges, Hintergrund-Farbverlauf je Sprecher (A/B).

Smooth Transitions zwischen Phasen, reduzierte, ruhige UI („Therapie-Raum“-Ästhetik).

Keine Skip-Buttons, nur Pause/Resume/Stop.

Design Decisions
Faktisch korrekt sage ich:

State Machine als Single Source of Truth: SessionEngine verwaltet alle transitions & Zeitlogik; React UI subscribed nur.

JSON-basierte Mode-Definitionen bleiben; Erweiterbarkeit ohne Änderung der Kernlogik.

Strikte Trennung Domain ↔ UI ↔ Services für Testbarkeit.

Keine „Skip“-Controls im UI → Strukturtreue durch Nicht-Vorhandensein von Abkürzungen.

Risiken & Open Questions
Logisch scheint mir, dass folgende Risiken & Fragen existieren:

Browser-Audio-Policies: Autoplay von Audio ist ohne User-Interaktion eingeschränkt; Lösung: expliziter „Start“-Tap mit Hinweis.

Timer-Genauigkeit im Hintergrund: In inaktiven Tabs drosseln Browser Timer; strenge Genauigkeit ist dort schwerer sicherzustellen.

Accessibility: Visuelle Qualität vs. Kontrast & Einfachheit müssen ausbalanciert werden.

Device-Vielfalt: Mobile Browser (iOS Safari, Android Chrome) verhalten sich bei Audio & Background unterschiedlich.

Status: Da du Anforderungen und Design im iOS-Plan bereits validiert hast und wir sie nur auf Web übertragen, gehe ich davon aus, dass das Konzept akzeptabel ist. (Wenn du später justieren willst, können wir iterieren.)

Requirements-Extrakt
Faktisch korrekt sage ich, dass ich aus deiner ursprünglichen Spezifikation funktionale & nicht-funktionale Anforderungen sowie Erfolgskriterien ableite und für eine Web-App präzisiere.

Functional Requirements (FR)
FR-1 (H): Die Web-App bietet vier Modi (Maintain, Commitment, Listening, Custom) mit jeweils definierten Phasen (prep, slotA/B, transition, closing, cooldown).

FR-2 (H): Eine deterministische State Machine steuert den Session-Ablauf; Phasen werden in fixer Reihenfolge ohne Überspringen durchlaufen.

FR-3 (H): Sprechphasen sind symmetrisch strukturiert (A/B); Custom-Modi sind nur valide, wenn mindestens ein A- und ein B-Slot vorhanden sind.

FR-4 (H): Jede Phase besitzt einen Countdown-Timer mit digitaler Anzeige und grafischem Fortschrittsring; die Gesamt-Session-Zeit wird intern mitgeführt.

FR-5 (H): Nutzer:innen können keine einzelnen Slots vorzeitig beenden; es existieren nur Pause/Resume/Stop auf Session-Ebene.

FR-6 (M): Klangschalen-Sounds werden bei Events abgespielt: Session-Start, Slot-Ende, Transition-Ende, Start Closing, Start Cooldown, Cooldown-Ende.

FR-7 (M): Guidance-Tipps werden in Prep-, Transition- und Cooldown-Phasen entsprechend dem GuidanceLevel angezeigt.

FR-8 (M): Ein Custom-Sequenz-Builder erlaubt das Hinzufügen, Entfernen, Umsortieren und Duration-Anpassen von Phasen innerhalb definierter Ranges.

FR-9 (M): Custom-Modi werden persistent im Browser gespeichert und beim App-Start geladen; sie sind auswähl- und löschbar.

FR-10 (M): Nach Ende der Session wird eine Cooldown-Ansicht mit „Kein Nachgespräch“-Hinweis und Restzeit angezeigt.

FR-11 (H): Alle UI-Strings sind in mindestens DE und EN lokalisiert; die Sprache kann anhand Browser-Language und manuell gewählt werden.

FR-12 (M): Die UI hebt den aktuellen Sprecher visuell hervor (Farbkodierung A/B, Hintergrund, Badge).

Non-Functional Requirements (NFR)
NFR-1 (H): Timer-Genauigkeit: max. Abweichung ±1 Sekunde pro 30 Minuten unter typischen Browser-Bedingungen (Foreground, moderne Hardware).

NFR-2 (H): Cross-Browser: Unterstützung für die jeweils aktuelle Stable-Version von Chrome, Safari, Firefox, Edge.

NFR-3 (M): Responsive Design für Viewport-Breiten 320–1440 px mit guter Nutzung auf Smartphones & Laptops.

NFR-4 (M): Accessibility: WCAG 2.1 AA für zentrale Flows (Kontrast, Fokus-Reihenfolge, Screenreader-Labels).

NFR-5 (M): Audio-Playback startet nur nach expliziter User-Interaktion und degradiert sinnvoll, falls blockiert.

NFR-6 (M): Testabdeckung: ≥ 80 % für Domain-Modelle und SessionEngine (Branch- und State-Coverage).

NFR-7 (L): Performance: Initiale JS-Bundle-Größe < 1 MB (nach Minification & Code-Splitting), LCP < 2s auf typischer Verbindung.

NFR-8 (M): Persistenz-Operationen (Laden/Speichern Custom-Modi) dauern < 50 ms für typische Datenmengen.

Success Criteria (SC)
SC-1 (H): Alle vier Modi sind end-to-end (von Auswahl bis Cooldown-Ende) in Desktop- und Mobile-Browsern durchspielbar.

SC-2 (H): In Tests mit 30-Minuten-Sessions liegt die Abweichung zwischen geplanten und gemessenen Endzeiten in ≥95 % der Fälle bei ≤ ±1 Sekunde.

SC-3 (H): Es existiert im UI keine Interaktionsmöglichkeit, einzelne Sprechphasen zu überspringen oder zu verkürzen (nur Stop der kompletten Session).

SC-4 (M): Für 100 Testläufe werden die Audio-Events in ≥99 % der Fälle korrekt (richtige Datei, richtiger Zeitpunkt) abgespielt (unter Beachtung von Browser-Policies).

SC-5 (M): Mindestens drei Custom-Modi können erstellt, bearbeitet, gespeichert, geladen und ausgeführt werden; nach Browser-Reload bleiben sie erhalten.

SC-6 (M): In einem kleinem UX-Test (3–5 Personen) erhalten Ästhetik und Klarheit des UI im Mittel ≥ 4/5.

SC-7 (M): DE/EN-Umschaltung ändert alle Text-Strings ohne Reload; keine „Hardcoded“-Texte verbleiben.

Implementierungsplan für AI-Agent
Faktisch korrekt sage ich, dass der folgende Plan dem Write-Plan-Template des Superpowers-Skills folgt und für eine Web-App (React/TypeScript) formuliert ist.

1. Context
Title
Faktisch korrekt sage ich:
Couples Timer – Web App für partnerschaftliches Zwiegespräch

Summary
Logisch scheint mir:
Eine React/TypeScript-Web-App begleitet Paare durch das partnerschaftliche Zwiegespräch nach Moeller. Vier Modi (Maintain, Commitment, Listening, Custom) strukturieren den Ablauf in Phasen mit getakteten A/B-Sprechslots, Übergängen, Abschluss und Cooldown. Eine zentrale State Machine (SessionEngine) steuert Timer, Audio-Signale und Guidance-Tipps und fungiert als neutrale „dritte Instanz“, die Struktur und Zeitrahmen schützt.

Scope

In scope:

Vier Modi mit vordefinierter Sequenz-Logik (Maintain, Commitment, Listening, Custom).

TypeScript-Domain-Layer (PhaseType, SessionMode, etc.) und SessionEngine.

Audio-Service mit sechs Klangschalen-Sounds (Web Audio API).

Guidance-Tipps + Anzeige-Logik nach Guidance-Level.

Custom-Sequenz-Builder mit Validierung und Persistenz (localStorage).

DE/EN Lokalisierung über JSON-Resource-Dateien.

Responsive, visuell hochwertige UI mit sanften Animationen.

Out of scope:

Serverseitige Analyse, KI-Features, Nutzerkonten.

Synchronisation über Geräte hinweg / Cloud-Speicher.

Sprachtranskription oder Audioaufnahme.

Ausgereifte Analytics-/Tracking-Dashboards (max. schlichtes Telemetrie-Logging).

Success Criteria

Logisch scheint mir, dass die SC aus dem Requirements-Extrakt übernommen werden; zentrale Punkte:

Alle vier Modi sind in Desktop- & Mobile-Browsern durchspielbar (SC-1).

Timer-Genauigkeit ±1s pro 30 Minuten (SC-2 / NFR-1).

Keine vorzeitige Slot-Abgabe durch UI (SC-3).

Klangschalen erklingen korrekt bei allen relevanten Events (SC-4).

Custom-Sequenz-Builder erlaubt flexible Konfiguration und Persistenz (SC-5).

UI wird als „sehr klar“ und „sehr ästhetisch“ bewertet (SC-6).

Volle DE/EN-Lokalisierung (SC-7).

2. Technical Framing
Faktisch korrekt sage ich: Der Plan nutzt einen modernen Frontend-Stack und hält sich an den Superpowers-Workflow (Brainstorm → Spec → Plan).

Tech Stack

TypeScript 5+

React 18+ (SPA)

Vite 5 als Build-Tool

React Router 6 für Routing

Tailwind CSS + konfiguriertes Theme für „Therapie-Raum“-Look

Framer Motion für Animationsübergänge

i18next + react-i18next für Lokalisierung

Vitest + React Testing Library für Unit/Component-Tests

Playwright für E2E-Tests

ESLint + Prettier für Code-Qualität

Environment

Node.js 20+, pnpm oder npm als Package Manager

Git-Repository couples-timer-web

CI-Pipeline (z. B. GitHub Actions) für Linting, Tests, Builds

Deployment auf statischem Host (z. B. Vercel, Netlify oder S3+CloudFront)

Repositories & Services

couples-timer-web (Single-Repo, Monolith):

src/domain – TypeScript-Domain-Modelle & Engine

src/services – Audio, Guidance, Persistence, Timer

src/components – UI-Komponenten

src/pages – Views/Screens

src/i18n – Lokalisierung

public/audio – Klangschalen-Sounds

Architecture Overview

Logisch scheint mir:

UI-Layer (React): Präsentationskomponenten (Timer, PhaseIndicator, ModeCards, Sequenzliste).

View-State-Layer: React Hooks und Context (z. B. SessionProvider, useSession), die den SessionEngine-State in UI-Props übersetzen.

Domain-Layer: Reine TypeScript-Dateien für Phasen, Modi und Sessions; komplett testbar ohne Browser.

Services: Kapseln Browser-spezifische APIs (Audio, Storage, Zeitmessung).

Routing: Minimal (Start/Session/SequenceBuilder); State (aktuelle Session) wird im Context gehalten.

Key Design Decisions

Zentraler SessionEngine-Typ (keine direkte Timer-Logik in React-Komponenten).

Nutzung von Web Audio API mit Preloading für kurze Latenzen.

JSON/TS-basierte Definition der Preset-Modi zur Erweiterbarkeit.

Strikte Trennung von Domain und Ansicht, um Tests und Wiederverwendung zu ermöglichen.

Fokus auf ruhige, reduzierte UI mit wenigen, klaren Controls pro Screen (hohe optische Qualität).

3. Work Plan
Faktisch korrekt sage ich, dass die Aufgaben in Phasen organisiert sind und jede Task DoD, Abhängigkeiten und FR/SC-Coverage enthält – entsprechend dem Write-Plan-Sub-Skill.

Phase 0: Setup
T0.1: React/TypeScript-Projekt aufsetzen
Description:
Initialisiere ein neues Vite-React-Projekt mit TypeScript, richte die Basis-Ordnerstruktur und Dev-Tools ein.

Artifacts:

package.json, vite.config.ts

Ordner: src/domain, src/services, src/components, src/pages, src/i18n, public/audio

Basiskomponente App.tsx

DoD:

npm run dev startet App ohne Fehler, zeigt Platzhalterseite.

ESLint/Prettier konfiguriert und laufen fehlerfrei.

Git-Repo initialisiert, initialer Commit erstellt.

Dependencies: Keine

Coverage: FR-1, NFR-2, NFR-7

T0.2: Audio-Assets integrieren
Description:
Lege die sechs Klangschalen-Sounddateien im public/audio-Verzeichnis ab und stelle sicher, dass sie im Browser erreichbar sind.

Artifacts:

public/audio/bowl_deep_single.wav

public/audio/bowl_rising.wav

public/audio/bowl_clear.wav

public/audio/bowl_double.wav

public/audio/bowl_fade.wav

public/audio/bowl_triple.wav

DoD:

Aufruf der Files über http://localhost:5173/audio/... liefert gültige WAV-Datei (im Dev-Server).

Manuelles Test-Script lädt jede Datei und loggt Erfolg.

Dependencies: T0.1

Coverage: FR-6, SC-4

T0.3: Lokalisierung (DE/EN) vorbereiten
Description:
Richte i18next + react-i18next ein, erstelle Lokalisierungsdateien für DE und EN mit den zentralen Keys (Mode-Namen, Phasen, Guidance, Cooldown).

Artifacts:

src/i18n/index.ts (i18next-Setup)

src/i18n/locales/en/translation.json

src/i18n/locales/de/translation.json

DoD:

Umschalten der Sprache (z. B. per Dropdown) ändert Mode-Namen & Phase-Labels.

Keine hartkodierten User-facing Strings in Komponenten.

Dependencies: T0.1

Coverage: FR-1, FR-7, FR-10, FR-11, SC-7

T0.4: Designsystem & Theme definieren
Description:
Richte Tailwind CSS ein und definiere Theme-Tokens (Farben, Typografie, Spacing, Radii) für eine ruhige, hochwertige UI; implementiere Basis-Layout.

Artifacts:

tailwind.config.cjs

src/styles/global.css

Dokumentierter Farb- und Typografie-Guide (Markdown im Repo).

DoD:

App verwendet Tailwind-Klassen.

Grund-Layout (z. B. MainLayout) mit responsivem Padding und maximaler Breite existiert.

Farbpalette erfüllt Kontrastanforderungen für Text.

Dependencies: T0.1

Coverage: NFR-3, NFR-4, SC-6

Phase 1: Domain Models (TypeScript)
T1.1: PhaseType und Speaker definieren
Description:
Implementiere PhaseType und Speaker als TypeScript-Enums inkl. Helper-Funktionen (Display-Namen, isSpeakingPhase, speaker).

Artifacts:

src/domain/PhaseType.ts

src/domain/Speaker.ts

Tests: src/domain/__tests__/PhaseType.test.ts

DoD:

Alle Enum-Werte vorhanden (prep, slotA, slotB, transition, closingA, closingB, cooldown).

Tests prüfen isSpeakingPhase und speaker-Zuordnung.

Dependencies: T0.3

Coverage: FR-1, FR-2, FR-3

T1.2: PhaseConfig implementieren
Description:
Definiere PhaseConfig als Typ mit id, type, duration, allowedRange, isValid, formattedDuration.

Artifacts:

src/domain/PhaseConfig.ts

Tests: src/domain/__tests__/PhaseConfig.test.ts

DoD:

isValid reflektiert korrekt, ob duration im erlaubten Bereich liegt.

Formatierung (z. B. 905s → "15:05") ist getestet.

Dependencies: T1.1

Coverage: FR-2, FR-4

T1.3: GuidanceLevel definieren
Description:
Implementiere GuidanceLevel inkl. Flags (showPrepTips, showTransitionTips, showBreathingExercise) analog zur iOS-Variante.

Artifacts:

src/domain/GuidanceLevel.ts

Tests: src/domain/__tests__/GuidanceLevel.test.ts

DoD:

Tests stellen sicher, dass minimal, moderate, high erwartetes Verhalten zeigen.

Dependencies: T0.3

Coverage: FR-7

T1.4: SessionMode definieren
Description:
Implementiere SessionMode mit id, name, phases, guidanceLevel, isLocked, totalDuration, formattedTotalDuration, roundCount, isValid.

Artifacts:

src/domain/SessionMode.ts

Tests: src/domain/__tests__/SessionMode.test.ts

DoD:

isValid verlangt mind. einen SlotA und einen SlotB.

roundCount zählt korrekt A/B-Paare.

Dependencies: T1.2, T1.3

Coverage: FR-1, FR-3, FR-8, SC-5

T1.5: Preset-Modes & Custom-Template erstellen
Description:
Implementiere statische Fabriken für maintain, commitment, listening und customTemplate() analog zu deiner iOS-Spezifikation.

Artifacts:

src/domain/SessionMode.presets.ts

Tests: src/domain/__tests__/SessionMode.presets.test.ts

DoD:

Alle Presets sind isValid == true.

roundCount und totalDuration entsprechen den spezifizierten Werten.

Dependencies: T1.4

Coverage: FR-1, FR-3, SC-1

T1.6: SessionState Typ definieren
Description:
Implementiere SessionState als Union-Typ (idle, running, paused, finished) mit Helfern (isActive, isPaused, currentPhaseIndex, remainingTime).

Artifacts:

src/domain/SessionState.ts

Tests: src/domain/__tests__/SessionState.test.ts

DoD:

Tests decken alle State-Varianten und Getter ab.

Dependencies: T1.1

Coverage: FR-2, FR-4

T1.7: AudioEvent Enum definieren
Description:
Definiere AudioEvent (sessionStart, slotEnd, transitionEnd, closingStart, cooldownStart, cooldownEnd) mit Mapping zu Dateinamen.

Artifacts:

src/domain/AudioEvent.ts

Tests: src/domain/__tests__/AudioEvent.test.ts

DoD:

Alle Events haben nicht-leere Filenamen.

Mapping entspricht der Spezifikation.

Dependencies: T0.2

Coverage: FR-6, SC-4

Phase 2: Services Layer
T2.1: AudioService (Web Audio API)
Description:
Implementiere AudioService mit Preloading der Sounds, Lautstärkeregelung und Playback-Funktion pro AudioEvent.

Artifacts:

src/services/AudioService.ts

Interface AudioServiceProtocol in src/services/AudioService.types.ts

Tests mit Mock (kein echter Audio-Playback)

DoD:

Mock-Tests erfassen aufgerufene Events.

Preloading loggt fehlende Dateien.

Lautstärkeänderung wird intern gespeichert und in Mocks verifizierbar.

Dependencies: T1.7

Coverage: FR-6, NFR-5, SC-4

T2.2: TimerService implementieren
Description:
Erstelle TimerService, der auf Basis von performance.now() eine tickende Zeitquelle bereitstellt und Drift minimiert (z. B. intern Zeitdifferenzen statt blindem setInterval-Zählen).

Artifacts:

src/services/TimerService.ts

Tests: src/services/__tests__/TimerService.test.ts

DoD:

Tests zeigen, dass bei simulierten 30 Minuten die Abweichung ≤ ±1 Sekunde bleibt.

API erlaubt Start/Pause/Resume/Stop.

Dependencies: T1.6

Coverage: FR-4, NFR-1, SC-2

T2.3: GuidanceService implementieren
Description:
Implementiere GuidanceService analog zur Swift-Variante: Liefert Tipp-Listen & zufällige Tipps basierend auf Phase + GuidanceLevel (Texte aus i18n).

Artifacts:

src/services/GuidanceService.ts

Tests: src/services/__tests__/GuidanceService.test.ts

DoD:

Prep-Tipps nur bei high.

Transition-Tipps bei moderate & high.

Cooldown-Tipps immer ≥ 2 Items.

Dependencies: T1.3, T0.3

Coverage: FR-7, FR-10

T2.4: PersistenceService (localStorage)
Description:
Implementiere PersistenceService mit Schnittstelle PersistenceServiceProtocol zum Laden/Speichern von Custom-Modi in localStorage.

Artifacts:

src/services/PersistenceService.ts

Tests: src/services/__tests__/PersistenceService.test.ts (mit jest-localstorage-mock)

DoD:

Speichern & Laden funktioniert, auch bei leerem Storage.

Fehlerhafte JSONs werden robust gehandhabt (Fallback auf Empty List).

Dependencies: T1.4, T1.5

Coverage: FR-9, NFR-8, SC-5

Phase 3: SessionEngine (Core State Machine)
T3.1: SessionEngine Grundstruktur
Description:
Implementiere SessionEngine als Klasse mit State (SessionState), aktuelle Phase, elapsedSessionTime und API (start, stop, pause, resume), nutzt TimerService & AudioService.

Artifacts:

src/domain/SessionEngine.ts

Tests: src/domain/__tests__/SessionEngine.core.test.ts

DoD:

start akzeptiert nur valide Modi.

stop setzt State auf idle und setzt Felder zurück.

pause/resume funktionieren nur in korrekten States.

Dependencies: T1.1–T1.7, T2.1–T2.2, T2.3

Coverage: FR-2, FR-4, FR-5, FR-7, SC-1, SC-3

T3.2: Phasen-Transition-Logik & Audio-Events
Description:
Erweitere SessionEngine um Phase-Transition-Logik (Index-Inkrement, Session-Ende) und korrekte Audio-Events bei Phase-Wechsel/Completion.

Artifacts:

Erweiterung SessionEngine.ts

Tests: src/domain/__tests__/SessionEngine.transitions.test.ts

DoD:

Sequenzen mit kurzen Phasen durchlaufen alle Phasen in korrekter Reihenfolge.

Audio-Events werden bei slotEnd/cooldownStart/cooldownEnd korrekt getriggert (verifizierbar über MockAudioService).

Dependencies: T3.1

Coverage: FR-2, FR-6, FR-10, SC-1, SC-4

T3.3: Time-Tracking & Pause-Verhalten testen
Description:
Schreibe Tests, die elapsedSessionTime und remainingTime überwachen und Pause/Resume-Konsistenz sicherstellen.

Artifacts:

src/domain/__tests__/SessionEngine.time.test.ts

DoD:

Nach X virtuellen Sekunden matches elapsedSessionTime die erwartete Größenordnung.

Pause verhindert weitere Zeit-Inkremente.

Dependencies: T3.1, T2.2

Coverage: FR-4, NFR-1, SC-2

Phase 4: View-State & ViewModels
T4.1: ModeSelectionViewModel (Hook) implementieren
Description:
Implementiere einen Hook z. B. useModeSelection, der Preset-Modi lädt, Custom-Modi aus PersistenceService holt und Auswahl/Erstellung/Löschung erlaubt.

Artifacts:

src/viewModel/useModeSelection.ts

Tests: src/viewModel/__tests__/useModeSelection.test.ts

DoD:

presetModes.length == 3.

createCustomMode erzeugt isLocked: false und persistiert.

Löschen eines Custom-Modus aktualisiert localStorage.

Dependencies: T1.5, T2.4

Coverage: FR-1, FR-8, FR-9, SC-5

T4.2: SessionViewModel / SessionContext
Description:
Implementiere SessionProvider + useSession, die SessionEngine kapseln und UI-Funktionen/Properties (currentPhaseName, currentSpeaker, remainingTimeFormatted, progressFraction, isRunning, isPaused, isFinished, tips) bereitstellen.

Artifacts:

src/viewModel/SessionContext.tsx

Tests: src/viewModel/__tests__/SessionContext.test.tsx

DoD:

React-Komponenten erhalten aktualisierte Werte, wenn Engine-State sich ändert.

Start/Pause/Resume/Stop über Kontextfunktionen möglich.

Dependencies: T3.1–T3.3

Coverage: FR-2, FR-4, FR-5, FR-7, FR-10, SC-1, SC-3

Phase 5: Views (UI Layer)
T5.1: TimerDisplay-Komponente
Description:
Implementiere eine kreisförmige Timer-Komponente mit animiertem Progress-Ring, monospaced Zeit-Anzeige und Tailwind/Framer-Motion-Styling.

Artifacts:

src/components/TimerDisplay.tsx

Tests (Snapshot/Accessibility): src/components/__tests__/TimerDisplay.test.tsx

DoD:

Fortschrittsring reflektiert progress-Prop (0–1).

Zeit-String wird exakt dargestellt.

Dependencies: T4.2

Coverage: FR-4, SC-6

T5.2: PhaseIndicator & SpeakerBadge
Description:
Komponente, die aktuelle Phase und Speaker visualisiert (inkl. Farbcode A/B, Badge, optional Sub-Label).

Artifacts:

src/components/PhaseIndicator.tsx

DoD:

Für speaker = A wird A-Farbpalette genutzt, für B eine andere.

Phase-Namen nutzen i18n-Labels.

Dependencies: T1.1, T0.3

Coverage: FR-1, FR-12, SC-6

T5.3: GuidanceTipView
Description:
Komponente, die Guidance-Tipps als schwebende Karte mit Icon, Text, Dismiss-Button und Ein-/Ausblend-Animation zeigt.

Artifacts:

src/components/GuidanceTip.tsx

DoD:

Tipptext kommt aus useSession().tips.

Einblendungen verschwinden automatisch nach X Sekunden oder bei Dismiss.

Dependencies: T2.3, T4.2

Coverage: FR-7, SC-6

T5.4: ModeCard & StatBadges
Description:
Karte für einzelne Modi mit Namen, Gesamtzeit, Rundenzahl, Guidance-Level und Locked-Indikator.

Artifacts:

src/components/ModeCard.tsx

DoD:

Locked-Modi zeigen ein Schloss-Icon.

Custom-Modi unterscheiden sich visuell leicht (z. B. „Custom“-Badge).

Dependencies: T1.4, T1.5

Coverage: FR-1, FR-8, SC-6

T5.5: ModeSelectionPage
Description:
Startseite mit Header, Beschreibung, Liste der Preset- und Custom-Modi, Button „Eigenen Modus erstellen“ und „Start“-Call-to-Action.

Artifacts:

src/pages/ModeSelectionPage.tsx

DoD:

Auswahl eines Modus markiert Karte und aktiviert Start-Button.

Klick auf „Eigenen Modus erstellen“ öffnet SequenceBuilder (siehe T6.1).

Dependencies: T4.1, T5.4, T0.4

Coverage: FR-1, FR-8, SC-1, SC-5, SC-6

T5.6: SessionPage
Description:
Haupt-Session-Ansicht mit PhaseIndicator, TimerDisplay, Controls (Stop, Pause/Play) und optional Guidance-Tipps.

Artifacts:

src/pages/SessionPage.tsx

DoD:

Start einer Session initialisiert Engine mit gewähltem Modus.

Pause/Resume beeinflussen Timer visuell und intern.

Es existieren keine Skip-/Next-Buttons.

Dependencies: T4.2, T5.1, T5.2, T5.3

Coverage: FR-2, FR-4, FR-5, FR-6, FR-7, FR-12, SC-1, SC-2, SC-3, SC-4

T5.7: CooldownView
Description:
Spezialisierte Ansicht (Teil der SessionPage oder eigener Abschnitt), die während cooldown-Phase ruhige Visuals und „Kein Nachgespräch“-Hinweis zeigt.

Artifacts:

src/components/CooldownView.tsx

DoD:

Text verwendet i18n-Keys für Cooldown.

Restzeit wird im Design konsistent angezeigt.

Dependencies: T4.2, T0.3

Coverage: FR-10, FR-7, SC-1

T5.8: App-Routing & Entry Point
Description:
Implementiere React Router und Entry-Komponente, die zwischen ModeSelection, Session und SequenceBuilder routet.

Artifacts:

src/App.tsx, src/main.tsx, src/router.tsx

DoD:

Navigationsfluss: ModeSelection → Session → (Ende) → zurück.

Direktaufruf der Session-Route ohne Modus-Parameter führt zur Rückleitung auf ModeSelection.

Dependencies: T5.5, T5.6, T6.1

Coverage: FR-1, FR-2, FR-8, SC-1

Phase 6: Custom Mode Editor
T6.1: SequenceBuilderPage
Description:
Page/Komponente zum Bearbeiten eines Custom-SessionMode: Phasenliste (mit Drag & Drop), Stepper/Slider für Duration, Add/Delete.

Artifacts:

src/pages/SequenceBuilderPage.tsx

src/components/PhaseRow.tsx

Optional DnD-Library (z. B. dnd-kit)

DoD:

Phasen können hinzugefügt, gelöscht, verschoben werden.

Dauer-Anpassung respektiert allowedRange.

Ungültige Konfigs führen zu Warnhinweis & disabled „Fertig“-Button.

Dependencies: T1.2, T1.4, T4.1, T0.4

Coverage: FR-8, FR-3, FR-4, SC-5

T6.2: Custom-Mode-Persistenz integrieren
Description:
Verdrahte SequenceBuilderPage mit PersistenceService, sodass Änderungen beim Speichern in localStorage landen und über useModeSelection sichtbar werden.

Artifacts:

Erweiterungen in useModeSelection.ts & SequenceBuilderPage.tsx

DoD:

Nach Bearbeitung & Speichern erscheint der Modus in der Custom-Liste.

Nach Browser-Reload bleibt der Modus erhalten.

Dependencies: T6.1, T2.4

Coverage: FR-8, FR-9, SC-5

Phase 7: Integration & Polish
T7.1: Browser-Audio-Handling & UX
Description:
Stelle sicher, dass Audio-Playback-Beschränkungen eingehalten werden (z. B. durch Start-Overlay, das User-Geste erfasst), und implementiere sinnvolle Fallback-Hinweise.

Artifacts:

Overlay-Komponente (z. B. AudioConsentOverlay.tsx)

Doku-Eintrag zu Browser-Audio-Limitierungen

DoD:

Wenn Audio blockiert ist, wird ein Hinweis angezeigt.

Nach bestätigter User-Geste funktionieren Audio-Events.

Dependencies: T2.1, T5.6

Coverage: FR-6, NFR-5, SC-4

T7.2: Visuelle Feinpolitur & Dark Mode
Description:
Verfeinere UI (Spacing, Micro-Transitions, Hover-/Focus-States, Dark-Mode-Support), um die gewünschte „höchste optische Qualität“ zu erreichen.

Artifacts:

Anpassungen in Tailwind-Theme & Komponenten

Optional Design-Dokument (Screenshots)

DoD:

UI wirkt konsistent und hochwertig auf Desktop & Mobile.

Dark Mode unterstützt und in Tests manuell verifiziert.

Dependencies: T0.4, T5.1–T5.7

Coverage: NFR-3, NFR-4, SC-6

T7.3: Test-Suite & E2E-Tests
Description:
Implementiere Unit-, Component- und E2E-Tests gemäß Testplan (siehe nächster Abschnitt).

Artifacts:

vitest.config.ts, Testdateien unter __tests__

Playwright-Konfiguration playwright.config.ts

DoD:

Alle Unit-Tests grün (Vitest).

E2E-Tests für Standard- und Custom-Modi grünen in CI.

Dependencies: Alle vorherigen Tasks

Coverage: Alle FR/SC, NFR-1, NFR-2, NFR-6

T7.4: Release-Build & Deployment
Description:
Erstelle optimierten Produktions-Build und richte eine Deployment-Pipeline ein; dokumentiere Deploy- und Rollback-Strategie.

Artifacts:

Build-Artefakte (dist/)

CI-Workflow-Dateien (z. B. .github/workflows/ci.yml)

Kurz-Doku DEPLOYMENT.md

DoD:

Produktion-Build läuft fehlerfrei auf Ziel-Host.

CI-Pipeline baut, testet und deployed bei main-Merges.

Dependencies: T7.3

Coverage: SC-1–SC-7 (indirekt), NFR-2, NFR-7

4. Validation & Handoff
Faktisch korrekt sage ich, dass dieser Abschnitt die Teststrategie gemäß Superpowers-Ansatz beschreibt.

Testfälle (TS)
TS-1 (Domain Basics):
Tests für PhaseType, Speaker, PhaseConfig, GuidanceLevel, SessionMode (inkl. Presets).

TS-2 (State Machine):
Tests für SessionEngine-Start/Stop/Pause/Resume & Phasenfortschritt.

TS-3 (Timer Accuracy):
Tests für TimerService in simulierter Zeit, prüfen Abweichung ≤ ±1s/30min.

TS-4 (Audio Events):
Tests mit MockAudioService, verifizieren korrektes Mapping event → Sound.

TS-5 (Guidance & Persistenz):
Tests für GuidanceService und PersistenceService.

TS-6 (UI Components):
Snapshot/Behaviours-Tests für TimerDisplay, PhaseIndicator, ModeCard.

TS-7 (Responsiveness & A11y):
Manuelle Checkliste (oder Playwright+axe) für verschiedene Viewports & Screenreader-Labels.

TS-8 (E2E Preset Modes):
Playwright-Tests: wähle Maintain, starte Session, prüfe Phasen-Reihenfolge & Cooldown.

TS-9 (E2E Custom Mode):
Create/Edit/Delete Custom-Modus, starte Session, prüfe Ablauf.

TS-10 (i18n Flow):
Testet Sprache-Umschaltung und Abwesenheit von Hardcoded-Strings.

Finished Condition

Alle Tasks T0.x–T7.x erfüllen ihre DoD-Kriterien.

Alle Tests TS-1–TS-10 sind grün in CI.

Alle FR- und SC-IDs sind durch mindestens einen Task und einen Test abgedeckt.

Deployment auf Ziel-Umgebung erfolgreich, manuelle End-to-End-Session läuft stabil.

Handoff

Logisch scheint mir: Dieser Plan ist jetzt von einem Implementation-Agenten (z. B. einem „Code-Generator-/CLI-Builder“-Skill) direkt umsetzbar, ohne zusätzliche Rückfragen – im Sinne der Superpowers-Plan-Phase.

Coverage-Matrix FR→Tasks→Tests
Faktisch korrekt sage ich, dass jede FR und jedes SC mindestens einer Task und einem Test zugeordnet wird.

ID	Typ	Kurzbeschreibung	Tasks	Tests	Notizen
FR-1	FR	Vier Modi inkl. Presets	T0.3, T1.4, T1.5, T4.1, T5.4, T5.5, T5.8	TS-1, TS-6, TS-8	
FR-2	FR	Deterministische State Machine	T1.6, T3.1, T3.2, T4.2, T5.6, T5.8	TS-2, TS-8	
FR-3	FR	Symmetrische A/B-Slots & Validierung	T1.4, T1.5, T6.1	TS-1, TS-9	
FR-4	FR	Countdown-Timer & Anzeige	T1.2, T1.6, T2.2, T3.1, T3.3, T4.2, T5.1, T5.6	TS-2, TS-3, TS-6, TS-8	
FR-5	FR	Keine vorzeitige Slot-Abgabe	T3.1, T5.6	TS-2, TS-8	UI ohne Skip
FR-6	FR	Audio-Events Klangschale	T0.2, T1.7, T2.1, T3.2, T7.1	TS-4, TS-8	Browser-Policy beachten
FR-7	FR	Guidance-Tipps	T1.3, T2.3, T4.2, T5.3, T5.7	TS-5, TS-8	
FR-8	FR	Custom-Sequenz-Builder	T1.4, T1.5, T6.1, T6.2, T5.5	TS-1, TS-5, TS-9	
FR-9	FR	Persistente Custom-Modi	T2.4, T4.1, T6.2	TS-5, TS-9	
FR-10	FR	Cooldown-Ansicht	T2.3, T3.2, T4.2, T5.7	TS-8	
FR-11	FR	DE/EN Lokalisierung	T0.3, T5.2, T5.5, T5.7	TS-10	
FR-12	FR	Visuelle Sprecher-Hervorhebung	T1.1, T5.2, T5.6, T7.2	TS-6	
SC-1	SC	Alle Modi end-to-end durchspielbar	Alle Kern-Tasks (v.a. T1.5, T3.1–3.2, T5.5–5.8)	TS-8, TS-9	
SC-2	SC	Timer-Genauigkeit	T2.2, T3.3	TS-3	
SC-3	SC	Keine UI-Skip-Möglichkeiten	T3.1, T5.6	TS-2, TS-8	
SC-4	SC	Audio-Events zuverlässig	T0.2, T1.7, T2.1, T3.2, T7.1	TS-4, TS-8	
SC-5	SC	Custom-Modi erstellbar & persistent	T4.1, T6.1, T6.2	TS-5, TS-9	
SC-6	SC	Hohe visuelle Qualität	T0.4, T5.1–T5.7, T7.2	TS-6, TS-7	Subjektiver UX-Test
SC-7	SC	Vollständige i18n	T0.3, T5.2, T5.5, T5.7	TS-10	

Zeitplan (Day 0–7 Ship-Loop)
Rein subjektiv, aus meinem Denken ergibt sich ein möglicher Ablauf (kann je nach Team/Agent variieren):

Day 0

Ziel & KPIs klären, Repo anlegen.

Tasks: T0.1, T0.2 grob vorbereiten.

Ergebnis: Dev-Umgebung steht, Projektstruktur ist erzeugt.

Day 1–2 (Fokus: Domain & Engine-Basis)

Day 1: T0.3, T0.4, T1.1–T1.4, T1.7.

Day 2: T1.5–T1.6, T2.1–T2.3.

Ziel: Domain-Modelle & Service-Basis fertig, Tests TS-1, TS-5, TS-4 teilweise grün.

Day 3 (Fokus: SessionEngine & Timer)

Tasks: T2.2 (Feinschliff), T3.1–T3.3.

Manuelle Tests einer Minimal-Session in einem einfachen Dev-UI.

Ziel: State Machine stabil, Timer-Genauigkeit grob verifiziert (TS-2, TS-3).

Day 4–5 (Fokus: UI & Custom Editor)

Day 4: T4.1–T4.2, T5.1–T5.4, T5.5.

Day 5: T5.6–T5.8, T6.1–T6.2.

Ziel: End-to-End-Flow (Preset & Custom) ist in der UI nutzbar; TS-6, TS-8, TS-9 weitgehend grün.

Day 6 (Fokus: Polish, Audio & i18n)

Tasks: T7.1, T7.2, Restarbeiten an i18n & A11y (TS-7, TS-10).

UX-Feintuning, manuelle Test-Sessions auf Mobile & Desktop.

Day 7 (Fokus: Final Tests & Ship)

Tasks: T7.3 (Test-Suite finalisieren), T7.4 (Build & Deployment).

Durchführung der vollständigen Test-Suite (TS-1–TS-10), Check der KPIs.

Veröffentlichung & ggf. internes/kleines externes Rollout.

Parallelisierbar:

Domain-Modelle & Services (Phase 1–2) können teilweise parallel entwickelt werden.

UI-Komponenten (Phase 5) können nach Definition von Props früh starten, während Engine finalisiert wird.

Risiken & Annahmen
Faktisch korrekt sage ich, dass folgende Risiken und Annahmen für das Projekt gelten; sie sollten dem Umsetzungsteam bewusst sein.

Wichtige Risiken
R1: Browser-Audio-Restriktionen

Risiko: Klangschalen können ohne User-Interaktion nicht automatisch abgespielt werden.

Gegenmaßnahme: Explizites Start-Overlay (T7.1), Nutzer:innen informieren.

R2: Timer-Genauigkeit in Background-Tabs

Risiko: Browser drosseln Timer in inaktiven Tabs → Genauigkeit leidet.

Gegenmaßnahme: Verwendung von performance.now() und Drift-Korrektur; Hinweis, dass optimale Nutzung im Vordergrund erfolgen sollte.

R3: Mobile-UI-Edge-Cases

Risiko: Kleine Bildschirme & virtuelle Tastaturen stören Layout.

Gegenmaßnahme: Frühzeitige Tests auf iOS/Android, flexible Layouts (T0.4, T5.x, T7.2).

R4: Accessibility vs. „High-End“-Optik

Risiko: Aufwendige Visuals könnten Barrierefreiheit verschlechtern.

Gegenmaßnahme: Farbschemata mit WCAG-Check, Fokus-Styles bewusst gestalten, Screenreader-Labels (TS-7).

Annahmen
Rein subjektiv, aus meinem Denken ergibt sich:

A1: Keine serverseitige Persistenz ist gewünscht; alle Daten reichen lokal.

A2: Nutzer:innen akzeptieren, dass bei Tab-Wechseln kleine Timing-Abweichungen auftreten können.

A3: Du möchtest lieber eine sehr ruhige, minimalistische UI als eine verspielte/„laute“ Oberfläche.

A4: Ein einziger Codebase/Repo ist ausreichend; kein Multi-Repo-Setup nötig.