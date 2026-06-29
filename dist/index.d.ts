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
interface ReceiptConfig {
    base?: string;
    currency?: string;
    budget?: Budget;
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

export { type Budget, COMMENT_MARKER, type LedgerEntry, type ModelPrice, type ModelRollup, type PriceBook, Pricing, type Receipt, type ReceiptConfig, append, appendMany, buildDashboardData, buildReceipt, importClaudeCode, importGeneric, knownRequestIds, ledgerPath, providerOf, readLedger, renderMarkdown, renderText, selectEntries };
