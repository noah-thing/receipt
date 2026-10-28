import { describe, expect, it } from "vitest";
import { Pricing, providerOf } from "../src/pricing.js";
import type { PriceBook } from "../src/types.js";

const book: PriceBook = {
  _meta: { updated: "test", currency: "USD" },
  models: {
    "claude-opus-4-8": { input: 15, output: 75 },
    "gpt-4o": { input: 2.5, output: 10, cacheRead: 1.25 },
    "fake-unverified": { input: 1, output: 1, verified: false },
  },
  prefixes: [{ match: "claude-opus", model: "claude-opus-4-8" }],
};

describe("Pricing", () => {
  const pricing = new Pricing(book);

  it("prices plain input and output per million tokens", () => {
    const cost = pricing.cost({
      model: "claude-opus-4-8",
      inputTokens: 1_000_000,
      outputTokens: 1_000_000,
      cacheReadTokens: 0,
      cacheWrite5mTokens: 0,
      cacheWrite1hTokens: 0,
    });
    expect(cost).toBeCloseTo(15 + 75, 6);
  });

  it("applies Anthropic cache multipliers when a card omits them", () => {
    const cost = pricing.cost({
      model: "claude-opus-4-8",
      inputTokens: 0,
      outputTokens: 0,
      cacheReadTokens: 1_000_000, // input * 0.1 = 1.5
      cacheWrite5mTokens: 1_000_000, // input * 1.25 = 18.75
      cacheWrite1hTokens: 1_000_000, // input * 2 = 30
    });
    expect(cost).toBeCloseTo(1.5 + 18.75 + 30, 6);
  });

  it("uses an explicit cacheRead price when present", () => {
    const cost = pricing.cost({
      model: "gpt-4o",
      inputTokens: 0,
      outputTokens: 0,
      cacheReadTokens: 1_000_000,
      cacheWrite5mTokens: 0,
      cacheWrite1hTokens: 0,
    });
    expect(cost).toBeCloseTo(1.25, 6);
  });

  it("returns null for an unknown model rather than inventing zero", () => {
    const cost = pricing.cost({
      model: "totally-unknown-model",
      inputTokens: 1000,
      outputTokens: 1000,
      cacheReadTokens: 0,
      cacheWrite5mTokens: 0,
      cacheWrite1hTokens: 0,
    });
    expect(cost).toBeNull();
  });

  it("resolves dated model ids through prefix rules", () => {
    expect(pricing.priceFor("claude-opus-4-8-20260115")).toBeDefined();
  });

  it("flags unverified prices", () => {
    expect(pricing.isVerified("claude-opus-4-8")).toBe(true);
    expect(pricing.isVerified("fake-unverified")).toBe(false);
  });

  it("adds per-request tool costs", () => {
    const withTools = new Pricing({
      ...book,
      models: { web: { input: 0, output: 0, tools: { web_search_requests: 0.01 } } },
    });
    const cost = withTools.cost({
      model: "web",
      inputTokens: 0,
      outputTokens: 0,
      cacheReadTokens: 0,
      cacheWrite5mTokens: 0,
      cacheWrite1hTokens: 0,
      toolCalls: { web_search_requests: 5 },
    });
    expect(cost).toBeCloseTo(0.05, 6);
  });

  it("loads the bundled default book", () => {
    const def = Pricing.load();
    expect(def.priceFor("claude-opus-4-8")).toBeDefined();
    expect(def.currency()).toBe("USD");
  });

  it("prices the current model families", () => {
    const def = Pricing.load();
    expect(def.priceFor("claude-opus-5-5")).toMatchObject({ input: 4, output: 20, cacheRead: 0.2 });
    expect(def.priceFor("claude-sonnet-5-5")).toMatchObject({ input: 2, output: 10 });
    expect(def.priceFor("claude-haiku-5-5")).toMatchObject({ input: 0.1, output: 0.5 });
    expect(def.priceFor("claude-fable-5-1")).toMatchObject({ input: 10, output: 50, cacheRead: 0.25 });
    expect(def.priceFor("gpt-6-sol")).toMatchObject({ input: 2, output: 10, cacheRead: 0.2 });
    expect(def.priceFor("gemini-4-argon")).toMatchObject({ input: 2, output: 10 });
    expect(def.priceFor("grok-4.7")).toMatchObject({ input: 2, output: 6, cacheRead: 0.5 });
  });

  it("resolves dated ids to the right version, not a neighbour", () => {
    const def = Pricing.load();
    expect(def.priceFor("claude-opus-5-5-20261001")?.input).toBe(4);
    expect(def.priceFor("claude-opus-4-5-20251101")?.input).toBe(5);
    expect(def.priceFor("claude-opus-4-1-20250805")?.input).toBe(15);
    expect(def.priceFor("claude-sonnet-5-5-20261001")?.input).toBe(2);
    expect(def.priceFor("gemini-2.5-flash-lite-preview")?.output).toBe(0.4);
  });

  it("leaves unknown models unpriced", () => {
    const def = Pricing.load();
    expect(def.priceFor("grok-9")).toBeUndefined();
    expect(def.priceFor("gpt-9")).toBeUndefined();
  });

  it("flags prices that could not be confirmed", () => {
    const def = Pricing.load();
    expect(def.isVerified("claude-3-opus")).toBe(false);
    expect(def.isVerified("o3")).toBe(true);
  });
});

describe("providerOf", () => {
  it("maps model ids to families", () => {
    expect(providerOf("claude-opus-4-8")).toBe("anthropic");
    expect(providerOf("haiku")).toBe("anthropic");
    expect(providerOf("gpt-4o")).toBe("openai");
    expect(providerOf("o3-mini")).toBe("openai");
    expect(providerOf("gemini-2.5-pro")).toBe("google");
    expect(providerOf("grok-4.7")).toBe("xai");
    expect(providerOf("mystery-7b")).toBe("unknown");
  });
});
