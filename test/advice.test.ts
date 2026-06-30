import { describe, expect, it } from "vitest";
import { recommend, costDrivers, topRecommendation } from "../src/advice.js";
import { buildReceipt } from "../src/receipt.js";
import { Pricing } from "../src/pricing.js";
import type { LedgerEntry } from "../src/types.js";

const pricing = Pricing.load();

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

describe("recommend — never tells the agent to do less", () => {
  it("contains no 'work less / produce less' advice in any branch", () => {
    // A worst-case receipt that would have tempted an 'ask for less output' rule.
    const r = buildReceipt([
      e({ model: "claude-opus-4-8", inputTokens: 900_000, cacheReadTokens: 0, outputTokens: 900_000, costUsd: 80, retries: 5 }),
    ]);
    const recs = recommend(r, pricing);
    const text = recs.map((x) => `${x.id} ${x.title} ${x.detail}`).join(" ").toLowerCase();
    expect(text).not.toMatch(/less output|work less|explain less|do less|shorter response|be brief|fewer tokens of output/);
    expect(recs.some((x) => x.id === "verbose-output")).toBe(false);
  });
});

describe("recommend — waste detection", () => {
  it("flags low cache reuse as the top, high-severity fix", () => {
    const r = buildReceipt([
      e({ model: "claude-opus-4-8", inputTokens: 800_000, cacheReadTokens: 0, outputTokens: 50_000, costUsd: 20 }),
    ]);
    const recs = recommend(r, pricing);
    const cache = recs.find((x) => x.id === "cache-reuse");
    expect(cache).toBeDefined();
    expect(cache!.severity).toBe("high");
  });

  it("suggests matching the model to the task (quality-preserving framing)", () => {
    const r = buildReceipt([
      e({ model: "claude-opus-4-8", inputTokens: 400_000, cacheReadTokens: 400_000, outputTokens: 20_000, costUsd: 12 }),
    ]);
    const mix = recommend(r, pricing).find((x) => x.id === "model-mix");
    expect(mix).toBeDefined();
    expect(mix!.detail.toLowerCase()).toMatch(/keep it for the real reasoning|hard thinking|same quality/);
    expect(mix!.impact).toMatch(/\$/);
  });

  it("flags retries", () => {
    const r = buildReceipt([
      e({ retries: 1 }),
      e({ retries: 1 }),
      e({ retries: 1 }),
    ]);
    expect(recommend(r, pricing).some((x) => x.id === "retries")).toBe(true);
  });

  it("returns a single positive note when there's nothing wasteful to cut", () => {
    const r = buildReceipt([
      e({ model: "claude-3-haiku", inputTokens: 40_000, cacheReadTokens: 960_000, outputTokens: 40_000, costUsd: 0.5, retries: 0 }),
    ]);
    const recs = recommend(r, pricing);
    expect(recs).toHaveLength(1);
    expect(recs[0]!.id).toBe("clean");
  });

  it("returns nothing for an empty receipt", () => {
    expect(recommend(buildReceipt([]), pricing)).toHaveLength(0);
  });
});

describe("costDrivers — what's costing so much", () => {
  it("names the dominant model and token class", () => {
    const r = buildReceipt([
      e({ model: "claude-opus-4-8", inputTokens: 100_000, cacheReadTokens: 900_000, outputTokens: 50_000, costUsd: 18 }),
    ]);
    const d = costDrivers(r);
    expect(d.join(" ")).toMatch(/claude-opus-4-8/);
    expect(d.join(" ")).toMatch(/cache reads|fresh input|output/);
  });
});

describe("topRecommendation", () => {
  it("returns the highest-priority actionable tip and skips the clean note", () => {
    const wasteful = buildReceipt([
      e({ model: "claude-opus-4-8", inputTokens: 800_000, cacheReadTokens: 0, outputTokens: 50_000, costUsd: 20 }),
    ]);
    expect(topRecommendation(wasteful, pricing)?.id).toBe("cache-reuse");

    const lean = buildReceipt([
      e({ model: "claude-3-haiku", inputTokens: 40_000, cacheReadTokens: 960_000, outputTokens: 40_000, costUsd: 0.5 }),
    ]);
    expect(topRecommendation(lean, pricing)).toBeUndefined();
  });
});
