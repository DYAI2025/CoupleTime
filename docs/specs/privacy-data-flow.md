# Privacy Data Flow — VibeMind MVP

Resolves [C4] from the design code-review.

## Honest disclosure

A goal stated during brainstorming was: *"Audio/Transkripte sollen im Tool / auf dem VPS verarbeitet werden."* The MVP architecture **does not fully meet that goal** because it depends on third-party Cloud APIs for transcription/diarization (Deepgram) and LLM inference (OpenRouter cascade). This is an explicit, cost-driven trade-off that ships in MVP and must be disclosed — to investors, to anyone who uses the tool, and inside the app itself.

The Local-Fallback exists (Step 5 of the LLM cascade, `gemma3:4b-it-qat` on the VPS itself) and a user-facing **"Lokale Verarbeitung erzwingen"** toggle skips the cloud path entirely for sensitive sessions. But Deepgram remains in the path even with the toggle on, because we have no MVP-grade local diarization. That gap is documented below as a **deferred mitigation**, not a hidden one.

## Where each data category goes

| Data | Destination | Stored where | Retention | Purpose |
|---|---|---|---|---|
| Recorded audio (OPUS) | Hostinger VPS `/var/vibemind/audio/{session_id}.opus` | KVM 2 disk | permanent (user-deletable later) | source of truth |
| Audio chunks during upload | Hostinger VPS `/var/vibemind/uploads/{upload_id}.partial` | KVM 2 disk | deleted on finalize, or after 7 days if abandoned | resumable upload |
| Audio (full) | **Deepgram (US-East region by default; switch to EU region in prod config)** | Deepgram processing infra | per Deepgram retention policy: deleted within 24h of processing unless retention enabled (we leave retention OFF) | transcription + diarization |
| Phase timeline / participant config | Hostinger VPS SQLite (`vibemind.db`) | KVM 2 disk | permanent | speaker-mapping prior, summary context |
| Transcript text + speaker mapping | Hostinger VPS SQLite | KVM 2 disk | permanent | source for summary, displayed in Review UI |
| Transcript + summary prompt | **OpenRouter → selected provider** (varies per cascade step: Anthropic, OpenAI, NVIDIA, Google) | provider infra | per provider policy. OpenRouter aggregates anonymized logs unless BYOK + opt-out is configured | LLM summary generation |
| Summary versions | Hostinger VPS SQLite | KVM 2 disk | permanent (all versions kept, see `pipeline-idempotency.md`) | review history |
| Speaker corrections, manual edits | Hostinger VPS SQLite | KVM 2 disk | permanent | user history, regenerate trigger |
| API key (`VITE_VIBEMIND_API_KEY`) | shipped in JS bundle at build time | user's browser localStorage / bundle | until rotation | request auth between frontend and backend |
| Web Notification subscription (deferred to v1.1) | currently: not used. Polling only. | n/a | n/a | n/a |

## What stays on the VPS only

- All **persisted state** (sessions, transcripts, summaries, mappings, corrections).
- All **audio files** post-processing.
- All **history** of summary versions.
- The `gemma3:4b-it-qat` model weights (~3.3 GB), used when the user toggles "Lokale Verarbeitung erzwingen".

## What leaves the VPS

- **Audio uploads to Deepgram** — full audio per session, every session. Deepgram processes and returns transcript + diarization. With retention disabled, the audio is deleted within 24h of processing.
- **Transcript text to OpenRouter** — sent in the LLM-summary prompt. Every "Summary neu generieren" click sends the corrected transcript again. With "Lokale Verarbeitung erzwingen" on, this stops happening.

## What the user sees in the app (in-app disclosure copy)

In the Settings screen, under a **Privacy** section, exactly this text:

> **Datenverarbeitung**
>
> Diese App nutzt für Transkription (Deepgram, USA/EU) und Zusammenfassung (OpenRouter Cloud) externe Dienste. Audio und Transkript verlassen dabei den eigenen Server und werden auf den Servern dieser Anbieter verarbeitet.
>
> Wenn du das nicht möchtest, schalte den Modus **"Lokale Verarbeitung erzwingen"** an. Die Zusammenfassung läuft dann auf dem eigenen Server (langsamer, ca. 1-3 Minuten statt ~10 Sekunden).
>
> **Wichtig:** Die Aufnahme selbst bleibt immer auf dem eigenen Server gespeichert. Auch im Modus "Lokale Verarbeitung erzwingen" wird das Audio aktuell zu Deepgram zur Sprechertrennung gesendet, da hier noch keine vollständig lokale Lösung integriert ist.
>
> [ ] Lokale Verarbeitung erzwingen (LLM-Inferenz nur lokal)
> [ ] Aufnahmen automatisch nach __ Tagen löschen (deaktiviert in MVP)

The toggle persists in `app_settings` table on the VPS; affects every subsequent session until toggled off.

## Mitigations included in MVP

- **Deepgram retention disabled** — set `keep_data=false` in API call.
- **OpenRouter logging disabled** — request header `X-Or-Allow-Logging: false` (where the upstream provider supports it; not all do, e.g. some free-tier endpoints don't).
- **Local Ollama fallback** — Step 5 of the cascade uses `gemma3:4b-it-qat` on the VPS itself; no external LLM call.
- **"Lokale Verarbeitung erzwingen" toggle** — forces every summary to skip the cloud cascade and go straight to local Ollama. Surfaced as a "verarbeitet auf eigenem Server"-badge in the Review UI for honest reflection.
- **API key shipped in bundle** — yes, recoverable. Rate limits and Origin-Header allowlist in the backend mitigate abuse. Not a privacy mitigation per se, but a least-privilege constraint.
- **HTTPS-only** between frontend and backend (Hostinger handles certs via Let's Encrypt).
- **CORS allowlist** in backend — only the configured frontend origin can hit the API.

## Mitigations deferred (post-MVP, named honestly here)

- **Self-hosted diarization** (`pyannote.audio` on a separate GPU box). Audio never leaves user infrastructure. Currently rejected for MVP because: (a) GPU box is a separate cost line, (b) `pyannote` self-host setup is a 2-3 PT effort by itself.
- **End-to-end client-side encryption of audio at rest.** Audio is currently stored unencrypted on KVM 2 disk. Disk-level encryption (LUKS / Hostinger-side equivalent) is the realistic post-MVP step; per-file E2EE requires key management we don't have user-flow for.
- **Audio retention policy** — automatic deletion after N days. Database column reserved (`audio_delete_after_at`) but UI not wired in MVP. User explicitly stated permanent storage is preferred for now.
- **Per-couple multi-tenancy with isolated keys.** MVP is single-user; multi-tenancy is a v2 concern.
- **GDPR Art. 30 record of processing activities.** Not formal-document MVP; informally documented in this file.

## Specific provider notes

### Deepgram

- Region selection: `region=us` default; for EU customers consider `region=eu`. Configure in `apps/backend/vibemind/providers/transcription.py` via env var.
- Retention: `keep_data=false` (default for paid plans). Audio deleted within 24h.
- Privacy policy as of 2026-05-02: https://deepgram.com/privacy
- BAA / DPA available — relevant if VibeMind ever scales beyond personal use.

### OpenRouter

- Each cascade step routes to a different provider (NVIDIA, OpenAI, NousResearch, Google). Privacy policies vary per provider.
- For free models: most providers retain anonymized prompts for evaluation/safety unless explicitly opted out. The `:free` slugs in our cascade (Hermes, gpt-oss, nemotron) are unmoderated free tiers — assume **prompts MAY be retained** by the upstream provider.
- For paid model (`google/gemini-2.5-flash`): Google's standard API privacy policy applies; for paid usage they don't train on inputs by default.
- Mitigation if a session is sensitive: use **"Lokale Verarbeitung erzwingen"**. Skips OpenRouter entirely.

## Wording for an investor pitch

> *"For the MVP, transcription and LLM summarization run via cloud APIs (Deepgram, OpenRouter) for cost and latency reasons. Recordings and all derived data are stored on our own VPS. We've designed an opt-in 'local processing' mode that runs the summary on the same VPS for privacy-sensitive sessions; full local diarization is on the post-MVP roadmap."*

That's the honest one-paragraph version. The three things that are likely to come up in the room — "where does the audio go?", "what's the privacy story?", "is this GDPR-compliant?" — are answered respectively by: Deepgram (audio) + OpenRouter (transcript), the toggle + roadmap, and "DPAs in place with both vendors, but not formal-audit GDPR compliant; that's a v1 sales-cycle item."
