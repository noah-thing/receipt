import type { LedgerEntry, ModelRollup, Receipt } from "./types.js";

export interface SelectOptions {
  branch?: string;
  base?: string;
  /** Only entries at or after this ISO time. */
  sinceTs?: string;
  /** Only entries before this ISO time. */
  untilTs?: string;
  /** Commit SHAs that belong to the pull request (branch minus base). */
  rangeShas?: Set<string>;
  currency?: string;
}

/**
 * Decide which ledger entries belong to a receipt.
 *
 * An entry counts when its commit is part of the branch's range, or when it
 * was logged while sitting on the branch inside the time window. The two rules
 * together cover both "I committed my ledger" and "I just ran the agent here".
 */
export function selectEntries(entries: LedgerEntry[], opts: SelectOptions): LedgerEntry[] {
  const { branch, sinceTs, untilTs, rangeShas } = opts;
  const sinceMs = sinceTs ? new Date(sinceTs).getTime() : undefined;
  const untilMs = untilTs ? new Date(untilTs).getTime() : undefined;

  return entries.filter((e) => {
    const t = new Date(e.ts).getTime();
    if (sinceMs !== undefined && t < sinceMs) return false;
    if (untilMs !== undefined && t >= untilMs) return false;

    // No branch filter requested: the time window alone decides.
    if (!branch && !rangeShas) return true;

    const shaHit = rangeShas && e.git?.sha ? rangeShas.has(e.git.sha) : false;
    const branchHit = branch ? e.git?.branch === branch : false;
    if (!branch && rangeShas) return shaHit;
    if (branch && !rangeShas) return branchHit;
    return shaHit || branchHit;
  });
}

/** Roll selected entries into a renderable receipt. */
export function buildReceipt(selected: LedgerEntry[], opts: SelectOptions = {}): Receipt {
  const byModelMap = new Map<string, ModelRollup>();
  const toolTotals: Record<string, number> = {};
  const unpriced = new Set<string>();

  let total = 0;
  let totalTokens = 0;
  let retries = 0;
  let first: string | undefined;
  let last: string | undefined;

  for (const e of selected) {
    const r =
      byModelMap.get(e.model) ??
      ({
        model: e.model,
        provider: e.provider,
        calls: 0,
        inputTokens: 0,
        outputTokens: 0,
        cacheReadTokens: 0,
        cacheWriteTokens: 0,
        costUsd: 0,
        priced: true,
      } satisfies ModelRollup);

    r.calls += 1;
    r.inputTokens += e.inputTokens;
    r.outputTokens += e.outputTokens;
    r.cacheReadTokens += e.cacheReadTokens;
    r.cacheWriteTokens += e.cacheWrite5mTokens + e.cacheWrite1hTokens;

    if (e.costUsd === null) {
      r.priced = false;
      unpriced.add(e.model);
    } else {
      r.costUsd += e.costUsd;
      total += e.costUsd;
    }

    totalTokens +=
      e.inputTokens +
      e.outputTokens +
      e.cacheReadTokens +
      e.cacheWrite5mTokens +
      e.cacheWrite1hTokens;
    retries += e.retries ?? 0;

    for (const [tool, count] of Object.entries(e.toolCalls ?? {})) {
      toolTotals[tool] = (toolTotals[tool] ?? 0) + count;
    }

    if (!first || e.ts < first) first = e.ts;
    if (!last || e.ts > last) last = e.ts;

    byModelMap.set(e.model, r);
  }

  const byModel = [...byModelMap.values()].sort((a, b) => b.costUsd - a.costUsd);

  return {
    total,
    unpricedModels: [...unpriced],
    totalTokens,
    entryCount: selected.length,
    retries,
    byModel,
    toolTotals,
    firstTs: first,
    lastTs: last,
    branch: opts.branch,
    base: opts.base,
    currency: opts.currency ?? "USD",
  };
}
