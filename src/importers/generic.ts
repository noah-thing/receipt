import { readFileSync } from "node:fs";
import { Pricing, providerOf } from "../pricing.js";
import type { LedgerEntry } from "../types.js";

/** A loose, tool-agnostic usage record. Field names are matched flexibly. */
type Loose = Record<string, unknown>;

function num(o: Loose, ...keys: string[]): number {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
  }
  return 0;
}

function str(o: Loose, ...keys: string[]): string | undefined {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "string" && v) return v;
  }
  return undefined;
}

/**
 * Normalize anything that looks like a usage row into a ledger entry.
 *
 * Accepts a JSON array or newline-delimited JSON. Recognizes the common
 * spellings: OpenAI's `prompt_tokens`/`completion_tokens`, Anthropic's
 * `input_tokens`/`output_tokens`, plus camelCase variants. Unknown rows that
 * carry no tokens are skipped.
 */
export function importGeneric(
  filePath: string,
  pricing: Pricing,
  defaults: { repo?: string; source?: string } = {},
): LedgerEntry[] {
  const raw = readFileSync(filePath, "utf8").trim();
  let rows: Loose[];
  if (raw.startsWith("[")) {
    rows = JSON.parse(raw) as Loose[];
  } else {
    rows = raw
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => JSON.parse(l) as Loose);
  }

  const out: LedgerEntry[] = [];
  for (const row of rows) {
    // Some exports nest the counts under `usage`.
    const u = (typeof row.usage === "object" && row.usage ? (row.usage as Loose) : row) as Loose;
    const model = str(row, "model", "model_id") ?? "unknown";

    const inputTokens = num(u, "input_tokens", "inputTokens", "prompt_tokens", "promptTokens");
    const outputTokens = num(
      u,
      "output_tokens",
      "outputTokens",
      "completion_tokens",
      "completionTokens",
    );
    // OpenAI nests its cached count under prompt_tokens_details.
    const details = (typeof u.prompt_tokens_details === "object" && u.prompt_tokens_details
      ? (u.prompt_tokens_details as Loose)
      : {}) as Loose;
    const cacheReadTokens =
      num(u, "cache_read_input_tokens", "cacheReadTokens", "cached_tokens") ||
      num(details, "cached_tokens");
    const cacheWrite5mTokens = num(u, "cache_creation_input_tokens", "cacheWriteTokens");

    if (inputTokens + outputTokens + cacheReadTokens + cacheWrite5mTokens === 0) continue;

    const partial = {
      model,
      inputTokens,
      outputTokens,
      cacheReadTokens,
      cacheWrite5mTokens,
      cacheWrite1hTokens: 0,
      toolCalls: undefined,
    };

    out.push({
      ts: str(row, "ts", "timestamp", "created_at", "createdAt") ?? new Date().toISOString(),
      source: defaults.source ?? "generic",
      provider: providerOf(model),
      costUsd: pricing.cost(partial),
      ...partial,
      requestId: str(row, "requestId", "request_id", "id"),
      label: str(row, "label", "task", "name"),
      git: {
        branch: str(row, "branch", "gitBranch"),
        sha: str(row, "sha", "commit"),
        repo: defaults.repo,
      },
    });
  }
  out.sort((a, b) => a.ts.localeCompare(b.ts));
  return out;
}
