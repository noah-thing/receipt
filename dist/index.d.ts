/**
 * A single metered AI call, as it lands in the ledger.
 *
 * One line of `.receipt/ledger.jsonl` is one of these. The format is
 * append-only and deliberately boring: token counts, a model name, a price,
 * and enough git context to attribute the call to a branch or a pull request.
 * No prompts, no completions, no source code.
 */
interface LedgerEntry {
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
interface ModelPrice {
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
interface PriceBook {
    _meta?: {
        updated?: string;
        currency?: string;
        note?: string;
    };
    /** Maps exact model ids (and aliases) to a price card. */
    models: Record<string, ModelPrice>;
    /** Prefix rules, tried in order when no exact id matches. */
    prefixes?: Array<{
        match: string;
        model: string;
    }>;
}
/** A grouped, priced summary ready to render. */
interface Receipt {
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
interface ModelRollup {
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
interface Budget {
    /** USD ceiling per pull request. */
    perPr?: number;
    /** USD ceiling per day. */
    perDay?: number;
}
/** Which subscription tier the user is on, for usage-window math. */
type PlanId = "pro" | "max5x" | "max20x" | "custom";
/**
 * Estimated throughput a plan allows per rolling window, in total tokens.
 *
 * Anthropic does not publish exact per-window token budgets, so a preset is a
 * rough, clearly-labeled estimate. `source` records where the number came from
 * so the UI can stay honest: a preset guess, a value calibrated from a real
 * limit you hit, or one observed live from the provider's rate-limit headers.
 */
interface PlanBudget {
    /** Estimated total tokens per 5-hour window. */
    fiveHour: number;
    /** Estimated total tokens per 7-day window. */
    weekly: number;
    source: "preset" | "calibrated" | "observed" | "custom";
    /** The plan this budget was derived from, when known. */
    plan?: PlanId;
}
interface ReceiptConfig {
    base?: string;
    currency?: string;
    budget?: Budget;
    /** Subscription tier, selected with `receipt budget plan <id>`. */
    plan?: PlanId;
    /** A custom window budget that overrides the preset for `plan`. */
    planBudget?: PlanBudget;
    /** Show playful real-world equivalences by default. */
    fun?: boolean;
    /** Set false to drop the usage-impact block from the PR comment and `show`. */
    usage?: boolean;
}

declare class Pricing {
    private book;
    constructor(book: PriceBook);
    /**
     * Load the bundled price book, then merge an optional repo override from
     * `.receipt/prices.json`. The override wins key by key, so a team can fix
     * one model's price without restating the whole table.
     */
    static load(repoRoot?: string): Pricing;
    currency(): string;
    /** The "as-of" date stamped on the price book, shown in the receipt footer. */
    updated(): string | undefined;
    /** Resolve a model id to its price card, trying exact match then prefixes. */
    priceFor(model: string): ModelPrice | undefined;
    isVerified(model: string): boolean;
    /**
     * The cheapest model in the book by input rate, preferring one from the same
     * provider so the what-if lever stays sensible (don't suggest a Claude model
     * to an OpenAI user). Skips the bare aliases. Falls back across providers.
     */
    cheapestModel(preferProvider?: string): string | undefined;
    /**
     * Cost in USD for one metered call. Returns `null` when the model is
     * unknown, so the caller can surface "unpriced" rather than invent a zero.
     */
    cost(entry: Omit<LedgerEntry, "costUsd" | "provider" | "ts" | "source">): number | null;
}
/** Best-effort provider family from a model id, for grouping and color. */
declare function providerOf(model: string): LedgerEntry["provider"];

/**
 * Resolve the ledger path for a repo: `<root>/.receipt/ledger.jsonl`, unless
 * `RECEIPT_LEDGER` overrides it (used by the GitHub Action to point at a
 * restored artifact).
 */
declare function ledgerPath(repoRoot: string): string;
/** Append one entry. Creates `.receipt/` on first write. */
declare function append(repoRoot: string, entry: LedgerEntry): void;
/** Append many entries in one write. */
declare function appendMany(repoRoot: string, entries: LedgerEntry[]): void;
/** Read every entry from a ledger file. Skips blank or corrupt lines. */
declare function readLedger(path: string): LedgerEntry[];
/** Existing request ids, so importers don't double-count a re-run. */
declare function knownRequestIds(path: string): Set<string>;

interface SelectOptions {
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
declare function selectEntries(entries: LedgerEntry[], opts: SelectOptions): LedgerEntry[];
/** Roll selected entries into a renderable receipt. */
declare function buildReceipt(selected: LedgerEntry[], opts?: SelectOptions): Receipt;

/** Hidden marker so the bot can find and update its own comment in place. */
declare const COMMENT_MARKER = "<!-- receipt:v1 -->";
interface RenderOptions {
    budget?: Budget;
    repoUrl?: string;
    priceUpdated?: string;
    /** Per-entry (ts, costUsd) pairs for the spend sparkline. */
    series?: Array<{
        ts: string;
        cost: number;
    }>;
    /** Median cost of recent receipts, for the "this PR vs usual" line. */
    medianPr?: number;
}
/**
 * The pull-request comment. Markdown, GitHub-flavored, screenshot-friendly.
 * This is the whole product in one artifact, so it has to read cleanly on its
 * own — no prior context, no setup, just the number and what made it.
 */
declare function renderMarkdown(receipt: Receipt, opts?: RenderOptions): string;
/** A compact terminal version for `receipt show`. No color codes here; the CLI adds them. */
declare function renderText(receipt: Receipt): string;

interface DashboardData {
    generatedAt: string;
    currency: string;
    budget?: ReceiptConfig["budget"];
    totals: {
        cost: number;
        tokens: number;
        calls: number;
        firstTs?: string;
        lastTs?: string;
    };
    daily: Array<{
        date: string;
        cost: number;
        tokens: number;
        calls: number;
    }>;
    byModel: Array<{
        model: string;
        provider: string;
        cost: number;
        tokens: number;
        calls: number;
    }>;
    byBranch: Array<{
        branch: string;
        cost: number;
        calls: number;
    }>;
    byProvider: Array<{
        provider: string;
        cost: number;
    }>;
    topCalls: Array<{
        ts: string;
        model: string;
        cost: number;
        tokens: number;
        branch?: string;
    }>;
}
declare function buildDashboardData(entries: LedgerEntry[], config?: ReceiptConfig): DashboardData;

/**
 * Normalize anything that looks like a usage row into a ledger entry.
 *
 * Accepts a JSON array or newline-delimited JSON. Recognizes the common
 * spellings: OpenAI's `prompt_tokens`/`completion_tokens`, Anthropic's
 * `input_tokens`/`output_tokens`, plus camelCase variants. Unknown rows that
 * carry no tokens are skipped.
 */
declare function importGeneric(filePath: string, pricing: Pricing, defaults?: {
    repo?: string;
    source?: string;
}): LedgerEntry[];

interface ClaudeImportOptions {
    pricing: Pricing;
    /** Only include calls whose cwd is inside this path. */
    repoRoot?: string;
    /** Branch filter. */
    branch?: string;
    /** ISO time floor. */
    sinceTs?: string;
    /** Skip the cwd filter and pull everything. */
    all?: boolean;
    /** Request ids already in the ledger, to avoid double-counting. */
    seen?: Set<string>;
    /** Where transcripts live; defaults to ~/.claude/projects. */
    dir?: string;
    /** Repo slug to stamp on entries. */
    repo?: string;
}
/**
 * Read Claude Code's own session logs and turn each metered turn into a ledger
 * entry. Nothing here is estimated: the token counts come straight from the
 * usage object the API returned, and the cost is those tokens times the price
 * book. Content is never read.
 */
declare function importClaudeCode(opts: ClaudeImportOptions): Promise<LedgerEntry[]>;

declare const FIVE_HOURS_MS: number;
declare const WEEK_MS: number;
/**
 * Rough per-window token budgets by plan. These are ESTIMATES — Anthropic does
 * not publish exact figures — and exist only so the feature works before you
 * calibrate. Run the proxy (which reads real rate-limit headers) or
 * `receipt calibrate` to replace them with your true ceiling.
 */
declare const PLAN_PRESETS: Record<Exclude<PlanId, "custom">, PlanBudget>;
/** Total tokens an entry moved, cached and uncached alike. */
declare function entryTokens(e: LedgerEntry): number;
interface WindowState {
    /** Tokens used inside the current window. */
    used: number;
    /** Calls inside the current window. */
    calls: number;
    /** When the current window opened (first call inside it). */
    openedAt: number;
    /** When the window resets and usage frees up. */
    resetAt: number;
    /** Estimated budget for the window, if known. */
    budget?: number;
    /** used / budget, when a budget is known. */
    frac?: number;
}
/**
 * State of one rolling window (5h or weekly).
 *
 * Approximates Anthropic's fixed-from-first-use window: the window opens at the
 * earliest call still inside the look-back and resets a window-length later.
 */
declare function windowState(entries: LedgerEntry[], durationMs: number, now: number, budget?: number): WindowState;
interface TaskRollup {
    key: string;
    tokens: number;
    cost: number;
    calls: number;
    firstTs: number;
    lastTs: number;
}
/** Group the ledger into tasks (one per branch) for distribution math. */
declare function taskRollups(entries: LedgerEntry[]): TaskRollup[];
declare function quantile(sortedAsc: number[], q: number): number;
interface TaskSizes {
    quick: number;
    pr: number;
    refactor: number;
    feature: number;
    /** True once there is enough history to derive these from real data. */
    learned: boolean;
}
/** Learn typical task sizes (in tokens) from the branch distribution. */
declare function taskSizes(entries: LedgerEntry[]): TaskSizes;
interface PersonalStats {
    taskCount: number;
    medianTaskTokens: number;
    medianTaskCost: number;
    meanTaskTokens: number;
}
declare function personalStats(entries: LedgerEntry[]): PersonalStats;
interface PaceState {
    /** Tokens used in the last hour. */
    lastHour: number;
    /** Tokens that would last all week, per hour. */
    sustainablePerHour: number;
    /** lastHour / sustainablePerHour. >1 means burning too fast. */
    ratio: number;
    /** Tokens used in the last 24h. */
    lastDay: number;
    /** Days of weekly budget left at the last-24h burn rate. */
    runwayDays?: number;
    /** When the weekly budget runs dry at that rate. */
    runsDryAt?: number;
}
declare function paceState(entries: LedgerEntry[], weeklyBudget: number | undefined, now: number, weeklyUsed: number): PaceState;
interface CapacityItem {
    label: string;
    count: number;
}
/** What the remaining window budget buys, in your own task sizes. */
declare function capacity(remainingTokens: number, sizes: TaskSizes): CapacityItem[];
/** Express a token amount in your own work-units, biggest unit that fits first. */
declare function inWorkUnits(tokensUsed: number, sizes: TaskSizes): string;
interface EfficiencyGrade {
    score: number;
    letter: string;
    cacheHitRate: number;
    retryRate: number;
}
/**
 * A heuristic 0–100 grade for how tight a task was. Rewards cache reuse,
 * punishes retries. Not a precise measure — a nudge, not a verdict.
 */
declare function efficiencyGrade(receipt: Receipt): EfficiencyGrade;
interface Composition {
    output: number;
    freshInput: number;
    cacheRead: number;
    cacheWrite: number;
}
/** Fractions of the total tokens by kind, so you can see where they went. */
declare function whereItWent(receipt: Receipt): Composition;
interface WhatIf {
    fromModel: string;
    toModel: string;
    currentCost: number;
    cheaperCost: number;
    saved: number;
    savedFrac: number;
}
/**
 * Estimate the saving from running the heaviest model's *read* work (fresh
 * input + cache reads) on a cheaper model. The lever everyone has but rarely
 * pulls: stop paying Opus prices to re-read files.
 */
declare function whatIf(receipt: Receipt, pricing: Pricing, cheaper?: string): WhatIf | undefined;
interface Records {
    priciest?: TaskRollup;
    leanest?: TaskRollup;
    latest?: TaskRollup;
    /** 1-based rank of the latest task by tokens (1 = heaviest). */
    latestRank?: number;
    /** Consecutive most-recent tasks under the median, newest-first. */
    streakUnderMedian: number;
}
declare function records(entries: LedgerEntry[]): Records;
/** Playful but honest comparisons. Anchored to real token counts. */
declare function funEquivalences(tokensUsed: number, repoTokens?: number): string[];
/** A dry one-liner sized to how close to the wall you are. */
declare function voiceLine(frac: number | undefined): string | undefined;
interface Fuel {
    budget?: PlanBudget;
    fiveHour: WindowState;
    weekly: WindowState;
    pace: PaceState;
    sizes: TaskSizes;
    /** What the remaining 5h window buys. */
    capacityFiveHour: CapacityItem[];
    /** What the remaining weekly window buys. */
    capacityWeekly: CapacityItem[];
}
/** Assemble everything about right-now from the ledger. */
declare function fuel(entries: LedgerEntry[], budget: PlanBudget | undefined, now: number): Fuel;
/** A task's share of each window, as fractions. */
declare function taskImpact(taskTokens: number, budget: PlanBudget | undefined): {
    fiveHour: number;
    weekly: number;
} | undefined;
/** Read the live/calibrated budget written by the proxy or `receipt calibrate`. */
declare function readObservedBudget(root: string): PlanBudget | undefined;
declare function writeObservedBudget(root: string, budget: PlanBudget): void;
/**
 * The preset for a plan id, or undefined. Uses an own-property check so a
 * hand-edited or malformed config (e.g. "toString") can never resolve to an
 * inherited Object.prototype member and poison the budget with a function.
 */
declare function presetFor(plan: string | undefined): PlanBudget | undefined;
/**
 * Resolve the budget to use, best source first: a live/calibrated value, then
 * a custom config value, then the plan preset. Undefined when no plan is set,
 * in which case the renderers fall back to history-only framings.
 */
declare function resolveBudget(config: ReceiptConfig, root: string): PlanBudget | undefined;
/**
 * Capture rate-limit headers from a provider response into limits.json.
 *
 * Anthropic returns `anthropic-ratelimit-unified-*` headers with the limit and
 * remaining tokens for the current window. When present, this gives a real
 * budget with no guessing. Safe to call on every response; it only writes when
 * it finds a usable limit number.
 */
declare function captureLimits(getHeader: (name: string) => string | null, root: string): void;
/**
 * Estimate the repo's size in tokens (~4 chars/token) by walking tracked-looking
 * source files. Bounded so it never crawls a giant tree. Used for the playful
 * "re-read your repo N×" equivalence.
 */
declare function estimateRepoTokens(root: string, maxFiles?: number): number;

/**
 * Advice — how to spend fewer tokens without making the work worse.
 *
 * The guiding rule: never tell the agent to think less, explain less, or produce
 * less. Output and reasoning are the value. This advisor only targets *waste* —
 * tokens spent without adding anything: context re-sent instead of cached,
 * retries, cache rebuilt faster than it's reused, premium prices paid for
 * mechanical reads, and cost you can't see because a model is unpriced. It also
 * names what is actually driving the bill, so you know where to look.
 *
 * Pure and deterministic: no API key, no network, nothing leaves your machine.
 * Every rule fires only on a real signal in your own data.
 */

type Severity$1 = "high" | "medium" | "low";
interface Recommendation {
    id: string;
    severity: Severity$1;
    /** Short imperative headline. */
    title: string;
    /** Why it costs, and how to fix it — without losing quality. */
    detail: string;
    /** Estimated saving, when computable (e.g. "~$2.80 · 37% of this"). */
    impact?: string;
}
/** What's actually driving the cost — the answer to "why is this so much?". */
declare function costDrivers(receipt: Receipt): string[];
/**
 * Build the ranked list of waste-cutting recommendations for a receipt.
 * Returns a single positive note when nothing is worth changing.
 */
declare function recommend(receipt: Receipt, pricing: Pricing): Recommendation[];
/** The single most actionable tip, for a one-liner on the receipt. Skips the "clean" note. */
declare function topRecommendation(receipt: Receipt, pricing: Pricing): Recommendation | undefined;

/**
 * Session health — keeping the agent sharp, not just cheap.
 *
 * Long sessions get worse before they hit any hard limit: context rot, lost-in-
 * the-middle, instruction drift, looping, and lossy auto-compaction all set in
 * while the window still has room. The research is consistent — effective
 * context is only ~50–65% of the advertised window (RULER), recall sags past
 * ~50% fill (lost-in-the-middle), and multi-turn quality drops ~39% over a long
 * conversation. Anthropic's own advice is to compact *proactively at 50–60%*,
 * before the summary itself goes lossy.
 *
 * This module reads the same ledger as everything else and estimates, per
 * session, how close it is to that quality cliff — then tells you the right
 * move (/compact, /clear, a fresh session, /rewind) BEFORE the output degrades.
 * It never advises doing less work; it protects the work's quality.
 *
 * The key trick: for any call, input + cache-read + cache-write tokens ≈ the
 * size of the prompt sent that turn ≈ how full the context was. No internals
 * needed — the ledger already has it.
 */

declare function contextWindowFor(model: string): number;
/** Tokens sent in one call ≈ context size at that turn. */
declare function promptTokens(e: LedgerEntry): number;
/** Split the ledger into sessions by an idle gap (default 30 min). Ascending. */
declare function sessionize(entries: LedgerEntry[], gapMs?: number): LedgerEntry[][];
/** The most recent session, or undefined if the ledger is empty. */
declare function latestSession(entries: LedgerEntry[], gapMs?: number): LedgerEntry[] | undefined;
type Severity = "ok" | "watch" | "high";
type HealthStatus = "fresh" | "healthy" | "watch" | "degrading" | "critical";
interface HealthSignal {
    key: string;
    severity: Severity;
    /** What's happening. */
    detail: string;
    /** The quality-preserving move to make. */
    action: string;
}
interface SessionHealth {
    calls: number;
    durationMin: number;
    model: string;
    contextWindow: number;
    /** Estimated current context size (tokens), from the heaviest of the last few calls. */
    contextTokens: number;
    fill: number;
    cacheReadShare: number;
    compactions: number;
    recentRetries: number;
    status: HealthStatus;
    signals: HealthSignal[];
}
/**
 * Score one session's quality risk from its token shape. Thresholds are drawn
 * from the research: compact proactively ~60% fill, degradation well before
 * "full", multi-turn drift past ~12 turns, accumulation slowdown past ~2h.
 */
declare function analyzeSession(session: LedgerEntry[], now: number): SessionHealth;
/** Analyze the most recent session in the ledger. */
declare function sessionHealth(entries: LedgerEntry[], now: number): SessionHealth | undefined;

interface UsageBlockExtras {
    topTip?: Recommendation;
    repoTokens?: number;
    fun?: boolean;
}
/**
 * The "% of you" block appended to the pull-request receipt. Only renders the
 * window-percentage lines when a budget is known; otherwise it leans on the
 * history-based framings, which always work.
 */
declare function usageBlockMarkdown(receipt: Receipt, fuel: Fuel, extras?: UsageBlockExtras): string;
declare function renderFuel(fuel: Fuel, now: number, extras?: {
    fun?: boolean;
    repoTokens?: number;
}): string;
/** Compact, plain (Claude Code colorizes its own statusline). */
declare function renderStatusline(fuel: Fuel, now: number): string;
declare function renderRecords(entries: LedgerEntry[]): string;
declare function renderForecast(fuel: Fuel, now: number): string;
/** Compact usage summary appended to `receipt show`. */
declare function usageSummaryText(receipt: Receipt, fuel: Fuel, extras?: {
    topTip?: Recommendation;
    fun?: boolean;
    repoTokens?: number;
}): string;
declare function renderHealth(h: SessionHealth | undefined): string;
/** Compact health fragment for the statusline / fuel. */
declare function healthOneLine(h: SessionHealth | undefined): string;
declare function renderAdvice(receipt: Receipt, recs: Recommendation[]): string;

export { type Budget, COMMENT_MARKER, FIVE_HOURS_MS, type HealthSignal, type HealthStatus, type LedgerEntry, type ModelPrice, type ModelRollup, PLAN_PRESETS, type PlanBudget, type PlanId, type PriceBook, Pricing, type Receipt, type ReceiptConfig, type Recommendation, type SessionHealth, type Severity$1 as Severity, WEEK_MS, analyzeSession, append, appendMany, buildDashboardData, buildReceipt, capacity, captureLimits, contextWindowFor, costDrivers, efficiencyGrade, entryTokens, estimateRepoTokens, fuel, funEquivalences, healthOneLine, importClaudeCode, importGeneric, inWorkUnits, knownRequestIds, latestSession, ledgerPath, paceState, personalStats, presetFor, promptTokens, providerOf, quantile, readLedger, readObservedBudget, recommend, records, renderAdvice, renderForecast, renderFuel, renderHealth, renderMarkdown, renderRecords, renderStatusline, renderText, resolveBudget, selectEntries, sessionHealth, sessionize, taskImpact, taskRollups, taskSizes, topRecommendation, usageBlockMarkdown, usageSummaryText, voiceLine, whatIf, whereItWent, windowState, writeObservedBudget };
