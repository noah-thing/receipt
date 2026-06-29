import type { Budget, Receipt } from "./types.js";
import { money, pct, progressBar, sparkline, timeBuckets, tokens } from "./util.js";

/** Hidden marker so the bot can find and update its own comment in place. */
export const COMMENT_MARKER = "<!-- receipt:v1 -->";

export interface RenderOptions {
  budget?: Budget;
  repoUrl?: string;
  priceUpdated?: string;
  /** Per-entry (ts, costUsd) pairs for the spend sparkline. */
  series?: Array<{ ts: string; cost: number }>;
  /** Median cost of recent receipts, for the "this PR vs usual" line. */
  medianPr?: number;
}

const PROVIDER_BADGE: Record<string, string> = {
  anthropic: "◆",
  openai: "○",
  google: "△",
  unknown: "·",
};

/**
 * The pull-request comment. Markdown, GitHub-flavored, screenshot-friendly.
 * This is the whole product in one artifact, so it has to read cleanly on its
 * own — no prior context, no setup, just the number and what made it.
 */
export function renderMarkdown(receipt: Receipt, opts: RenderOptions = {}): string {
  const { currency } = receipt;
  const lines: string[] = [];
  lines.push(COMMENT_MARKER);

  const scope = receipt.branch ? ` — \`${receipt.branch}\`` : "";
  lines.push(`### 🧾 Receipt${scope}`);
  lines.push("");

  if (receipt.entryCount === 0) {
    lines.push("No AI usage recorded for this branch yet.");
    lines.push("");
    lines.push(footer(opts));
    return lines.join("\n");
  }

  // Headline.
  const head = [
    `**${money(receipt.total, currency)}**`,
    `${tokens(receipt.totalTokens)} tokens`,
    `${receipt.entryCount} calls`,
  ];
  if (receipt.retries > 0) head.push(`${receipt.retries} retries`);
  lines.push(head.join(" · "));
  lines.push("");

  // Budget block.
  if (opts.budget?.perPr) {
    const frac = receipt.total / opts.budget.perPr;
    const flag = frac > 1 ? "🔴" : frac > 0.8 ? "🟡" : "🟢";
    const verdict =
      frac > 1
        ? `over budget by ${money(receipt.total - opts.budget.perPr, currency)}`
        : `${money(opts.budget.perPr - receipt.total, currency)} left`;
    lines.push(
      `${flag} \`${progressBar(frac)}\` ${pct(frac)} of ${money(opts.budget.perPr, currency)} budget — ${verdict}`,
    );
    lines.push("");
  }

  // Comparison to the team's usual PR.
  if (opts.medianPr && opts.medianPr > 0) {
    const ratio = receipt.total / opts.medianPr;
    const word = ratio >= 1 ? "more" : "less";
    lines.push(`This PR cost **${ratio.toFixed(1)}×** ${word} than your median PR (${money(opts.medianPr, currency)}).`);
    lines.push("");
  }

  // Model table.
  lines.push("| Model | Calls | Input | Output | Cache | Cost |");
  lines.push("| --- | --: | --: | --: | --: | --: |");
  for (const m of receipt.byModel) {
    const badge = PROVIDER_BADGE[m.provider] ?? "·";
    const cost = m.priced ? money(m.costUsd, currency) : "—";
    lines.push(
      `| ${badge} \`${m.model}\` | ${m.calls} | ${tokens(m.inputTokens)} | ${tokens(m.outputTokens)} | ${tokens(m.cacheReadTokens + m.cacheWriteTokens)} | ${cost} |`,
    );
  }
  lines.push("");

  // Spend sparkline across the branch.
  if (opts.series && opts.series.length > 1) {
    const buckets = timeBuckets(
      opts.series.map((s) => s.ts),
      opts.series.map((s) => s.cost),
    );
    if (buckets.length > 1) {
      lines.push(`Spend over time \`${sparkline(buckets)}\``);
      lines.push("");
    }
  }

  // Provider tool calls (web search, etc.).
  const tools = Object.entries(receipt.toolTotals).filter(([, n]) => n > 0);
  if (tools.length > 0) {
    lines.push(
      "Tool calls: " + tools.map(([t, n]) => `${n}× ${t.replace(/_/g, " ")}`).join(", "),
    );
    lines.push("");
  }

  // Honesty: flag anything we couldn't price.
  if (receipt.unpricedModels.length > 0) {
    lines.push(
      `> ⚠️ No price on file for ${receipt.unpricedModels.map((m) => `\`${m}\``).join(", ")}; ` +
        "their tokens are counted but not costed. Add them to `.receipt/prices.json`.",
    );
    lines.push("");
  }

  lines.push(footer(opts));
  return lines.join("\n");
}

function footer(opts: RenderOptions): string {
  const url = opts.repoUrl ?? "https://github.com/noah-thing/receipt";
  const priced = opts.priceUpdated ? ` · prices as of ${opts.priceUpdated}` : "";
  return `<sub>🧾 [Receipt](${url}) · measured from real token usage${priced}</sub>`;
}

/** A compact terminal version for `receipt show`. No color codes here; the CLI adds them. */
export function renderText(receipt: Receipt): string {
  const c = receipt.currency;
  const out: string[] = [];
  const scope = receipt.branch ? ` (${receipt.branch})` : "";
  out.push(`Receipt${scope}`);
  out.push(
    `${money(receipt.total, c)}  ·  ${tokens(receipt.totalTokens)} tokens  ·  ${receipt.entryCount} calls` +
      (receipt.retries ? `  ·  ${receipt.retries} retries` : ""),
  );
  out.push("");
  const nameW = Math.max(5, ...receipt.byModel.map((m) => m.model.length));
  out.push(
    `${"model".padEnd(nameW)}  ${"calls".padStart(6)}  ${"in".padStart(7)}  ${"out".padStart(7)}  ${"cache".padStart(7)}  ${"cost".padStart(9)}`,
  );
  for (const m of receipt.byModel) {
    const cost = m.priced ? money(m.costUsd, c) : "—";
    out.push(
      `${m.model.padEnd(nameW)}  ${String(m.calls).padStart(6)}  ${tokens(m.inputTokens).padStart(7)}  ${tokens(m.outputTokens).padStart(7)}  ${tokens(m.cacheReadTokens + m.cacheWriteTokens).padStart(7)}  ${cost.padStart(9)}`,
    );
  }
  if (receipt.unpricedModels.length > 0) {
    out.push("");
    out.push(`unpriced: ${receipt.unpricedModels.join(", ")} (counted, not costed)`);
  }
  return out.join("\n");
}
