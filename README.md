# Receipt

**See what your AI coding agent cost, itemized on every pull request.**

Receipt logs the tokens and dollars your AI tools spend, then drops a line-itemized comment on the PR before you merge. Token and cost tracking for Claude Code, Cursor, Copilot, Aider, Codex, and anything that speaks the OpenAI or Anthropic API.

[![CI](https://github.com/noah-thing/receipt/actions/workflows/ci.yml/badge.svg)](https://github.com/noah-thing/receipt/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](package.json)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-blue.svg)](CONTRIBUTING.md)

---

Here is what lands on the pull request:

<!-- receipt:v1 -->
### 🧾 Receipt — `feat/payment-retries`

**$5.22** · 926k tokens · 28 calls · 2 retries

🟢 `█████████████░░░░░░░` 65% of $8.00 budget — $2.78 left

This PR cost **1.8×** more than your median PR ($2.90).

| Model | Calls | Input | Output | Cache | Cost |
| --- | --: | --: | --: | --: | --: |
| ◆ `claude-opus-4-8` | 26 | 50k | 36k | 794k | $5.19 |
| ◆ `claude-haiku-4-5` | 2 | 9.0k | 3.5k | 34k | $0.036 |

Spend over time `▅▂█▃▅▃▆▆▄▇▅▃▃▆▄▆`

Tool calls: 2× web search requests

<sub>🧾 [Receipt](https://github.com/noah-thing/receipt) · measured from real token usage · prices as of 2026-06</sub>

---

## Why

You let an agent write a feature. It ran for an hour, retried a few flaky turns, and burned through a pile of cache reads. Nobody on the team sees the bill until it lands at the end of the month, and by then the argument about who spent what is a guessing game.

Receipt puts that number where you already review the work. The reviewer opening the PR sees the cost next to the diff. No dashboard to log into, no invoice to wait for.

Every figure comes from the token counts the provider returned, multiplied by a price book you can read and override. Receipt never stores prompts or completions.

## Quick start

```bash
# clone and build (npm package coming once it stabilizes)
git clone https://github.com/noah-thing/receipt.git
cd receipt && npm install && npm run build && npm link
```

Then pick how Receipt sees your usage. Two paths.

**If you use Claude Code**, import straight from its session logs. Nothing to reconfigure:

```bash
cd your-project
receipt import claude-code
receipt show
```

**For everything else**, point the tool at the logging proxy:

```bash
receipt proxy &                       # listens on :8787
export ANTHROPIC_BASE_URL=http://localhost:8787
export OPENAI_BASE_URL=http://localhost:8787/v1
# run your agent as usual; every call gets logged
```

Either way, the receipt for the current branch is one command away:

```bash
receipt show          # terminal view
receipt pr            # the markdown comment, to stdout
receipt post          # upsert it on the open PR
```

## The same number at three altitudes

Receipt keeps one append-only ledger and reads it three ways.

- **File.** `receipt show` prints the cost of the branch you are on, scoped to the commits it adds over `main`.
- **PR.** The GitHub Action (or `receipt post` from your laptop) writes a single sticky comment and updates it in place on every push.
- **Dashboard.** `receipt dashboard` serves a local view of spend over time, by model, by branch, and the calls that cost the most.

## How it captures usage

**The proxy** sits between your tool and the provider. It forwards each request untouched, reads the `usage` block off the response, prices it, and appends a row to the ledger. It speaks both the Anthropic (`/v1/messages`) and OpenAI (`/v1/chat/completions`, `/v1/responses`) shapes, including streaming, so one proxy covers most tools. It records token counts and timing. It never records the body of a request or a response.

**The importers** read logs a tool already keeps.

- `receipt import claude-code` walks `~/.claude/projects` and turns each metered turn into a ledger row, with the git branch Claude recorded at the time.
- `receipt import generic usage.json` normalizes any JSON or JSONL export with `prompt_tokens` / `completion_tokens` or `input_tokens` / `output_tokens` fields.

Both de-duplicate on the provider request id, so you can re-run an import without double counting.

## On every pull request

Add the Action and the receipt posts itself. Full example in [`examples/github-workflow.yml`](examples/github-workflow.yml).

```yaml
# .github/workflows/receipt.yml
name: Receipt
on:
  pull_request:
    types: [opened, synchronize, reopened]
permissions:
  contents: read
  pull-requests: write
jobs:
  receipt:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: noah-thing/receipt@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

The Action reads `.receipt/ledger.jsonl` from the checkout. Get your ledger there by committing it, or by uploading it as a workflow artifact and restoring it before this step. If you would rather not touch CI, run `receipt post` from your machine after the run and it posts the same comment.

## Budgets, the brake

Set a ceiling and the receipt shows a bar against it.

```bash
receipt budget set pr 8     # warn past $8 per pull request
receipt budget set day 50   # and $50 per day
```

Under budget reads green. Past 80% turns yellow. Over the line goes red and names the overage:

```
🔴 `████████████████████` 131% of $4.00 budget — over budget by $1.22
```

Catching that before the merge is the whole point.

## Know what it cost *you*, not just dollars

Dollars are abstract on a subscription. What you actually feel is the window: the five-hour cap and the weekly one. So Receipt measures every task a second way — as a percentage of *you* — and turns it into the thing that changes how you work: what you can no longer do before the reset.

Tell it your plan once:

```bash
receipt budget plan max5x        # or: pro, max20x
```

Then `receipt fuel` shows where you stand right now:

```
🔋 Fuel — how much of you this is using

🟢 5-hour window  ███░░░░░░░░░░░░░░░░░░░░░ 11%  1.4M / 12.5M · resets in 3h30m
🟢 weekly cap     █░░░░░░░░░░░░░░░░░░░░░░░ 4%   4.6M / 125.0M · resets in 3d 0h

You could still do
  5h: ~15 PRs this size · ~8 big refactors · ~101 quick edits
  week: ~172 PRs this size · ~91 big refactors · ~1099 quick edits

Pace: ↓ sustainable (168k/hr vs 744k/hr sustainable)
```

Every PR receipt gets a matching block: the share of your 5-hour and weekly windows the branch ate, the same number in your own work-units, an efficiency grade, and the one lever worth pulling — what running the heavy model's reads on a cheaper one would have saved.

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
- **A weekly (7-day) window.** A rolling ceiling across the whole week. Heavier models draw it down faster — an hour on Opus costs far more of the window than an hour on Sonnet or Haiku.

Anthropic does not publish exact token budgets, and they shift with your model mix, so Receipt ships rough per-plan estimates and labels them as estimates everywhere they appear:

| Plan | ~5-hour budget | ~weekly budget |
| --- | --: | --: |
| `pro` | 2.5M tokens | 25M tokens |
| `max5x` | 12.5M tokens | 125M tokens |
| `max20x` | 50M tokens | 500M tokens |

Treat these as a starting point, not gospel. Two ways to replace them with your real ceiling:

- **Run the proxy.** Every response carries the provider's `anthropic-ratelimit-*` headers. Receipt reads them and writes your actual limit to `.receipt/limits.json` — no guessing.
- **Calibrate from a wall.** The moment you get rate-limited, run `receipt calibrate`; it takes what you'd spent in the window as your true budget. Add `--window week` for the weekly one.

From there the math is plain: a percentage is `tokens used ÷ that budget`, and "what you could still do" is `budget left ÷ your own median task size`. The footer always names the source — `preset`, `calibrated`, or `observed` — so you know how much to trust the number. Full detail in [`docs/LIMITS.md`](docs/LIMITS.md).

### Live in the Claude Code statusline

Put the gauge where you work, so awareness happens mid-task rather than after:

```json
// .claude/settings.json
{ "statusLine": { "type": "command", "command": "receipt statusline" } }
```

```
🔋 🟢 5h 11% · wk 4% · ~15 PRs this size · resets 3h30m
```

Don't want any of it? Set `"usage": false` in `.receipt/config.json` and the block disappears from the PR comment and `receipt show`.

### Cut the waste — `receipt advice`

```bash
receipt advice          # this branch
receipt advice --all    # the whole ledger
```

Receipt reads your usage and tells you what's driving the cost and how to spend fewer tokens — **without making the work worse.** It never suggests thinking less or writing less. It targets pure waste:

- context re-sent at full price instead of cached,
- the cache rebuilt faster than it's reused,
- retries that re-send everything for no new output,
- premium prices paid for mechanical reads a cheaper model handles at the same quality.

Each tip is ranked by impact, with the dollar saving where it can be computed. The single biggest win also rides along on every PR receipt and `receipt show`.

```
💡 Advice — cut the waste, keep the quality

What's driving the cost
  • claude-opus-4-8 — 100% of the spend
  • fresh input — 51% of the tokens

Recommendations
  ‼ Reuse your context instead of resending it   up to ~$12.15 if it cached
     Only 8% of your input came from cache; the rest was fresh, billed roughly
     10× higher for the exact same context. Keep the stable part of the prompt
     first and unchanged so it caches, and avoid /clear mid-task.
```

## Dashboard

```bash
receipt dashboard       # opens http://localhost:4123
```

Spend over time, a breakdown by model and provider, your most expensive branches, and the twelve calls that ate the most. It reads the local ledger and renders with no external calls. Open [`docs/dashboard-preview.html`](docs/dashboard-preview.html) for a static snapshot built from the example data.

## Prices, and how honest they are

The bundled [`src/prices.json`](src/prices.json) holds best-effort public list prices in USD per million tokens, stamped with the month they were checked. Your negotiated rate may differ, and prices move. Override any model without restating the table:

```json
// .receipt/prices.json
{
  "models": {
    "claude-opus-4-8": { "input": 12, "output": 60 }
  }
}
```

Cache reads and cache writes are priced with Anthropic's published multipliers (read at 0.1×, five-minute write at 1.25×, one-hour write at 2× the input rate) unless a model card states otherwise. When Receipt meets a model it has no price for, it counts the tokens and marks the line unpriced rather than invent a zero, and the receipt says so.

## Privacy

The ledger holds token counts, model names, a cost, a timestamp, and the git branch or commit. It does not hold prompts, completions, or source code. The proxy strips request and response bodies before anything is written. By default the ledger stays out of git (see [`.gitignore`](.gitignore)); commit it only if you want CI to read it.

## Works with

Claude Code, Cursor, Aider, Codex CLI, Continue, the OpenAI and Anthropic SDKs, and any client that lets you set a base URL. GitHub Copilot usage flows in through the generic importer once you export it. Providers covered out of the box: Anthropic, OpenAI, and Google Gemini.

## Commands

| Command | Does |
| --- | --- |
| `receipt proxy` | Run the logging proxy. |
| `receipt import claude-code` | Import token usage from Claude Code logs. |
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
| `receipt statusline` | One-line usage gauge for the Claude Code statusline. |
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

## FAQ

**Does it slow my agent down?** The proxy streams bytes through untouched and parses usage after the response finishes, so the client sees the provider's latency, not Receipt's.

**Do I have to run the proxy?** No. If you use Claude Code, the importer reads its logs directly. The proxy is for tools that don't keep usage logs of their own.

**Are the numbers exact?** The token counts are the provider's own. The dollar figure is those tokens against the price book, which is as exact as the prices you give it. Swap in your contract rates for an exact bill.

**Why not just read the provider's dashboard?** Because the spend you care about is per pull request and per branch, and no provider dashboard knows what a branch is.

## Roadmap

- Per-author and per-team rollups in the hosted dashboard
- Slack and Linear receipts
- A `wrapped` image worth screenshotting
- An energy estimate, clearly labeled as one

Issues and PRs welcome. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT © Noah. See [LICENSE](LICENSE).
