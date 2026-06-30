/**
 * Advice — how to spend fewer tokens without making the work worse.
 *
 * The guiding rule: never tell the agent to think less, explain less, or produce
 * less. Output and reasoning are the value. This advisor only targets *waste* —
 * tokens spent without adding anything: context re-sent instead of cached,
 * retries, cache rebuilt faster than it's reused, premium prices paid for
 * mechanical reads, and cost you can't see because a model is unpriced. It also
 * names what is actually driving the bill, so you know where to look.
 *
 * Pure and deterministic: no API key, no network, nothing leaves your machine.
 * Every rule fires only on a real signal in your own data.
 */
import type { Receipt } from "./types.js";
import { Pricing } from "./pricing.js";
import { efficiencyGrade, whatIf, whereItWent } from "./usage.js";
import { money } from "./util.js";

export type Severity = "high" | "medium" | "low";

export interface Recommendation {
  id: string;
  severity: Severity;
  /** Short imperative headline. */
  title: string;
  /** Why it costs, and how to fix it — without losing quality. */
  detail: string;
  /** Estimated saving, when computable (e.g. "~$2.80 · 37% of this"). */
  impact?: string;
}

const RANK: Record<Severity, number> = { high: 0, medium: 1, low: 2 };

/** Cost of N tokens of a model billed as fresh input vs as cache reads. */
function freshVsCached(pricing: Pricing, model: string, tokens: number): number | undefined {
  const base = { outputTokens: 0, cacheWrite5mTokens: 0, cacheWrite1hTokens: 0 };
  const fresh = pricing.cost({ model, inputTokens: tokens, cacheReadTokens: 0, ...base });
  const cached = pricing.cost({ model, inputTokens: 0, cacheReadTokens: tokens, ...base });
  if (fresh === null || cached === null) return undefined;
  return fresh - cached;
}

/** What's actually driving the cost — the answer to "why is this so much?". */
export function costDrivers(receipt: Receipt): string[] {
  const out: string[] = [];
  const byCost = [...receipt.byModel].filter((m) => m.priced).sort((a, b) => b.costUsd - a.costUsd);
  const top = byCost[0];
  if (top && receipt.total > 0) {
    out.push(`\`${top.model}\` — ${Math.round((top.costUsd / receipt.total) * 100)}% of the spend`);
  }
  const comp = whereItWent(receipt);
  const classes: Array<[string, number]> = [
    ["output", comp.output],
    ["fresh input", comp.freshInput],
    ["cache reads", comp.cacheRead],
    ["cache writes", comp.cacheWrite],
  ];
  classes.sort((a, b) => b[1] - a[1]);
  if (classes[0] && classes[0][1] > 0) {
    out.push(`${classes[0][0]} — ${Math.round(classes[0][1] * 100)}% of the tokens`);
  }
  if (receipt.retries > 0) out.push(`${receipt.retries} retr${receipt.retries === 1 ? "y" : "ies"}`);
  return out;
}

/**
 * Build the ranked list of waste-cutting recommendations for a receipt.
 * Returns a single positive note when nothing is worth changing.
 */
export function recommend(receipt: Receipt, pricing: Pricing): Recommendation[] {
  const recs: Recommendation[] = [];
  if (receipt.totalTokens === 0) return recs;

  const comp = whereItWent(receipt);
  const grade = efficiencyGrade(receipt);
  const currency = receipt.currency;
  const top = receipt.byModel.find((m) => m.priced && m.costUsd > 0);

  // 1. Low cache reuse — fresh input is ~10× the price of a cache read. Pure
  //    waste: same context, full price, no extra quality.
  const inputAll = comp.freshInput + comp.cacheRead;
  if (inputAll > 0.25 && comp.cacheRead / Math.max(inputAll, 1e-9) < 0.4 && comp.freshInput > 0.25) {
    const saving = top ? freshVsCached(pricing, top.model, top.inputTokens) : undefined;
    recs.push({
      id: "cache-reuse",
      severity: "high",
      title: "Reuse your context instead of resending it",
      detail:
        `Only ${Math.round((comp.cacheRead / Math.max(inputAll, 1e-9)) * 100)}% of your input came from ` +
        `cache; the rest was fresh, billed roughly 10× higher for the exact same context. Keep the stable ` +
        `part of the prompt first and unchanged (same system prompt, same file order) so it caches, and ` +
        `avoid \`/clear\` mid-task — each clear throws the cache away and you pay full price to rebuild it. ` +
        `This is pure savings; the model still sees everything it did before.`,
      impact: saving && saving > 0 ? `up to ~${money(saving, currency)} if it cached` : undefined,
    });
  }

  // 2. Model mix — match the model to the task. Quality on the hard work is
  //    untouched; you just stop paying top-tier prices for mechanical reads.
  const wi = whatIf(receipt, pricing);
  if (wi && wi.savedFrac >= 0.12) {
    recs.push({
      id: "model-mix",
      severity: wi.savedFrac >= 0.3 ? "high" : "medium",
      title: "Match the model to the task",
      detail:
        `Most of this ran on \`${wi.fromModel}\`. Keep it for the real reasoning — but its plain file-reads ` +
        `and mechanical edits would cost a fraction on \`${wi.toModel}\` at the same quality for that kind of ` +
        `work. Send the easy parts down a tier and keep the hard thinking where it is.`,
      impact: `~${money(wi.saved, currency)} · ${Math.round(wi.savedFrac * 100)}% of this`,
    });
  }

  // 3. Cache-write churn — paying to rebuild the cache faster than you reuse it.
  if (comp.cacheWrite > 0.1 && comp.cacheWrite > comp.cacheRead * 1.5) {
    recs.push({
      id: "cache-churn",
      severity: "medium",
      title: "Stop rebuilding the cache every turn",
      detail:
        `Cache writes (${Math.round(comp.cacheWrite * 100)}%) outweigh cache reads ` +
        `(${Math.round(comp.cacheRead * 100)}%), which usually means the early context keeps changing ` +
        `between calls so nothing gets reused. Pin the system prompt and the first files; let the volatile ` +
        `parts come last. Same information reaches the model, less of it is rewritten.`,
    });
  }

  // 4. Retries — re-sending the whole context for no new output. Pure waste.
  const retryRate = receipt.entryCount > 0 ? receipt.retries / receipt.entryCount : 0;
  if (receipt.retries >= 2 && retryRate >= 0.1) {
    recs.push({
      id: "retries",
      severity: "medium",
      title: "Track down the retries",
      detail:
        `${receipt.retries} ${receipt.retries === 1 ? "retry" : "retries"} across ${receipt.entryCount} ` +
        `calls (${Math.round(retryRate * 100)}%). Each one re-sends the full context and produces nothing ` +
        `new. They usually trace to a flaky tool, a malformed tool call, or transient overload — fixing the ` +
        `cause costs you no capability, just removes the wasted re-sends.`,
    });
  }

  // 5. Provider tool calls — billed per request on top of tokens.
  const tools = Object.entries(receipt.toolTotals).filter(([, n]) => n > 0);
  const toolTotal = tools.reduce((s, [, n]) => s + n, 0);
  if (toolTotal >= 5) {
    recs.push({
      id: "tool-calls",
      severity: "low",
      title: "Mind the provider tool calls",
      detail:
        `${toolTotal} provider tool call${toolTotal === 1 ? "" : "s"} (${tools
          .map(([t, n]) => `${n}× ${t.replace(/_/g, " ")}`)
          .join(", ")}) are billed per request on top of tokens. Reuse results you'll need again, or scope ` +
        `searches more tightly — without skipping the ones that actually inform the work.`,
    });
  }

  // 6. Unpriced models — you can't optimize what you can't measure.
  if (receipt.unpricedModels.length > 0) {
    recs.push({
      id: "unpriced",
      severity: "low",
      title: "Add prices for unrecognized models",
      detail:
        `No price on file for ${receipt.unpricedModels.map((m) => `\`${m}\``).join(", ")}, so their cost is ` +
        `missing from this analysis. Add them to \`.receipt/prices.json\`.`,
    });
  }

  recs.sort((a, b) => RANK[a.severity] - RANK[b.severity]);

  if (recs.length === 0) {
    recs.push({
      id: "clean",
      severity: "low",
      title: "Already lean",
      detail:
        `Good cache reuse, few retries, sensible model mix (grade ${grade.letter}). Nothing to cut without ` +
        `touching the actual work — keep an eye on it with \`receipt fuel\`.`,
    });
  }

  return recs.slice(0, 6);
}

/** The single most actionable tip, for a one-liner on the receipt. Skips the "clean" note. */
export function topRecommendation(receipt: Receipt, pricing: Pricing): Recommendation | undefined {
  return recommend(receipt, pricing).filter((r) => r.id !== "clean")[0];
}
