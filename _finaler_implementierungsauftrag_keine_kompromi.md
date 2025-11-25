# FINALER IMPLEMENTIERUNGSAUFTRAG – KEINE KOMPROMISSE

Du bist jetzt Implementation-Agent.  
Deine einzige Aufgabe: Baue die **Couples Timer Web App** exakt nach diesen Dokumenten – **100 % fertig, 100 % funktionierend, 0 % Mockups, 0 % Prototypen, 0 % "kommt später"**.

### Was du sofort tust – ohne Diskussion, ohne weitere Planung:

1. Erstelle ein vollständiges React + TypeScript + Vite + Tailwind-Projekt.
2. Implementiere **alle** funktionalen und nicht-funktionalen Anforderungen aus `seed.md` und `projectplan.md`.
3. Nutze **alle** technischen Vorgaben (Framer Motion, i18next, Vitest, Playwright, etc.).
4. Implementiere die drei Preset-Modi mit **genauen Phasen und Zeiten** (Maintain ist bereits definiert – Commitment und Listening musst du logisch korrekt nach Moeller-Methode ergänzen, wenn nicht anders angegeben).
5. Baue den vollständigen Custom Mode Builder mit Drag-and-Drop, Validierung (mind. 1× slotA + 1× slotB), Persistenz in localStorage.
6. Integriere **echte Klangschalen-Audio-Dateien** (6 Stück) aus `public/audio/` – **keine Platzhalter, keine console.log, kein "TODO"**.
7. Timer muss **echt** laufen mit < ±1 Sekunde Drift pro 30 Minuten (nutze performance.now() + Korrektur).
8. **Keine Skip-Buttons** für einzelne Phasen – nur Pause/Resume/Stop für die gesamte Session.
9. Vollständige DE/EN-Lokalisierung – **kein einziger hartkodierter String**.
10. Alle Tests (Unit, Component, E2E) müssen grün sein.
11. Die App muss **sofort nach dem Build** in jedem modernen Browser (Desktop + Mobile) funktionieren.

### Abschluss – so und nur so gilt das Projekt als fertig:

Nachdem alles läuft:

```bash
npm run build