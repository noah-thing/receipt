# Session health: keeping the agent sharp

`receipt health` answers one question: *is this session still producing its best work, or is it quietly degrading?* It reads the same local ledger as everything else and scores the most recent session for the well-documented ways long AI-coding sessions go downhill — then tells you the move to make **before** quality drops.

A principle runs through all of it: **the advice never tells the agent to think less, explain less, or do less.** Output and reasoning are the value. Every recommendation is about *refreshing* context (`/compact`, `/clear`, a fresh session, `/rewind`) so the agent keeps its full capability, not about trimming the work.

## Why sessions degrade (the research)

Long conversations get worse well before they hit the context limit. The consistent findings:

- **Usable context ≪ advertised window.** The RULER benchmark found effective context averages only **~50–65%** of the marketed size across 17 models. A 1M window is realistically ~500–650K before multi-hop reasoning degrades. ([RULER](https://arxiv.org/html/2404.06654v1))
- **Lost in the middle.** Accuracy drops **~15–30 points** when the needed information sits in the middle of a long context rather than the start or end — a property of causal attention + positional encoding, not content. ([Liu et al.](https://arxiv.org/abs/2307.03172))
- **Recall sags past ~50% fill**, and degradation onset tracks absolute tokens (often **32K–100K**) more than a fixed percentage — so big windows don't buy proportionally more usable room. ([Chroma context rot](https://www.trychroma.com/research/context-rot), [NoLiMa](https://llm-stats.com/benchmarks/nolima))
- **Multi-turn drift.** Quality drops **~39%** on average across long multi-turn conversations as early decisions fade and the model re-litigates settled points. ([Laban et al., "LLMs Get Lost in Multi-Turn Conversation"](https://arxiv.org/abs/2505.06120))
- **Auto-compaction is lossy.** Claude Code auto-compacts around **~90%** full; the summary drops precise detail (paths, line numbers, error codes), and summaries-of-summaries degrade fast. Anthropic recommends compacting **proactively at 50–60%**, while the model still has the full context to summarize well. ([Anthropic: effective context engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents))
- **Cache-invalidation cascade.** Prompt caching is prefix-based; when the early context keeps changing, the cache resets every turn — wasting cost *and* signalling that the stable context the model relies on is churning.
- **Looping & accumulation.** Stuck agents re-send the whole context on retries (no new output), and sessions running 2h+ slow down from accumulated state regardless of context size.

## What Receipt measures, and the thresholds

The key estimate: for any call, **input + cache-read + cache-write tokens ≈ the size of the prompt sent that turn ≈ how full the context was.** No model internals needed — the ledger already has it. Sessions are split by a 30-minute idle gap.

| Signal | How it's computed | Warn (🟡) | Serious (🔴) | Action it suggests |
|---|---|---|---|---|
| **Context fill** | heaviest of the last 3 calls' prompt tokens ÷ that model's window | ≥ 60% **or** ≥ 200K abs | ≥ 80% **or** ≥ 400K abs | `/compact` now (proactively at 50–60%) |
| **Session length** | calls in the session | ≥ 12 turns | ≥ 25 turns | `/clear` if switching tasks; checkpoint + fresh session for long work |
| **Session age** | last − first timestamp | ≥ 120 min | — | restart the agent to clear accumulated slowdown |
| **Cache reuse** | cache-read ÷ (read + write), when cache > 50K | < 50% | < 20% | pin stable context first; let volatile context come last |
| **Compaction cascade** | count of prompt-size collapses after a large prompt | — | ≥ 2 | start fresh with a short handoff note instead of compacting again |
| **Looping** | retries in the last 5 calls | ≥ 3 | — | `/rewind` and change approach; restate the goal with a success check |
| **Output shrinkage** | avg output last third ÷ first third | ≥ 40% drop | — | re-state the task, or `/compact` to clear bloat |

The overall status is the worst active signal: **fresh** (too short to judge) → **healthy** → **watch** → **degrading** → **critical**.

Context fill is scored by **both** percentage and absolute size, because a 1M-token window degrades by absolute token count long before it's "full" — a real effect users report (e.g. Opus showing degradation around 40% of a 1M window).

## Honesty

Context-window sizes are best-effort current values (see `src/health.ts`); a model not listed falls back to a conservative 200K. The thresholds are drawn from the research above and are deliberately *early* — the whole point is to act before the cliff, not at it. Everything is computed locally from token counts and timestamps; no prompts, completions, or code are read, and nothing leaves your machine.

## Put it in your statusline

`receipt statusline` includes the live context gauge, so you see it while you work (the moment awareness actually changes behavior):

```json
// .claude/settings.json
{ "statusLine": { "type": "command", "command": "receipt statusline" } }
```

```
🔋 🟢 5h 22% · wk 6%   🧠 🟡 ctx 64% · 14 turns · context fill
```
