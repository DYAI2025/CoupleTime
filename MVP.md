## Topic: MVP-Architektur für Audio-Transkriptions- und Summary-Tool

Ich fasse deine Antworten als **MVP-Entscheidungsversion** zusammen. Zusätzlich habe ich intern gesucht: Zu **Vibe/Sonar** habe ich keine belastbaren Drive-Treffer gefunden. GitHub konnte ich nicht durchsuchen, weil aktuell kein Repository freigegeben ist. Es gibt aber relevante interne Anknüpfungspunkte zu lokaler Audioverarbeitung, Whisper/Vosk und monorepo-artiger Architektur.

## 1. Geklärte Produktentscheidung

Das Tool ist kein reines Skript, sondern eine **Application**.

**Ziel des MVP:**

Eine App, die eine Session startet, während der Timer läuft Audio aufnimmt, Sprecher trennt, transkribiert und anschließend eine universelle Zusammenfassung erzeugt.

Der Kern ist damit:

**Timer läuft → Aufnahme läuft → Sprechertrennung → Transkription → editierbares Transkript → Summary → Summary nach Korrektur erneut generieren.**

Das ist ein sinnvoller MVP-Schnitt, weil er eine vollständige End-to-End-Journey liefert. Das passt auch zu dem internen Story-Mapping-Material: Ein „Walking Skeleton“ soll die minimale, aber komplette End-to-End-Nutzungsstrecke liefern, nicht isolierte Einzel-Features.

Storymapping_with_agents

## 2. Privacy / Hosting Posture

Deine Privacy-Entscheidung lautet praktisch:

BereichEntscheidung

Audio/TranskripteWerden im Tool verarbeitet

HostingServer-hosted oder App mit Upload an angebundenen VPS

InfrastrukturHetzner und/oder Hostinger nutzbar

SpeicherungDauerhafte Speicherung von Rohtranskripten, korrigierten Versionen und generierten Folgeversionen

App-FormDesktop/Web-Application, später Swift-App möglich

MVP-AufnahmequelleMacBook-Mikrofon

Das ist eine **serverfähige, nicht strikt lokale Privacy-Posture**. Wichtig: Wenn Roh-Audio und Transkripte dauerhaft gespeichert werden, muss früh ein klares Datenmodell für Consent, Löschung, Export und Zugriff gebaut werden. Sonst wird der spätere Privacy-Aufwand größer als die eigentliche Transkriptionslogik.

## 3. Technische Zielarchitektur

### Monorepo

Du willst das Projekt als **Monorepo** bauen. Das passt zu vorhandenen internen Architekturmustern: Das OSAL-README beschreibt bereits ein full-stack MVP mit getrennten Packages für lokale Logik, Gateway/API und Demo-UI innerhalb einer Repository-Struktur.

README

Vorschlag für dieses Projekt:

`/apps
  /desktop-or-web-app
  /api
/packages
  /audio-capture
  /transcription
  /diarization
  /summary-engine
  /shared-types
  /storage
/infra
  /docker
  /deploy
/docs
  /architecture
  /mvp-scope`

### Backend

Minimal ausreichend:

API für Session-Start/Stop

Upload/Streaming von Audio-Chunks

Job-Queue für Transkription

Speicherung von Audio, Transkript, Korrekturen, Summary-Versionen

Summary-Generierung nach Transkriptänderung

### Frontend

MVP-UI:

Start/Stop-Timer

Aufnahmezustand sichtbar

Session-Liste

Transkriptansicht

Sprecherlabel A/B/…

manuelles Turn-Splitting

Textbearbeitung

Button: „Summary neu generieren“

## 4. Transkription und Speaker Diarization

Du nennst **Sonar** als mögliche Engine aus dem Vibe-Repo. Dazu konnte ich in Drive keine eindeutige Quelle finden; GitHub ist ohne Repo-Auswahl nicht durchsuchbar. Daher bleibt Sonar aktuell **ungeprüft**.

Fallback-Entscheidung:

KomponentePriorität

SonarVerwenden, falls im Vibe-Repo vorhanden und Deutsch/Englisch + Diarization tragfähig

Whisper mediumSolider Fallback für DE/EN Auto-Detect

Whisper.cpp / VoskInterne ältere Architekturüberlegungen nennen beide als lokale Speech-to-Text-Optionen

lokale_llm_agent

Speaker DiarizationSeparat behandeln, nicht als garantiertes Whisper-Feature annehmen

Wichtig: **Whisper allein löst Sprechertrennung nicht sauber.** Für das MVP sollte Speaker Diarization als eigene Pipeline-Stufe betrachtet werden:

`Audio → Segmentierung → Diarization → Transkription → Speaker-aligned Transcript → Edit → Summary`

## 5. MVP-Scope — präzise geschnitten

### Muss im MVP enthalten sein

**Session starten**

Timer läuft.

Aufnahme läuft.

Audio wird gespeichert.

**Sprechertrennung**

Mindestens Sprecher A/B.

Weitere Sprecher optional, aber Datenmodell sollte N Sprecher können.

**Transkription**

Deutsch und Englisch.

Auto-Detect.

Transkription kann während oder nach der Session laufen.

**Transkript-Review**

Sprecher pro Turn sichtbar.

Sprecherlabel editierbar.

Turn-Splitting möglich.

Text editierbar.

**Summary**

Universeller Prompt reicht.

Summary kann nach Korrektur neu generiert werden.

**Persistenz**

Rohaufnahme.

Rohtranskript.

korrigiertes Transkript.

Summary-Versionen.

spätere Versionen/Derivate.

### Nicht im MVP

Swift-App

verschiedene Gesprächstypen

mehrere Summary-Arten

komplexe Prompt-Bibliothek

Mobile-Aufnahme

kollaborative Bearbeitung

Mandantenfähigkeit, sofern nicht zwingend für den ersten Betrieb

## 6. Offene technische Risiken

RisikoWarum kritischEntscheidung / Test

Sonar-Fähigkeiten unklarUnklar, ob DE/EN und Diarization passenRepo prüfen

Diarization-QualitätSprechertrennung ist oft fehleranfälliger als TranskriptionFrüher Spike mit echten Audios

Streaming vs. BatchRealtime erhöht KomplexitätMVP darf nach Session transkribieren

DatenschutzDauerhafte Speicherung sensibler GesprächeLösch-/Export-/Zugriffskonzept direkt mitbauen

Audioqualität MacBookRaumhall, Distanz, mehrere PersonenTest mit 3–5 realistischen Sessions

Summary nach EditVersionierung nötigSummary an Transkript-Version koppeln

## 7. Empfohlener erster Bauplan

### Sprint 0: Architektur-Check

Vibe/Sonar-Repo prüfen.

Entscheiden: Sonar verwenden oder Whisper-Pipeline.

Datenmodell für Session, AudioAsset, TranscriptVersion, SummaryVersion definieren.

Docker-/VPS-Ziel festlegen: Hetzner oder Hostinger.

### Sprint 1: Walking Skeleton

App startet Session.

Timer läuft.

Aufnahme über MacBook-Mikrofon.

Audio wird gespeichert.

Session erscheint in Liste.

### Sprint 2: Transkriptionspipeline

Audio wird nach Session transkribiert.

Sprache DE/EN Auto-Detect.

Ergebnis wird als Turns gespeichert.

Sprecher zunächst A/B, auch wenn noch unperfekt.

### Sprint 3: Review-UI

Transkript anzeigen.

Sprecher ändern.

Text editieren.

Turn splitten.

### Sprint 4: Summary

Universeller Summary-Prompt.

Summary-Version speichern.

Nach Transkriptkorrektur neu generieren.

## 8. Konkrete Spezifikation als nächster Arbeitsstand

Markdown

`# MVP: Gesprächsaufnahme, Transkription und Summary

## Ziel
Eine Application, die Gespräche über das MacBook-Mikrofon aufnimmt, Sprecher trennt, transkribiert, editierbar macht und daraus eine Zusammenfassung generiert.

## Kern-Flow
1. Nutzer startet Session.
2. Timer läuft.
3. Audioaufnahme läuft.
4. Nutzer stoppt Session.
5. Audio wird gespeichert.
6. Transkription und Sprechertrennung laufen im Hintergrund oder nachgelagert.
7. Nutzer prüft Transkript.
8. Nutzer korrigiert Sprecher, Turns und Text.
9. Nutzer generiert Summary.
10. Nach Korrekturen kann Summary neu generiert werden.

## MVP-Anforderungen
- MacBook-Mikrofon als Audioquelle.
- Deutsch und Englisch.
- Auto-Detect der Sprache.
- Sprechertrennung A/B, erweiterbar auf N Sprecher.
- Editierbares Transkript.
- Turn-Splitting.
- Universeller Summary-Prompt.
- Versionierte Speicherung von Rohtranskript, korrigiertem Transkript und Summary.
- Server-hosted oder App mit Upload an VPS.
- Deployment auf Hetzner oder Hostinger möglich.
- Monorepo-Struktur.

## Nicht-MVP
- Swift-App.
- Mobile Recording.
- Gesprächstyp-spezifische Summary-Prompts.
- Mehrbenutzer-Kollaboration.`

## 9. Kritische Korrektur meinerseits

Der kleinste MVP ist **nicht** „Realtime-Transkription“. Der kleinste belastbare MVP ist:

**Realtime-Aufnahme + Timer + gespeicherte Session + nachgelagerte Transkription + Sprechertrennung + Review + Summary.**

Realtime-Transkription während der Aufnahme ist ein Optimierungsfeature. Wenn es zu früh eingebaut wird, steigt die technische Komplexität unnötig.
