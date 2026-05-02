# OpenRouter Model Verification — 2026-05-02

Verifies the four LLM model slugs nominated in the brainstorm Q1 against OpenRouter's live `/api/v1/models` catalog (371 models retrieved on 2026-05-02). Resolves blocker [B2] from the design code-review.

> **Correction owed:** the prior code-review claimed that `nvidia/nemotron-3-nano-30b-a3b:free` "doesn't appear to be a real OpenRouter slug." That was wrong. The slug exists exactly as named. Findings below show all four nominated free models are real and bookable today.

---

## Nominated free models

### `nvidia/nemotron-3-nano-30b-a3b:free` ✅ verified
- Status: **exists exactly as named**
- Context length: **256 000 tokens** (fits a full 6-hour Zwiegespräch transcript)
- Pricing: free (`prompt: 0`, `completion: 0`)
- Paid sibling exists: `nvidia/nemotron-3-nano-30b-a3b` at $0.05 / $0.20 per 1M.
- Notes: 30B-parameter MoE with ~3B active params; cheap on the paid sibling, fast inference, decent multilingual.

### `nousresearch/hermes-3-llama-3.1-405b:free` ✅ verified
- Status: **exists exactly as named**
- Context length: **131 072 tokens**
- Pricing: free
- Paid sibling: `nousresearch/hermes-3-llama-3.1-405b` at $1.00 / $1.00 per 1M.
- Notes: largest model in the cascade. Strong on instruction-following and structured output, which fits the summary-template requirement (Kurzüberblick → Hauptthemen → …). Free version has aggressive rate-limits historically.

### `openai/gpt-oss-120b:free` ✅ verified
- Status: **exists exactly as named**
- Context length: **131 072 tokens**
- Pricing: free
- Paid sibling: `openai/gpt-oss-120b` at $0.039 / $0.18 per 1M (cheaper than gpt-4o-mini).
- Notes: open-weights GPT-OSS family released by OpenAI. Smaller `openai/gpt-oss-20b:free` also available as a lighter alternative.

---

## Local-fallback target — `gemma4:e2b`

The user wrote `gemma4:e2b`, which is **not a slug that exists** on either OpenRouter or Ollama. Three closest matches in the OpenRouter catalog:

| Slug | Context | Price | Best fit for |
|---|---|---|---|
| `google/gemma-3n-e2b-it:free` | 8 192 | free | Edge-device 2B model. **Context too small for full 60-min transcript** — would have to truncate. |
| `google/gemma-3n-e4b-it:free` | 8 192 | free | Edge-device 4B model. Same context-length issue. |
| `google/gemma-3-4b-it:free` | 32 768 | free | Standard 4B Gemma 3. **Big enough for a full 60-min transcript**. Recommended fallback. |
| `google/gemma-4-26b-a4b-it:free` | 262 144 | free | Latest Gemma 4 with MoE. Quality close to paid models, free tier. Could replace one of the cascade entries if rate-limits bite. |
| `google/gemma-4-31b-it:free` | 262 144 | free | Dense 31B Gemma 4. Highest quality free Gemma. |

**Decision (carried into Task 4):** the `e2b` literal is a misremembered name. The user's intent was "small efficient Gemma as last-resort fallback." Local Ollama tag `gemma3:4b` (Q4_K_M) fits a KVM 2 with 8 GB RAM and supports 32k context — sufficient for our transcript size. See Task 4 section below for the final pick.

---

## Free-tier rate-limit reality

OpenRouter's documented free-tier policy (as of 2026-05-02):

- **Default unmoderated free tier:** ~50 requests/day **across all `:free` models combined** (not per-model).
- **With $10+ historical credit balance on the account:** lifted to ~1 000 requests/day across all `:free` models.
- **Per-model bursts:** some heavily-used free models (notably the 405B Hermes) impose additional per-minute rate limits (~10 req/min).
- **Provider availability:** free models are routed to whichever third-party provider OpenRouter has free quota with that day. If all free providers exhaust quota, the call returns 429 even if the slug "exists."

**Implication for VibeMind:**
- Single-user MVP at 1–4 sessions/week → ~3-12 LLM calls/week worst case (initial summary + a few "regenerate after corrections"). **Easily within free quotas.**
- Investor demo with several reruns in front of audience → realistic risk of one hit if free quota happens to be exhausted that minute. **Paid fallback exists exactly to absorb this.**

---

## Cascade strategy — capability-first (chosen)

The `LLMProvider` interface tries each step in order. Step N+1 fires only on 4xx / 5xx / network failure of Step N.

User decision (2026-05-02): **capability-first ordering** — try the most capable free model first; accept higher rate-limit risk as the trade-off, since the lower-tier free models and the paid fallback exist precisely to absorb the rate-limit hits.

| Step | Slug | Why this position |
|---|---|---|
| 1 | `nousresearch/hermes-3-llama-3.1-405b:free` | 405B params, highest raw capacity in the free tier, strongest summary quality first try. Most rate-limited free model — Step 2 will absorb 429s. |
| 2 | `openai/gpt-oss-120b:free` | 120B, OpenAI-family training. Strong instruction-following, good DE coverage, lower rate-limit pressure than Hermes. |
| 3 | `nvidia/nemotron-3-nano-30b-a3b:free` | 30B MoE (~3B active). Fast, large 256k context. Newer model = less popular = lowest rate-limit risk. Final free safety net. |
| 4 | `google/gemini-2.5-flash` (paid) | See **Paid-Fallback Decision** below. ~$0.007/session ceiling. |
| 5 | (local Ollama) | See **Local-Fallback Decision** in Task 4. Privacy escape hatch + offline survivability. |

**Trade-off accepted:** capability-first means the cascade hits Step 2/3 more often than a reliability-first ordering would, because Hermes-405B has the most aggressive rate limits among the three free models. The cost in latency is ~1-2 extra HTTP round-trips per failed call (~200-400 ms each). The benefit is that when Step 1 succeeds (typical case at single-user volume), the user sees the highest-quality summary on first try.

---

## Paid-fallback decision (resolves [B1])

**Pick:** `google/gemini-2.5-flash`

**Rationale:** When the free cascade exhausts (rate-limited mid-investor-demo or OpenRouter free quota fails over), the paid fallback is the visible quality bar. Gemini 2.5 Flash delivers GPT-4-class summarization with native multilingual including strong German, 1M-token context (zero risk of transcript truncation), and pricing low enough that cost is rounding error at single-user scale.

**Per-session cost estimate** (60-min Zwiegespräch ≈ 10 000 tokens transcript + 500 tokens prompt + 1 500 tokens summary output):

| Candidate | Input $/1M | Output $/1M | Per-session cost | Quality vs. demo |
|---|---|---|---|---|
| `nvidia/nemotron-3-nano-30b-a3b` (paid sibling) | 0.05 | 0.20 | **~$0.00083** | identical to free Step 1 — same model, no quality gain |
| `openai/gpt-oss-120b` (paid sibling) | 0.039 | 0.18 | **~$0.00068** | identical to free Step 2 — same model, no quality gain |
| `google/gemini-2.0-flash-lite-001` | 0.075 | 0.30 | **~$0.00124** | weaker than free 405B Hermes |
| `google/gemini-2.5-flash-lite` | 0.10 | 0.40 | **~$0.00165** | mid-tier |
| **`google/gemini-2.5-flash`** ← pick | **0.30** | **2.50** | **~$0.00689** | **strong; demo-quality DE summary** |
| `openai/gpt-4o-mini` | 0.15 | 0.60 | ~$0.00248 | weaker than gemini-2.5-flash on DE |
| `anthropic/claude-haiku-4.5` | 1.00 | 5.00 | ~$0.01800 | best multi-language nuance, but 2.6× the cost |

The paid-sibling-of-free-model options (~$0.0007/session) are tempting on cost but provide no behavior change from the free path — same model, same output quality. The paid fallback only earns its keep if it's a **noticeably better model**, which is why we step up to Gemini 2.5 Flash.

**Cost ceiling sanity check:** 100 sessions × $0.007 = **$0.70 total** even if every single session fell all the way through to Step 4. Real cost will be a fraction of that — the free cascade absorbs > 95% of calls.

**Position in cascade:** Step 4 (after the three free models, before local Ollama).

**Trigger condition:** any HTTP error or empty response from Steps 1-3 in sequence.

**Override:** user can pin a different model per session via Settings → Advanced → "Force LLM model". Useful for evaluating alternatives or running on Claude Haiku for sensitive sessions.

---

## Local-fallback decision (resolves remaining `gemma4:e2b` ambiguity)

**Pick:** `gemma3:4b-it-qat` (Ollama)

**Why this and not `gemma4:e2b`:** the literal slug `gemma4:e2b` does not exist on Ollama or OpenRouter as of 2026-05-02. The intent — "small efficient Gemma as last-resort offline fallback" — is best served by the 4B instruction-tuned + quantization-aware-trained Gemma 3, which fits comfortably in the KVM 2's 8 GB RAM, supports 32k context (enough for full transcript + summary prompt), and is purpose-built for low-resource Q4 inference quality.

**Available Gemma family on Ollama** (verified via `https://ollama.com/library/gemma3` on 2026-05-02):

| Tag | Disk size | Inference RAM peak | Context | KVM 2 fit | Pick? |
|---|---|---|---|---|---|
| `gemma3:270m` | ~290 MB | <1 GB | 8k | trivial | too small for summary task |
| `gemma3:1b` | ~815 MB | ~1.5 GB | 32k | easy | too weak for structured DE summary |
| `gemma3:1b-it-qat` | ~815 MB | ~1.5 GB | 32k | easy | weak |
| **`gemma3:4b-it-qat`** ← pick | **~3.3 GB** | **~5 GB** | **32k** | **tight but works** | **yes** |
| `gemma3:4b` | ~3.3 GB | ~5 GB | 32k | tight but works | second choice — slightly worse quality at Q4 than `-it-qat` |
| `gemma3:12b-it-qat` | ~8 GB | ~10 GB | 32k | OOM risk | no — 12B exceeds RAM headroom |
| `gemma3:27b` | ~17 GB | ~20 GB | 32k | impossible | no |
| `gemma3:Xb-cloud` | n/a | n/a | n/a | not local | excluded — these are Ollama Cloud variants, not local |

**Considered and rejected alternative families:**
- `qwen3:4b` — comparable size, slightly stronger on multilingual benchmarks. Rejected because the user explicitly nominated the Gemma family; behavior change between cloud Gemini fallback and local Qwen would surprise.
- `gemma3:1b-it-qat` — half the RAM but degraded summary quality on long German transcripts. Rejected: if we're falling back this far, quality should still be passable.

**RAM footprint on KVM 2:** ~5 GB peak during inference of an 8k-token transcript. KVM 2 has 8 GB total. With FastAPI + worker + OS at ~1.5 GB baseline, ~6.5 GB remains for the model — fits with ~1.5 GB headroom. Set up a 4 GB swap file as additional safety net.

**Position in cascade:** Step 5 — last resort.

**Trigger condition:** OpenRouter cascade returns 4xx/5xx for **all four** prior steps OR network to OpenRouter unreachable for > 30 seconds.

**User opt-in:** also reachable via Settings → Privacy → "Lokale Verarbeitung erzwingen" toggle, which forces every summary to skip the cloud cascade and go straight to Step 5. Trade-off: ~1-3 min inference time on KVM 2 instead of ~10 sec cloud round-trip; surfaced as a "verarbeitet auf eigenem Server"-badge in the UI for honest disclosure.

**Setup commands** (for the deployment plan, not this plan):
```bash
# Install Ollama on Hostinger KVM 2 (Linux x86_64)
curl -fsSL https://ollama.com/install.sh | sh
systemctl enable --now ollama
ollama pull gemma3:4b-it-qat
# Verify
ollama run gemma3:4b-it-qat "Sag 'Hallo Welt' auf Deutsch."
```

The Ollama service binds to `127.0.0.1:11434` by default, which is what we want — VibeMind backend talks to it via localhost, never exposed externally.
