import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { LedgerEntry } from "./types.js";

/**
 * Resolve the ledger path for a repo: `<root>/.receipt/ledger.jsonl`, unless
 * `RECEIPT_LEDGER` overrides it (used by the GitHub Action to point at a
 * restored artifact).
 */
export function ledgerPath(repoRoot: string): string {
  return process.env.RECEIPT_LEDGER || join(repoRoot, ".receipt", "ledger.jsonl");
}

/** Append one entry. Creates `.receipt/` on first write. */
export function append(repoRoot: string, entry: LedgerEntry): void {
  const path = ledgerPath(repoRoot);
  mkdirSync(dirname(path), { recursive: true });
  appendFileSync(path, JSON.stringify(entry) + "\n", "utf8");
}

/** Append many entries in one write. */
export function appendMany(repoRoot: string, entries: LedgerEntry[]): void {
  if (entries.length === 0) return;
  const path = ledgerPath(repoRoot);
  mkdirSync(dirname(path), { recursive: true });
  appendFileSync(path, entries.map((e) => JSON.stringify(e)).join("\n") + "\n", "utf8");
}

/** Read every entry from a ledger file. Skips blank or corrupt lines. */
export function readLedger(path: string): LedgerEntry[] {
  if (!existsSync(path)) return [];
  const out: LedgerEntry[] = [];
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      out.push(JSON.parse(trimmed) as LedgerEntry);
    } catch {
      // A half-written final line can happen if a process died mid-append.
      // Skipping it is safer than refusing to read the whole ledger.
    }
  }
  return out;
}

/** Existing request ids, so importers don't double-count a re-run. */
export function knownRequestIds(path: string): Set<string> {
  const ids = new Set<string>();
  for (const e of readLedger(path)) {
    if (e.requestId) ids.add(e.requestId);
  }
  return ids;
}
