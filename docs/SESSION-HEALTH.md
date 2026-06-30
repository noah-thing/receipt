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

## Make it automatic: the `guard` hook

The research is unanimous that the fix is to act *before* the cliff, not at it. `receipt guard` turns the detection into a nudge that arrives at the right moment — wire it into a Claude Code hook and it stays silent until a session crosses your gate, then prints the single most important move where the agent will see it.

```json
// .claude/settings.json
{
  "hooks": {
    "Stop": [
      { "matcher": "*", "hooks": [
        { "type": "command", "command": "receipt guard --notify --gate watch" }
      ]}
    ],
    "PreCompact": [
      { "matcher": "*", "hooks": [
        { "type": "command", "command": "receipt guard --notify --gate degrading" }
      ]}
    ]
  }
}
```

`PreCompact` is the highest-leverage placement: at the instant Claude Code is about to auto-compact — the lossy event the research warns about — `guard` can say "you're past the point where the summary stays faithful; start fresh with a handoff note instead." With `--notify`, `guard` exits 2 so Claude Code feeds the line back to the agent; without it, the line goes to stdout for a person.

A typical nudge:

```
receipt: session degrading (ctx ~84%, 31 turns) — /compact now (or start a fresh session) — past here, even the summary gets lossy
```

## Scripting and CI: exit codes + `--json`

`receipt health --quiet --gate degrading` prints nothing and returns an exit code you can branch on: `0` below the gate, `10` at *watch*, `20` at *degrading*, `30` at *critical* (distinct codes, all above the generic failure `1`). `receipt health --json` emits the full `SessionHealth` object for editor plugins and dashboards.

## See your whole history: `receipt health --all`

`receipt health --all` scores every past session and learns your personal pattern — when *you* tend to drift, and whether you habitually compact too late:

```
🧠 Session history — how your sessions have held up

  #    when             turns   peak ctx   ~compact   verdict
    2  Tue 9pm           24      78% 🟡        1     watch
    1  Tue 7pm            3      10% 🟢        0     healthy

  You tend to drift around turn ~12 (~544k ctx tokens).  60% of your sessions that
  crossed 80% full compacted *after* the fact — try /compact at 60%.
```

## The context tax

`receipt health` also shows how much of a session is just re-sending itself. As a session grows, most of each turn's tokens are prior context carried forward (cache reads), not new work:

```
📦 Re-sent context: 🟠 97% of this session's tokens
   9.9M of 10.3M were prior context carried forward; 169k (2%) was new work.
   → A long session mostly re-reads itself. A fresh session is cheaper and sharper.
```

This is the quadratic re-send tax made visible — the same mechanism behind both rising cost *and* fading quality. Caching makes the dollars cheaper per token, but the sheer volume of re-sent context is why a fresh session is the honest win on both axes.

## On the pull request

If the work behind a PR was produced under degrading conditions, Receipt adds a collapsed, review-oriented note to the cost comment — never a scold, always a pointer for the reviewer:

> <details><summary>🧠 Session health — 1 of 2 sessions was degrading</summary>
> This PR's AI work spanned 2 sessions. The longest ran 31 turns / 96 min, and context peaked at ~92% full (184k/200k) with ~2 auto-compactions. Long, compacted sessions drift — so these changes are worth a careful review for consistency and correctness. Nothing here says the code is wrong; it's a pointer to where to look.</details>

It is **silent** unless a session reached *watch* or worse, addresses the reviewer rather than the author, and proves only *conditions*, never that the code is wrong. Opt out with `health: false` in `.receipt/config.json`.

## What the token-only ledger cannot do

Receipt sees token counts, not content, so it is honest about its blind spots. It **cannot** detect redundant file reads, identical-command loops, or repeated tool calls (the ledger has no per-tool-call paths or command strings), and it cannot see hallucinated files, contradictions, architectural drift, or ignored instructions (those need the prompt and completion text Receipt deliberately never stores). The `looping` signal rides on `retries`, which only the proxy records — imported sessions won't have it. Compaction counts and context fill are *inferred* from prompt-size shape, which is why they always carry a `~`.
