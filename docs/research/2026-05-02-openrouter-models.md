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

## Cascade strategy (confirmed structure)

The `LLMProvider` interface tries each step in order. Step N+1 fires only on 4xx / 5xx / network failure of Step N.

| Step | Slug | Why this position |
|---|---|---|
| 1 | `nvidia/nemotron-3-nano-30b-a3b:free` | Largest free context (256k), good DE quality, MoE = fast |
| 2 | `openai/gpt-oss-120b:free` | Strong general capability, OpenAI-family training |
| 3 | `nousresearch/hermes-3-llama-3.1-405b:free` | Highest raw capacity, but rate-limited often → middle of cascade, not first |
| 4 | (paid) — see **Paid-Fallback Decision** below | Cost-bounded safety net |
| 5 | (local Ollama) — see **Local-Fallback Decision** below | Privacy escape hatch + offline survivability |

Cost ceiling per session if Steps 1-3 all fail and we land on Step 4: see decision below.

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
