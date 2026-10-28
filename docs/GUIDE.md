# Guide

The long form of what the README summarizes. Every command listed here accepts `--help`.

## How it captures usage

**The proxy** sits between your tool and the provider. It forwards each request untouched, reads the `usage` block off the response, prices it, and appends a row to the ledger. It speaks both the Anthropic (`/v1/messages`) and OpenAI (`/v1/chat/completions`, `/v1/responses`) shapes, including streaming, so one proxy covers most tools. It records token counts and timing. It never records the body of a request or a response.

**The importers** read logs a tool already keeps.

- `receipt import claude-code` walks `~/.claude/projects` and turns each metered turn into a ledger row, with the git branch Claude recorded at the time.
- `receipt import codex` walks `~/.codex/sessions` (or `$CODEX_HOME/sessions`) and turns each model response into a ledger row. Cached input is split out and priced at the cache rate. Codex records a git branch only for some sessions, so `--branch` can match fewer rows than it does for Claude Code.
- `receipt import generic usage.json` normalizes any JSON or JSONL export with `prompt_tokens` / `completion_tokens` or `input_tokens` / `output_tokens` fields.

All of them de-duplicate on the provider request id, so you can re-run an import without double counting.

## Budgets

Set a ceiling and the receipt shows a bar against it.

```bash
receipt budget set pr 8     # warn past $8 per pull request
receipt budget set day 50   # and $50 per day
```

Under budget reads green. Past 80% turns yellow. Over the line goes red and names the overage:

```
🔴 `████████████████████` 131% of $4.00 budget, over budget by $1.22
```


## Plan usage

Dollars are abstract on a subscription. What you actually feel is the window: the five-hour cap and the weekly one. So Receipt measures every task a second way, as a percentage of *you*, and turns it into the thing that changes how you work: what you can no longer do before the reset.

Tell it your plan once:

```bash
receipt budget plan max5x        # or: pro, max20x
```

Then `receipt fuel` shows where you stand right now:

```
Fuel: how much of you this is using

🟢 5-hour window  ███░░░░░░░░░░░░░░░░░░░░░ 11%  1.4M / 12.5M · resets in 3h30m
🟢 weekly cap     █░░░░░░░░░░░░░░░░░░░░░░░ 4%   4.6M / 125.0M · resets in 3d 0h

You could still do
  5h: ~15 PRs this size · ~8 big refactors · ~101 quick edits
  week: ~172 PRs this size · ~91 big refactors · ~1099 quick edits

Pace: ↓ sustainable (168k/hr vs 744k/hr sustainable)
```

Every PR receipt gets a matching block: the share of your 5-hour and weekly windows the branch ate, the same number in your own work-units, an efficiency grade, and the one lever worth pulling, what running the heavy model's reads on a cheaper one would have saved.

The window sizes learn from you. Capacity, records, and pace are built from your own task distribution, so "≈ 2 PRs this size" means *your* PRs. Add `--fun` for playful, still-honest comparisons ("re-reading your entire repo 1.6×").

```bash
receipt fuel            # current windows, capacity, pace
receipt records         # heaviest, leanest, most recent tasks, ranked
receipt forecast        # a typical task's impact + your weekly runway
receipt statusline      # one-line gauge for the Claude Code statusline
receipt calibrate       # set your real budget from a limit you hit
```

### How the limits work, and the numbers

Claude subscriptions meter you on two rolling windows, not a dollar balance:

- **A 5-hour window.** It opens with your first prompt and resets five hours later. This is the cap you hit inside a long session.
- **A weekly (7-day) window.** A rolling ceiling across the whole week. Heavier models draw it down faster, an hour on Opus costs far more of the window than an hour on Sonnet or Haiku.

Anthropic does not publish exact token budgets, and they shift with your model mix, so Receipt ships rough per-plan estimates and labels them as estimates everywhere they appear:

| Plan | ~5-hour budget | ~weekly budget |
| --- | --: | --: |
| `pro` | 2.5M tokens | 25M tokens |
| `max5x` | 12.5M tokens | 125M tokens |
| `max20x` | 50M tokens | 500M tokens |

Treat these as a starting point, not gospel. Two ways to replace them with your real ceiling:

- **Run the proxy.** Every response carries the provider's `anthropic-ratelimit-*` headers. Receipt reads them and writes your actual limit to `.receipt/limits.json`, no guessing.
- **Calibrate from a wall.** The moment you get rate-limited, run `receipt calibrate`; it takes what you'd spent in the window as your true budget. Add `--window week` for the weekly one.

From there the math is plain: a percentage is `tokens used ÷ that budget`, and "what you could still do" is `budget left ÷ your own median task size`. The footer always names the source, `preset`, `calibrated`, or `observed`, so you know how much to trust the number. Full detail in [`docs/LIMITS.md`](docs/LIMITS.md).

### Live in the Claude Code statusline

Put the gauge where you work, so awareness happens mid-task rather than after:

```json
// .claude/settings.json
{ "statusLine": { "type": "command", "command": "receipt statusline" } }
```

```
🟢 5h 11% · wk 4% · ~15 PRs this size · resets 3h30m
```

Don't want any of it? Set `"usage": false` in `.receipt/config.json` and the block disappears from the PR comment and `receipt show`.

### Cut the waste: `receipt advice`

```bash
receipt advice          # this branch
receipt advice --all    # the whole ledger
```

Receipt reads your usage and tells you what's driving the cost and how to spend fewer tokens, **without making the work worse.** It never suggests thinking less or writing less. It targets pure waste:

- context re-sent at full price instead of cached,
- the cache rebuilt faster than it's reused,
- retries that re-send everything for no new output,
- premium prices paid for mechanical reads a cheaper model handles at the same quality.

Each tip is ranked by impact, with the dollar saving where it can be computed. The single biggest win also rides along on every PR receipt and `receipt show`.

```
Advice: cut the waste, keep the quality

What's driving the cost
  • claude-opus-4-8: 100% of the spend
  • fresh input: 51% of the tokens

Recommendations
  ‼ Reuse your context instead of resending it   up to ~$12.15 if it cached
     Only 8% of your input came from cache; the rest was fresh, billed roughly
     10× higher for the exact same context. Keep the stable part of the prompt
     first and unchanged so it caches, and avoid /clear mid-task.
```

### Keep the session sharp: `receipt health`

```bash
receipt health           # is the current session still sharp?
receipt health --all     # every past session + when you tend to drift
receipt health --json    # machine-readable, for hooks and editors
receipt guard --notify   # hook entrypoint: nudge the agent before the cliff
```

AI coding sessions get *worse before they hit any limit*, context rot, lost-in-the-middle, instruction drift, looping, and lossy auto-compaction all set in while the window still has room. The research is consistent: usable context is only ~50 to 65% of the advertised window, recall sags past ~50% fill, and multi-turn quality can drop ~39% over a long conversation. Anthropic's own advice is to compact *proactively at 50 to 60%*, before the summary itself goes lossy.

Receipt reads the same ledger and estimates, per session, how close you are to that cliff, then tells you the move to make **before** quality drops:

```
Session health: keeping the agent sharp

🟡 Watch  context 64% full (640k/1000k) · 14 turns · 31 min · 78% cache reuse

  🟡 Context is ~64% full, usable context is only ~50 to 65% of the window.
     → good moment to /compact (Anthropic suggests 50 to 60%, before quality dips)
  🟡 14 turns, multi-turn drift creeps in past ~12.
     → switching tasks? /clear. Long task? checkpoint and start a fresh session.
```

It watches context fill (by % *and* absolute size, since big windows degrade by absolute tokens), session length and age, cache reuse (context churn), auto-compaction cascades, and looping. Every suggestion keeps the agent **sharp**, `/compact`, `/clear`, a fresh session, `/rewind`, and never tells it to think or write less. The live gauge also rides along in `receipt statusline` and `receipt fuel`.

Four ways it goes further than a single read-out:

- **Act before the cliff, automatically.** `receipt guard` is a [Claude Code hook](https://docs.claude.com/en/docs/claude-code/hooks) entrypoint. Wire it to `Stop` or `PreCompact` and it stays silent until a session crosses your gate, then nudges the agent at exactly the right moment, `--notify` exits 2 so Claude Code feeds the line back to the model. `receipt health --quiet --gate degrading` gives CI a clean exit code (`0/10/20/30`).
- **See your whole history.** `receipt health --all` scores every past session and learns *your* pattern: "you tend to drift around turn ~12," and whether you habitually compact too late.
- **The context tax.** It shows how much of a session is just re-sending itself, the quadratic re-send tax that drives both rising cost *and* fading quality. A long session mostly re-reads itself; a fresh one is cheaper and sharper.
- **On the pull request.** If the work behind a PR ran under degrading conditions, the cost comment gains a collapsed, review-oriented note, silent unless it matters, addressed to the reviewer, and honest that it proves *conditions*, not that the code is wrong.

The signals, thresholds, the automation recipes, and the research behind them are in [`docs/SESSION-HEALTH.md`](docs/SESSION-HEALTH.md).

## Dashboard

```bash
receipt dashboard       # opens http://localhost:4123
```

Spend over time, a breakdown by model and provider, your most expensive branches, and the twelve calls that ate the most. It reads the local ledger and renders with no external calls. Open [`docs/dashboard-preview.html`](docs/dashboard-preview.html) for a static snapshot built from the example data.

## Commands

| Command | Does |
| --- | --- |
| `receipt proxy` | Run the logging proxy. |
| `receipt import claude-code` | Import token usage from Claude Code logs. |
| `receipt import codex` | Import token usage from Codex CLI logs. |
| `receipt import generic <file>` | Import a JSON/JSONL usage export. |
| `receipt show` | Print the receipt for the current branch. |
| `receipt pr` | Render the PR comment as markdown. |
| `receipt post` | Post or update the sticky PR comment. |
| `receipt dashboard` | Serve the local spend dashboard. |
| `receipt wrapped` | A shareable summary of recent spend. |
| `receipt budget set <pr\|day> <usd>` | Set a spend ceiling. |
| `receipt budget plan <pro\|max5x\|max20x>` | Set your subscription tier for window math. |
| `receipt fuel` | How much of your plan you're using, and what's left. |
| `receipt records` | Your heaviest, leanest, and most recent tasks. |
| `receipt forecast` | A typical task's impact and your weekly runway. |
| `receipt advice` | How to cut wasted tokens, without making the work worse. |
| `receipt health` | Whether the current session is still sharp; warns before it degrades. `--all` for history, `--json`/`--quiet --gate` for scripts. |
| `receipt guard` | Hook entrypoint: nudge the agent the moment a session degrades (`--notify` for Claude Code). |
| `receipt statusline` | One-line usage + session-health gauge for the Claude Code statusline. |
| `receipt calibrate` | Set your real window budget from a limit you hit. |

Run any command with `--help` for its flags.

## Use it as a library

```ts
import { Pricing, readLedger, ledgerPath, buildReceipt, renderMarkdown } from "@noah-thing/receipt";

const pricing = Pricing.load(process.cwd());
const entries = readLedger(ledgerPath(process.cwd()));
const receipt = buildReceipt(entries, { currency: "USD" });
console.log(renderMarkdown(receipt));
```
