import { createInterface } from "node:readline";
import { createReadStream } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { Pricing, providerOf } from "../pricing.js";
import type { LedgerEntry } from "../types.js";
import { insideRepo, jsonlFiles } from "./claude-code.js";

/** Default location of Codex CLI's session rollouts. */
export function defaultCodexDir(): string {
  return join(process.env.CODEX_HOME ?? join(homedir(), ".codex"), "sessions");
}

/** The slice of a Codex rollout line that we read. */
interface CodexLine {
  timestamp?: string;
  type?: string;
  payload?: {
    cwd?: string;
    turn_id?: string;
    model?: string;
    response_id?: string;
    git?: { branch?: string };
    usage?: {
      input_tokens?: number;
      cached_input_tokens?: number;
      output_tokens?: number;
    };
  };
}

export interface CodexImportOptions {
  pricing: Pricing;
  /** Only include calls whose cwd is inside this path. */
  repoRoot?: string;
  /** Branch filter. Codex only records a branch for some sessions. */
  branch?: string;
  /** ISO time floor. */
  sinceTs?: string;
  /** Skip the cwd filter and pull everything. */
  all?: boolean;
  /** Response ids already in the ledger, to avoid double-counting. */
  seen?: Set<string>;
  /** Where rollouts live; defaults to ~/.codex/sessions. */
  dir?: string;
  /** Repo slug to stamp on entries. */
  repo?: string;
}

/**
 * Read Codex CLI's session rollouts and turn each model response into a ledger
 * entry. Every response gets a `token_usage_record` line with the API's own
 * counts, and the `turn_context` line before it names the model. OpenAI's
 * input count includes cached tokens, so the cached part is split out and
 * priced at the cache rate. Reasoning tokens are already inside the output
 * count. Message content is never read.
 */
export async function importCodex(opts: CodexImportOptions): Promise<LedgerEntry[]> {
  const dir = opts.dir ?? defaultCodexDir();
  const sinceMs = opts.sinceTs ? new Date(opts.sinceTs).getTime() : undefined;
  const seen = opts.seen ?? new Set<string>();
  const out: LedgerEntry[] = [];
  const dedupeWithin = new Set<string>();

  for (const file of jsonlFiles(dir)) {
    const rl = createInterface({
      input: createReadStream(file, { encoding: "utf8" }),
      crlfDelay: Infinity,
    });
    let sessionCwd: string | undefined;
    let branch: string | undefined;
    const turns = new Map<string, { model?: string; cwd?: string }>();
    let lastTurn: { model?: string; cwd?: string } | undefined;

    for await (const line of rl) {
      const interesting =
        line.includes('"token_usage_record"') ||
        line.includes('"turn_context"') ||
        line.includes('"session_meta"');
      if (!interesting) continue;
      let o: CodexLine;
      try {
        o = JSON.parse(line) as CodexLine;
      } catch {
        continue;
      }
      const p = o.payload;
      if (!p) continue;

      if (o.type === "session_meta") {
        sessionCwd = p.cwd;
        branch = p.git?.branch && p.git.branch !== "HEAD" ? p.git.branch : undefined;
        continue;
      }
      if (o.type === "turn_context") {
        lastTurn = { model: p.model, cwd: p.cwd };
        if (p.turn_id) turns.set(p.turn_id, lastTurn);
        continue;
      }
      if (o.type !== "token_usage_record" || !p.usage) continue;

      const turn = (p.turn_id ? turns.get(p.turn_id) : undefined) ?? lastTurn;
      const model = turn?.model;
      if (!model) continue;

      const cwd = turn?.cwd ?? sessionCwd;
      if (!opts.all && opts.repoRoot && !insideRepo(cwd, opts.repoRoot)) continue;
      if (opts.branch && branch !== opts.branch) continue;

      const ts = o.timestamp ?? new Date(0).toISOString();
      if (sinceMs !== undefined && new Date(ts).getTime() < sinceMs) continue;

      const id = p.response_id;
      if (id) {
        if (seen.has(id) || dedupeWithin.has(id)) continue;
        dedupeWithin.add(id);
      }

      const total = p.usage.input_tokens ?? 0;
      const cached = Math.min(p.usage.cached_input_tokens ?? 0, total);
      const partial = {
        model,
        inputTokens: total - cached,
        outputTokens: p.usage.output_tokens ?? 0,
        cacheReadTokens: cached,
        cacheWrite5mTokens: 0,
        cacheWrite1hTokens: 0,
      };

      out.push({
        ts,
        source: "codex",
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
