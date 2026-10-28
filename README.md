# Receipt

Receipt itemizes what your AI coding agent cost and posts it as a comment on the pull request, next to the diff.

[![CI](https://github.com/noah-thing/receipt/actions/workflows/ci.yml/badge.svg)](https://github.com/noah-thing/receipt/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/noah-thing/receipt)](https://github.com/noah-thing/receipt/releases)
[![License](https://img.shields.io/github/license/noah-thing/receipt)](LICENSE)

```
$ receipt show

Receipt
$5.22  ·  926k tokens  ·  28 calls  ·  2 retries

model              calls       in      out    cache       cost
claude-opus-4-8       26      50k      36k     794k      $5.19
claude-haiku-4-5       2     9.0k     3.5k      34k     $0.036
```

That output comes from the sample ledger in [`examples/`](examples). The full pull request comment is in [`examples/receipt.example.md`](examples/receipt.example.md).

## Install

Receipt is not on npm yet. Build it from source (Node 18 or newer):

```bash
git clone https://github.com/noah-thing/receipt.git
cd receipt
npm install && npm run build && npm link
```

## Usage

Receipt reads a ledger at `.receipt/ledger.jsonl` and fills it in one of two ways.

If you use Claude Code, import its session logs:

```bash
cd your-project
receipt import claude-code
receipt show
```

For any other tool, run the logging proxy and point the tool at it:

```bash
receipt proxy &
export ANTHROPIC_BASE_URL=http://localhost:8787
export OPENAI_BASE_URL=http://localhost:8787/v1
```

A file of usage rows from some other source can be loaded with `receipt import generic <file>`.

Once the ledger has entries:

```bash
receipt show      # the receipt for the current branch, in the terminal
receipt pr        # the same receipt as the markdown pull request comment
receipt post      # create or update that comment on the open pull request
```

### GitHub Action

```yaml
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
```

The action reads `.receipt/ledger.jsonl` from the checkout, so the ledger has to be committed or restored from an artifact first. [`examples/github-workflow.yml`](examples/github-workflow.yml) shows both. The comment is updated in place on every push.

## How it works

Every call goes into an append-only ledger as a row of token counts, a model name, a cost and the git branch. The proxy reads the `usage` block off each Anthropic or OpenAI response, including streamed ones, and the importers read logs that tools already keep. Cost is those token counts multiplied by a price book in [`src/prices.json`](src/prices.json). A receipt is the slice of the ledger that belongs to a branch, grouped by model.

Models missing from the price book are counted but shown as unpriced. A zero is never invented.

## Configuration

| File | Purpose |
| --- | --- |
| `.receipt/ledger.jsonl` | The ledger. Ignored by git unless you add it deliberately. |
| `.receipt/config.json` | Budgets, plan tier, and the `usage` and `health` switches. |
| `.receipt/prices.json` | Per-model price overrides, merged over the bundled table. |

Budgets are set from the command line:

```bash
receipt budget set pr 8      # USD per pull request
receipt budget set day 50    # USD per day
```

Prices, the config keys and the privacy details are in [`docs/CONFIGURATION.md`](docs/CONFIGURATION.md).

## More

Receipt can also measure a task against your subscription window, suggest where tokens were wasted, and warn when a long session is losing quality. Those commands are described in [`docs/GUIDE.md`](docs/GUIDE.md), with the arithmetic behind them in [`docs/LIMITS.md`](docs/LIMITS.md) and [`docs/SESSION-HEALTH.md`](docs/SESSION-HEALTH.md).

## Privacy

The ledger holds token counts, model names, costs, timestamps and branch or commit names. It never holds prompts, completions or source code.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Security reports go through [SECURITY.md](SECURITY.md).

## License

MIT. See [LICENSE](LICENSE).
