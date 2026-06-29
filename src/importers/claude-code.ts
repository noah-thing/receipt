import { createInterface } from "node:readline";
import { createReadStream, existsSync, readdirSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { Pricing, providerOf } from "../pricing.js";
import type { LedgerEntry } from "../types.js";

/** Default location of Claude Code's per-project session transcripts. */
export function defaultClaudeDir(): string {
  return join(homedir(), ".claude", "projects");
}

/** The slice of a Claude Code transcript line that we read. */
interface CCLine {
  type?: string;
  timestamp?: string;
  requestId?: string;
  cwd?: string;
  gitBranch?: string;
  message?: {
    model?: string;
    usage?: {
      input_tokens?: number;
      output_tokens?: number;
      cache_read_input_tokens?: number;
      cache_creation_input_tokens?: number;
      cache_creation?: {
        ephemeral_5m_input_tokens?: number;
        ephemeral_1h_input_tokens?: number;
      };
      server_tool_use?: {
        web_search_requests?: number;
        web_fetch_requests?: number;
      };
    };
  };
}

export interface ClaudeImportOptions {
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

function* jsonlFiles(dir: string): Generator<string> {
  if (!existsSync(dir)) return;
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      yield* jsonlFiles(full);
    } else if (name.endsWith(".jsonl")) {
      yield full;
    }
  }
}

function insideRepo(cwd: string | undefined, root: string): boolean {
  if (!cwd) return false;
  return cwd === root || cwd.startsWith(root.endsWith("/") ? root : root + "/");
}

/**
 * Read Claude Code's own session logs and turn each metered turn into a ledger
 * entry. Nothing here is estimated: the token counts come straight from the
 * usage object the API returned, and the cost is those tokens times the price
 * book. Content is never read.
 */
export async function importClaudeCode(opts: ClaudeImportOptions): Promise<LedgerEntry[]> {
  const dir = opts.dir ?? defaultClaudeDir();
  const sinceMs = opts.sinceTs ? new Date(opts.sinceTs).getTime() : undefined;
  const seen = opts.seen ?? new Set<string>();
  const out: LedgerEntry[] = [];
  const dedupeWithin = new Set<string>();

  for (const file of jsonlFiles(dir)) {
    const rl = createInterface({
      input: createReadStream(file, { encoding: "utf8" }),
      crlfDelay: Infinity,
    });
    for await (const line of rl) {
      if (!line.includes('"usage"')) continue;
      let o: CCLine;
      try {
        o = JSON.parse(line) as CCLine;
      } catch {
        continue;
      }
      const usage = o.message?.usage;
      const model = o.message?.model;
      if (!usage || !model || model === "<synthetic>") continue;
      if (o.type && o.type !== "assistant") continue;

      if (!opts.all && opts.repoRoot && !insideRepo(o.cwd, opts.repoRoot)) continue;

      const branch = o.gitBranch && o.gitBranch !== "HEAD" ? o.gitBranch : undefined;
      if (opts.branch && branch !== opts.branch) continue;

      const ts = o.timestamp ?? new Date(0).toISOString();
      if (sinceMs !== undefined && new Date(ts).getTime() < sinceMs) continue;

      // De-dupe against the existing ledger and within this run.
      const id = o.requestId;
      if (id) {
        if (seen.has(id) || dedupeWithin.has(id)) continue;
        dedupeWithin.add(id);
      }

      const cacheWrite5m =
        usage.cache_creation?.ephemeral_5m_input_tokens ??
        (usage.cache_creation ? 0 : usage.cache_creation_input_tokens ?? 0);
      const cacheWrite1h = usage.cache_creation?.ephemeral_1h_input_tokens ?? 0;

      const toolCalls: Record<string, number> = {};
      const web = usage.server_tool_use?.web_search_requests ?? 0;
      const fetch = usage.server_tool_use?.web_fetch_requests ?? 0;
      if (web > 0) toolCalls.web_search_requests = web;
      if (fetch > 0) toolCalls.web_fetch_requests = fetch;

      const partial = {
        model,
        inputTokens: usage.input_tokens ?? 0,
        outputTokens: usage.output_tokens ?? 0,
        cacheReadTokens: usage.cache_read_input_tokens ?? 0,
        cacheWrite5mTokens: cacheWrite5m,
        cacheWrite1hTokens: cacheWrite1h,
        toolCalls: Object.keys(toolCalls).length ? toolCalls : undefined,
      };

      out.push({
        ts,
        source: "claude-code",
        provider: providerOf(model),
        costUsd: opts.pricing.cost(partial),
        ...partial,
        requestId: id,
        git: { branch, repo: opts.repo },
      });
    }
  }

  out.sort((a, b) => a.ts.localeCompare(b.ts));
  return out;
}
