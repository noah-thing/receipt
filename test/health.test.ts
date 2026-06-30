import { describe, expect, it } from "vitest";
import {
  analyzeSession,
  atOrAbove,
  contextTax,
  contextWindowFor,
  degradationProfile,
  healthExitCode,
  latestSession,
  prHealth,
  promptTokens,
  sessionHealth,
  sessionHistory,
  sessionize,
} from "../src/health.js";
import { guardLine, healthBlockMarkdown } from "../src/usage-render.js";
import { Pricing } from "../src/pricing.js";
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

  it("tracks peak fill separately from end-state fill", () => {
    // Spikes to 95% then compacts back to 10%: end fill is low, peak is high.
    const sess = [
      e({ ts: iso(400), inputTokens: 190_000 }),
      e({ ts: iso(300), inputTokens: 10_000 }),
      e({ ts: iso(200), inputTokens: 12_000 }),
      e({ ts: iso(100), inputTokens: 11_000 }),
    ];
    const h = analyzeSession(sess, NOW);
    expect(h.peakFill).toBeGreaterThan(0.9);
    expect(h.fill).toBeLessThan(0.2);
  });
});

describe("exit codes (automation)", () => {
  it("orders statuses correctly", () => {
    expect(atOrAbove("critical", "watch")).toBe(true);
    expect(atOrAbove("watch", "degrading")).toBe(false);
    expect(atOrAbove("degrading", "degrading")).toBe(true);
    expect(atOrAbove("healthy", "watch")).toBe(false);
  });

  it("maps a session to a gated exit code", () => {
    const undef = healthExitCode(undefined);
    expect(undef).toBe(0);
    const critical = analyzeSession(
      [
        e({ ts: iso(300), inputTokens: 190_000 }),
        e({ ts: iso(200), inputTokens: 190_000 }),
        e({ ts: iso(100), inputTokens: 190_000 }),
      ],
      NOW,
    );
    expect(healthExitCode(critical, "critical")).toBe(30); // critical fires even at the highest gate
    const healthy = analyzeSession(
      [
        e({ ts: iso(300), inputTokens: 4000, cacheReadTokens: 90_000, cacheWrite5mTokens: 5000 }),
        e({ ts: iso(200), inputTokens: 4000, cacheReadTokens: 90_000, cacheWrite5mTokens: 5000 }),
        e({ ts: iso(100), inputTokens: 4000, cacheReadTokens: 90_000, cacheWrite5mTokens: 5000 }),
      ],
      NOW,
    );
    expect(healthExitCode(healthy, "degrading")).toBe(0); // below gate → 0
  });
});

describe("guardLine", () => {
  it("packs status, fill, turns, and the top action into one line", () => {
    const h = analyzeSession(
      [
        e({ ts: iso(300), inputTokens: 190_000 }),
        e({ ts: iso(200), inputTokens: 190_000 }),
        e({ ts: iso(100), inputTokens: 190_000 }),
      ],
      NOW,
    );
    const line = guardLine(h);
    expect(line).toMatch(/receipt: session (degrading|critical)/);
    expect(line).toMatch(/ctx ~9\d%/);
    expect(line).toMatch(/turns/);
    expect(line).toContain("—"); // includes the action
  });
});

describe("prHealth", () => {
  it("returns undefined for no entries", () => {
    expect(prHealth([], NOW)).toBeUndefined();
  });

  it("aggregates across idle-separated sessions and de-dupes signals", () => {
    const selected = [
      // session 1: small/clean
      e({ ts: iso(20000), inputTokens: 5000 }),
      e({ ts: iso(19950), inputTokens: 5000 }),
      // session 2 (>30min gap): nearly full → critical, with a compaction
      e({ ts: iso(600), inputTokens: 150_000 }),
      e({ ts: iso(500), inputTokens: 10_000 }),
      e({ ts: iso(400), inputTokens: 190_000 }),
      e({ ts: iso(300), inputTokens: 190_000 }),
    ];
    const ph = prHealth(selected, NOW)!;
    expect(ph.sessions).toBe(2);
    expect(ph.worst).toBe("critical");
    expect(ph.peakFill).toBeGreaterThan(0.9);
    expect(ph.topSignals.length).toBeLessThanOrEqual(3);
    // No duplicate signal keys after de-dup.
    const keys = ph.topSignals.map((s) => s.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe("healthBlockMarkdown", () => {
  it("is silent for healthy work, reassures with always", () => {
    const clean = [
      e({ ts: iso(300), inputTokens: 4000, cacheReadTokens: 90_000, cacheWrite5mTokens: 5000 }),
      e({ ts: iso(200), inputTokens: 4000, cacheReadTokens: 90_000, cacheWrite5mTokens: 5000 }),
      e({ ts: iso(100), inputTokens: 4000, cacheReadTokens: 90_000, cacheWrite5mTokens: 5000 }),
    ];
    const ph = prHealth(clean, NOW);
    expect(healthBlockMarkdown(ph)).toBe("");
    expect(healthBlockMarkdown(ph, { always: true })).toContain("stayed healthy");
  });

  it("renders a collapsed details block when a session degraded", () => {
    const rough = [
      e({ ts: iso(300), inputTokens: 190_000 }),
      e({ ts: iso(200), inputTokens: 190_000 }),
      e({ ts: iso(100), inputTokens: 190_000 }),
    ];
    const ph = prHealth(rough, NOW);
    const md = healthBlockMarkdown(ph);
    expect(md).toContain("<details>");
    expect(md).toContain("worth a careful review");
    expect(md).toMatch(/~9\d% full/);
  });
});

describe("sessionHistory", () => {
  it("returns one summary per session, chronological, not 'still running'", () => {
    const entries = [
      e({ ts: iso(20000), inputTokens: 5000 }),
      e({ ts: iso(19950), inputTokens: 5000 }),
      e({ ts: iso(300), inputTokens: 5000 }),
      e({ ts: iso(250), inputTokens: 5000 }),
    ];
    const hist = sessionHistory(entries);
    expect(hist).toHaveLength(2);
    expect(hist[0]!.index).toBe(1);
    expect(hist[0]!.endTs).toBeLessThanOrEqual(hist[1]!.startTs);
    // Old session scored at its own end, so duration is bounded, not "until now".
    expect(hist[0]!.health.durationMin).toBeLessThan(5);
  });

  it("flags compaction that happened only after 80% full as 'late'", () => {
    const late = [
      e({ ts: iso(500), inputTokens: 170_000 }), // ~85% of 200k
      e({ ts: iso(400), inputTokens: 180_000 }),
      e({ ts: iso(300), inputTokens: 10_000 }), // collapse after being very full
      e({ ts: iso(200), inputTokens: 12_000 }),
    ];
    expect(sessionHistory(late)[0]!.compactedLate).toBe(true);

    const early = [
      e({ ts: iso(500), inputTokens: 70_000 }), // ~35%
      e({ ts: iso(400), inputTokens: 10_000 }), // collapse while still low
      e({ ts: iso(300), inputTokens: 12_000 }),
    ];
    expect(sessionHistory(early)[0]!.compactedLate).toBe(false);
  });
});

describe("contextTax", () => {
  const pricing = Pricing.load();

  it("shares of the token pie sum to one", () => {
    const sess = [
      e({ ts: iso(300), inputTokens: 5000, outputTokens: 1000, cacheReadTokens: 80_000, cacheWrite5mTokens: 10_000 }),
      e({ ts: iso(200), inputTokens: 5000, outputTokens: 1000, cacheReadTokens: 80_000, cacheWrite5mTokens: 5000 }),
    ];
    const t = contextTax(sess, pricing);
    const recombined = (t.resentTokens + t.newTokens + t.cacheWriteTokens) / t.totalTokens;
    expect(recombined).toBeCloseTo(1, 6);
    expect(t.resentShare).toBeGreaterThan(0.7); // mostly re-sent context
  });

  it("is zero re-send for an all-fresh session", () => {
    const sess = [e({ ts: iso(100), inputTokens: 5000, outputTokens: 1000 })];
    expect(contextTax(sess, pricing).resentShare).toBe(0);
  });

  it("reports null cost when a model is unpriced, but still counts tokens", () => {
    const sess = [e({ ts: iso(100), model: "mystery-model-x", cacheReadTokens: 50_000, inputTokens: 1000 })];
    const t = contextTax(sess, pricing);
    expect(t.resentCostUsd).toBeNull();
    expect(t.resentTokens).toBe(50_000);
  });
});

describe("degradationProfile", () => {
  it("finds a median onset turn and counts degraded sessions", () => {
    // Two sessions, each crossing 60% fill at turn 2 (190k of 200k).
    const entries = [
      e({ ts: iso(20000), inputTokens: 5000 }),
      e({ ts: iso(19950), inputTokens: 190_000 }),
      e({ ts: iso(19900), inputTokens: 190_000 }),
      e({ ts: iso(300), inputTokens: 5000 }),
      e({ ts: iso(250), inputTokens: 190_000 }),
      e({ ts: iso(200), inputTokens: 190_000 }),
    ];
    const p = degradationProfile(entries);
    expect(p.sessionsAnalyzed).toBe(2);
    expect(p.degradedCount).toBeGreaterThanOrEqual(1);
    expect(p.medianTurnsToOnset).toBe(2);
  });

  it("reports no degradation for short clean sessions", () => {
    const entries = [
      e({ ts: iso(300), inputTokens: 4000, cacheReadTokens: 90_000 }),
      e({ ts: iso(200), inputTokens: 4000, cacheReadTokens: 90_000 }),
    ];
    const p = degradationProfile(entries);
    expect(p.degradedCount).toBe(0);
  });
});
