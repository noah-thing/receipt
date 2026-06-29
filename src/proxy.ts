import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import pc from "picocolors";
import { append } from "./ledger.js";
import { Pricing, providerOf } from "./pricing.js";
import { currentBranch, currentSha, repoSlug } from "./git.js";
import { money, tokens } from "./util.js";
import type { LedgerEntry } from "./types.js";

export interface ProxyOptions {
  port: number;
  repoRoot: string;
  pricing: Pricing;
  anthropicUrl: string;
  openaiUrl: string;
  /** Override upstream for paths we don't recognize. */
  target?: string;
  quiet?: boolean;
}

/** Hop-by-hop headers that must not be forwarded. */
const STRIP_HEADERS = new Set([
  "host",
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "content-length",
  "accept-encoding",
]);

interface ParsedUsage {
  model?: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWrite5mTokens: number;
  cacheWrite1hTokens: number;
  toolCalls?: Record<string, number>;
}

function routeUpstream(path: string, opts: ProxyOptions): { base: string; provider: string } {
  if (path.startsWith("/v1/messages")) return { base: opts.anthropicUrl, provider: "anthropic" };
  if (
    path.startsWith("/v1/chat/completions") ||
    path.startsWith("/v1/completions") ||
    path.startsWith("/v1/responses") ||
    path.startsWith("/v1/embeddings")
  ) {
    return { base: opts.openaiUrl, provider: "openai" };
  }
  return { base: opts.target ?? opts.anthropicUrl, provider: "unknown" };
}

function readBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(c as Buffer));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

/** Pull usage out of an Anthropic /v1/messages response (JSON or SSE). */
export function parseAnthropic(body: string, contentType: string): ParsedUsage | undefined {
  const u: ParsedUsage = {
    inputTokens: 0,
    outputTokens: 0,
    cacheReadTokens: 0,
    cacheWrite5mTokens: 0,
    cacheWrite1hTokens: 0,
  };
  const applyUsage = (usage: Record<string, any>) => {
    if (typeof usage.input_tokens === "number") u.inputTokens = usage.input_tokens;
    if (typeof usage.output_tokens === "number") u.outputTokens = usage.output_tokens;
    if (typeof usage.cache_read_input_tokens === "number")
      u.cacheReadTokens = usage.cache_read_input_tokens;
    const cc = usage.cache_creation;
    if (cc && typeof cc === "object") {
      u.cacheWrite5mTokens = cc.ephemeral_5m_input_tokens ?? 0;
      u.cacheWrite1hTokens = cc.ephemeral_1h_input_tokens ?? 0;
    } else if (typeof usage.cache_creation_input_tokens === "number") {
      u.cacheWrite5mTokens = usage.cache_creation_input_tokens;
    }
    const web = usage.server_tool_use?.web_search_requests ?? 0;
    if (web > 0) u.toolCalls = { ...(u.toolCalls ?? {}), web_search_requests: web };
  };

  try {
    if (contentType.includes("event-stream")) {
      for (const line of body.split("\n")) {
        if (!line.startsWith("data:")) continue;
        const json = line.slice(5).trim();
        if (!json || json === "[DONE]") continue;
        let evt: any;
        try {
          evt = JSON.parse(json);
        } catch {
          continue;
        }
        if (evt.type === "message_start" && evt.message) {
          u.model = evt.message.model;
          if (evt.message.usage) applyUsage(evt.message.usage);
        } else if (evt.type === "message_delta" && evt.usage) {
          // message_delta carries the running output count; keep the latest.
          if (typeof evt.usage.output_tokens === "number") u.outputTokens = evt.usage.output_tokens;
        }
      }
    } else {
      const o = JSON.parse(body);
      u.model = o.model;
      if (o.usage) applyUsage(o.usage);
    }
  } catch {
    return undefined;
  }
  return u.model ? u : undefined;
}

/** Pull usage out of an OpenAI chat/responses payload (JSON or SSE). */
export function parseOpenAI(body: string, contentType: string): ParsedUsage | undefined {
  const u: ParsedUsage = {
    inputTokens: 0,
    outputTokens: 0,
    cacheReadTokens: 0,
    cacheWrite5mTokens: 0,
    cacheWrite1hTokens: 0,
  };
  const applyUsage = (usage: Record<string, any>) => {
    const cached = usage.prompt_tokens_details?.cached_tokens ?? 0;
    u.inputTokens = (usage.prompt_tokens ?? usage.input_tokens ?? 0) - cached;
    u.cacheReadTokens = cached;
    u.outputTokens = usage.completion_tokens ?? usage.output_tokens ?? 0;
  };
  try {
    if (contentType.includes("event-stream")) {
      for (const line of body.split("\n")) {
        if (!line.startsWith("data:")) continue;
        const json = line.slice(5).trim();
        if (!json || json === "[DONE]") continue;
        let evt: any;
        try {
          evt = JSON.parse(json);
        } catch {
          continue;
        }
        if (evt.model) u.model = evt.model;
        if (evt.usage) applyUsage(evt.usage);
        if (evt.response?.usage) applyUsage(evt.response.usage);
      }
    } else {
      const o = JSON.parse(body);
      u.model = o.model;
      const usage = o.usage ?? o.response?.usage;
      if (usage) applyUsage(usage);
    }
  } catch {
    return undefined;
  }
  return u.model && u.inputTokens + u.outputTokens > 0 ? u : undefined;
}

export function startProxy(opts: ProxyOptions): Promise<{ close: () => void }> {
  let gitCache: { branch?: string; sha?: string; repo?: string; at: number } | undefined;
  const git = () => {
    const now = Date.now();
    if (!gitCache || now - gitCache.at > 5000) {
      gitCache = {
        branch: currentBranch(opts.repoRoot),
        sha: currentSha(opts.repoRoot),
        repo: repoSlug(opts.repoRoot),
        at: now,
      };
    }
    return gitCache;
  };

  const handler = async (req: IncomingMessage, res: ServerResponse) => {
    const path = req.url ?? "/";
    const { base, provider } = routeUpstream(path, opts);
    const reqBody = await readBody(req);

    const headers: Record<string, string> = {};
    for (const [k, v] of Object.entries(req.headers)) {
      if (STRIP_HEADERS.has(k.toLowerCase())) continue;
      if (Array.isArray(v)) headers[k] = v.join(", ");
      else if (v != null) headers[k] = v;
    }
    headers["accept-encoding"] = "identity"; // so we can read usage without gunzipping

    let upstream: Response;
    try {
      upstream = await fetch(base + path, {
        method: req.method,
        headers,
        body: reqBody.length ? reqBody : undefined,
      });
    } catch (err) {
      res.writeHead(502, { "content-type": "text/plain" });
      res.end(`receipt proxy: upstream error: ${(err as Error).message}`);
      return;
    }

    // Mirror the upstream response to the client and tee a copy for parsing.
    const resHeaders: Record<string, string> = {};
    upstream.headers.forEach((value, key) => {
      if (STRIP_HEADERS.has(key.toLowerCase())) return;
      resHeaders[key] = value;
    });
    res.writeHead(upstream.status, resHeaders);

    const contentType = upstream.headers.get("content-type") ?? "";
    const collected: Buffer[] = [];
    if (upstream.body) {
      const reader = upstream.body.getReader();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        const buf = Buffer.from(value);
        collected.push(buf);
        res.write(buf);
      }
    }
    res.end();

    if (upstream.status < 200 || upstream.status >= 300) return;

    const text = Buffer.concat(collected).toString("utf8");
    const parsed =
      provider === "openai"
        ? parseOpenAI(text, contentType)
        : provider === "anthropic"
          ? parseAnthropic(text, contentType)
          : (parseAnthropic(text, contentType) ?? parseOpenAI(text, contentType));

    if (!parsed || !parsed.model) return;

    const g = git();
    const partial = {
      model: parsed.model,
      inputTokens: parsed.inputTokens,
      outputTokens: parsed.outputTokens,
      cacheReadTokens: parsed.cacheReadTokens,
      cacheWrite5mTokens: parsed.cacheWrite5mTokens,
      cacheWrite1hTokens: parsed.cacheWrite1hTokens,
      toolCalls: parsed.toolCalls,
    };
    const entry: LedgerEntry = {
      ts: new Date().toISOString(),
      source: "proxy",
      provider: providerOf(parsed.model),
      costUsd: opts.pricing.cost(partial),
      ...partial,
      git: { branch: g.branch, sha: g.sha, repo: g.repo },
    };
    append(opts.repoRoot, entry);

    if (!opts.quiet) {
      const cost = entry.costUsd === null ? pc.yellow("unpriced") : pc.green(money(entry.costUsd));
      process.stderr.write(
        `${pc.dim(new Date().toLocaleTimeString())} ${pc.cyan(parsed.model)} ` +
          `${tokens(parsed.inputTokens)}→${tokens(parsed.outputTokens)} ${cost}` +
          `${g.branch ? pc.dim(` (${g.branch})`) : ""}\n`,
      );
    }
  };

  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      handler(req, res).catch((err) => {
        if (!res.headersSent) res.writeHead(500);
        res.end(`receipt proxy error: ${(err as Error).message}`);
      });
    });
    server.listen(opts.port, () => resolve({ close: () => server.close() }));
  });
}
