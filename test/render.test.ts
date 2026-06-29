import { describe, expect, it } from "vitest";
import { buildReceipt } from "../src/receipt.js";
import { COMMENT_MARKER, renderMarkdown } from "../src/render.js";
import { money, sparkline, timeBuckets, tokens } from "../src/util.js";
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
    costUsd: 4.18,
    source: "test",
    ...over,
  };
}

describe("renderMarkdown", () => {
  it("includes the sticky marker so the bot can update in place", () => {
    const md = renderMarkdown(buildReceipt([e({})]));
    expect(md.startsWith(COMMENT_MARKER)).toBe(true);
  });

  it("leads with the dollar amount", () => {
    const md = renderMarkdown(buildReceipt([e({ costUsd: 4.18 })], { branch: "feat/x" }));
    expect(md).toContain("**$4.18**");
    expect(md).toContain("`feat/x`");
  });

  it("shows an over-budget flag when the ceiling is crossed", () => {
    const md = renderMarkdown(buildReceipt([e({ costUsd: 10 })]), { budget: { perPr: 5 } });
    expect(md).toContain("🔴");
    expect(md).toContain("over budget");
  });

  it("stays green under budget", () => {
    const md = renderMarkdown(buildReceipt([e({ costUsd: 1 })]), { budget: { perPr: 5 } });
    expect(md).toContain("🟢");
    expect(md).toContain("left");
  });

  it("warns about unpriced models", () => {
    const md = renderMarkdown(buildReceipt([e({ model: "mystery", costUsd: null })]));
    expect(md).toContain("No price on file");
    expect(md).toContain("`mystery`");
  });

  it("renders an empty state instead of a broken table", () => {
    const md = renderMarkdown(buildReceipt([]));
    expect(md).toContain("No AI usage recorded");
  });
});

describe("formatting", () => {
  it("formats money with size-aware precision", () => {
    expect(money(0)).toBe("$0.00");
    expect(money(5.2)).toBe("$5.20");
    expect(money(0.222)).toBe("$0.22");
    expect(money(0.036)).toBe("$0.036");
    expect(money(0.0012)).toBe("$0.0012");
  });

  it("compacts token counts", () => {
    expect(tokens(900)).toBe("900");
    expect(tokens(1500)).toBe("1.5k");
    expect(tokens(2_100_000)).toBe("2.1M");
  });

  it("buckets a time series for the sparkline", () => {
    const ts = ["2026-06-01T00:00:00Z", "2026-06-01T12:00:00Z", "2026-06-02T00:00:00Z"];
    const buckets = timeBuckets(ts, [1, 2, 3], 16);
    expect(buckets.length).toBeLessThanOrEqual(3);
    expect(buckets.reduce((a, b) => a + b, 0)).toBe(6);
  });

  it("draws a sparkline of the right length", () => {
    expect(sparkline([1, 2, 3, 4]).length).toBe(4);
    expect(sparkline([0, 0]).length).toBe(2);
  });
});
