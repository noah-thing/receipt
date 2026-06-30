import { describe, expect, it } from "vitest";
import {
  analyzeSession,
  contextWindowFor,
  latestSession,
  promptTokens,
  sessionHealth,
  sessionize,
} from "../src/health.js";
import type { LedgerEntry } from "../src/types.js";

const NOW = new Date("2026-06-29T12:00:00.000Z").getTime();
const iso = (secAgo: number) => new Date(NOW - secAgo * 1000).toISOString();

function e(over: Partial<LedgerEntry>): LedgerEntry {
  return {
    ts: iso(60),
    model: "claude-haiku-4-5",
    provider: "anthropic",
    inputTokens: 1000,
    outputTokens: 500,
    cacheReadTokens: 0,
    cacheWrite5mTokens: 0,
    cacheWrite1hTokens: 0,
    costUsd: 0.01,
    source: "test",
    ...over,
  };
}

describe("contextWindowFor", () => {
  it("knows exact models, prefixes, and a safe default", () => {
    expect(contextWindowFor("claude-opus-4-8")).toBe(1_000_000);
    expect(contextWindowFor("claude-haiku-4-5")).toBe(200_000);
    expect(contextWindowFor("claude-sonnet-4-6")).toBe(1_000_000);
    expect(contextWindowFor("gpt-4o")).toBe(128_000);
    expect(contextWindowFor("some-unknown-model")).toBe(200_000); // conservative default
  });
});

describe("promptTokens", () => {
  it("counts the whole prompt sent that turn", () => {
    expect(
      promptTokens(e({ inputTokens: 10, cacheReadTokens: 20, cacheWrite5mTokens: 5, cacheWrite1hTokens: 1, outputTokens: 999 })),
    ).toBe(36); // output is NOT part of the prompt
  });
});

describe("sessionize", () => {
  it("splits on idle gaps over 30 minutes", () => {
    const entries = [
      e({ ts: iso(10000) }),
      e({ ts: iso(9900) }), // ~1.6 min later — same session
      e({ ts: iso(200) }), // ~2.7h later — new session
      e({ ts: iso(120) }),
    ];
    const s = sessionize(entries);
    expect(s).toHaveLength(2);
    expect(s[0]).toHaveLength(2);
    expect(s[1]).toHaveLength(2);
    expect(latestSession(entries)).toHaveLength(2);
  });
});

describe("analyzeSession", () => {
  it("is 'fresh' with too few calls to judge", () => {
    const h = analyzeSession([e({}), e({})], NOW);
    expect(h.status).toBe("fresh");
  });

  it("flags a nearly-full context window as critical", () => {
    const sess = [
      e({ ts: iso(300), inputTokens: 180_000 }),
      e({ ts: iso(200), inputTokens: 190_000 }),
      e({ ts: iso(100), inputTokens: 190_000 }),
    ];
    const h = analyzeSession(sess, NOW);
    expect(h.fill).toBeGreaterThan(0.9);
    expect(h.status).toBe("critical");
    expect(h.signals.find((s) => s.key === "context-fill")?.severity).toBe("high");
  });

  it("warns on a large absolute context even on a 1M window", () => {
    // 450k tokens on a 1M Opus window is only 45% but is past the absolute danger zone.
    const sess = [
      e({ ts: iso(300), model: "claude-opus-4-8", inputTokens: 450_000 }),
      e({ ts: iso(200), model: "claude-opus-4-8", inputTokens: 450_000 }),
      e({ ts: iso(100), model: "claude-opus-4-8", inputTokens: 460_000 }),
    ];
    const h = analyzeSession(sess, NOW);
    expect(h.fill).toBeLessThan(0.6);
    expect(h.signals.find((s) => s.key === "context-fill")?.severity).toBe("high");
  });

  it("flags long sessions (multi-turn drift)", () => {
    const sess = Array.from({ length: 14 }, (_, i) => e({ ts: iso(800 - i * 50), inputTokens: 5000 }));
    const h = analyzeSession(sess, NOW);
    expect(h.signals.some((s) => s.key === "session-length")).toBe(true);
  });

  it("flags poor cache reuse (context churn)", () => {
    const sess = [
      e({ ts: iso(300), cacheReadTokens: 5_000, cacheWrite5mTokens: 100_000 }),
      e({ ts: iso(200), cacheReadTokens: 5_000, cacheWrite5mTokens: 100_000 }),
      e({ ts: iso(100), cacheReadTokens: 5_000, cacheWrite5mTokens: 100_000 }),
    ];
    const h = analyzeSession(sess, NOW);
    expect(h.cacheReadShare).toBeLessThan(0.2);
    expect(h.signals.find((s) => s.key === "cache-health")?.severity).toBe("high");
  });

  it("detects auto-compaction cascades", () => {
    const sess = [
      e({ ts: iso(600), inputTokens: 150_000 }),
      e({ ts: iso(500), inputTokens: 10_000 }), // compaction drop 1
      e({ ts: iso(400), inputTokens: 150_000 }),
      e({ ts: iso(300), inputTokens: 10_000 }), // compaction drop 2
      e({ ts: iso(200), inputTokens: 20_000 }),
    ];
    const h = analyzeSession(sess, NOW);
    expect(h.compactions).toBeGreaterThanOrEqual(2);
    expect(h.signals.some((s) => s.key === "compaction-cascade")).toBe(true);
  });

  it("detects looping via recent retries", () => {
    const sess = [
      e({ ts: iso(400) }),
      e({ ts: iso(300), retries: 1 }),
      e({ ts: iso(200), retries: 1 }),
      e({ ts: iso(100), retries: 1 }),
    ];
    const h = analyzeSession(sess, NOW);
    expect(h.signals.some((s) => s.key === "looping")).toBe(true);
  });

  it("is 'healthy' for a small, clean session", () => {
    const sess = [
      e({ ts: iso(300), inputTokens: 5_000, cacheReadTokens: 90_000, cacheWrite5mTokens: 10_000, outputTokens: 800 }),
      e({ ts: iso(220), inputTokens: 5_000, cacheReadTokens: 90_000, cacheWrite5mTokens: 5_000, outputTokens: 850 }),
      e({ ts: iso(150), inputTokens: 5_000, cacheReadTokens: 90_000, cacheWrite5mTokens: 5_000, outputTokens: 820 }),
      e({ ts: iso(80), inputTokens: 5_000, cacheReadTokens: 90_000, cacheWrite5mTokens: 5_000, outputTokens: 830 }),
    ];
    const h = analyzeSession(sess, NOW);
    expect(h.status).toBe("healthy");
    expect(h.signals).toHaveLength(0);
  });

  it("never advises doing less work (only refresh/compact/clear/rewind)", () => {
    const sess = [
      e({ ts: iso(300), inputTokens: 190_000, cacheReadTokens: 2_000, cacheWrite5mTokens: 80_000, retries: 2 }),
      e({ ts: iso(200), inputTokens: 190_000, cacheReadTokens: 2_000, cacheWrite5mTokens: 80_000, retries: 2 }),
      e({ ts: iso(100), inputTokens: 190_000, cacheReadTokens: 2_000, cacheWrite5mTokens: 80_000, retries: 2 }),
    ];
    const h = analyzeSession(sess, NOW);
    const text = h.signals.map((s) => s.action + " " + s.detail).join(" ").toLowerCase();
    expect(text).not.toMatch(/do less|work less|think less|explain less|shorter response|be brief/);
  });
});

describe("sessionHealth", () => {
  it("analyzes the most recent session", () => {
    const entries = [
      e({ ts: iso(10000), inputTokens: 1000 }), // old session
      e({ ts: iso(300), inputTokens: 190_000 }),
      e({ ts: iso(200), inputTokens: 190_000 }),
      e({ ts: iso(100), inputTokens: 190_000 }),
    ];
    const h = sessionHealth(entries, NOW)!;
    expect(h.calls).toBe(3); // only the latest session
    expect(h.fill).toBeGreaterThan(0.9);
  });

  it("returns undefined for an empty ledger", () => {
    expect(sessionHealth([], NOW)).toBeUndefined();
  });
});
