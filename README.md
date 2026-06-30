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
