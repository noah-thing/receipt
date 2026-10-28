import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { Pricing } from "../src/pricing.js";
import { importCodex } from "../src/importers/codex.js";

const pricing = Pricing.load();

const meta = (cwd: string, branch?: string) =>
  JSON.stringify({
    timestamp: "2026-10-20T10:00:00.000Z",
    type: "session_meta",
    payload: { id: "s1", cwd, git: branch ? { branch } : {} },
  });
const turn = (id: string, model: string, cwd: string) =>
  JSON.stringify({
    timestamp: "2026-10-20T10:00:01.000Z",
    type: "turn_context",
    payload: { turn_id: id, cwd, model },
  });
const record = (turnId: string, responseId: string, usage: object, ts = "2026-10-20T10:00:05.000Z") =>
  JSON.stringify({
    timestamp: ts,
    type: "token_usage_record",
    payload: { turn_id: turnId, response_id: responseId, usage },
  });
const noise = JSON.stringify({
  timestamp: "2026-10-20T10:00:02.000Z",
  type: "response_item",
  payload: { type: "message", content: "ignored" },
});

function rollout(lines: string[]): string {
  const dir = mkdtempSync(join(tmpdir(), "codex-"));
  const day = join(dir, "2026", "10", "20");
  mkdirSync(day, { recursive: true });
  writeFileSync(join(day, "rollout-test.jsonl"), lines.join("\n") + "\n");
  return dir;
}

describe("importCodex", () => {
  it("splits cached input, keeps output whole, and prices the model", async () => {
    const dir = rollout([
      meta("/work/app"),
      turn("t1", "gpt-6-sol", "/work/app"),
      noise,
      record("t1", "resp_1", { input_tokens: 1_000_000, cached_input_tokens: 600_000, output_tokens: 100_000, reasoning_output_tokens: 40_000 }),
    ]);
    const [e] = await importCodex({ pricing, dir, all: true });
    expect(e!.source).toBe("codex");
    expect(e!.provider).toBe("openai");
    expect(e!.model).toBe("gpt-6-sol");
    expect(e!.inputTokens).toBe(400_000);
    expect(e!.cacheReadTokens).toBe(600_000);
    expect(e!.outputTokens).toBe(100_000);
    // 0.4M x $2 + 0.6M x $0.20 + 0.1M x $10
    expect(e!.costUsd).toBeCloseTo(0.8 + 0.12 + 1, 6);
    expect(e!.requestId).toBe("resp_1");
  });

  it("uses the model of the matching turn", async () => {
    const dir = rollout([
      meta("/work/app"),
      turn("t1", "gpt-6-sol", "/work/app"),
      turn("t2", "gpt-6-luna", "/work/app"),
      record("t1", "r1", { input_tokens: 10, cached_input_tokens: 0, output_tokens: 1 }),
      record("t2", "r2", { input_tokens: 10, cached_input_tokens: 0, output_tokens: 1 }),
    ]);
    const entries = await importCodex({ pricing, dir, all: true });
    expect(entries.map((e) => e.model)).toEqual(["gpt-6-sol", "gpt-6-luna"]);
  });

  it("filters by repo, by branch and by time", async () => {
    const dir = rollout([
      meta("/work/app", "feature"),
      turn("t1", "gpt-6-sol", "/work/app/sub"),
      record("t1", "a", { input_tokens: 5, output_tokens: 1 }, "2026-10-20T10:00:05.000Z"),
      record("t1", "b", { input_tokens: 5, output_tokens: 1 }, "2026-10-21T10:00:05.000Z"),
    ]);
    expect(await importCodex({ pricing, dir, repoRoot: "/work/app" })).toHaveLength(2);
    expect(await importCodex({ pricing, dir, repoRoot: "/work/other" })).toHaveLength(0);
    expect(await importCodex({ pricing, dir, all: true, branch: "feature" })).toHaveLength(2);
    expect(await importCodex({ pricing, dir, all: true, branch: "main" })).toHaveLength(0);
    const later = await importCodex({ pricing, dir, all: true, sinceTs: "2026-10-21T00:00:00Z" });
    expect(later.map((e) => e.requestId)).toEqual(["b"]);
  });

  it("de-dupes by response id and against the ledger", async () => {
    const dir = rollout([
      meta("/work/app"),
      turn("t1", "gpt-6-sol", "/work/app"),
      record("t1", "same", { input_tokens: 5, output_tokens: 1 }),
      record("t1", "same", { input_tokens: 5, output_tokens: 1 }),
      record("t1", "old", { input_tokens: 5, output_tokens: 1 }),
    ]);
    const entries = await importCodex({ pricing, dir, all: true, seen: new Set(["old"]) });
    expect(entries.map((e) => e.requestId)).toEqual(["same"]);
  });

  it("leaves an unknown model unpriced and skips records with no model", async () => {
    const dir = rollout([
      record("t0", "orphan", { input_tokens: 5, output_tokens: 1 }),
      meta("/work/app"),
      turn("t1", "gpt-99-mystery", "/work/app"),
      record("t1", "r1", { input_tokens: 5, output_tokens: 1 }),
    ]);
    const entries = await importCodex({ pricing, dir, all: true });
    expect(entries).toHaveLength(1);
    expect(entries[0]!.costUsd).toBeNull();
  });

  it("returns nothing for a missing directory", async () => {
    expect(await importCodex({ pricing, dir: "/nonexistent/codex", all: true })).toEqual([]);
  });
});
