# Speaker Mapping Decision Rules — VibeMind

Resolves [C3] from the design code-review.

## Why this spec exists

The VibeMind hybrid speaker attribution claim (CoupleTimer phase plan as a strong **prior**, acoustic diarization as the **corrector**) is the load-bearing differentiator vs. naive timer-only attribution. If the algorithm is hand-waved, real conversations — interjections, overlaps, dialog inside monologic slots, third-party voices — produce wrong attributions and the summary becomes garbage.

This spec turns the hand-wave into concrete decision rules with worked edge cases.

## Inputs

```python
@dataclass
class PhaseWindow:
    phase_type: Literal["prep", "slotA", "slotB", "transition", "closingA", "closingB", "cooldown"]
    expected_speaker: Literal["A", "B"] | None  # A for slotA/closingA, B for slotB/closingB, None elsewhere
    start_ms: int
    end_ms: int

@dataclass
class DiarizationTurn:
    diarized_speaker_id: str    # e.g. "SPEAKER_00", "SPEAKER_01"
    start_ms: int
    end_ms: int
    confidence: float           # 0.0 - 1.0, from Deepgram
```

`phase_timeline: list[PhaseWindow]` from CoupleTimer's `SessionEngine` export.
`diarization_turns: list[DiarizationTurn]` from Deepgram Nova-2 diarization.

## Outputs

```python
@dataclass
class SpeakerMapping:
    diarized_speaker_id: str
    couple_timer_speaker: Literal["A", "B", "unknown"]
    confidence: Literal["high", "medium", "low"]
    evidence: dict  # overlap times with each slot, manual-correction flag

@dataclass
class FinalTurn:
    start_ms: int
    end_ms: int
    speaker: Literal["A", "B", "unknown"]
    source: Literal["diarization", "timer", "fallback"]
    diarization_confidence: float | None
    text: str  # filled in later by transcript-merge step
```

## Algorithm

### Step 1 — Count distinct diarized speakers

```python
n = len({t.diarized_speaker_id for t in diarization_turns})
```

### Step 2 — Branch by speaker count

#### Case `n == 1` (only one voice detected)

Acoustic separation failed. Common causes: mono mic far from one partner, very quiet partner, music/noise dominating one channel.

- Map the single diarized speaker → `"A"` arbitrarily (label is meaningless when there's only one).
- For every transcript turn: `source = "timer"` and `speaker = phase_window.expected_speaker` for the phase that turn falls into.
- If the turn falls into a phase where `expected_speaker is None` (prep, transition, cooldown): `speaker = "unknown"`, `source = "fallback"`.
- All `SpeakerMapping` entries get `confidence = "low"`.
- Surface a banner in the Review UI: *"Sprechertrennung nicht möglich — nur ein Sprecher erkannt. Zuordnung erfolgt nach Timer-Phase und sollte manuell überprüft werden."*

#### Case `n == 2` (the happy path)

For each diarized speaker, compute total overlap-time (in ms) with `slotA`+`closingA` phases vs `slotB`+`closingB` phases:

```python
def overlap_with_slot(turns_for_speaker, slot_phases):
    total = 0
    for turn in turns_for_speaker:
        for phase in slot_phases:
            ov_start = max(turn.start_ms, phase.start_ms)
            ov_end = min(turn.end_ms, phase.end_ms)
            if ov_end > ov_start:
                total += ov_end - ov_start
    return total

a_phases = [p for p in phase_timeline if p.phase_type in ("slotA", "closingA")]
b_phases = [p for p in phase_timeline if p.phase_type in ("slotB", "closingB")]

overlap_X_with_A = overlap_with_slot(turns_X, a_phases)
overlap_X_with_B = overlap_with_slot(turns_X, b_phases)
overlap_Y_with_A = overlap_with_slot(turns_Y, a_phases)
overlap_Y_with_B = overlap_with_slot(turns_Y, b_phases)
```

**Mapping rules** (in order of evaluation):

1. **Clear-majority case.** If `overlap_X_with_A > overlap_X_with_B * 1.2` AND `overlap_Y_with_B > overlap_Y_with_A * 1.2`:
   `X → A`, `Y → B`. Confidence: `"high"`.

2. **Clear-majority swapped.** If `overlap_X_with_B > overlap_X_with_A * 1.2` AND `overlap_Y_with_A > overlap_Y_with_B * 1.2`:
   `X → B`, `Y → A`. Confidence: `"high"`.

3. **Tie-break by phase position.** If neither speaker has a clear majority (both within 20% of each other):
   - Find the first `slotA` phase in `phase_timeline`.
   - Whichever diarized speaker has a turn starting inside that first `slotA` phase → `"A"`.
   - The other → `"B"`.
   - Confidence: `"medium"` (timer-prior is doing the heavy lifting, audio is ambiguous).

4. **Total speaking-time tie-break.** If even the first-slotA test is ambiguous (no diarized turn starts inside the first slotA phase, e.g. the speaker stayed silent in their first slot):
   - Whichever diarized speaker has more total speaking time across the whole session → `"A"`.
   - Confidence: `"low"`.

#### Case `n >= 3` (extra voices detected)

Picked up a third voice — kid, dog, neighbor, audio bleed from a TV. Pick the top 2 by total speaking time, run Case `n == 2` on those. All other diarized speaker IDs map to `"unknown"`.

### Step 3 — Per-turn final attribution with confidence threshold

For each transcript turn (assembled later from Deepgram word-level output, not yet covered in this spec):

```python
def attribute_turn(transcript_turn, mappings, phase_timeline):
    diarized_speaker = transcript_turn.diarized_speaker_id
    diarization_confidence = transcript_turn.confidence

    mapped = mappings.get(diarized_speaker, "unknown")

    # Find the phase this turn falls into
    phase = find_phase_for_timestamp(phase_timeline, transcript_turn.midpoint_ms)
    timer_speaker = phase.expected_speaker if phase else None

    # Override threshold: diarization is allowed to override the timer prior
    # only when both signals are strong.
    overlap_asymmetry = compute_phase_overlap_asymmetry(diarized_speaker, mappings)
    if (
        diarization_confidence >= 0.7
        and overlap_asymmetry >= 0.7
        and mapped != "unknown"
    ):
        return FinalTurn(speaker=mapped, source="diarization", ...)

    # Otherwise fall back to timer prior
    if timer_speaker is not None:
        return FinalTurn(speaker=timer_speaker, source="timer", ...)

    # No phase-prior available (e.g. turn during transition/cooldown)
    return FinalTurn(speaker="unknown", source="fallback", ...)
```

`overlap_asymmetry` for a given diarized speaker = `max(overlap_with_A, overlap_with_B) / total_overlap`. ≥ 0.7 means that speaker spent ≥ 70% of their time in one of the two speaker's slots.

This is the rule that catches **interjections**: speaker B says something quick during slotA. Phase prior says "A". Diarization says "B" with high confidence (0.85). Speaker B's overall asymmetry is 0.85 (mostly speaks in slotB). Both ≥ 0.7 thresholds met → attribute to B, not A. Timer prior is correctly overridden.

## Edge cases handled

| Situation | Behavior |
|---|---|
| **Silence in a slot** | No diarization turn → no transcript turn → not in output. |
| **Overlap (both speak simultaneously)** | Deepgram emits two overlapping turns for the same time range; both kept, each with their respective mapped speaker. UI may show stacked bubbles. |
| **Mid-slot interjection** | Caught by Step-3 confidence + asymmetry threshold (see above). |
| **Recording starts before phase_timeline starts** | Audio may include "let me start the timer..." talking. Turns before `phase_timeline[0].start_ms` → `speaker = "unknown"`, `source = "fallback"`. |
| **Recording ends after phase_timeline ends** | Same — post-cooldown chatter is `"unknown"`. |
| **Clock skew between MediaRecorder and SessionEngine** | Tolerable — clocks come from the same `performance.now()` source. If absolute drift > 500 ms detected (turn timestamps systematically ahead or behind phase boundaries), surface a warning in worker logs. |
| **`n == 1` but both should have spoken** | Best-effort timer-prior; user can manually correct in Review UI. |
| **Very short turns** (< 500 ms) | Likely noise or backchanneling ("mhm"). Filter from final transcript before attribution; record in metadata for completeness. |
| **Speaker swap mid-session** (e.g. Partner A leaves room, Partner C arrives) | `n >= 3` case handles this; the "swapped-in" voice maps to `"unknown"` and the user must intervene. |

## Confidence levels — what they mean to the UI

| Confidence | Behavior in Review UI |
|---|---|
| `"high"` | Speaker badges shown without warnings. User can still edit but nothing nags them to. |
| `"medium"` | Yellow tint on speaker badges + small banner: *"Sprecherzuordnung möglicherweise unsicher — bitte überprüfen."* |
| `"low"` | Red tint + modal on first open: *"Sprechertrennung war nicht eindeutig. Bitte alle Turns im Detail prüfen, bevor du die Zusammenfassung verwendest."* |

## Test plan

```python
# Unit fixtures, one per case in §Step 2 + edge cases
def test_n1_falls_back_to_timer_prior(): ...
def test_n2_clear_majority_maps_correctly(): ...
def test_n2_clear_majority_swapped(): ...
def test_n2_tie_break_by_first_slotA(): ...
def test_n2_tie_break_by_total_speaking_time(): ...
def test_n3_picks_top_two_others_unknown(): ...
def test_interjection_overrides_timer_prior(): ...
def test_low_confidence_diarization_does_not_override(): ...
def test_low_asymmetry_does_not_override(): ...
def test_pre_phase_audio_is_unknown_fallback(): ...
def test_short_turn_filtered_out(): ...
```

Integration test: run a real Deepgram output for a known recorded session, eyeball the resulting `FinalTurn` list against ground-truth speaker labels.

Manual verification dry-run: planned investor-demo session with a few intentional interjections (Partner B says "mhm" during slotA, Partner A asks "warum?" mid-slotB). Verify the final transcript attributes correctly.

## Out of scope

- **Speaker enrollment** (training a fingerprint per partner so we can identify A vs B by voice across sessions). Useful eventually but not MVP — Deepgram's per-call diarization with timer-prior reconciliation is enough.
- **Voice activity detection upstream of diarization.** Deepgram does this internally; we don't run a separate VAD pass.
- **Beam-search rescoring** of diarization output using transcript content (e.g. "the word 'mein Mann' suggests this is the wife speaking"). Out of MVP scope — fragile and not needed at our scale.
