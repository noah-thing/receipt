import { createRequire as __cr } from 'module'; const require = __cr(import.meta.url);
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/picocolors/picocolors.js
var require_picocolors = __commonJS({
  "node_modules/picocolors/picocolors.js"(exports, module) {
    "use strict";
    var p = process || {};
    var argv = p.argv || [];
    var env = p.env || {};
    var isColorSupported = !(!!env.NO_COLOR || argv.includes("--no-color")) && (!!env.FORCE_COLOR || argv.includes("--color") || p.platform === "win32" || (p.stdout || {}).isTTY && env.TERM !== "dumb" || !!env.CI);
    var formatter = (open, close, replace = open) => (input) => {
      let string = "" + input, index = string.indexOf(close, open.length);
      return ~index ? open + replaceClose(string, close, replace, index) + close : open + string + close;
    };
    var replaceClose = (string, close, replace, index) => {
      let result = "", cursor = 0;
      do {
        result += string.substring(cursor, index) + replace;
        cursor = index + close.length;
        index = string.indexOf(close, cursor);
      } while (~index);
      return result + string.substring(cursor);
    };
    var createColors = (enabled = isColorSupported) => {
      let f = enabled ? formatter : () => String;
      return {
        isColorSupported: enabled,
        reset: f("\x1B[0m", "\x1B[0m"),
        bold: f("\x1B[1m", "\x1B[22m", "\x1B[22m\x1B[1m"),
        dim: f("\x1B[2m", "\x1B[22m", "\x1B[22m\x1B[2m"),
        italic: f("\x1B[3m", "\x1B[23m"),
        underline: f("\x1B[4m", "\x1B[24m"),
        inverse: f("\x1B[7m", "\x1B[27m"),
        hidden: f("\x1B[8m", "\x1B[28m"),
        strikethrough: f("\x1B[9m", "\x1B[29m"),
        black: f("\x1B[30m", "\x1B[39m"),
        red: f("\x1B[31m", "\x1B[39m"),
        green: f("\x1B[32m", "\x1B[39m"),
        yellow: f("\x1B[33m", "\x1B[39m"),
        blue: f("\x1B[34m", "\x1B[39m"),
        magenta: f("\x1B[35m", "\x1B[39m"),
        cyan: f("\x1B[36m", "\x1B[39m"),
        white: f("\x1B[37m", "\x1B[39m"),
        gray: f("\x1B[90m", "\x1B[39m"),
        bgBlack: f("\x1B[40m", "\x1B[49m"),
        bgRed: f("\x1B[41m", "\x1B[49m"),
        bgGreen: f("\x1B[42m", "\x1B[49m"),
        bgYellow: f("\x1B[43m", "\x1B[49m"),
        bgBlue: f("\x1B[44m", "\x1B[49m"),
        bgMagenta: f("\x1B[45m", "\x1B[49m"),
        bgCyan: f("\x1B[46m", "\x1B[49m"),
        bgWhite: f("\x1B[47m", "\x1B[49m"),
        blackBright: f("\x1B[90m", "\x1B[39m"),
        redBright: f("\x1B[91m", "\x1B[39m"),
        greenBright: f("\x1B[92m", "\x1B[39m"),
        yellowBright: f("\x1B[93m", "\x1B[39m"),
        blueBright: f("\x1B[94m", "\x1B[39m"),
        magentaBright: f("\x1B[95m", "\x1B[39m"),
        cyanBright: f("\x1B[96m", "\x1B[39m"),
        whiteBright: f("\x1B[97m", "\x1B[39m"),
        bgBlackBright: f("\x1B[100m", "\x1B[49m"),
        bgRedBright: f("\x1B[101m", "\x1B[49m"),
        bgGreenBright: f("\x1B[102m", "\x1B[49m"),
        bgYellowBright: f("\x1B[103m", "\x1B[49m"),
        bgBlueBright: f("\x1B[104m", "\x1B[49m"),
        bgMagentaBright: f("\x1B[105m", "\x1B[49m"),
        bgCyanBright: f("\x1B[106m", "\x1B[49m"),
        bgWhiteBright: f("\x1B[107m", "\x1B[49m")
      };
    };
    module.exports = createColors();
    module.exports.createColors = createColors;
  }
});

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
   * The cheapest model in the book by input rate, preferring one from the same
   * provider so the what-if lever stays sensible (don't suggest a Claude model
   * to an OpenAI user). Skips the bare aliases. Falls back across providers.
   */
  cheapestModel(preferProvider) {
    const ALIASES = /* @__PURE__ */ new Set(["opus", "sonnet", "haiku"]);
    let best;
    for (const [id, price] of Object.entries(this.book.models)) {
      if (typeof price.input !== "number" || ALIASES.has(id)) continue;
      if (preferProvider && providerOf(id) !== preferProvider) continue;
      if (!best || price.input < best.rate) best = { id, rate: price.input };
    }
    if (!best && preferProvider) return this.cheapestModel();
    return best?.id;
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

// src/usage.ts
import { existsSync as existsSync5, mkdirSync as mkdirSync3, readdirSync as readdirSync2, readFileSync as readFileSync6, statSync as statSync2, writeFileSync as writeFileSync2 } from "fs";
import { dirname as dirname4, join as join6 } from "path";
var FIVE_HOURS_MS = 5 * 60 * 60 * 1e3;
var WEEK_MS = 7 * 24 * 60 * 60 * 1e3;
var PLAN_PRESETS = {
  pro: { fiveHour: 25e5, weekly: 25e6, source: "preset", plan: "pro" },
  max5x: { fiveHour: 125e5, weekly: 125e6, source: "preset", plan: "max5x" },
  max20x: { fiveHour: 5e7, weekly: 5e8, source: "preset", plan: "max20x" }
};
function entryTokens(e) {
  return e.inputTokens + e.outputTokens + e.cacheReadTokens + e.cacheWrite5mTokens + e.cacheWrite1hTokens;
}
function ms(ts) {
  return new Date(ts).getTime();
}
function windowState(entries, durationMs, now, budget) {
  const since = now - durationMs;
  const inWindow = entries.filter((e) => ms(e.ts) >= since);
  if (inWindow.length === 0) {
    return { used: 0, calls: 0, openedAt: now, resetAt: now + durationMs, budget, frac: budget ? 0 : void 0 };
  }
  const openedAt = Math.min(...inWindow.map((e) => ms(e.ts)));
  const used = inWindow.reduce((s, e) => s + entryTokens(e), 0);
  const resetAt = openedAt + durationMs;
  return {
    used,
    calls: inWindow.length,
    openedAt,
    resetAt,
    budget,
    frac: budget && budget > 0 ? used / budget : void 0
  };
}
function taskRollups(entries) {
  const map = /* @__PURE__ */ new Map();
  for (const e of entries) {
    const key = e.git?.branch || e.label || "(unscoped)";
    const r = map.get(key) ?? { key, tokens: 0, cost: 0, calls: 0, firstTs: ms(e.ts), lastTs: ms(e.ts) };
    r.tokens += entryTokens(e);
    r.cost += e.costUsd ?? 0;
    r.calls += 1;
    r.firstTs = Math.min(r.firstTs, ms(e.ts));
    r.lastTs = Math.max(r.lastTs, ms(e.ts));
    map.set(key, r);
  }
  return [...map.values()];
}
function quantile(sortedAsc, q) {
  if (sortedAsc.length === 0) return 0;
  const pos = (sortedAsc.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  if (lo === hi) return sortedAsc[lo];
  return sortedAsc[lo] + (sortedAsc[hi] - sortedAsc[lo]) * (pos - lo);
}
var DEFAULT_SIZES = {
  quick: 5e4,
  pr: 3e5,
  refactor: 9e5,
  feature: 2e6,
  learned: false
};
function taskSizes(entries) {
  const totals = taskRollups(entries).filter((t) => t.key !== "(unscoped)").map((t) => t.tokens).filter((n) => n > 0).sort((a, b) => a - b);
  if (totals.length < 4) return DEFAULT_SIZES;
  return {
    quick: Math.max(1, Math.round(quantile(totals, 0.25))),
    pr: Math.max(1, Math.round(quantile(totals, 0.5))),
    refactor: Math.max(1, Math.round(quantile(totals, 0.75))),
    feature: Math.max(1, Math.round(quantile(totals, 0.9))),
    learned: true
  };
}
function personalStats(entries) {
  const tasks = taskRollups(entries).filter((t) => t.tokens > 0 && t.key !== "(unscoped)");
  const tokensSorted = tasks.map((t) => t.tokens).sort((a, b) => a - b);
  const costSorted = tasks.map((t) => t.cost).sort((a, b) => a - b);
  const meanTokens = tasks.length ? tasks.reduce((s, t) => s + t.tokens, 0) / tasks.length : 0;
  return {
    taskCount: tasks.length,
    medianTaskTokens: quantile(tokensSorted, 0.5),
    medianTaskCost: quantile(costSorted, 0.5),
    meanTaskTokens: meanTokens
  };
}
function paceState(entries, weeklyBudget, now, weeklyUsed) {
  const lastHour = entries.filter((e) => ms(e.ts) >= now - 60 * 60 * 1e3).reduce((s, e) => s + entryTokens(e), 0);
  const lastDay = entries.filter((e) => ms(e.ts) >= now - 24 * 60 * 60 * 1e3).reduce((s, e) => s + entryTokens(e), 0);
  const sustainablePerHour = weeklyBudget ? weeklyBudget / 168 : 0;
  const ratio = sustainablePerHour > 0 ? lastHour / sustainablePerHour : 0;
  let runwayDays;
  let runsDryAt;
  if (weeklyBudget && lastDay > 0) {
    const remaining = Math.max(0, weeklyBudget - weeklyUsed);
    runwayDays = remaining / lastDay;
    runsDryAt = now + runwayDays * 24 * 60 * 60 * 1e3;
  }
  return { lastHour, sustainablePerHour, ratio, lastDay, runwayDays, runsDryAt };
}
function capacity(remainingTokens, sizes) {
  const r = Math.max(0, remainingTokens);
  const items = [
    { label: "PRs this size", count: Math.floor(r / sizes.pr) },
    { label: "big refactors", count: Math.floor(r / sizes.refactor) },
    { label: "quick edits", count: Math.floor(r / sizes.quick) }
  ];
  return items.filter((i) => i.count > 0);
}
function inWorkUnits(tokensUsed, sizes) {
  const units = [
    ["features", sizes.feature],
    ["refactors", sizes.refactor],
    ["PRs", sizes.pr],
    ["quick edits", sizes.quick]
  ];
  for (const [name, size] of units) {
    const n = tokensUsed / size;
    if (n >= 0.8) return `${n.toFixed(n >= 10 ? 0 : 1)} ${name}`;
  }
  return `${Math.max(1, Math.round(tokensUsed / sizes.quick))} quick edits`;
}
function efficiencyGrade(receipt) {
  const inputAll = receipt.byModel.reduce((s, m) => s + m.inputTokens + m.cacheReadTokens, 0);
  const cacheRead = receipt.byModel.reduce((s, m) => s + m.cacheReadTokens, 0);
  const cacheHitRate = inputAll > 0 ? cacheRead / inputAll : 0;
  const retryRate = receipt.entryCount > 0 ? receipt.retries / receipt.entryCount : 0;
  let score = 55 + 45 * cacheHitRate - 35 * Math.min(1, retryRate);
  score = Math.max(0, Math.min(100, Math.round(score)));
  const letter = score >= 90 ? "A" : score >= 80 ? "B" : score >= 70 ? "C" : score >= 60 ? "D" : "F";
  return { score, letter, cacheHitRate, retryRate };
}
function whereItWent(receipt) {
  const total = receipt.totalTokens || 1;
  const output = receipt.byModel.reduce((s, m) => s + m.outputTokens, 0);
  const freshInput = receipt.byModel.reduce((s, m) => s + m.inputTokens, 0);
  const cacheRead = receipt.byModel.reduce((s, m) => s + m.cacheReadTokens, 0);
  const cacheWrite = receipt.byModel.reduce((s, m) => s + m.cacheWriteTokens, 0);
  return {
    output: output / total,
    freshInput: freshInput / total,
    cacheRead: cacheRead / total,
    cacheWrite: cacheWrite / total
  };
}
function whatIf(receipt, pricing, cheaper) {
  const top = receipt.byModel.find((m) => m.priced && m.costUsd > 0);
  if (!top) return void 0;
  cheaper = cheaper ?? pricing.cheapestModel(top.provider) ?? "claude-haiku-4-5";
  if (top.model === cheaper) return void 0;
  const readTokens = { inputTokens: top.inputTokens, cacheReadTokens: top.cacheReadTokens };
  const base = {
    outputTokens: 0,
    cacheWrite5mTokens: 0,
    cacheWrite1hTokens: 0,
    toolCalls: {}
  };
  const current = pricing.cost({ model: top.model, ...readTokens, ...base });
  const swapped = pricing.cost({ model: cheaper, ...readTokens, ...base });
  if (current === null || swapped === null || current <= swapped) return void 0;
  const saved = current - swapped;
  return {
    fromModel: top.model,
    toModel: cheaper,
    currentCost: current,
    cheaperCost: swapped,
    saved,
    savedFrac: receipt.total > 0 ? saved / receipt.total : 0
  };
}
function records(entries) {
  const tasks = taskRollups(entries).filter((t) => t.tokens > 0 && t.key !== "(unscoped)");
  if (tasks.length === 0) return { streakUnderMedian: 0 };
  const byTokens = [...tasks].sort((a, b) => b.tokens - a.tokens);
  const byRecency = [...tasks].sort((a, b) => b.lastTs - a.lastTs);
  const median = quantile([...tasks].map((t) => t.tokens).sort((a, b) => a - b), 0.5);
  const latest = byRecency[0];
  let streak = 0;
  for (const t of byRecency) {
    if (t.tokens < median) streak += 1;
    else break;
  }
  return {
    priciest: byTokens[0],
    leanest: byTokens[byTokens.length - 1],
    latest,
    latestRank: latest ? byTokens.findIndex((t) => t.key === latest.key) + 1 : void 0,
    streakUnderMedian: streak
  };
}
function funEquivalences(tokensUsed, repoTokens) {
  const out = [];
  if (repoTokens && repoTokens > 0) {
    const times = tokensUsed / repoTokens;
    if (times >= 0.3) out.push(`re-reading your entire repo ${times.toFixed(1)}\xD7`);
  }
  const WAR_AND_PEACE = 78e4;
  const NOVEL = 105e3;
  const wp = tokensUsed / WAR_AND_PEACE;
  if (wp >= 0.5) out.push(`reading War and Peace ${wp.toFixed(1)}\xD7 over`);
  const novels = tokensUsed / NOVEL;
  if (novels >= 1) out.push(`reading ${Math.round(novels)} average novels`);
  const readerHours = tokensUsed / 330 / 60;
  if (readerHours >= 1) out.push(`${readerHours.toFixed(0)} hours of human reading`);
  return out;
}
function voiceLine(frac) {
  if (frac === void 0) return void 0;
  if (frac >= 1) return "Window's gone. The wall is right there.";
  if (frac >= 0.85) return "You're nearly out of road for this window.";
  if (frac >= 0.6) return "Past the halfway mark. Spend the rest on purpose.";
  if (frac >= 0.3) return "Cruising. Plenty of window left.";
  return "Barely touched it.";
}
function fuel(entries, budget, now) {
  const fiveHour = windowState(entries, FIVE_HOURS_MS, now, budget?.fiveHour);
  const weekly = windowState(entries, WEEK_MS, now, budget?.weekly);
  const sizes = taskSizes(entries);
  const pace = paceState(entries, budget?.weekly, now, weekly.used);
  const remaining5h = budget ? Math.max(0, budget.fiveHour - fiveHour.used) : 0;
  const remainingWk = budget ? Math.max(0, budget.weekly - weekly.used) : 0;
  return {
    budget,
    fiveHour,
    weekly,
    pace,
    sizes,
    capacityFiveHour: budget ? capacity(remaining5h, sizes) : [],
    capacityWeekly: budget ? capacity(remainingWk, sizes) : []
  };
}
function taskImpact(taskTokens, budget) {
  if (!budget) return void 0;
  return {
    fiveHour: budget.fiveHour > 0 ? taskTokens / budget.fiveHour : 0,
    weekly: budget.weekly > 0 ? taskTokens / budget.weekly : 0
  };
}
function limitsPath(root) {
  return join6(root, ".receipt", "limits.json");
}
function readObservedBudget(root) {
  const path = limitsPath(root);
  if (!existsSync5(path)) return void 0;
  try {
    const b = JSON.parse(readFileSync6(path, "utf8"));
    if (typeof b.fiveHour === "number" && typeof b.weekly === "number") return b;
  } catch {
  }
  return void 0;
}
function writeObservedBudget(root, budget) {
  const path = limitsPath(root);
  mkdirSync3(dirname4(path), { recursive: true });
  writeFileSync2(path, JSON.stringify(budget, null, 2) + "\n", "utf8");
}
function presetFor(plan) {
  if (!plan || !Object.prototype.hasOwnProperty.call(PLAN_PRESETS, plan)) return void 0;
  return PLAN_PRESETS[plan];
}
function resolveBudget(config, root) {
  const observed = readObservedBudget(root);
  if (observed) return observed;
  if (config.planBudget) return config.planBudget;
  return presetFor(config.plan);
}
function captureLimits(getHeader, root) {
  const num2 = (name) => {
    const v = getHeader(name);
    if (v == null) return void 0;
    const n = Number(v);
    return Number.isFinite(n) ? n : void 0;
  };
  const limit = num2("anthropic-ratelimit-unified-limit") ?? num2("anthropic-ratelimit-tokens-limit") ?? num2("anthropic-ratelimit-input-tokens-limit");
  if (!limit || limit <= 0) return;
  const existing = readObservedBudget(root);
  const fiveHour = Math.max(limit, existing?.fiveHour ?? 0);
  const weekly = Math.max(existing?.weekly ?? 0, fiveHour * 5);
  if (existing && existing.source === "observed" && existing.fiveHour === fiveHour && existing.weekly === weekly) {
    return;
  }
  writeObservedBudget(root, { fiveHour, weekly, source: "observed" });
}
var SKIP_DIRS = /* @__PURE__ */ new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  "coverage",
  ".next",
  ".turbo",
  "vendor"
]);
var TEXT_EXT = /\.(ts|tsx|js|jsx|mjs|cjs|py|go|rs|rb|java|kt|c|h|cpp|cc|cs|php|swift|scala|sh|sql|json|yaml|yml|toml|md|css|scss|html|vue|svelte)$/i;
function estimateRepoTokens(root, maxFiles = 4e3) {
  let chars = 0;
  let seen = 0;
  const walk = (dir) => {
    if (seen >= maxFiles) return;
    let ents;
    try {
      ents = readdirSync2(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const ent of ents) {
      if (seen >= maxFiles) return;
      if (ent.isDirectory()) {
        if (SKIP_DIRS.has(ent.name) || ent.name.startsWith(".")) continue;
        walk(join6(dir, ent.name));
      } else if (ent.isFile() && TEXT_EXT.test(ent.name)) {
        try {
          const size = statSync2(join6(dir, ent.name)).size;
          if (size <= 2e6) {
            chars += size;
            seen += 1;
          }
        } catch {
        }
      }
    }
  };
  walk(root);
  return Math.round(chars / 4);
}

// src/usage-render.ts
var import_picocolors = __toESM(require_picocolors(), 1);
function until(now, target) {
  let s = Math.max(0, Math.round((target - now) / 1e3));
  const d = Math.floor(s / 86400);
  s -= d * 86400;
  const h = Math.floor(s / 3600);
  s -= h * 3600;
  const m = Math.floor(s / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h${String(m).padStart(2, "0")}m`;
  return `${m}m`;
}
function clockDate(ms2) {
  const d = new Date(ms2);
  const day = d.toLocaleDateString(void 0, { weekday: "short" });
  let hr = d.getHours();
  const ampm = hr >= 12 ? "pm" : "am";
  hr = hr % 12 || 12;
  return `${day} ${hr}${ampm}`;
}
function dot(frac) {
  if (frac === void 0) return "\u26AA";
  if (frac >= 1) return "\u{1F534}";
  if (frac >= 0.85) return "\u{1F7E0}";
  if (frac >= 0.6) return "\u{1F7E1}";
  return "\u{1F7E2}";
}
function sourceNote(b) {
  if (!b) return "";
  if (b.source === "observed") return "from live rate-limit headers";
  if (b.source === "calibrated") return "calibrated from a real limit you hit";
  if (b.source === "custom") return "your custom budget";
  return "estimated preset \u2014 run the proxy or `receipt calibrate` for real numbers";
}
function capacityPhrase(items) {
  if (items.length === 0) return "not enough left for a full task";
  return items.map((i) => `~${i.count} ${i.label}`).join(" \xB7 ");
}
function usageBlockMarkdown(receipt, fuel2, extras = {}) {
  if (receipt.totalTokens === 0) return "";
  const lines = [];
  lines.push("<details><summary>\u{1F50B} <b>Usage impact</b> \u2014 what this cost <i>you</i></summary>");
  lines.push("");
  const impact = taskImpact(receipt.totalTokens, fuel2.budget);
  if (impact && fuel2.budget) {
    lines.push(
      `This PR ate **${(impact.fiveHour * 100).toFixed(1)}%** of a 5-hour window and **${(impact.weekly * 100).toFixed(1)}%** of your weekly cap.`
    );
    const left = capacityPhrase(fuel2.capacityFiveHour);
    lines.push(`Right now you've got **${left}** left in this 5-hour window.`);
    lines.push("");
  }
  lines.push(`That's about **${inWorkUnits(receipt.totalTokens, fuel2.sizes)}** in your own work.`);
  const grade = efficiencyGrade(receipt);
  lines.push(
    `Efficiency: **${grade.letter}** (${grade.score}/100) \u2014 ${Math.round(grade.cacheHitRate * 100)}% served from cache, ${receipt.retries} ${receipt.retries === 1 ? "retry" : "retries"}.`
  );
  if (extras.whatIf) {
    const w = extras.whatIf;
    lines.push(
      `Lever: running \`${w.fromModel}\`'s reads on \`${w.toModel}\` would've saved **$${w.saved.toFixed(2)}** (${Math.round(w.savedFrac * 100)}% of this PR).`
    );
  }
  if (extras.fun) {
    const eq = funEquivalences(receipt.totalTokens, extras.repoTokens);
    if (eq.length) lines.push(`For scale: ${eq.slice(0, 2).join(", ")}.`);
  }
  if (fuel2.budget) {
    lines.push("");
    lines.push(`<sub>window budget ${sourceNote(fuel2.budget)}</sub>`);
  }
  lines.push("");
  lines.push("</details>");
  return lines.join("\n");
}
function gaugeLine(label, w, now) {
  if (w.budget && w.frac !== void 0) {
    const bar = progressBar(w.frac, 24);
    const color = w.frac >= 1 ? import_picocolors.default.red : w.frac >= 0.85 ? import_picocolors.default.yellow : w.frac >= 0.6 ? import_picocolors.default.yellow : import_picocolors.default.green;
    return `${dot(w.frac)} ${import_picocolors.default.bold(label.padEnd(14))} ${color(bar)} ${import_picocolors.default.bold(`${Math.round(w.frac * 100)}%`)}  ` + import_picocolors.default.dim(`${tokens(w.used)} / ${tokens(w.budget)} \xB7 resets in ${until(now, w.resetAt)}`);
  }
  return `${dot(void 0)} ${import_picocolors.default.bold(label.padEnd(14))} ${import_picocolors.default.dim(`${tokens(w.used)} used \xB7 resets in ${until(now, w.resetAt)} \xB7 no plan set`)}`;
}
function renderFuel(fuel2, now, extras = {}) {
  const out = [];
  out.push("");
  out.push(import_picocolors.default.bold("\u{1F50B} Fuel \u2014 how much of you this is using"));
  out.push("");
  out.push(gaugeLine("5-hour window", fuel2.fiveHour, now));
  out.push(gaugeLine("weekly cap", fuel2.weekly, now));
  out.push("");
  if (fuel2.budget) {
    out.push(import_picocolors.default.bold("You could still do"));
    out.push(`  5h: ${capacityPhrase(fuel2.capacityFiveHour)}`);
    out.push(`  week: ${capacityPhrase(fuel2.capacityWeekly)}`);
    out.push("");
    const p = fuel2.pace;
    if (p.sustainablePerHour > 0) {
      const arrow = p.ratio > 1.25 ? import_picocolors.default.red(`\u2191 ${p.ratio.toFixed(1)}\xD7 too fast`) : p.ratio < 0.75 ? import_picocolors.default.green("\u2193 sustainable") : import_picocolors.default.yellow("\u2248 on pace");
      out.push(`Pace: ${arrow} ${import_picocolors.default.dim(`(${tokens(p.lastHour)}/hr vs ${tokens(p.sustainablePerHour)}/hr sustainable)`)}`);
    }
    if (p.runsDryAt && p.runwayDays !== void 0 && p.runwayDays < 14) {
      out.push(import_picocolors.default.dim(`At today's burn, the weekly budget runs dry ~${clockDate(p.runsDryAt)}.`));
    }
    const vl = voiceLine(fuel2.weekly.frac);
    if (vl) out.push(import_picocolors.default.italic(import_picocolors.default.dim(`\u201C${vl}\u201D`)));
    out.push("");
    out.push(import_picocolors.default.dim(`window budget ${sourceNote(fuel2.budget)}`));
  } else {
    out.push(import_picocolors.default.dim("No plan set, so percentages are off. Set one to unlock the gauges:"));
    out.push(import_picocolors.default.dim("  receipt budget plan pro|max5x|max20x"));
    out.push(import_picocolors.default.dim("  \u2026or run `receipt proxy` and it learns your real limit from the provider."));
    if (fuel2.sizes.learned) {
      out.push("");
      out.push(import_picocolors.default.dim(`Your typical sizes: quick ${tokens(fuel2.sizes.quick)} \xB7 PR ${tokens(fuel2.sizes.pr)} \xB7 refactor ${tokens(fuel2.sizes.refactor)} \xB7 feature ${tokens(fuel2.sizes.feature)} tokens.`));
    }
  }
  out.push("");
  return out.join("\n");
}
function renderStatusline(fuel2, now) {
  const parts = [];
  if (fuel2.fiveHour.frac !== void 0) {
    parts.push(`${dot(fuel2.fiveHour.frac)} 5h ${Math.round(fuel2.fiveHour.frac * 100)}%`);
  } else {
    parts.push(`5h ${tokens(fuel2.fiveHour.used)}`);
  }
  if (fuel2.weekly.frac !== void 0) parts.push(`wk ${Math.round(fuel2.weekly.frac * 100)}%`);
  const p = fuel2.pace;
  if (p.sustainablePerHour > 0 && p.ratio >= 1.25) parts.push(`\u2191${p.ratio.toFixed(1)}x`);
  if (fuel2.budget && fuel2.capacityFiveHour[0]) {
    parts.push(`~${fuel2.capacityFiveHour[0].count} ${fuel2.capacityFiveHour[0].label}`);
  }
  if (fuel2.budget && fuel2.fiveHour.frac !== void 0) {
    parts.push(`resets ${until(now, fuel2.fiveHour.resetAt)}`);
  }
  return "\u{1F50B} " + parts.join(" \xB7 ");
}
function renderRecords(entries) {
  const r = records(entries);
  const out = [];
  out.push("");
  out.push(import_picocolors.default.bold("\u{1F3C6} Your usage records"));
  out.push("");
  if (!r.priciest) {
    out.push(import_picocolors.default.dim("Not enough branch history yet. Keep working and check back."));
    out.push("");
    return out.join("\n");
  }
  out.push(`\u{1F947} Heaviest task: ${import_picocolors.default.bold(r.priciest.key)} ${import_picocolors.default.dim(`(${tokens(r.priciest.tokens)} tokens)`)}`);
  if (r.leanest) out.push(`\u{1FAB6} Leanest task:  ${import_picocolors.default.bold(r.leanest.key)} ${import_picocolors.default.dim(`(${tokens(r.leanest.tokens)} tokens)`)}`);
  if (r.latest && r.latestRank) {
    out.push(
      `\u{1F4CD} Most recent:  ${import_picocolors.default.bold(r.latest.key)} \u2014 #${r.latestRank} heaviest of ${r.priciest ? "all" : ""} your tasks`
    );
  }
  if (r.streakUnderMedian > 0) {
    out.push(import_picocolors.default.green(`\u{1F525} Streak: ${r.streakUnderMedian} task(s) in a row under your median. Tidy.`));
  }
  out.push("");
  return out.join("\n");
}
function renderForecast(fuel2, now) {
  const out = [];
  out.push("");
  out.push(import_picocolors.default.bold("\u{1F52E} Forecast"));
  out.push("");
  const typical = fuel2.sizes.pr;
  out.push(`A typical task for you runs ~${tokens(typical)} tokens.`);
  if (fuel2.budget) {
    const imp5 = typical / fuel2.budget.fiveHour * 100;
    out.push(`That's ~${imp5.toFixed(1)}% of a 5-hour window each.`);
    const left = fuel2.budget.fiveHour - fuel2.fiveHour.used;
    const fits = Math.floor(Math.max(0, left) / typical);
    out.push(
      fits > 0 ? import_picocolors.default.green(`You can fit ~${fits} more before this window resets in ${until(now, fuel2.fiveHour.resetAt)}.`) : import_picocolors.default.yellow(`Not enough window left for another typical task; resets in ${until(now, fuel2.fiveHour.resetAt)}.`)
    );
    if (fuel2.pace.runsDryAt && fuel2.pace.runwayDays !== void 0 && fuel2.pace.runwayDays < 14) {
      out.push(import_picocolors.default.dim(`Weekly runway at today's pace: ~${fuel2.pace.runwayDays.toFixed(1)} days (dry ~${clockDate(fuel2.pace.runsDryAt)}).`));
    }
  } else {
    out.push(import_picocolors.default.dim("Set a plan (`receipt budget plan \u2026`) to forecast against your real window."));
  }
  out.push("");
  return out.join("\n");
}
function whereItWentText(receipt) {
  const c = whereItWent(receipt);
  const pctOf = (n) => `${Math.round(n * 100)}%`;
  return `where it went: ${pctOf(c.output)} output \xB7 ${pctOf(c.freshInput)} fresh input \xB7 ${pctOf(c.cacheRead)} cache reads \xB7 ${pctOf(c.cacheWrite)} cache writes`;
}
function usageSummaryText(receipt, fuel2, extras = {}) {
  if (receipt.totalTokens === 0) return "";
  const out = [];
  const impact = taskImpact(receipt.totalTokens, fuel2.budget);
  const grade = efficiencyGrade(receipt);
  const head = [];
  if (impact && fuel2.budget) {
    head.push(`${(impact.fiveHour * 100).toFixed(1)}% of 5h \xB7 ${(impact.weekly * 100).toFixed(1)}% of week`);
  }
  head.push(`\u2248 ${inWorkUnits(receipt.totalTokens, fuel2.sizes)}`);
  head.push(`grade ${grade.letter} (${grade.score}/100)`);
  out.push(import_picocolors.default.bold("\u{1F50B} ") + head.join(import_picocolors.default.dim(" \xB7 ")));
  out.push(import_picocolors.default.dim("   " + whereItWentText(receipt)));
  if (impact && fuel2.budget) {
    out.push(import_picocolors.default.dim(`   ${capacityPhrase(fuel2.capacityFiveHour)} left in this 5h window`));
  }
  if (extras.whatIf) {
    out.push(import_picocolors.default.dim(`   lever: ${extras.whatIf.fromModel} reads on ${extras.whatIf.toModel} saves $${extras.whatIf.saved.toFixed(2)}`));
  }
  if (extras.fun) {
    const eq = funEquivalences(receipt.totalTokens, extras.repoTokens);
    if (eq.length) out.push(import_picocolors.default.dim("   = " + eq.slice(0, 2).join(", ")));
  }
  return out.join("\n");
}
export {
  COMMENT_MARKER,
  FIVE_HOURS_MS,
  PLAN_PRESETS,
  Pricing,
  WEEK_MS,
  append,
  appendMany,
  buildDashboardData,
  buildReceipt,
  capacity,
  captureLimits,
  efficiencyGrade,
  entryTokens,
  estimateRepoTokens,
  fuel,
  funEquivalences,
  importClaudeCode,
  importGeneric,
  inWorkUnits,
  knownRequestIds,
  ledgerPath,
  paceState,
  personalStats,
  presetFor,
  providerOf,
  quantile,
  readLedger,
  readObservedBudget,
  records,
  renderForecast,
  renderFuel,
  renderMarkdown,
  renderRecords,
  renderStatusline,
  renderText,
  resolveBudget,
  selectEntries,
  taskImpact,
  taskRollups,
  taskSizes,
  usageBlockMarkdown,
  usageSummaryText,
  voiceLine,
  whatIf,
  whereItWent,
  windowState,
  writeObservedBudget
};
