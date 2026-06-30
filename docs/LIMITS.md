# How the limits work, and how Receipt measures them

Receipt's usage features answer one question: *how much of my plan did this cost, and what can I still do before it resets?* This doc explains the windows, the numbers, and exactly how every figure is computed — so you can trust it, or correct it.

## The two windows

Claude subscriptions don't meter you on a dollar balance. They meter you on two rolling windows:

- **The 5-hour window.** It opens with your first prompt and resets five hours later. This is the cap you run into during a long working session.
- **The weekly (7-day) window.** A rolling ceiling across the week. It exists so sustained heavy use is bounded even if no single session trips the 5-hour cap.

Two things matter and are easy to miss:

1. **Model mix moves the needle.** The windows are spent in tokens, and an expensive model burns the budget far faster than a cheap one. An hour on Opus is worth many hours on Haiku. Receipt counts *total tokens* (input, output, cache reads, cache writes), which is the honest denominator-agnostic measure of throughput.
2. **Cache reads still count.** Re-sending context as a cached read is cheap in dollars but still moves tokens through the window. That's why a task that "felt" small can eat a surprising slice — and why Receipt's "where it went" breakdown calls out cache reads explicitly.

## How Receipt approximates a window

The ledger stores a timestamp on every call. To compute a window's usage Receipt:

1. Takes every call whose timestamp is within the last *N* hours (5h or 7d).
2. Treats the **earliest** of those as the moment the window opened.
3. Sums the total tokens of all calls inside it.
4. Sets the reset time to `opened_at + window_length`.

This is a close approximation of Anthropic's "fixed-from-first-use" behaviour. It can differ from the provider's own clock by a little — the provider knows the exact anchor and you don't — which is why the live header source (below) is always preferred when available.

## The numbers, and why they're estimates

Anthropic does not publish exact per-window token budgets, and the effective ceiling shifts with your model mix and with policy changes over time. So Receipt ships **rough per-plan estimates** and labels them as estimates everywhere they appear:

| Plan (`receipt budget plan …`) | ~5-hour budget | ~weekly budget |
| --- | --: | --: |
| `pro` | 2,500,000 tokens | 25,000,000 tokens |
| `max5x` | 12,500,000 tokens | 125,000,000 tokens |
| `max20x` | 50,000,000 tokens | 500,000,000 tokens |

These are deliberately round and conservative. They exist so the feature works on day one, not so you take them as fact. **Replace them with your real numbers** as soon as you can — there are two ways, best first.

### 1. Observed — from the provider's own headers (most accurate)

Run the logging proxy:

```bash
receipt proxy
export ANTHROPIC_BASE_URL=http://localhost:8787
```

Anthropic responses carry rate-limit headers (`anthropic-ratelimit-unified-limit` and friends) that state your real limit. Receipt reads them on every response and writes the result to `.receipt/limits.json` with `"source": "observed"`. No guessing, and it updates itself as your plan or the provider's policy changes.

### 2. Calibrated — from a wall you actually hit

If you can't run the proxy, calibrate from reality the next time you get rate-limited:

```bash
receipt calibrate              # uses what you'd spent in the current 5h window
receipt calibrate --window week
receipt calibrate 9000000      # or state the number explicitly
```

That writes `.receipt/limits.json` with `"source": "calibrated"`. It's an estimate too, but it's *your* estimate from *your* wall, which beats a generic preset.

### Which one is in effect

`receipt budget` prints the resolved window and its source. Precedence, highest first:

1. `.receipt/limits.json` (observed or calibrated)
2. `planBudget` in `.receipt/config.json` (a custom value you set by hand)
3. the preset for your `plan`

If none is set, the percentage gauges turn off and Receipt falls back to history-only framings (records, pace ratio, work-units) that need no denominator.

## How each number is computed

Once a budget is known, everything else is plain arithmetic over your ledger:

- **% of a window** = `tokens in this task ÷ window budget`.
- **What you could still do** = `(window budget − used) ÷ your median task size`, expressed in your own task buckets (quick edit / PR / refactor / feature). Those buckets are the 25th / 50th / 75th / 90th percentiles of your per-branch token totals, so "≈ 2 PRs" means *your* PRs. Before there's enough history (fewer than four branches) it uses labelled defaults.
- **Pace** = `tokens in the last hour ÷ (weekly budget ÷ 168)`. Above 1.0 means you're burning faster than a rate that lasts the week.
- **Weekly runway** = `(weekly budget − weekly used) ÷ tokens in the last 24h`, projected to a date.
- **Efficiency grade** is a heuristic 0–100: it rewards a high cache-hit rate and punishes retries. It's a nudge, not a verdict.
- **The lever (what-if)** reprices the heaviest model's *read* tokens (fresh input + cache reads) at a cheaper model using the price book, and reports the saving. It's the one change most people can make today: stop paying top-tier prices to re-read files.
- **Fun equivalences** (`--fun`) anchor to real counts — your repo's own size (≈ chars ÷ 4), a novel (~105k tokens), War and Peace (~780k tokens) — so they're playful but not made up.

## Privacy

All of this reads the same local, append-only ledger of token counts and timestamps. No prompts, no completions, no source code, and nothing leaves your machine. The rate-limit capture stores only the numeric limit, never any request content.
