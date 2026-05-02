CoupleTimer bleibt **Geschaechtsstrukturierungs- und Timing-System**.

Der Transkriptionsdienst wird als **Backend-Service** ergaenzt und muss im MVP nicht live transkribieren, aber **Audio aufnehmen, Sprechertrennung durchfuehren, Sprecherzuordnung verbessern und spaeter Transkript + Zusammenfassung erzeugen**.

## Korrigierte MVP-Definition

FeatureMVP?Begruendung

Strukturierte Timer-PhasenJa, bereits vorhandenGrundlage fuer Primaerzuordnung der Sprecher

Audioaufnahme pro SessionJaOhne Aufnahme keine spaetere Transkription

Aufnahme pro Phase/SegmentJaErleichtert Sprecherzuordnung und Kontextrekonstruktion

Backend-basierte SprechertrennungJaWichtig wegen Zwischenfragen, Unterbrechungen und Dialogen im falschen Zeitfenster

Zeitbasierte Sprecherzuordnung A/BJaPrimaerer Speaker-Prior aus CoupleTimer

Diarization-Korrektur der SprecherzuordnungJaMuss Zeitlogik gegen echte Audiosprecher pruefen

Nachgelagerte TranskriptionJaMuss nicht live sein

Semantische ZusammenfassungJaKernnutzen nach dem Gespraech

Markdown ExportJaEinfachster strukturierter Output

TXT ExportJaEinfacher Basisexport

PDF ExportOptional MVP+Sinnvoll, aber technisch nachgelagert

Live-TranskriptionNeinSpaeteres Feature

Live-Speaker-DiarizationNeinSpaeteres Feature

Lokales LLMOptional MVP+Konfigurierbar vorsehen, aber nicht zwingend MVP

OpenRouter/OpenAI-kompatible APIJaWichtig fuer Modellunabhaengigkeit

## Revidierte Zielarchitektur

`[CoupleTimer Frontend]
  - strukturierte Gespraechsphasen
  - Sprecher A/B
  - Timer-Events
  - Session-Metadaten
  - Aufnahme-Start/Stop
  - Review von Transcript/Summary

        |
        v

[VibeMind Backend Service]
  - Audio Upload
  - Segmentverwaltung
  - Speaker Diarization
  - Zuordnung: Timer-Speaker + Diarization
  - Batch Transcription
  - Transcript Assembly
  - Semantic Summary
  - Export: Markdown, TXT, spaeter PDF

        |
        +--> [Transcription Engine]
        |      - Vibe/Sona
        |      - Whisper / whisper.cpp
        |      - optional faster-whisper
        |
        +--> [Diarization Engine]
        |      - pyannote.audio
        |      - speaker embedding / clustering
        |      - optional Vibe/Sona diarization, falls ausreichend
        |
        +--> [LLM Provider Layer]
               - OpenRouter
               - OpenAI-compatible API
               - Ollama/local
               - custom base URL`

## Wichtigste Anpassung: Speaker-Zuordnung nicht nur aus Timer ableiten

Die Timer-Phasen sind ein **starker Prior**, aber keine Wahrheit.

Deshalb sollte das Backend zwei Informationsquellen kombinieren:

**Geplante Sprecherzeit aus CoupleTimer**

Phase `slotA` -> wahrscheinlich Sprecher A

Phase `slotB` -> wahrscheinlich Sprecher B

`closingA` -> wahrscheinlich Sprecher A

`closingB` -> wahrscheinlich Sprecher B

**Akustische Sprechertrennung aus dem Audio**

Wer spricht tatsaechlich in welchem Zeitbereich?

Gibt es kurze Einwuerfe?

Gibt es Ueberlappungen?

Gibt es Dialog innerhalb eines eigentlich monologischen Slots?

Das Ergebnis sollte kein simples "Phase = Sprecher" sein, sondern ein gemischtes Modell:

`final_speaker =
  diarization_speaker,
  gemappt auf CoupleTimer speaker A/B,
  gewichtet durch Timer-Zeitfenster,
  korrigiert bei klarer akustischer Abweichung`

## Empfohlenes MVP-Datenmodell

TypeScript

`type TimerSpeaker = "A" | "B" | "unknown";

type AudioSegment = {
  id: string;
  sessionId: string;
  phaseId: string;
  phaseType: "slotA" | "slotB" | "closingA" | "closingB" | "transition" | "freeDialog";
  expectedSpeaker: TimerSpeaker;
  startedAtMs: number;
  endedAtMs: number;
  audioUri: string;
};

type DiarizationTurn = {
  id: string;
  sessionId: string;
  startMs: number;
  endMs: number;
  diarizedSpeakerId: string; // e.g. SPEAKER_00
  confidence?: number;
};

type SpeakerMapping = {
  diarizedSpeakerId: string;
  coupleTimerSpeaker: "A" | "B";
  confidence: number;
  evidence: {
    overlapWithSlotA_ms: number;
    overlapWithSlotB_ms: number;
    manualCorrection?: boolean;
  };
};

type TranscriptTurn = {
  id: string;
  sessionId: string;
  startMs: number;
  endMs: number;
  speaker: "A" | "B" | "unknown";
  speakerName?: string;
  text: string;
  confidence?: number;
  source: "timer" | "diarization" | "manual";
};`

## MVP-Pipeline

`1. CoupleTimer startet Session
2. Backend erzeugt sessionId

3. CoupleTimer zeichnet Audio auf
   - entweder eine durchgehende Session-Datei
   - oder mehrere Phasen-Segmente
   - Empfehlung: beides logisch unterstuetzen, MVP technisch mit durchgehender Datei + Phase-Metadaten

4. CoupleTimer sendet:
   - Audio
   - Phase timeline
   - Sprecher A/B Namen
   - Start/Stop/Pause Events

5. Backend fuehrt Speaker Diarization aus
   - erkennt SPEAKER_00, SPEAKER_01, ggf. weitere Stimmen

6. Backend mappt Diarization-Speaker auf A/B
   - anhand Ueberschneidung mit CoupleTimer-Zeitfenstern
   - z.B. SPEAKER_00 spricht zu 82% in slotA -> A

7. Backend fuehrt Batch-Transkription aus
   - Whisper/Vibe/Sona
   - mit Zeitstempeln

8. Backend merged:
   - Transcript timestamps
   - Diarization turns
   - CoupleTimer phases
   - Speaker mapping

9. Backend erzeugt:
   - speaker-attributed transcript
   - semantische Zusammenfassung
   - Themen
   - Dynamik
   - offene Punkte
   - Vereinbarungen
   - ggf. Konflikt-/Emotionsmarker, vorsichtig formuliert

10. Export:
   - Markdown
   - TXT
   - PDF spaeter`

## Beste technische Strategie fuer Sprechertrennung

Fuer das MVP wuerde ich nicht versuchen, Sprechertrennung im Browser zu machen. Sie gehoert ins Backend.

### Variante 1: Vibe/Sona fuer Transkription, separater Diarization-Service

**Empfohlen, wenn Vibe/Sona-Diarization nicht ausreichend steuerbar ist.**

`Audio
  -> Diarization Service: pyannote.audio / faster diarization pipeline
  -> Transcription Service: Vibe/Sona
  -> Merge Service: timestamps + speaker turns`

Vorteile:

klare Trennung

beste Kontrolle ueber Sprechertrennung

austauschbare Komponenten

Vibe bleibt Transkriptionsmotor

Nachteil:

pyannote und aehnliche Modelle koennen Setup-/Lizenz-/GPU-Fragen mitbringen

### Variante 2: Vibe/Sona macht Transkription und Diarization

**Empfohlen, falls Vibe/Sona im Zielsystem bereits stabile Speaker-Diarization liefert.**

`Audio
  -> Vibe/Sona transcription with diarization
  -> CoupleTimer phase alignment
  -> LLM summary`

Vorteile:

weniger eigene Backend-Komplexitaet

schnellere Integration

Nachteil:

weniger Kontrolle ueber Mapping, Fehlerkorrektur und Speziallogik

### Variante 3: Nur Timer-basierte Sprecherzuordnung

**Nicht ausreichend fuer dein Szenario.**

Das waere zwar einfach, aber gerade Zwischenfragen und Dialogabweichungen wuerden falsch zugeordnet. Fuer das MVP nach deiner Klarstellung nicht ausreichend.

## Revidierte Aufwandschaetzung

ModulMVP-RelevanzAufwand

Audioaufnahme in CoupleTimerPflicht3-6 PT

Upload an BackendPflicht2-4 PT

Session-/Phase-Timeline ExportPflicht, durch vorhandenen Code erleichtert2-3 PT

Backend Session APIPflicht3-5 PT

Audio StoragePflicht2-5 PT

Speaker Diarization BackendPflicht5-12 PT

Mapping Diarization <-> CoupleTimer Speaker A/BPflicht4-8 PT

Batch-Transkription ueber Vibe/SonaPflicht4-8 PT

Transcript-Diarization-MergePflicht4-8 PT

Semantische Zusammenfassung via LLM APIPflicht3-6 PT

OpenRouter/OpenAI-kompatible LLM ConfigPflicht2-4 PT

Markdown/TXT ExportPflicht1-3 PT

PDF ExportMVP+2-5 PT

Review UI fuer SprecherkorrekturStark empfohlen4-8 PT

Live-TranskriptionSpaeter10-25+ PT

**Neuer realistischer MVP-Aufwand:**

ca. **35-65 Personentage**, wenn Sprechertrennung wirklich Bestandteil des MVP ist.

**Ohne echte Diarization:** ca. 20-35 PT, aber das waere nach deiner Klarstellung fachlich zu schwach.

## Was CoupleTimer bereits erleichtert

Vorhandene FunktionNutzen

Custom Timer PhasesGibt semantische Gespraechsstruktur

Speaker A/B SlotsLiefert starken Prior fuer Sprecherzuordnung

TeilnehmerkonfigurationNamen koennen direkt ins Transkript

Session EngineExakte Zeitfenster fuer Phase Alignment

Start/Pause/Stop-LogikKann Aufnahme sauber steuern

Custom ModesSpaeter verschiedene Gespraechstypen mit eigenen Summary-Prompts

Guidance/Prompts im UI-KontextKann spaeter LLM-Zusammenfassung strukturieren

Persistierte SettingsMuster fuer LLM-/Recording-Konfiguration

React/Vite-StrukturGute Basis fuer Review- und Export-UI

## Semantische Zusammenfassung: empfohlene Struktur

Die Zusammenfassung sollte nicht nur "kurz zusammenfassen", sondern den Gespraechsmodus verstehen.

Markdown

`# Gespraechszusammenfassung

## Kurzueberblick
...

## Hauptthemen
- ...

## Was Person A gesagt hat
- ...

## Was Person B gesagt hat
- ...

## Gespraechsdynamik
- Redeanteile
- Unterbrechungen
- Rueckfragen
- Themenwechsel

## Vereinbarungen
- ...

## Offene Fragen
- ...

## Naechste Schritte
- ...

## Vollstaendiges Transkript
[00:01:12] Person A: ...
[00:01:18] Person B: ...`

Wichtig: "Gespraechsdynamik" sollte vorsichtig formuliert werden. Es darf nicht wie psychologische Diagnose wirken, sondern als beobachtbare Kommunikationsstruktur:

`Beobachtung: Person B stellte in Slot A mehrere Zwischenfragen.
Nicht: Person B war dominant.`

## Aktualisierte Sternebewertung

ZielrolleBewertungKommentar

CoupleTimer als strukturierender Gespraechscontroller*****Sehr passend

CoupleTimer als Aufnahme-Orchestrator****Mit MediaRecorder gut erweiterbar

CoupleTimer als Sprecherzuordnungs-Prior****Sehr wertvoll, aber nicht ausreichend allein

Backend-Sprechertrennung im MVP***Machbar, aber eigener Integrationsblock

Vibe/Sona als nachgelagerte Transkription****Gute Passung

VibeMind als modularer Service fuer CoupleTimer****Sinnvolle Zielarchitektur

Real-Time-Transcription im MVP*Nicht notwendig und nicht empfohlen

Semantische Summary + Markdown/TXT****Gut realisierbar

PDF Export***Machbar, aber nachgelagert

## Endgueltige Empfehlung

Fuer das MVP sollte VibeMind in CoupleTimer so geschnitten werden:

`MVP = Aufnahme + Backend-Diarization + Batch-Transkription + Speaker-attributed Transcript + semantische Summary + Markdown/TXT Export`

Nicht im MVP:

`Live-Transkription
Live-Diarization
vollstaendige lokale LLM-Unterstuetzung
perfekter PDF-Export
automatische psychologische Interpretation`

Die wichtigste Designentscheidung ist:

**Sprecherzuordnung wird hybrid geloest: CoupleTimer liefert den zeitlichen und semantischen Sprecher-Prior, das Backend korrigiert ihn durch echte akustische Sprechertrennung.**

Das ist fuer deinen Use Case deutlich robuster als reine Timer-Zuordnung und trotzdem effizienter als komplett freie Diarization ohne Gespraechsstruktur.
