import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { Pricing } from "../src/pricing.js";
import { importClaudeCode } from "../src/importers/claude-code.js";
import { importGeneric } from "../src/importers/generic.js";

const pricing = Pricing.load();

describe("importClaudeCode", () => {
  it("reads usage, skips synthetic, and de-dupes by request id", async () => {
    const dir = mkdtempSync(join(tmpdir(), "cc-"));
    const lines = [
      // a real assistant turn
      JSON.stringify({
        type: "assistant",
        timestamp: "2026-06-29T10:00:00Z",
        requestId: "req_1",
        gitBranch: "feature",
        message: {
          model: "claude-opus-4-8",
          usage: {
            input_tokens: 1000,
            output_tokens: 500,
            cache_read_input_tokens: 2000,
            cache_creation: { ephemeral_5m_input_tokens: 100, ephemeral_1h_input_tokens: 0 },
            server_tool_use: { web_search_requests: 1, web_fetch_requests: 0 },
          },
        },
      }),
      // duplicate request id — should be ignored
      JSON.stringify({
        type: "assistant",
        timestamp: "2026-06-29T10:00:01Z",
        requestId: "req_1",
        gitBranch: "feature",
        message: { model: "claude-opus-4-8", usage: { input_tokens: 1, output_tokens: 1 } },
      }),
      // synthetic — should be skipped
      JSON.stringify({
        type: "assistant",
        timestamp: "2026-06-29T10:00:02Z",
        message: { model: "<synthetic>", usage: { input_tokens: 9, output_tokens: 9 } },
      }),
      // a user line — no usage
      JSON.stringify({ type: "user", message: { role: "user", content: "hi" } }),
    ];
    writeFileSync(join(dir, "session.jsonl"), lines.join("\n") + "\n");

    const entries = await importClaudeCode({ pricing, dir, all: true });
    expect(entries).toHaveLength(1);
    const entry = entries[0]!;
    expect(entry.model).toBe("claude-opus-4-8");
    expect(entry.git?.branch).toBe("feature");
    expect(entry.cacheWrite5mTokens).toBe(100);
    expect(entry.toolCalls).toEqual({ web_search_requests: 1 });
    expect(entry.costUsd).toBeGreaterThan(0);
  });

  it("respects the seen set for incremental imports", async () => {
    const dir = mkdtempSync(join(tmpdir(), "cc-"));
    writeFileSync(
      join(dir, "s.jsonl"),
      JSON.stringify({
        type: "assistant",
        timestamp: "2026-06-29T10:00:00Z",
        requestId: "already",
        message: { model: "claude-opus-4-8", usage: { input_tokens: 1, output_tokens: 1 } },
      }) + "\n",
    );
    const entries = await importClaudeCode({ pricing, dir, all: true, seen: new Set(["already"]) });
    expect(entries).toHaveLength(0);
  });
});

describe("importGeneric", () => {
  it("normalizes OpenAI-shaped rows", () => {
    const file = join(mkdtempSync(join(tmpdir(), "gen-")), "usage.json");
    writeFileSync(
      file,
      JSON.stringify([
        {
          model: "gpt-4o",
          usage: { prompt_tokens: 1000, completion_tokens: 500, prompt_tokens_details: { cached_tokens: 200 } },
          branch: "main",
        },
      ]),
    );
    const entries = importGeneric(file, pricing);
    expect(entries).toHaveLength(1);
    expect(entries[0]!.model).toBe("gpt-4o");
    expect(entries[0]!.inputTokens).toBe(1000);
    expect(entries[0]!.cacheReadTokens).toBe(200);
    expect(entries[0]!.git?.branch).toBe("main");
  });

  it("reads JSONL and skips rows with no tokens", () => {
    const file = join(mkdtempSync(join(tmpdir(), "gen-")), "usage.jsonl");
    writeFileSync(
      file,
      [
        JSON.stringify({ model: "claude-opus-4-8", input_tokens: 100, output_tokens: 50 }),
        JSON.stringify({ model: "claude-opus-4-8", input_tokens: 0, output_tokens: 0 }),
      ].join("\n"),
    );
    const entries = importGeneric(file, pricing);
    expect(entries).toHaveLength(1);
  });
});
