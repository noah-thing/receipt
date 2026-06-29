import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { append, knownRequestIds, ledgerPath, readLedger } from "../src/ledger.js";
import type { LedgerEntry } from "../src/types.js";

function entry(over: Partial<LedgerEntry> = {}): LedgerEntry {
  return {
    ts: "2026-06-29T10:00:00.000Z",
    model: "claude-opus-4-8",
    provider: "anthropic",
    inputTokens: 100,
    outputTokens: 50,
    cacheReadTokens: 0,
    cacheWrite5mTokens: 0,
    cacheWrite1hTokens: 0,
    costUsd: 0.01,
    source: "test",
    ...over,
  };
}

describe("ledger", () => {
  it("appends and reads back round-trip", () => {
    const root = mkdtempSync(join(tmpdir(), "receipt-"));
    append(root, entry({ requestId: "a" }));
    append(root, entry({ requestId: "b" }));
    const read = readLedger(ledgerPath(root));
    expect(read).toHaveLength(2);
    expect(read[0]!.requestId).toBe("a");
  });

  it("skips a corrupt trailing line instead of throwing", () => {
    const root = mkdtempSync(join(tmpdir(), "receipt-"));
    const path = ledgerPath(root);
    append(root, entry({ requestId: "good" }));
    writeFileSync(path, JSON.stringify(entry({ requestId: "good" })) + "\n{ broken", "utf8");
    const read = readLedger(path);
    expect(read).toHaveLength(1);
    expect(read[0]!.requestId).toBe("good");
  });

  it("collects known request ids for de-duplication", () => {
    const root = mkdtempSync(join(tmpdir(), "receipt-"));
    append(root, entry({ requestId: "x" }));
    append(root, entry({ requestId: "y" }));
    append(root, entry({})); // no id
    const ids = knownRequestIds(ledgerPath(root));
    expect(ids.has("x")).toBe(true);
    expect(ids.has("y")).toBe(true);
    expect(ids.size).toBe(2);
  });

  it("returns an empty array for a missing ledger", () => {
    expect(readLedger(join(tmpdir(), "does-not-exist-receipt.jsonl"))).toEqual([]);
  });
});
