import { describe, expect, it } from "vitest";
import { buildReceipt, selectEntries } from "../src/receipt.js";
import type { LedgerEntry } from "../src/types.js";

function e(over: Partial<LedgerEntry>): LedgerEntry {
  return {
    ts: "2026-06-29T10:00:00.000Z",
    model: "claude-opus-4-8",
    provider: "anthropic",
    inputTokens: 1000,
    outputTokens: 500,
    cacheReadTokens: 0,
    cacheWrite5mTokens: 0,
    cacheWrite1hTokens: 0,
    costUsd: 1,
    source: "test",
    ...over,
  };
}

describe("selectEntries", () => {
  const entries = [
    e({ ts: "2026-06-01T00:00:00Z", git: { branch: "main", sha: "base1" } }),
    e({ ts: "2026-06-10T00:00:00Z", git: { branch: "feature", sha: "feat1" } }),
    e({ ts: "2026-06-11T00:00:00Z", git: { branch: "feature", sha: "feat2" } }),
    e({ ts: "2026-06-12T00:00:00Z", git: { branch: "other", sha: "feat3" } }),
  ];

  it("selects by branch name", () => {
    const got = selectEntries(entries, { branch: "feature" });
    expect(got).toHaveLength(2);
  });

  it("selects by commit range when shas are given", () => {
    const got = selectEntries(entries, { rangeShas: new Set(["feat1", "feat3"]) });
    expect(got.map((x) => x.git?.sha).sort()).toEqual(["feat1", "feat3"]);
  });

  it("unions branch and range matches", () => {
    const got = selectEntries(entries, { branch: "feature", rangeShas: new Set(["feat3"]) });
    // feat1, feat2 (branch) + feat3 (range)
    expect(got).toHaveLength(3);
  });

  it("honors a since floor", () => {
    const got = selectEntries(entries, { branch: "feature", sinceTs: "2026-06-11T00:00:00Z" });
    expect(got).toHaveLength(1);
    expect(got[0]!.git?.sha).toBe("feat2");
  });

  it("returns everything when no scope is given", () => {
    expect(selectEntries(entries, {})).toHaveLength(4);
  });
});

describe("buildReceipt", () => {
  it("totals cost and tokens and groups by model", () => {
    const r = buildReceipt([
      e({ model: "claude-opus-4-8", costUsd: 2, inputTokens: 1000, outputTokens: 1000 }),
      e({ model: "claude-opus-4-8", costUsd: 1, inputTokens: 500, outputTokens: 500 }),
      e({ model: "claude-haiku-4-5", costUsd: 0.1, inputTokens: 200, outputTokens: 100 }),
    ]);
    expect(r.total).toBeCloseTo(3.1, 6);
    expect(r.byModel).toHaveLength(2);
    expect(r.byModel[0]!.model).toBe("claude-opus-4-8"); // sorted by cost desc
    expect(r.byModel[0]!.calls).toBe(2);
  });

  it("counts unpriced models without breaking the total", () => {
    const r = buildReceipt([
      e({ model: "known", costUsd: 5 }),
      e({ model: "mystery", costUsd: null }),
    ]);
    expect(r.total).toBe(5);
    expect(r.unpricedModels).toContain("mystery");
    expect(r.byModel.find((m) => m.model === "mystery")!.priced).toBe(false);
  });

  it("sums retries and tool calls", () => {
    const r = buildReceipt([
      e({ retries: 2, toolCalls: { web_search_requests: 3 } }),
      e({ retries: 1, toolCalls: { web_search_requests: 1 } }),
    ]);
    expect(r.retries).toBe(3);
    expect(r.toolTotals.web_search_requests).toBe(4);
  });

  it("handles an empty selection", () => {
    const r = buildReceipt([]);
    expect(r.total).toBe(0);
    expect(r.entryCount).toBe(0);
    expect(r.byModel).toEqual([]);
  });
});
