import { describe, expect, it } from "vitest";
import { parseAnthropic, parseOpenAI } from "../src/proxy.js";

describe("parseAnthropic", () => {
  it("reads usage from a non-streaming response", () => {
    const body = JSON.stringify({
      model: "claude-opus-4-8",
      usage: {
        input_tokens: 1200,
        output_tokens: 800,
        cache_read_input_tokens: 40000,
        cache_creation: { ephemeral_5m_input_tokens: 5000, ephemeral_1h_input_tokens: 0 },
      },
    });
    const u = parseAnthropic(body, "application/json")!;
    expect(u.model).toBe("claude-opus-4-8");
    expect(u.inputTokens).toBe(1200);
    expect(u.outputTokens).toBe(800);
    expect(u.cacheReadTokens).toBe(40000);
    expect(u.cacheWrite5mTokens).toBe(5000);
  });

  it("reads usage from a streaming (SSE) response", () => {
    const sse = [
      `event: message_start`,
      `data: ${JSON.stringify({ type: "message_start", message: { model: "claude-opus-4-8", usage: { input_tokens: 500, output_tokens: 1, cache_read_input_tokens: 9000 } } })}`,
      ``,
      `event: message_delta`,
      `data: ${JSON.stringify({ type: "message_delta", usage: { output_tokens: 640 } })}`,
      ``,
      `data: [DONE]`,
    ].join("\n");
    const u = parseAnthropic(sse, "text/event-stream")!;
    expect(u.model).toBe("claude-opus-4-8");
    expect(u.inputTokens).toBe(500);
    expect(u.outputTokens).toBe(640); // last message_delta wins
    expect(u.cacheReadTokens).toBe(9000);
  });
});

describe("parseOpenAI", () => {
  it("separates cached tokens from fresh input", () => {
    const body = JSON.stringify({
      model: "gpt-4o",
      usage: { prompt_tokens: 1000, completion_tokens: 400, prompt_tokens_details: { cached_tokens: 250 } },
    });
    const u = parseOpenAI(body, "application/json")!;
    expect(u.inputTokens).toBe(750);
    expect(u.cacheReadTokens).toBe(250);
    expect(u.outputTokens).toBe(400);
  });

  it("reads usage from the final streaming chunk", () => {
    const sse = [
      `data: ${JSON.stringify({ model: "gpt-4o", choices: [{ delta: { content: "hi" } }] })}`,
      `data: ${JSON.stringify({ model: "gpt-4o", usage: { prompt_tokens: 80, completion_tokens: 20 } })}`,
      `data: [DONE]`,
    ].join("\n");
    const u = parseOpenAI(sse, "text/event-stream")!;
    expect(u.inputTokens).toBe(80);
    expect(u.outputTokens).toBe(20);
  });
});
