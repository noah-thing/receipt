# Configuration

Everything Receipt reads lives under `.receipt/` in your repository.

## config.json

`receipt budget set` and `receipt budget plan` write this file; you can also edit it by hand.

| Key | Meaning |
| --- | --- |
| `currency` | Currency code shown on receipts. |
| `budget.perPr`, `budget.perDay` | Spend ceilings in USD. |
| `plan` | Subscription tier: `pro`, `max5x`, `max20x` or `custom`. |
| `planBudget` | A custom window budget that overrides the preset for `plan`. |
| `fun` | Show playful equivalences by default. |
| `usage` | Set to `false` to drop the usage block from the comment and `receipt show`. |
| `health` | Set to `false` to drop the session health note from the comment. |

Setting `RECEIPT_LEDGER` points Receipt at a ledger somewhere other than `.receipt/ledger.jsonl`.

## Prices, and how honest they are

The bundled [`src/prices.json`](src/prices.json) holds best-effort public list prices in USD per million tokens, stamped with the month they were checked. Models that charge more for long prompts (Haiku 5.5 over 100k tokens, Gemini Pro and Grok over 200k, GPT over 272k) are priced at the standard rate, so very long calls on those models read low. Your negotiated rate may differ, and prices move. Override any model without restating the table:

```json
// .receipt/prices.json
{
  "models": {
    "claude-opus-5-5": { "input": 3.2, "output": 16 }
  }
}
```

Cache reads and cache writes are priced with Anthropic's published multipliers (read at 0.1×, five-minute write at 1.25×, one-hour write at 2× the input rate) unless a model card states otherwise. When Receipt meets a model it has no price for, it counts the tokens and marks the line unpriced rather than invent a zero, and the receipt says so.

## Privacy

The ledger holds token counts, model names, a cost, a timestamp, and the git branch or commit. It does not hold prompts, completions, or source code. The proxy strips request and response bodies before anything is written. By default the ledger stays out of git (see [`.gitignore`](.gitignore)); commit it only if you want CI to read it.

## FAQ

**Does it slow my agent down?** The proxy streams bytes through untouched and parses usage after the response finishes, so the client sees the provider's latency, not Receipt's.

**Do I have to run the proxy?** No. If you use Claude Code or Codex CLI, the importers read their logs directly. The proxy is for tools that don't keep usage logs of their own.

**Are the numbers exact?** The token counts are the provider's own. The dollar figure is those tokens against the price book, which is as exact as the prices you give it. Swap in your contract rates for an exact bill.

**Why not just read the provider's dashboard?** Because the spend you care about is per pull request and per branch, and no provider dashboard knows what a branch is.
