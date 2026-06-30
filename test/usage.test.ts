import { describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  capacity,
  captureLimits,
  efficiencyGrade,
  entryTokens,
  fuel,
  funEquivalences,
  inWorkUnits,
  paceState,
  quantile,
  readObservedBudget,
  records,
  taskImpact,
  taskSizes,
  whereItWent,
  windowState,
  writeObservedBudget,
  FIVE_HOURS_MS,
  WEEK_MS,
} from "../src/usage.js";
import { buildReceipt } from "../src/receipt.js";
import type { LedgerEntry, PlanBudget } from "../src/types.js";

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

const NOW = new Date("2026-06-29T12:00:00.000Z").getTime();

describe("entryTokens", () => {
  it("sums every token field", () => {
    expect(
      entryTokens(
        e({ inputTokens: 10, outputTokens: 20, cacheReadTokens: 30, cacheWrite5mTokens: 1, cacheWrite1hTokens: 2 }),
      ),
    ).toBe(63);
  });
});

describe("quantile", () => {
  it("interpolates", () => {
    expect(quantile([1, 2, 3, 4], 0.5)).toBe(2.5);
    expect(quantile([10], 0.9)).toBe(10);
    expect(quantile([], 0.5)).toBe(0);
  });
});

describe("windowState", () => {
  it("counts only entries inside the window and computes a reset time", () => {
    const entries = [
      e({ ts: new Date(NOW - 6 * 60 * 60 * 1000).toISOString(), inputTokens: 100, outputTokens: 0 }), // 6h ago, outside 5h
      e({ ts: new Date(NOW - 2 * 60 * 60 * 1000).toISOString(), inputTokens: 200, outputTokens: 0 }), // inside
      e({ ts: new Date(NOW - 1 * 60 * 60 * 1000).toISOString(), inputTokens: 300, outputTokens: 0 }), // inside
    ];
    const w = windowState(entries, FIVE_HOURS_MS, NOW, 1000);
    expect(w.used).toBe(500); // only the two inside the 5h window
    expect(w.calls).toBe(2);
    expect(w.frac).toBeCloseTo(0.5, 5);
    // window opened at the earliest in-window entry (2h ago) and resets 5h later
    expect(w.resetAt).toBe(NOW - 2 * 60 * 60 * 1000 + FIVE_HOURS_MS);
  });

  it("is empty and unfracted with no usage or no budget", () => {
    const w = windowState([], FIVE_HOURS_MS, NOW);
    expect(w.used).toBe(0);
    expect(w.frac).toBeUndefined();
  });
});

describe("taskSizes", () => {
  it("falls back to defaults without enough history", () => {
    const s = taskSizes([e({ git: { branch: "a" } })]);
    expect(s.learned).toBe(false);
    expect(s.pr).toBeGreaterThan(0);
  });

  it("learns from the branch distribution", () => {
    const entries: LedgerEntry[] = [];
    for (let i = 1; i <= 8; i++) {
      entries.push(e({ git: { branch: `b${i}` }, inputTokens: i * 1000, outputTokens: 0, cacheReadTokens: 0 }));
    }
    const s = taskSizes(entries);
    expect(s.learned).toBe(true);
    expect(s.quick).toBeLessThan(s.pr);
    expect(s.pr).toBeLessThanOrEqual(s.refactor);
    expect(s.refactor).toBeLessThanOrEqual(s.feature);
  });
});

describe("capacity & inWorkUnits", () => {
  const sizes = { quick: 50, pr: 300, refactor: 900, feature: 2000, learned: true };
  it("lists what the remaining budget buys", () => {
    const items = capacity(1000, sizes);
    expect(items.find((i) => i.label === "PRs this size")?.count).toBe(3);
    expect(items.find((i) => i.label === "quick edits")?.count).toBe(20);
  });
  it("returns nothing when too little is left", () => {
    expect(capacity(10, sizes)).toHaveLength(0);
  });
  it("expresses tokens in the largest unit that fits", () => {
    expect(inWorkUnits(2100, sizes)).toMatch(/feature/);
    expect(inWorkUnits(310, sizes)).toMatch(/PR/);
  });
});

describe("efficiencyGrade", () => {
  it("rewards cache hits and punishes retries", () => {
    const cached = buildReceipt([
      e({ inputTokens: 100, cacheReadTokens: 900, outputTokens: 100, retries: 0 }),
    ]);
    const churny = buildReceipt([
      e({ inputTokens: 1000, cacheReadTokens: 0, outputTokens: 100, retries: 5 }),
    ]);
    expect(efficiencyGrade(cached).score).toBeGreaterThan(efficiencyGrade(churny).score);
    expect(efficiencyGrade(cached).letter).toMatch(/[A-F]/);
  });
});

describe("whereItWent", () => {
  it("breaks total tokens into fractions that sum to ~1", () => {
    const r = buildReceipt([
      e({ inputTokens: 250, outputTokens: 250, cacheReadTokens: 250, cacheWrite5mTokens: 250, cacheWrite1hTokens: 0 }),
    ]);
    const c = whereItWent(r);
    const sum = c.output + c.freshInput + c.cacheRead + c.cacheWrite;
    expect(sum).toBeCloseTo(1, 5);
    expect(c.output).toBeCloseTo(0.25, 5);
  });
});

describe("taskImpact", () => {
  const budget: PlanBudget = { fiveHour: 1000, weekly: 10000, source: "custom" };
  it("computes share of each window", () => {
    const imp = taskImpact(250, budget)!;
    expect(imp.fiveHour).toBeCloseTo(0.25, 5);
    expect(imp.weekly).toBeCloseTo(0.025, 5);
  });
  it("is undefined without a budget", () => {
    expect(taskImpact(250, undefined)).toBeUndefined();
  });
});

describe("paceState", () => {
  it("flags burning faster than sustainable", () => {
    const entries = [e({ ts: new Date(NOW - 5 * 60 * 1000).toISOString(), inputTokens: 1_000_000, outputTokens: 0 })];
    const weeklyBudget = 1_680_000; // => 10k/hr sustainable
    const p = paceState(entries, weeklyBudget, NOW, 0);
    // 1M in the last hour vs 10k/hr sustainable -> ratio >> 1
    expect(p.ratio).toBeGreaterThan(1);
    expect(p.lastHour).toBe(1_000_000);
    expect(p.runwayDays).toBeDefined();
  });
});

describe("fuel", () => {
  const budget: PlanBudget = { fiveHour: 1_000_000, weekly: 10_000_000, source: "preset" };
  it("assembles window state and capacity", () => {
    const entries = [
      e({ ts: new Date(NOW - 30 * 60 * 1000).toISOString(), inputTokens: 200_000, outputTokens: 0 }),
    ];
    const f = fuel(entries, budget, NOW);
    expect(f.fiveHour.used).toBe(200_000);
    expect(f.fiveHour.frac).toBeCloseTo(0.2, 5);
    expect(f.budget?.source).toBe("preset");
    expect(Array.isArray(f.capacityFiveHour)).toBe(true);
  });
  it("works with no budget (history-only)", () => {
    const f = fuel([e({})], undefined, NOW);
    expect(f.fiveHour.frac).toBeUndefined();
    expect(f.capacityFiveHour).toHaveLength(0);
  });
});

describe("records", () => {
  it("ranks tasks and finds the latest's place", () => {
    const entries = [
      e({ git: { branch: "small" }, ts: "2026-06-01T00:00:00Z", inputTokens: 100, outputTokens: 0, cacheReadTokens: 0 }),
      e({ git: { branch: "big" }, ts: "2026-06-02T00:00:00Z", inputTokens: 10_000, outputTokens: 0, cacheReadTokens: 0 }),
      e({ git: { branch: "latest" }, ts: "2026-06-10T00:00:00Z", inputTokens: 500, outputTokens: 0, cacheReadTokens: 0 }),
    ];
    const r = records(entries);
    expect(r.priciest?.key).toBe("big");
    expect(r.leanest?.key).toBe("small");
    expect(r.latest?.key).toBe("latest");
    expect(r.latestRank).toBe(2); // latest is the 2nd-heaviest
  });
});

describe("funEquivalences", () => {
  it("anchors comparisons to real token counts", () => {
    const eqs = funEquivalences(1_600_000, 200_000);
    expect(eqs.some((s) => s.includes("repo"))).toBe(true);
    expect(eqs.some((s) => s.includes("War and Peace"))).toBe(true);
  });
});

describe("observed budget round-trip + captureLimits", () => {
  it("writes and reads a budget, and learns from rate-limit headers", () => {
    const dir = mkdtempSync(join(tmpdir(), "receipt-usage-"));
    try {
      writeObservedBudget(dir, { fiveHour: 5, weekly: 25, source: "custom" });
      expect(readObservedBudget(dir)?.fiveHour).toBe(5);

      const headers: Record<string, string> = {
        "anthropic-ratelimit-unified-limit": "1000000",
      };
      captureLimits((name) => headers[name] ?? null, dir);
      const b = readObservedBudget(dir)!;
      expect(b.source).toBe("observed");
      expect(b.fiveHour).toBeGreaterThanOrEqual(1_000_000);
      expect(b.weekly).toBeGreaterThanOrEqual(b.fiveHour);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("ignores responses with no usable limit header", () => {
    const dir = mkdtempSync(join(tmpdir(), "receipt-usage-"));
    try {
      captureLimits(() => null, dir);
      expect(readObservedBudget(dir)).toBeUndefined();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
