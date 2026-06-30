import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import defaultPrices from "./prices.json" with { type: "json" };
import type { LedgerEntry, ModelPrice, PriceBook } from "./types.js";

/** Anthropic's published cache multipliers, applied when a price card omits them. */
const CACHE_READ_MULT = 0.1;
const CACHE_WRITE_5M_MULT = 1.25;
const CACHE_WRITE_1H_MULT = 2.0;

export class Pricing {
  private book: PriceBook;

  constructor(book: PriceBook) {
    this.book = book;
  }

  /**
   * Load the bundled price book, then merge an optional repo override from
   * `.receipt/prices.json`. The override wins key by key, so a team can fix
   * one model's price without restating the whole table.
   */
  static load(repoRoot?: string): Pricing {
    const base = structuredClone(defaultPrices) as PriceBook;
    if (repoRoot) {
      const overridePath = join(repoRoot, ".receipt", "prices.json");
      if (existsSync(overridePath)) {
        try {
          const override = JSON.parse(readFileSync(overridePath, "utf8")) as PriceBook;
          base.models = { ...base.models, ...override.models };
          if (override.prefixes) base.prefixes = override.prefixes;
          if (override._meta) base._meta = { ...base._meta, ...override._meta };
        } catch (err) {
          throw new Error(
            `Could not parse ${overridePath}: ${(err as Error).message}`,
          );
        }
      }
    }
    return new Pricing(base);
  }

  currency(): string {
    return this.book._meta?.currency ?? "USD";
  }

  /** The "as-of" date stamped on the price book, shown in the receipt footer. */
  updated(): string | undefined {
    return this.book._meta?.updated;
  }

  /** Resolve a model id to its price card, trying exact match then prefixes. */
  priceFor(model: string): ModelPrice | undefined {
    const exact = this.book.models[model];
    if (exact) return exact;
    for (const rule of this.book.prefixes ?? []) {
      if (model.startsWith(rule.match)) {
        const target = this.book.models[rule.model];
        if (target) return target;
      }
    }
    return undefined;
  }

  isVerified(model: string): boolean {
    const price = this.priceFor(model);
    return price ? price.verified !== false : false;
  }

  /**
   * The cheapest model in the book by input rate, preferring one from the same
   * provider so the what-if lever stays sensible (don't suggest a Claude model
   * to an OpenAI user). Skips the bare aliases. Falls back across providers.
   */
  cheapestModel(preferProvider?: string): string | undefined {
    const ALIASES = new Set(["opus", "sonnet", "haiku"]);
    let best: { id: string; rate: number } | undefined;
    for (const [id, price] of Object.entries(this.book.models)) {
      if (typeof price.input !== "number" || ALIASES.has(id)) continue;
      if (preferProvider && providerOf(id) !== preferProvider) continue;
      if (!best || price.input < best.rate) best = { id, rate: price.input };
    }
    if (!best && preferProvider) return this.cheapestModel();
    return best?.id;
  }

  /**
   * Cost in USD for one metered call. Returns `null` when the model is
   * unknown, so the caller can surface "unpriced" rather than invent a zero.
   */
  cost(entry: Omit<LedgerEntry, "costUsd" | "provider" | "ts" | "source">): number | null {
    const price = this.priceFor(entry.model);
    if (!price) return null;

    const perM = (tokens: number, rate: number) => (tokens / 1_000_000) * rate;
    let usd = 0;
    usd += perM(entry.inputTokens, price.input);
    usd += perM(entry.outputTokens, price.output);
    usd += perM(entry.cacheReadTokens, price.cacheRead ?? price.input * CACHE_READ_MULT);
    usd += perM(
      entry.cacheWrite5mTokens,
      price.cacheWrite5m ?? price.input * CACHE_WRITE_5M_MULT,
    );
    usd += perM(
      entry.cacheWrite1hTokens,
      price.cacheWrite1h ?? price.input * CACHE_WRITE_1H_MULT,
    );

    for (const [tool, count] of Object.entries(entry.toolCalls ?? {})) {
      const rate = price.tools?.[tool];
      if (rate) usd += count * rate;
    }
    return usd;
  }
}

/** Best-effort provider family from a model id, for grouping and color. */
export function providerOf(model: string): LedgerEntry["provider"] {
  const m = model.toLowerCase();
  if (m.includes("claude") || m === "opus" || m === "sonnet" || m === "haiku" || m.includes("fable"))
    return "anthropic";
  if (m.startsWith("gpt") || m.startsWith("o1") || m.startsWith("o3") || m.startsWith("o4"))
    return "openai";
  if (m.includes("gemini")) return "google";
  return "unknown";
}
