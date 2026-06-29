import { createRequire as __cr } from 'module'; const require = __cr(import.meta.url);

// src/pricing.ts
import { readFileSync, existsSync } from "fs";
import { join } from "path";

// src/prices.json
var prices_default = {
  _meta: {
    updated: "2026-06",
    currency: "USD",
    note: "Best-effort public list prices in USD per 1,000,000 tokens. Prices change and your negotiated rate may differ. Override any of these by dropping a .receipt/prices.json in your repo; it is merged over these defaults. Unverified entries are marked verified:false and flagged on the receipt."
  },
  models: {
    "claude-opus-4-8": { input: 15, output: 75, tools: { web_search_requests: 0.01 } },
    "claude-opus-4-7": { input: 15, output: 75, tools: { web_search_requests: 0.01 } },
    "claude-opus-4-1": { input: 15, output: 75 },
    "claude-opus-4": { input: 15, output: 75 },
    "claude-sonnet-4-6": { input: 3, output: 15, tools: { web_search_requests: 0.01 } },
    "claude-sonnet-4-5": { input: 3, output: 15 },
    "claude-sonnet-4": { input: 3, output: 15 },
    "claude-haiku-4-5": { input: 1, output: 5 },
    "claude-3-7-sonnet": { input: 3, output: 15 },
    "claude-3-5-sonnet": { input: 3, output: 15 },
    "claude-3-5-haiku": { input: 0.8, output: 4 },
    "claude-3-opus": { input: 15, output: 75 },
    "claude-3-haiku": { input: 0.25, output: 1.25 },
    "claude-fable-5": { input: 3, output: 15, verified: false },
    "gpt-4o": { input: 2.5, output: 10, cacheRead: 1.25 },
    "gpt-4o-mini": { input: 0.15, output: 0.6, cacheRead: 0.075 },
    "gpt-4.1": { input: 2, output: 8, cacheRead: 0.5 },
    "gpt-4.1-mini": { input: 0.4, output: 1.6, cacheRead: 0.1 },
    "gpt-4.1-nano": { input: 0.1, output: 0.4, cacheRead: 0.025 },
    o3: { input: 2, output: 8, cacheRead: 0.5, verified: false },
    "o4-mini": { input: 1.1, output: 4.4, cacheRead: 0.275, verified: false },
    "gpt-4-turbo": { input: 10, output: 30 },
    "gpt-3.5-turbo": { input: 0.5, output: 1.5 },
    "gemini-2.5-pro": { input: 1.25, output: 10, verified: false },
    "gemini-2.5-flash": { input: 0.3, output: 2.5, verified: false },
    "gemini-2.0-flash": { input: 0.1, output: 0.4, verified: false },
    haiku: { input: 1, output: 5 },
    sonnet: { input: 3, output: 15 },
    opus: { input: 15, output: 75 }
  },
  prefixes: [
    { match: "claude-opus", model: "claude-opus-4-8" },
    { match: "claude-sonnet", model: "claude-sonnet-4-6" },
    { match: "claude-haiku", model: "claude-haiku-4-5" },
    { match: "claude-3-5-sonnet", model: "claude-3-5-sonnet" },
    { match: "gpt-4o-mini", model: "gpt-4o-mini" },
    { match: "gpt-4o", model: "gpt-4o" },
    { match: "gpt-4.1-mini", model: "gpt-4.1-mini" },
    { match: "gpt-4.1", model: "gpt-4.1" },
    { match: "gemini-2.5-pro", model: "gemini-2.5-pro" },
    { match: "gemini-2.5-flash", model: "gemini-2.5-flash" }
  ]
};

// src/pricing.ts
var CACHE_READ_MULT = 0.1;
var CACHE_WRITE_5M_MULT = 1.25;
var CACHE_WRITE_1H_MULT = 2;
var Pricing = class _Pricing {
  book;
  constructor(book) {
    this.book = book;
  }
  /**
   * Load the bundled price book, then merge an optional repo override from
   * `.receipt/prices.json`. The override wins key by key, so a team can fix
   * one model's price without restating the whole table.
   */
  static load(repoRoot) {
    const base = structuredClone(prices_default);
    if (repoRoot) {
      const overridePath = join(repoRoot, ".receipt", "prices.json");
      if (existsSync(overridePath)) {
        try {
          const override = JSON.parse(readFileSync(overridePath, "utf8"));
          base.models = { ...base.models, ...override.models };
          if (override.prefixes) base.prefixes = override.prefixes;
          if (override._meta) base._meta = { ...base._meta, ...override._meta };
        } catch (err) {
          throw new Error(
            `Could not parse ${overridePath}: ${err.message}`
          );
        }
      }
    }
    return new _Pricing(base);
  }
  currency() {
    return this.book._meta?.currency ?? "USD";
  }
  /** The "as-of" date stamped on the price book, shown in the receipt footer. */
  updated() {
    return this.book._meta?.updated;
  }
  /** Resolve a model id to its price card, trying exact match then prefixes. */
  priceFor(model) {
    const exact = this.book.models[model];
    if (exact) return exact;
    for (const rule of this.book.prefixes ?? []) {
      if (model.startsWith(rule.match)) {
        const target = this.book.models[rule.model];
        if (target) return target;
      }
    }
    return void 0;
  }
  isVerified(model) {
    const price = this.priceFor(model);
    return price ? price.verified !== false : false;
  }
  /**
   * Cost in USD for one metered call. Returns `null` when the model is
   * unknown, so the caller can surface "unpriced" rather than invent a zero.
   */
  cost(entry) {
    const price = this.priceFor(entry.model);
    if (!price) return null;
    const perM = (tokens2, rate) => tokens2 / 1e6 * rate;
    let usd = 0;
    usd += perM(entry.inputTokens, price.input);
    usd += perM(entry.outputTokens, price.output);
    usd += perM(entry.cacheReadTokens, price.cacheRead ?? price.input * CACHE_READ_MULT);
    usd += perM(
      entry.cacheWrite5mTokens,
      price.cacheWrite5m ?? price.input * CACHE_WRITE_5M_MULT
    );
    usd += perM(
      entry.cacheWrite1hTokens,
      price.cacheWrite1h ?? price.input * CACHE_WRITE_1H_MULT
    );
    for (const [tool, count] of Object.entries(entry.toolCalls ?? {})) {
      const rate = price.tools?.[tool];
      if (rate) usd += count * rate;
    }
    return usd;
  }
};
function providerOf(model) {
  const m = model.toLowerCase();
  if (m.includes("claude") || m === "opus" || m === "sonnet" || m === "haiku" || m.includes("fable"))
    return "anthropic";
  if (m.startsWith("gpt") || m.startsWith("o1") || m.startsWith("o3") || m.startsWith("o4"))
    return "openai";
  if (m.includes("gemini")) return "google";
  return "unknown";
}

// src/ledger.ts
import { appendFileSync, existsSync as existsSync2, mkdirSync, readFileSync as readFileSync2 } from "fs";
import { dirname, join as join2 } from "path";
function ledgerPath(repoRoot) {
  return process.env.RECEIPT_LEDGER || join2(repoRoot, ".receipt", "ledger.jsonl");
}
function append(repoRoot, entry) {
  const path = ledgerPath(repoRoot);
  mkdirSync(dirname(path), { recursive: true });
  appendFileSync(path, JSON.stringify(entry) + "\n", "utf8");
}
function appendMany(repoRoot, entries) {
  if (entries.length === 0) return;
  const path = ledgerPath(repoRoot);
  mkdirSync(dirname(path), { recursive: true });
  appendFileSync(path, entries.map((e) => JSON.stringify(e)).join("\n") + "\n", "utf8");
}
function readLedger(path) {
  if (!existsSync2(path)) return [];
  const out = [];
  for (const line of readFileSync2(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      out.push(JSON.parse(trimmed));
    } catch {
    }
  }
  return out;
}
function knownRequestIds(path) {
  const ids = /* @__PURE__ */ new Set();
  for (const e of readLedger(path)) {
    if (e.requestId) ids.add(e.requestId);
  }
  return ids;
}

// src/receipt.ts
function selectEntries(entries, opts) {
  const { branch, sinceTs, untilTs, rangeShas } = opts;
  const sinceMs = sinceTs ? new Date(sinceTs).getTime() : void 0;
  const untilMs = untilTs ? new Date(untilTs).getTime() : void 0;
  return entries.filter((e) => {
    const t = new Date(e.ts).getTime();
    if (sinceMs !== void 0 && t < sinceMs) return false;
    if (untilMs !== void 0 && t >= untilMs) return false;
    if (!branch && !rangeShas) return true;
    const shaHit = rangeShas && e.git?.sha ? rangeShas.has(e.git.sha) : false;
    const branchHit = branch ? e.git?.branch === branch : false;
    if (!branch && rangeShas) return shaHit;
    if (branch && !rangeShas) return branchHit;
    return shaHit || branchHit;
  });
}
function buildReceipt(selected, opts = {}) {
  const byModelMap = /* @__PURE__ */ new Map();
  const toolTotals = {};
  const unpriced = /* @__PURE__ */ new Set();
  let total = 0;
  let totalTokens2 = 0;
  let retries = 0;
  let first;
  let last;
  for (const e of selected) {
    const r = byModelMap.get(e.model) ?? {
      model: e.model,
      provider: e.provider,
      calls: 0,
      inputTokens: 0,
      outputTokens: 0,
      cacheReadTokens: 0,
      cacheWriteTokens: 0,
      costUsd: 0,
      priced: true
    };
    r.calls += 1;
    r.inputTokens += e.inputTokens;
    r.outputTokens += e.outputTokens;
    r.cacheReadTokens += e.cacheReadTokens;
    r.cacheWriteTokens += e.cacheWrite5mTokens + e.cacheWrite1hTokens;
    if (e.costUsd === null) {
      r.priced = false;
      unpriced.add(e.model);
    } else {
      r.costUsd += e.costUsd;
      total += e.costUsd;
    }
    totalTokens2 += e.inputTokens + e.outputTokens + e.cacheReadTokens + e.cacheWrite5mTokens + e.cacheWrite1hTokens;
    retries += e.retries ?? 0;
    for (const [tool, count] of Object.entries(e.toolCalls ?? {})) {
      toolTotals[tool] = (toolTotals[tool] ?? 0) + count;
    }
    if (!first || e.ts < first) first = e.ts;
    if (!last || e.ts > last) last = e.ts;
    byModelMap.set(e.model, r);
  }
  const byModel = [...byModelMap.values()].sort((a, b) => b.costUsd - a.costUsd);
  return {
    total,
    unpricedModels: [...unpriced],
    totalTokens: totalTokens2,
    entryCount: selected.length,
    retries,
    byModel,
    toolTotals,
    firstTs: first,
    lastTs: last,
    branch: opts.branch,
    base: opts.base,
    currency: opts.currency ?? "USD"
  };
}

// src/util.ts
function money(usd, currency = "USD") {
  const symbol = currency === "USD" ? "$" : "";
  const suffix = currency === "USD" ? "" : ` ${currency}`;
  if (usd === 0) return `${symbol}0.00${suffix}`;
  const abs = Math.abs(usd);
  const dp = abs < 0.01 ? 4 : abs < 0.1 ? 3 : 2;
  return `${symbol}${usd.toFixed(dp)}${suffix}`;
}
function tokens(n) {
  if (n < 1e3) return String(n);
  if (n < 1e6) return `${(n / 1e3).toFixed(n < 1e4 ? 1 : 0)}k`;
  return `${(n / 1e6).toFixed(1)}M`;
}
var BARS = ["\u2581", "\u2582", "\u2583", "\u2584", "\u2585", "\u2586", "\u2587", "\u2588"];
function sparkline(values) {
  if (values.length === 0) return "";
  const max = Math.max(...values);
  if (max === 0) return BARS[0].repeat(values.length);
  return values.map((v) => {
    const idx = Math.min(BARS.length - 1, Math.round(v / max * (BARS.length - 1)));
    return BARS[idx];
  }).join("");
}
function timeBuckets(timestamps, values, maxBuckets = 16) {
  if (timestamps.length === 0) return [];
  const times = timestamps.map((t) => new Date(t).getTime());
  const min = Math.min(...times);
  const max = Math.max(...times);
  const span = max - min;
  const n = Math.max(1, Math.min(maxBuckets, timestamps.length));
  const buckets = new Array(n).fill(0);
  for (let i = 0; i < times.length; i++) {
    const frac = span === 0 ? 0 : (times[i] - min) / span;
    const idx = Math.min(n - 1, Math.floor(frac * n));
    buckets[idx] += values[i];
  }
  return buckets;
}
function progressBar(fraction, width = 20) {
  const f = Math.max(0, Math.min(1, fraction));
  const filled = Math.round(f * width);
  return "\u2588".repeat(filled) + "\u2591".repeat(width - filled);
}
function pct(fraction) {
  return `${Math.round(fraction * 100)}%`;
}

// src/render.ts
var COMMENT_MARKER = "<!-- receipt:v1 -->";
var PROVIDER_BADGE = {
  anthropic: "\u25C6",
  openai: "\u25CB",
  google: "\u25B3",
  unknown: "\xB7"
};
function renderMarkdown(receipt, opts = {}) {
  const { currency } = receipt;
  const lines = [];
  lines.push(COMMENT_MARKER);
  const scope = receipt.branch ? ` \u2014 \`${receipt.branch}\`` : "";
  lines.push(`### \u{1F9FE} Receipt${scope}`);
  lines.push("");
  if (receipt.entryCount === 0) {
    lines.push("No AI usage recorded for this branch yet.");
    lines.push("");
    lines.push(footer(opts));
    return lines.join("\n");
  }
  const head = [
    `**${money(receipt.total, currency)}**`,
    `${tokens(receipt.totalTokens)} tokens`,
    `${receipt.entryCount} calls`
  ];
  if (receipt.retries > 0) head.push(`${receipt.retries} retries`);
  lines.push(head.join(" \xB7 "));
  lines.push("");
  if (opts.budget?.perPr) {
    const frac = receipt.total / opts.budget.perPr;
    const flag = frac > 1 ? "\u{1F534}" : frac > 0.8 ? "\u{1F7E1}" : "\u{1F7E2}";
    const verdict = frac > 1 ? `over budget by ${money(receipt.total - opts.budget.perPr, currency)}` : `${money(opts.budget.perPr - receipt.total, currency)} left`;
    lines.push(
      `${flag} \`${progressBar(frac)}\` ${pct(frac)} of ${money(opts.budget.perPr, currency)} budget \u2014 ${verdict}`
    );
    lines.push("");
  }
  if (opts.medianPr && opts.medianPr > 0) {
    const ratio = receipt.total / opts.medianPr;
    const word = ratio >= 1 ? "more" : "less";
    lines.push(`This PR cost **${ratio.toFixed(1)}\xD7** ${word} than your median PR (${money(opts.medianPr, currency)}).`);
    lines.push("");
  }
  lines.push("| Model | Calls | Input | Output | Cache | Cost |");
  lines.push("| --- | --: | --: | --: | --: | --: |");
  for (const m of receipt.byModel) {
    const badge = PROVIDER_BADGE[m.provider] ?? "\xB7";
    const cost = m.priced ? money(m.costUsd, currency) : "\u2014";
    lines.push(
      `| ${badge} \`${m.model}\` | ${m.calls} | ${tokens(m.inputTokens)} | ${tokens(m.outputTokens)} | ${tokens(m.cacheReadTokens + m.cacheWriteTokens)} | ${cost} |`
    );
  }
  lines.push("");
  if (opts.series && opts.series.length > 1) {
    const buckets = timeBuckets(
      opts.series.map((s) => s.ts),
      opts.series.map((s) => s.cost)
    );
    if (buckets.length > 1) {
      lines.push(`Spend over time \`${sparkline(buckets)}\``);
      lines.push("");
    }
  }
  const tools = Object.entries(receipt.toolTotals).filter(([, n]) => n > 0);
  if (tools.length > 0) {
    lines.push(
      "Tool calls: " + tools.map(([t, n]) => `${n}\xD7 ${t.replace(/_/g, " ")}`).join(", ")
    );
    lines.push("");
  }
  if (receipt.unpricedModels.length > 0) {
    lines.push(
      `> \u26A0\uFE0F No price on file for ${receipt.unpricedModels.map((m) => `\`${m}\``).join(", ")}; their tokens are counted but not costed. Add them to \`.receipt/prices.json\`.`
    );
    lines.push("");
  }
  lines.push(footer(opts));
  return lines.join("\n");
}
function footer(opts) {
  const url = opts.repoUrl ?? "https://github.com/noah-thing/receipt";
  const priced = opts.priceUpdated ? ` \xB7 prices as of ${opts.priceUpdated}` : "";
  return `<sub>\u{1F9FE} [Receipt](${url}) \xB7 measured from real token usage${priced}</sub>`;
}
function renderText(receipt) {
  const c = receipt.currency;
  const out = [];
  const scope = receipt.branch ? ` (${receipt.branch})` : "";
  out.push(`Receipt${scope}`);
  out.push(
    `${money(receipt.total, c)}  \xB7  ${tokens(receipt.totalTokens)} tokens  \xB7  ${receipt.entryCount} calls` + (receipt.retries ? `  \xB7  ${receipt.retries} retries` : "")
  );
  out.push("");
  const nameW = Math.max(5, ...receipt.byModel.map((m) => m.model.length));
  out.push(
    `${"model".padEnd(nameW)}  ${"calls".padStart(6)}  ${"in".padStart(7)}  ${"out".padStart(7)}  ${"cache".padStart(7)}  ${"cost".padStart(9)}`
  );
  for (const m of receipt.byModel) {
    const cost = m.priced ? money(m.costUsd, c) : "\u2014";
    out.push(
      `${m.model.padEnd(nameW)}  ${String(m.calls).padStart(6)}  ${tokens(m.inputTokens).padStart(7)}  ${tokens(m.outputTokens).padStart(7)}  ${tokens(m.cacheReadTokens + m.cacheWriteTokens).padStart(7)}  ${cost.padStart(9)}`
    );
  }
  if (receipt.unpricedModels.length > 0) {
    out.push("");
    out.push(`unpriced: ${receipt.unpricedModels.join(", ")} (counted, not costed)`);
  }
  return out.join("\n");
}

// src/dashboard.ts
import { createServer } from "http";
import { readFileSync as readFileSync4 } from "fs";
import { dirname as dirname3, join as join4 } from "path";
import { fileURLToPath } from "url";

// src/config.ts
import { existsSync as existsSync3, mkdirSync as mkdirSync2, readFileSync as readFileSync3, writeFileSync } from "fs";
import { dirname as dirname2, join as join3 } from "path";

// src/dashboard.ts
var totalTokens = (e) => e.inputTokens + e.outputTokens + e.cacheReadTokens + e.cacheWrite5mTokens + e.cacheWrite1hTokens;
function buildDashboardData(entries, config = {}) {
  const daily = /* @__PURE__ */ new Map();
  const byModel = /* @__PURE__ */ new Map();
  const byBranch = /* @__PURE__ */ new Map();
  const byProvider = /* @__PURE__ */ new Map();
  let cost = 0;
  let tokens2 = 0;
  let first;
  let last;
  for (const e of entries) {
    const c = e.costUsd ?? 0;
    const tk = totalTokens(e);
    cost += c;
    tokens2 += tk;
    if (!first || e.ts < first) first = e.ts;
    if (!last || e.ts > last) last = e.ts;
    const day = e.ts.slice(0, 10);
    const d = daily.get(day) ?? { cost: 0, tokens: 0, calls: 0 };
    d.cost += c;
    d.tokens += tk;
    d.calls += 1;
    daily.set(day, d);
    const m = byModel.get(e.model) ?? { provider: e.provider, cost: 0, tokens: 0, calls: 0 };
    m.cost += c;
    m.tokens += tk;
    m.calls += 1;
    byModel.set(e.model, m);
    const branch = e.git?.branch ?? "(unknown)";
    const b = byBranch.get(branch) ?? { cost: 0, calls: 0 };
    b.cost += c;
    b.calls += 1;
    byBranch.set(branch, b);
    byProvider.set(e.provider, (byProvider.get(e.provider) ?? 0) + c);
  }
  return {
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    currency: config.currency ?? "USD",
    budget: config.budget,
    totals: { cost, tokens: tokens2, calls: entries.length, firstTs: first, lastTs: last },
    daily: [...daily.entries()].map(([date, v]) => ({ date, ...v })).sort((a, b) => a.date.localeCompare(b.date)),
    byModel: [...byModel.entries()].map(([model, v]) => ({ model, ...v })).sort((a, b) => b.cost - a.cost),
    byBranch: [...byBranch.entries()].map(([branch, v]) => ({ branch, ...v })).sort((a, b) => b.cost - a.cost).slice(0, 20),
    byProvider: [...byProvider.entries()].map(([provider, cost2]) => ({ provider, cost: cost2 })).sort((a, b) => b.cost - a.cost),
    topCalls: [...entries].filter((e) => e.costUsd !== null).sort((a, b) => (b.costUsd ?? 0) - (a.costUsd ?? 0)).slice(0, 12).map((e) => ({
      ts: e.ts,
      model: e.model,
      cost: e.costUsd ?? 0,
      tokens: totalTokens(e),
      branch: e.git?.branch
    }))
  };
}

// src/importers/generic.ts
import { readFileSync as readFileSync5 } from "fs";
function num(o, ...keys) {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
  }
  return 0;
}
function str(o, ...keys) {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "string" && v) return v;
  }
  return void 0;
}
function importGeneric(filePath, pricing, defaults = {}) {
  const raw = readFileSync5(filePath, "utf8").trim();
  let rows;
  if (raw.startsWith("[")) {
    rows = JSON.parse(raw);
  } else {
    rows = raw.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => JSON.parse(l));
  }
  const out = [];
  for (const row of rows) {
    const u = typeof row.usage === "object" && row.usage ? row.usage : row;
    const model = str(row, "model", "model_id") ?? "unknown";
    const inputTokens = num(u, "input_tokens", "inputTokens", "prompt_tokens", "promptTokens");
    const outputTokens = num(
      u,
      "output_tokens",
      "outputTokens",
      "completion_tokens",
      "completionTokens"
    );
    const details = typeof u.prompt_tokens_details === "object" && u.prompt_tokens_details ? u.prompt_tokens_details : {};
    const cacheReadTokens = num(u, "cache_read_input_tokens", "cacheReadTokens", "cached_tokens") || num(details, "cached_tokens");
    const cacheWrite5mTokens = num(u, "cache_creation_input_tokens", "cacheWriteTokens");
    if (inputTokens + outputTokens + cacheReadTokens + cacheWrite5mTokens === 0) continue;
    const partial = {
      model,
      inputTokens,
      outputTokens,
      cacheReadTokens,
      cacheWrite5mTokens,
      cacheWrite1hTokens: 0,
      toolCalls: void 0
    };
    out.push({
      ts: str(row, "ts", "timestamp", "created_at", "createdAt") ?? (/* @__PURE__ */ new Date()).toISOString(),
      source: defaults.source ?? "generic",
      provider: providerOf(model),
      costUsd: pricing.cost(partial),
      ...partial,
      requestId: str(row, "requestId", "request_id", "id"),
      label: str(row, "label", "task", "name"),
      git: {
        branch: str(row, "branch", "gitBranch"),
        sha: str(row, "sha", "commit"),
        repo: defaults.repo
      }
    });
  }
  out.sort((a, b) => a.ts.localeCompare(b.ts));
  return out;
}

// src/importers/claude-code.ts
import { createInterface } from "readline";
import { createReadStream, existsSync as existsSync4, readdirSync, statSync } from "fs";
import { homedir } from "os";
import { join as join5 } from "path";
function defaultClaudeDir() {
  return join5(homedir(), ".claude", "projects");
}
function* jsonlFiles(dir) {
  if (!existsSync4(dir)) return;
  for (const name of readdirSync(dir)) {
    const full = join5(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      yield* jsonlFiles(full);
    } else if (name.endsWith(".jsonl")) {
      yield full;
    }
  }
}
function insideRepo(cwd, root) {
  if (!cwd) return false;
  return cwd === root || cwd.startsWith(root.endsWith("/") ? root : root + "/");
}
async function importClaudeCode(opts) {
  const dir = opts.dir ?? defaultClaudeDir();
  const sinceMs = opts.sinceTs ? new Date(opts.sinceTs).getTime() : void 0;
  const seen = opts.seen ?? /* @__PURE__ */ new Set();
  const out = [];
  const dedupeWithin = /* @__PURE__ */ new Set();
  for (const file of jsonlFiles(dir)) {
    const rl = createInterface({
      input: createReadStream(file, { encoding: "utf8" }),
      crlfDelay: Infinity
    });
    for await (const line of rl) {
      if (!line.includes('"usage"')) continue;
      let o;
      try {
        o = JSON.parse(line);
      } catch {
        continue;
      }
      const usage = o.message?.usage;
      const model = o.message?.model;
      if (!usage || !model || model === "<synthetic>") continue;
      if (o.type && o.type !== "assistant") continue;
      if (!opts.all && opts.repoRoot && !insideRepo(o.cwd, opts.repoRoot)) continue;
      const branch = o.gitBranch && o.gitBranch !== "HEAD" ? o.gitBranch : void 0;
      if (opts.branch && branch !== opts.branch) continue;
      const ts = o.timestamp ?? (/* @__PURE__ */ new Date(0)).toISOString();
      if (sinceMs !== void 0 && new Date(ts).getTime() < sinceMs) continue;
      const id = o.requestId;
      if (id) {
        if (seen.has(id) || dedupeWithin.has(id)) continue;
        dedupeWithin.add(id);
      }
      const cacheWrite5m = usage.cache_creation?.ephemeral_5m_input_tokens ?? (usage.cache_creation ? 0 : usage.cache_creation_input_tokens ?? 0);
      const cacheWrite1h = usage.cache_creation?.ephemeral_1h_input_tokens ?? 0;
      const toolCalls = {};
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
        toolCalls: Object.keys(toolCalls).length ? toolCalls : void 0
      };
      out.push({
        ts,
        source: "claude-code",
        provider: providerOf(model),
        costUsd: opts.pricing.cost(partial),
        ...partial,
        requestId: id,
        git: { branch, repo: opts.repo }
      });
    }
  }
  out.sort((a, b) => a.ts.localeCompare(b.ts));
  return out;
}
export {
  COMMENT_MARKER,
  Pricing,
  append,
  appendMany,
  buildDashboardData,
  buildReceipt,
  importClaudeCode,
  importGeneric,
  knownRequestIds,
  ledgerPath,
  providerOf,
  readLedger,
  renderMarkdown,
  renderText,
  selectEntries
};
