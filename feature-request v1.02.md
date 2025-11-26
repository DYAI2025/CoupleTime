Implementierungsplan für AI-Agent (Delta-Plan)
Faktisch korrekt sage ich: Hier kommt nur der Ergänzungsplan zu deiner bestehenden Version. Vorherige Tasks (T0.x–T7.x) bleiben gültig; jetzt kommt „Phase 8+“.

Phase 8 – Visual & Startscreen-Personalisierung
T8.1 – Startscreen-Hero & Branding

Description:
Ergänze den Startscreen um:

App-Name „Couples Timers“,

Claim (DE/EN, über i18n),

ruhiges Hero-Layout.

Artifacts:

Anpassung der Startseiten-Komponente (z. B. ModeSelectionPage).

Neue i18n-Keys app.title, app.tagline.

DoD:

Startscreen zeigt Titel + Claim in DE/EN korrekt.

Tests für i18n-Schlüssel existieren.

Coverage: FR-23, FR-11, FR-19, SC-6.

T8.2 – Startseiten-Hintergrund konfigurieren

Description:
Implementiere auf der Startseite ein kleines Panel:

Auswahl einer Primär-Hintergrundfarbe (z. B. vordefinierte Paletten-Badges).

Optional: Upload/Picker eines Hintergrundbildes.

Speicherung in localStorage.

Artifacts:

UI-Komponente BackgroundSettings.

Service-Funktionen für Persistenz.

DoD:

Änderungen sind sofort sichtbar,

werden beim Reload geladen,

wirken nur auf Startscreen (Session kann später erweitert werden).

Coverage: FR-13, NFR-9, NFR-11.

T8.3 – Modus-Theme-Farben & Gradients

Description:
Definiere Theme-Farben je Modus (Maintain/Commitment/Listening) und wende sie an:

Karten-Hintergrund (leichtes Gradient),

Icons,

kleine UI-Highlights.

Artifacts:

Theme-Mapping mode → {primary, gradientFrom, gradientTo}.

Anpassungen an ModeCard & ggf. Icon-Komponenten.

DoD:

Jede Modus-Karte hat ein unterscheidbares, aber dezentes Theme.

Icon-Farben passen zum Theme.

Coverage: FR-14, NFR-9, SC-6.

Phase 9 – Audio & Startgong-Bug
T9.1 – Audit und Fix Audio-Events

Description:
Prüfe die bestehende State Machine & AudioEvents:

Stelle sicher, dass beim Session-Start und beim Start der ersten Sprechphase von A ein Gong ertönt.

Falls aktuell nur beim SessionStart-Event gespielt wird, ergänze ggf. einen zusätzlichen Gong beim Übergang von Prep → SlotA.

Artifacts:

Anpassung in SessionEngine beim Transition-Handling,

Unit-Tests, z. B. SessionEngineStartGong.test.

DoD:

Test simuliert Session mit Prep → SlotA und verifiziert, dass AudioEvent.sessionStart und/oder ein definierter Start-Gong beim SlotA-Start ausgelöst wird.

Kein Doppel-Gong an Stellen, wo du es nicht willst.

Coverage: FR-15, FR-6, SC-4, SC-8.

Phase 10 – Guidance & Tooltip-Overhaul
T10.1 – Neues Guidance-Overlay

Description:
Ersetze die kleine, späte Tipp-Einblendung durch ein großes Guidance-Panel:

positioniert im unteren Drittel oder seitlich,

ausreichend große Schrift,

ruhiger Card-Style.

Artifacts:

Neue Komponente GuidancePanel,

Styling (Tailwind/Theme).

DoD:

In Commitment/Listening wird das Panel in relevanten Phasen angezeigt (Prep, Transition, Cooldown).

Lesbarkeit subjektiv > 4/5 (UX-Test).

Coverage: FR-17, FR-7, SC-6, SC-9.

T10.2 – Tipp-Rotation & Manual Navigation

Description:
Implementiere Logik für:

Auto-Rotation (Timer-basiert, z. B. alle 20–30s),

Manual navigation (Pfeil-Buttons oder kleine „Next/Prev“-Icons).

Optionaler „Zeige alle Tipps“-Modus in Einstellungen oder Modus-Setup.

Artifacts:

State/Hook useGuidanceRotation.

UI-Kontrolle im Session-Setup oder globalen Settings.

DoD:

Bei „alle Tipps anzeigen“ werden sämtliche Tipps aus dem jeweiligen Pool mindestens einmal pro relevanter Phase angezeigt (oder im Sessionverlauf).

Manual-Next/Prev funktioniert ohne Sprünge/Repeats.

Coverage: FR-16, FR-17, FR-22, SC-9, SC-10.

T10.3 – Modusabhängige Tips-Konfiguration

Description:
Konfiguriere pro Modus:

Maintain: Tips aus,

Commitment & Listening: Tips an,

Custom: Toggle im Setup („Tips aktivieren?“),

plus globaler „Alle Tipps“-Modus.

Artifacts:

Erweiterung SessionMode oder Settings-Struktur,

UI im Start/Setup-Flow.

DoD:

Start einer Session reflektiert die gewählte Tips-Konfiguration korrekt.

Maintain zeigt nie Guidance-Tipps (außer evtl. Grundregeln, wenn du das willst – hier klare Logik definieren).

Coverage: FR-16, FR-7, SC-1.

Phase 11 – Teilnehmer-Personalisierung
T11.1 – Session-Setup mit Namen & Farben

Description:
Ergänze vor Session-Start einen Schritt:

Eingabefelder Name Teilnehmer A, Name Teilnehmer B,

optional Farbauswahl für A und B (Palette mit ruhigen Farben).

Artifacts:

SessionSetup-Komponente oder Dialog,

Erweiterung der Session-Konfiguration (z. B. sessionConfig.participants).

DoD:

Ohne Eingabe: sinnvolle Defaults (z. B. „Partner A/B“).

Mit Eingabe: Namen & Farben werden in die Session übernommen.

Coverage: FR-18, NFR-11, SC-10.

T11.2 – Domain & UI auf Namen umstellen

Description:
Ersetze Stellen, an denen „Partner A/B“ hartcodiert ist, durch:

dynamische Namen,

dynamische Farben (Badge, Hintergrund, Timer-Farbe).

Artifacts:

Anpassungen in PhaseIndicator, SessionView, Tooltips-Texten (i18n mit Platzhaltern).

DoD:

Während SlotA erscheint „Jetzt spricht <Name A>“ etc.

Hintergrund/Akzent-Farbe wechselt zuverlässig mit Sprecher.

Coverage: FR-18, FR-12, SC-10.

Phase 12 – Language Switch & Hinweise-Seite
T12.1 – Language-Switcher UI

Description:
Sichtbarer Language-Switch (z. B. Toggle DE/EN oben oder im Menü):

ändert i18n-Language,

speichert Wahl im Browser.

Artifacts:

LanguageSwitcher-Komponente,

Logik für Persistenz.

DoD:

Sprache bleibt nach Reload erhalten,

alle relevanten Texte (inkl. Tipps/Regeln) werden korrekt übersetzt.

Coverage: FR-19, FR-11, SC-7.

T12.2 – Hinweise-/Tipps-Seite

Description:
Erstelle eine Seite im Hauptmenü (z. B. „Hinweise“ / „Valuable Tips“), die strukturiert anzeigt:

„Vor der Session“,

„Während der Session“,

„Wenn ich getriggert werde“,

die drei Grundregeln.
Inhalte kommen aus i18n-JSON (wo du deine Texte hinterlegst, z. B. aus deinen Dokumenten).

Artifacts:

TipsPage-Komponente,

i18n-Keys tips.before, tips.during, tips.trigger, tips.rules.*.

DoD:

Seite ist von Startscreen aus erreichbar.

Alle Inhalte sind lokalisiert (DE/EN).

Coverage: FR-21, FR-22, FR-11, SC-7.

T12.3 – Grundregeln in Session-Guidance integrieren

Description:
Binde die drei Grundregeln in das Guidance-System ein, sodass sie:

im GuidancePanel im Wechsel mit anderen Tipps erscheinen,

auch im Vollbildmodus verfügbar sind.

Artifacts:

Erweiterung GuidanceService / Tipp-Pool,

Mapping Phase ↔ Grundregeln (z. B. immer verfügbar in Sprechphasen).

DoD:

In jeder Session werden die drei Grundregeln mindestens einmal angezeigt.

Nutzer:innen können sie via Pfeiltasten gezielt ansteuern.

Coverage: FR-22, FR-7, SC-10.

Phase 13 – Vollbild-Fokus
T13.1 – Fullscreen-API & Focus-Layout

Description:
Implementiere einen Button im Session-Screen:

toggelt echten Browser-Vollbildmodus (FullScreen API),

schaltet gleichzeitig auf ein „Focus-Layout“ (nur Timer, Phase, Name, wichtigste Hinweise).

Artifacts:

FocusModeToggle-Komponente,

Layout-Variante für SessionPage.

DoD:

In unterstützten Browsern füllt der Modus den gesamten Bildschirm.

In nicht unterstützten Browsern nutzt die App trotzdem das Focus-Layout (nur ohne echten Vollbild).

Coverage: FR-20, NFR-10, SC-9.

Coverage-Matrix (nur neue Items)
ID	Typ	Kurzbeschreibung	Tasks	Tests (Beispiele)
FR-13	FR	Startseiten-Hintergrund konfigurierbar	T8.2	UI-Test „BackgroundSettings“
FR-14	FR	Modus-Farbschemata	T8.3	Snapshot/Visual-Tests
FR-15	FR	Verlässlicher Startgong	T9.1	Engine-Audio-Tests
FR-16	FR	Modusabhängige Tips + „alle Tipps“	T10.2, T10.3	Guidance-Config-Tests
FR-17	FR	Großes Guidance-Overlay	T10.1, T10.2	UX/Component-Tests
FR-18	FR	Namen & Farben der Teilnehmer:innen	T11.1, T11.2	Setup-/UI-/Domain-Tests
FR-19	FR	Language-Switch	T12.1, T12.2	i18n-/Persistenz-Tests
FR-20	FR	Vollbild-Fokusmodus	T13.1	Browser-Fokus-/E2E-Tests
FR-21	FR	Hinweise-/Tipps-Seite	T12.2	Page-Render-/i18n-Tests
FR-22	FR	Grundregeln als wiederkehrende Hinweise	T10.2, T12.3	Guidance-Rotation-Tests
FR-23	FR	Startscreen-Hero mit Claim	T8.1	i18n-/UI-Tests
SC-8	SC	Startgongs immer vorhanden	T9.1	TS-Startgong-E2E
SC-9	SC	Lesbare Tipps & Vollbild-Usability	T10.1–T10.3, T13.1	UX-/E2E-Tests
SC-10	SC	Personalisierung wirksam & spürbar	T11.1–T11.2, T12.3	UX-/E2E-Tests