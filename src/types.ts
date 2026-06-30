/**
 * A single metered AI call, as it lands in the ledger.
 *
 * One line of `.receipt/ledger.jsonl` is one of these. The format is
 * append-only and deliberately boring: token counts, a model name, a price,
 * and enough git context to attribute the call to a branch or a pull request.
 * No prompts, no completions, no source code.
 */
export interface LedgerEntry {
  /** ISO-8601 timestamp of the call. */
  ts: string;
  /** Provider model id, e.g. "claude-opus-4-8" or "gpt-4o". */
  model: string;
  /** Provider family, derived from the model id. */
  provider: "anthropic" | "openai" | "google" | "unknown";
  /** Plain (uncached) input tokens. */
  inputTokens: number;
  /** Generated output tokens. */
  outputTokens: number;
  /** Tokens read from a prompt cache (billed at a discount). */
  cacheReadTokens: number;
  /** Tokens written to a 5-minute prompt cache. */
  cacheWrite5mTokens: number;
  /** Tokens written to a 1-hour prompt cache. */
  cacheWrite1hTokens: number;
  /** Provider-side tool calls billed per request, e.g. web search. */
  toolCalls?: Record<string, number>;
  /** Computed cost in USD. `null` when the model has no known price. */
  costUsd: number | null;
  /** Where the work happened. */
  git?: {
    branch?: string;
    sha?: string;
    repo?: string;
  };
  /** What produced the entry: "proxy", "claude-code", "openai", "generic", "manual". */
  source: string;
  /** Optional free-text label for the run or task. */
  label?: string;
  /** Provider request id, used to de-duplicate on import. */
  requestId?: string;
  /** Retries observed for this logical call (proxy only). */
  retries?: number;
}

/** Price card for one model, in USD per 1,000,000 tokens. */
export interface ModelPrice {
  input: number;
  output: number;
  /** Cache-read price. Defaults to input × 0.1 when omitted. */
  cacheRead?: number;
  /** 5-minute cache-write price. Defaults to input × 1.25 when omitted. */
  cacheWrite5m?: number;
  /** 1-hour cache-write price. Defaults to input × 2 when omitted. */
  cacheWrite1h?: number;
  /** Per-request tool prices in USD, keyed by tool name. */
  tools?: Record<string, number>;
  /** False marks a price we could not confirm; the receipt flags it. */
  verified?: boolean;
}

export interface PriceBook {
  _meta?: {
    updated?: string;
    currency?: string;
    note?: string;
  };
  /** Maps exact model ids (and aliases) to a price card. */
  models: Record<string, ModelPrice>;
  /** Prefix rules, tried in order when no exact id matches. */
  prefixes?: Array<{ match: string; model: string }>;
}

/** A grouped, priced summary ready to render. */
export interface Receipt {
  total: number;
  unpricedModels: string[];
  totalTokens: number;
  entryCount: number;
  retries: number;
  byModel: ModelRollup[];
  toolTotals: Record<string, number>;
  firstTs?: string;
  lastTs?: string;
  branch?: string;
  base?: string;
  currency: string;
}

export interface ModelRollup {
  model: string;
  provider: string;
  calls: number;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  costUsd: number;
  priced: boolean;
}

export interface Budget {
  /** USD ceiling per pull request. */
  perPr?: number;
  /** USD ceiling per day. */
  perDay?: number;
}

/** Which subscription tier the user is on, for usage-window math. */
export type PlanId = "pro" | "max5x" | "max20x" | "custom";

/**
 * Estimated throughput a plan allows per rolling window, in total tokens.
 *
 * Anthropic does not publish exact per-window token budgets, so a preset is a
 * rough, clearly-labeled estimate. `source` records where the number came from
 * so the UI can stay honest: a preset guess, a value calibrated from a real
 * limit you hit, or one observed live from the provider's rate-limit headers.
 */
export interface PlanBudget {
  /** Estimated total tokens per 5-hour window. */
  fiveHour: number;
  /** Estimated total tokens per 7-day window. */
  weekly: number;
  source: "preset" | "calibrated" | "observed" | "custom";
  /** The plan this budget was derived from, when known. */
  plan?: PlanId;
}

export interface ReceiptConfig {
  base?: string;
  currency?: string;
  budget?: Budget;
  /** Subscription tier, selected with `receipt budget plan <id>`. */
  plan?: PlanId;
  /** A custom window budget that overrides the preset for `plan`. */
  planBudget?: PlanBudget;
  /** Show playful real-world equivalences by default. */
  fun?: boolean;
}
