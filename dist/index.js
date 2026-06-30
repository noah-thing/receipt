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
  const median2 = quantile([...tasks].map((t) => t.tokens).sort((a, b) => a - b), 0.5);
  const latest = byRecency[0];
  let streak = 0;
  for (const t of byRecency) {
    if (t.tokens < median2) streak += 1;
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

// src/advice.ts
var RANK = { high: 0, medium: 1, low: 2 };
function freshVsCached(pricing, model, tokens2) {
  const base = { outputTokens: 0, cacheWrite5mTokens: 0, cacheWrite1hTokens: 0 };
  const fresh = pricing.cost({ model, inputTokens: tokens2, cacheReadTokens: 0, ...base });
  const cached = pricing.cost({ model, inputTokens: 0, cacheReadTokens: tokens2, ...base });
  if (fresh === null || cached === null) return void 0;
  return fresh - cached;
}
function costDrivers(receipt) {
  const out = [];
  const byCost = [...receipt.byModel].filter((m) => m.priced).sort((a, b) => b.costUsd - a.costUsd);
  const top = byCost[0];
  if (top && receipt.total > 0) {
    out.push(`\`${top.model}\` \u2014 ${Math.round(top.costUsd / receipt.total * 100)}% of the spend`);
  }
  const comp = whereItWent(receipt);
  const classes = [
    ["output", comp.output],
    ["fresh input", comp.freshInput],
    ["cache reads", comp.cacheRead],
    ["cache writes", comp.cacheWrite]
  ];
  classes.sort((a, b) => b[1] - a[1]);
  if (classes[0] && classes[0][1] > 0) {
    out.push(`${classes[0][0]} \u2014 ${Math.round(classes[0][1] * 100)}% of the tokens`);
  }
  if (receipt.retries > 0) out.push(`${receipt.retries} retr${receipt.retries === 1 ? "y" : "ies"}`);
  return out;
}
function recommend(receipt, pricing) {
  const recs = [];
  if (receipt.totalTokens === 0) return recs;
  const comp = whereItWent(receipt);
  const grade = efficiencyGrade(receipt);
  const currency = receipt.currency;
  const top = receipt.byModel.find((m) => m.priced && m.costUsd > 0);
  const inputAll = comp.freshInput + comp.cacheRead;
  if (inputAll > 0.25 && comp.cacheRead / Math.max(inputAll, 1e-9) < 0.4 && comp.freshInput > 0.25) {
    const saving = top ? freshVsCached(pricing, top.model, top.inputTokens) : void 0;
    recs.push({
      id: "cache-reuse",
      severity: "high",
      title: "Reuse your context instead of resending it",
      detail: `Only ${Math.round(comp.cacheRead / Math.max(inputAll, 1e-9) * 100)}% of your input came from cache; the rest was fresh, billed roughly 10\xD7 higher for the exact same context. Keep the stable part of the prompt first and unchanged (same system prompt, same file order) so it caches, and avoid \`/clear\` mid-task \u2014 each clear throws the cache away and you pay full price to rebuild it. This is pure savings; the model still sees everything it did before.`,
      impact: saving && saving > 0 ? `up to ~${money(saving, currency)} if it cached` : void 0
    });
  }
  const wi = whatIf(receipt, pricing);
  if (wi && wi.savedFrac >= 0.12) {
    recs.push({
      id: "model-mix",
      severity: wi.savedFrac >= 0.3 ? "high" : "medium",
      title: "Match the model to the task",
      detail: `Most of this ran on \`${wi.fromModel}\`. Keep it for the real reasoning \u2014 but its plain file-reads and mechanical edits would cost a fraction on \`${wi.toModel}\` at the same quality for that kind of work. Send the easy parts down a tier and keep the hard thinking where it is.`,
      impact: `~${money(wi.saved, currency)} \xB7 ${Math.round(wi.savedFrac * 100)}% of this`
    });
  }
  if (comp.cacheWrite > 0.1 && comp.cacheWrite > comp.cacheRead * 1.5) {
    recs.push({
      id: "cache-churn",
      severity: "medium",
      title: "Stop rebuilding the cache every turn",
      detail: `Cache writes (${Math.round(comp.cacheWrite * 100)}%) outweigh cache reads (${Math.round(comp.cacheRead * 100)}%), which usually means the early context keeps changing between calls so nothing gets reused. Pin the system prompt and the first files; let the volatile parts come last. Same information reaches the model, less of it is rewritten.`
    });
  }
  const retryRate = receipt.entryCount > 0 ? receipt.retries / receipt.entryCount : 0;
  if (receipt.retries >= 2 && retryRate >= 0.1) {
    recs.push({
      id: "retries",
      severity: "medium",
      title: "Track down the retries",
      detail: `${receipt.retries} ${receipt.retries === 1 ? "retry" : "retries"} across ${receipt.entryCount} calls (${Math.round(retryRate * 100)}%). Each one re-sends the full context and produces nothing new. They usually trace to a flaky tool, a malformed tool call, or transient overload \u2014 fixing the cause costs you no capability, just removes the wasted re-sends.`
    });
  }
  const tools = Object.entries(receipt.toolTotals).filter(([, n]) => n > 0);
  const toolTotal = tools.reduce((s, [, n]) => s + n, 0);
  if (toolTotal >= 5) {
    recs.push({
      id: "tool-calls",
      severity: "low",
      title: "Mind the provider tool calls",
      detail: `${toolTotal} provider tool call${toolTotal === 1 ? "" : "s"} (${tools.map(([t, n]) => `${n}\xD7 ${t.replace(/_/g, " ")}`).join(", ")}) are billed per request on top of tokens. Reuse results you'll need again, or scope searches more tightly \u2014 without skipping the ones that actually inform the work.`
    });
  }
  if (receipt.unpricedModels.length > 0) {
    recs.push({
      id: "unpriced",
      severity: "low",
      title: "Add prices for unrecognized models",
      detail: `No price on file for ${receipt.unpricedModels.map((m) => `\`${m}\``).join(", ")}, so their cost is missing from this analysis. Add them to \`.receipt/prices.json\`.`
    });
  }
  recs.sort((a, b) => RANK[a.severity] - RANK[b.severity]);
  if (recs.length === 0) {
    recs.push({
      id: "clean",
      severity: "low",
      title: "Already lean",
      detail: `Good cache reuse, few retries, sensible model mix (grade ${grade.letter}). Nothing to cut without touching the actual work \u2014 keep an eye on it with \`receipt fuel\`.`
    });
  }
  return recs.slice(0, 6);
}
function topRecommendation(receipt, pricing) {
  return recommend(receipt, pricing).filter((r) => r.id !== "clean")[0];
}

// src/health.ts
var THIRTY_MIN_MS = 30 * 60 * 1e3;
var CONTEXT_WINDOWS = {
  "claude-opus-4-8": 1e6,
  "claude-opus-4-7": 1e6,
  "claude-opus-4-1": 2e5,
  "claude-opus-4": 2e5,
  "claude-sonnet-5": 1e6,
  "claude-sonnet-4-6": 1e6,
  "claude-sonnet-4-5": 1e6,
  "claude-sonnet-4": 1e6,
  "claude-fable-5": 1e6,
  "claude-haiku-4-5": 2e5,
  "claude-3-7-sonnet": 2e5,
  "claude-3-5-sonnet": 2e5,
  "claude-3-5-haiku": 2e5,
  "claude-3-opus": 2e5,
  "claude-3-haiku": 2e5,
  "gpt-4o": 128e3,
  "gpt-4o-mini": 128e3,
  "gpt-4.1": 1e6,
  "gpt-4.1-mini": 1e6,
  "gpt-4.1-nano": 1e6,
  "o3": 2e5,
  "o4-mini": 2e5,
  "gpt-4-turbo": 128e3,
  "gpt-3.5-turbo": 16e3,
  "gemini-2.5-pro": 2e6,
  "gemini-2.5-flash": 1e6,
  "gemini-2.0-flash": 1e6
};
var PREFIX_WINDOWS = [
  ["claude-opus-4-8", 1e6],
  ["claude-opus-4-7", 1e6],
  ["claude-opus", 2e5],
  ["claude-sonnet", 1e6],
  ["claude-haiku", 2e5],
  ["claude-3", 2e5],
  ["claude-fable", 1e6],
  ["opus", 2e5],
  ["sonnet", 1e6],
  ["haiku", 2e5],
  ["gpt-4o", 128e3],
  ["gpt-4.1", 1e6],
  ["gpt-4-turbo", 128e3],
  ["gpt-3.5", 16e3],
  ["o3", 2e5],
  ["o4", 2e5],
  ["gemini-2.5-pro", 2e6],
  ["gemini", 1e6]
];
function contextWindowFor(model) {
  if (Object.prototype.hasOwnProperty.call(CONTEXT_WINDOWS, model)) {
    return CONTEXT_WINDOWS[model];
  }
  for (const [prefix, win] of PREFIX_WINDOWS) {
    if (model.startsWith(prefix)) return win;
  }
  return 2e5;
}
function promptTokens(e) {
  return e.inputTokens + e.cacheReadTokens + e.cacheWrite5mTokens + e.cacheWrite1hTokens;
}
function ms2(ts) {
  return new Date(ts).getTime();
}
function sessionize(entries, gapMs = THIRTY_MIN_MS) {
  const sorted = [...entries].sort((a, b) => ms2(a.ts) - ms2(b.ts));
  const sessions = [];
  let cur = [];
  let prev = 0;
  for (const e of sorted) {
    const t = ms2(e.ts);
    if (cur.length > 0 && t - prev > gapMs) {
      sessions.push(cur);
      cur = [];
    }
    cur.push(e);
    prev = t;
  }
  if (cur.length) sessions.push(cur);
  return sessions;
}
function latestSession(entries, gapMs = THIRTY_MIN_MS) {
  const s = sessionize(entries, gapMs);
  return s[s.length - 1];
}
function dominantModel(session) {
  const counts = /* @__PURE__ */ new Map();
  for (const e of session) counts.set(e.model, (counts.get(e.model) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "unknown";
}
var RANK2 = { ok: 0, watch: 1, high: 2 };
function analyzeSession(session, now) {
  const calls = session.length;
  const first = ms2(session[0].ts);
  const last = ms2(session[session.length - 1].ts);
  const durationMin = Math.max(0, (Math.max(last, now) - first) / 6e4);
  const tail = session.slice(-3);
  let contextTokens = 0;
  let contextModel = session[session.length - 1].model;
  for (const e of tail) {
    const p = promptTokens(e);
    if (p >= contextTokens) {
      contextTokens = p;
      contextModel = e.model;
    }
  }
  const model = dominantModel(session);
  const contextWindow = contextWindowFor(contextModel);
  const fill = contextWindow > 0 ? contextTokens / contextWindow : 0;
  let peakContextTokens = 0;
  for (const e of session) peakContextTokens = Math.max(peakContextTokens, promptTokens(e));
  const peakFill = contextWindow > 0 ? peakContextTokens / contextWindow : 0;
  const cacheRead = session.reduce((s, e) => s + e.cacheReadTokens, 0);
  const cacheWrite = session.reduce((s, e) => s + e.cacheWrite5mTokens + e.cacheWrite1hTokens, 0);
  const cacheReadShare = cacheRead + cacheWrite > 0 ? cacheRead / (cacheRead + cacheWrite) : 1;
  let compactions = 0;
  for (let i = 1; i < session.length; i++) {
    const prev = promptTokens(session[i - 1]);
    const cur = promptTokens(session[i]);
    if (prev > contextWindow * 0.3 && cur < prev * 0.5) compactions++;
  }
  const recentRetries = session.slice(-5).reduce((s, e) => s + (e.retries ?? 0), 0);
  let outputDecline = 0;
  if (calls >= 6) {
    const third = Math.floor(calls / 3);
    const early = session.slice(0, third);
    const lateArr = session.slice(-third);
    const avg = (xs) => xs.reduce((s, e) => s + e.outputTokens, 0) / xs.length;
    const e0 = avg(early);
    const e1 = avg(lateArr);
    if (e0 > 0) outputDecline = (e0 - e1) / e0;
  }
  const signals = [];
  const fillSev = fill >= 0.9 ? "high" : fill >= 0.8 ? "high" : fill >= 0.6 ? "watch" : "ok";
  const absSev = contextTokens >= 4e5 ? "high" : contextTokens >= 2e5 ? "watch" : "ok";
  const ctxSev = RANK2[fillSev] >= RANK2[absSev] ? fillSev : absSev;
  if (ctxSev !== "ok") {
    signals.push({
      key: "context-fill",
      severity: ctxSev,
      detail: `Context is ~${Math.round(fill * 100)}% full (${Math.round(contextTokens / 1e3)}k of ${Math.round(contextWindow / 1e3)}k). Usable context is only ~50\u201365% of the window, so quality sags before it's "full."`,
      action: ctxSev === "high" ? "/compact now (or start a fresh session) \u2014 past here, even the summary gets lossy" : "good moment to /compact \u2014 Anthropic suggests it around 50\u201360%, before quality dips"
    });
  }
  const turnSev = calls >= 25 ? "high" : calls >= 12 ? "watch" : "ok";
  if (turnSev !== "ok") {
    signals.push({
      key: "session-length",
      severity: turnSev,
      detail: `${calls} turns this session. Multi-turn drift creeps in past ~12 turns (early decisions fade, the model re-litigates settled points).`,
      action: "switching tasks? /clear. Long task? checkpoint progress to a file and start a fresh session."
    });
  }
  if (durationMin >= 120) {
    signals.push({
      key: "session-duration",
      severity: "watch",
      detail: `Running ${Math.round(durationMin)} min. Past ~2h, accumulated state slows the agent independent of context.`,
      action: "restart the agent to clear the slowdown (your files and git are untouched)."
    });
  }
  if (cacheRead + cacheWrite > 5e4) {
    const cacheSev = cacheReadShare < 0.2 ? "high" : cacheReadShare < 0.5 ? "watch" : "ok";
    if (cacheSev !== "ok") {
      signals.push({
        key: "cache-health",
        severity: cacheSev,
        detail: `Only ${Math.round(cacheReadShare * 100)}% of cache activity is reuse \u2014 the context keeps changing, so cache (and coherence) reset each turn.`,
        action: "keep the stable parts (system prompt, key files) first and unchanged; let volatile context come last."
      });
    }
  }
  if (compactions >= 2) {
    signals.push({
      key: "compaction-cascade",
      severity: "high",
      detail: `~${compactions} auto-compactions this session. Each summary drops precise detail (paths, line numbers, error codes), and summaries of summaries degrade fast.`,
      action: "start a fresh session with a short handoff note of decisions + next steps, rather than compacting again."
    });
  }
  if (recentRetries >= 3) {
    signals.push({
      key: "looping",
      severity: "watch",
      detail: `${recentRetries} retries in the last few turns \u2014 a sign the agent is stuck repeating an approach.`,
      action: "/rewind to before the loop and change approach, or restate the goal with an explicit success check."
    });
  }
  if (outputDecline >= 0.4) {
    signals.push({
      key: "output-shrink",
      severity: "watch",
      detail: `Responses are ~${Math.round(outputDecline * 100)}% shorter than earlier in the session \u2014 often a sign focus is slipping.`,
      action: "re-state the task and constraints in a fresh message, or /compact to clear the bloat."
    });
  }
  signals.sort((a, b) => RANK2[b.severity] - RANK2[a.severity]);
  let status;
  if (calls < 3) status = "fresh";
  else {
    const worst = signals.reduce((m, s) => Math.max(m, RANK2[s.severity]), 0);
    if (worst === RANK2.high) status = fill >= 0.9 || compactions >= 2 ? "critical" : "degrading";
    else if (worst === RANK2.watch) status = "watch";
    else status = "healthy";
  }
  return {
    calls,
    durationMin,
    model,
    contextWindow,
    contextTokens,
    fill,
    peakContextTokens,
    peakFill,
    cacheReadShare,
    compactions,
    recentRetries,
    status,
    signals
  };
}
function sessionHealth(entries, now) {
  const s = latestSession(entries);
  if (!s || s.length === 0) return void 0;
  return analyzeSession(s, now);
}
var STATUS_ORDER = ["fresh", "healthy", "watch", "degrading", "critical"];
var STATUS_RANK = {
  fresh: 0,
  healthy: 1,
  watch: 2,
  degrading: 3,
  critical: 4
};
var HEALTH_EXIT = {
  fresh: 0,
  healthy: 0,
  watch: 10,
  degrading: 20,
  critical: 30
};
function atOrAbove(status, gate) {
  return STATUS_ORDER.indexOf(status) >= STATUS_ORDER.indexOf(gate);
}
function healthExitCode(h, gate = "degrading") {
  if (!h) return 0;
  return atOrAbove(h.status, gate) ? HEALTH_EXIT[h.status] : 0;
}
function prHealth(selected, now, gapMs = THIRTY_MIN_MS) {
  if (selected.length === 0) return void 0;
  const sessions = sessionize(selected, gapMs);
  const analyzed = sessions.map((s) => {
    const end = ms2(s[s.length - 1].ts);
    return analyzeSession(s, end);
  });
  let worst = "fresh";
  let peakFill = 0;
  let peakContextTokens = 0;
  let peakWindow = 2e5;
  let totalCompactions = 0;
  let looped = false;
  let longestTurns = 0;
  let longestMin = 0;
  const sigByKey = /* @__PURE__ */ new Map();
  for (const h of analyzed) {
    if (STATUS_RANK[h.status] > STATUS_RANK[worst]) worst = h.status;
    if (h.peakFill > peakFill) {
      peakFill = h.peakFill;
      peakContextTokens = h.peakContextTokens;
      peakWindow = h.contextWindow;
    }
    totalCompactions += h.compactions;
    if (h.recentRetries >= 3) looped = true;
    longestTurns = Math.max(longestTurns, h.calls);
    longestMin = Math.max(longestMin, h.durationMin);
    for (const s of h.signals) {
      const prev = sigByKey.get(s.key);
      if (!prev || RANK2[s.severity] > RANK2[prev.severity]) sigByKey.set(s.key, s);
    }
  }
  const topSignals = [...sigByKey.values()].sort((a, b) => RANK2[b.severity] - RANK2[a.severity]).slice(0, 3);
  return {
    sessions: analyzed.length,
    analyzed,
    worst,
    peakFill,
    peakContextTokens,
    peakWindow,
    totalCompactions,
    looped,
    longestTurns,
    longestMin,
    topSignals
  };
}
function sessionHistory(entries, gapMs = THIRTY_MIN_MS) {
  return sessionize(entries, gapMs).map((s, i) => {
    const endTs = ms2(s[s.length - 1].ts);
    const health = analyzeSession(s, endTs);
    let peakBefore = 0;
    let compactedLate = false;
    for (let j = 1; j < s.length; j++) {
      const prev = promptTokens(s[j - 1]);
      const cur = promptTokens(s[j]);
      peakBefore = Math.max(peakBefore, prev / health.contextWindow);
      if (prev > health.contextWindow * 0.3 && cur < prev * 0.5) {
        compactedLate = peakBefore >= 0.8;
        break;
      }
    }
    return { index: i + 1, startTs: ms2(s[0].ts), endTs, health, compactedLate };
  });
}
function contextTax(session, pricing) {
  let resentTokens = 0;
  let newTokens = 0;
  let cacheWriteTokens = 0;
  let resentCostUsd = 0;
  let newCostUsd = 0;
  for (const e of session) {
    resentTokens += e.cacheReadTokens;
    newTokens += e.inputTokens + e.outputTokens;
    cacheWriteTokens += e.cacheWrite5mTokens + e.cacheWrite1hTokens;
    const zero = {
      model: e.model,
      inputTokens: 0,
      outputTokens: 0,
      cacheReadTokens: 0,
      cacheWrite5mTokens: 0,
      cacheWrite1hTokens: 0
    };
    const reCost = pricing.cost({ ...zero, cacheReadTokens: e.cacheReadTokens });
    const nwCost = pricing.cost({ ...zero, inputTokens: e.inputTokens, outputTokens: e.outputTokens });
    if (reCost === null) resentCostUsd = null;
    else if (resentCostUsd !== null) resentCostUsd += reCost;
    if (nwCost === null) newCostUsd = null;
    else if (newCostUsd !== null) newCostUsd += nwCost;
  }
  const totalTokens2 = resentTokens + newTokens + cacheWriteTokens;
  const resentShare = totalTokens2 > 0 ? resentTokens / totalTokens2 : 0;
  const resentCostShare = resentCostUsd !== null && newCostUsd !== null && resentCostUsd + newCostUsd > 0 ? resentCostUsd / (resentCostUsd + newCostUsd) : null;
  return {
    totalTokens: totalTokens2,
    resentTokens,
    newTokens,
    cacheWriteTokens,
    resentShare,
    resentCostUsd,
    newCostUsd,
    resentCostShare
  };
}
function median(xs) {
  if (xs.length === 0) return void 0;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}
function degradationProfile(entries, gapMs = THIRTY_MIN_MS) {
  const hist = sessionHistory(entries, gapMs);
  const onsetTurns = [];
  const onsetTokens = [];
  let degradedCount = 0;
  let crossed80 = 0;
  let lateCompactions = 0;
  for (const summ of hist) {
    const { health } = summ;
    if (STATUS_RANK[health.status] >= STATUS_RANK.degrading) degradedCount++;
    if (health.peakFill >= 0.8) crossed80++;
    if (summ.compactedLate) lateCompactions++;
  }
  for (const session of sessionize(entries, gapMs)) {
    const win = analyzeSession(session, ms2(session[session.length - 1].ts)).contextWindow;
    for (let i = 0; i < session.length; i++) {
      const p = promptTokens(session[i]);
      if (p / win >= 0.6 || i + 1 >= 12) {
        onsetTurns.push(i + 1);
        onsetTokens.push(p);
        break;
      }
    }
  }
  return {
    sessionsAnalyzed: hist.length,
    degradedCount,
    medianTurnsToOnset: median(onsetTurns),
    medianTokensToOnset: median(onsetTokens),
    lateCompactionRate: crossed80 > 0 ? lateCompactions / crossed80 : void 0
  };
}

// src/usage-render.ts
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
function clockDate(ms3) {
  const d = new Date(ms3);
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
  if (extras.topTip) {
    const t = extras.topTip;
    lines.push(
      `\u{1F4A1} **Biggest win:** ${t.title}${t.impact ? ` (${t.impact})` : ""}. Run \`receipt advice\` for the full list.`
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
  if (extras.topTip) {
    out.push(import_picocolors.default.dim(`   \u{1F4A1} ${extras.topTip.title}${extras.topTip.impact ? ` (${extras.topTip.impact})` : ""}`));
  }
  if (extras.fun) {
    const eq = funEquivalences(receipt.totalTokens, extras.repoTokens);
    if (eq.length) out.push(import_picocolors.default.dim("   = " + eq.slice(0, 2).join(", ")));
  }
  return out.join("\n");
}
var SEV_MARK = {
  high: (s) => import_picocolors.default.red("\u203C " + s),
  medium: (s) => import_picocolors.default.yellow("\u26A0 " + s),
  low: (s) => import_picocolors.default.dim("\xB7 " + s)
};
function wrap(text, width, indent) {
  const words = text.split(/\s+/);
  const lines = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > width) {
      if (cur) lines.push(cur);
      cur = w;
    } else {
      cur = cur ? cur + " " + w : w;
    }
  }
  if (cur) lines.push(cur);
  return lines.map((l) => indent + l).join("\n");
}
var STATUS_BADGE = {
  fresh: "\u{1F7E2} Fresh",
  healthy: "\u{1F7E2} Healthy",
  watch: "\u{1F7E1} Watch",
  degrading: "\u{1F7E0} Degrading",
  critical: "\u{1F534} Critical"
};
function sigMark(sev) {
  if (sev === "high") return (s) => import_picocolors.default.red("\u{1F534} " + s);
  if (sev === "watch") return (s) => import_picocolors.default.yellow("\u{1F7E1} " + s);
  return (s) => import_picocolors.default.dim("\xB7 " + s);
}
function renderHealth(h, tax, currency = "USD") {
  const out = [];
  out.push("");
  out.push(import_picocolors.default.bold("\u{1F9E0} Session health \u2014 keeping the agent sharp"));
  out.push("");
  if (!h) {
    out.push(import_picocolors.default.dim("No recent session in the ledger yet. Run your agent (or import it), then check back."));
    out.push("");
    return out.join("\n");
  }
  const head = `${STATUS_BADGE[h.status]}  ` + import_picocolors.default.dim(
    `context ${Math.round(h.fill * 100)}% full (${Math.round(h.contextTokens / 1e3)}k/${Math.round(h.contextWindow / 1e3)}k) \xB7 ${h.calls} turns \xB7 ${Math.round(h.durationMin)} min \xB7 ${Math.round(h.cacheReadShare * 100)}% cache reuse`
  );
  out.push(head);
  out.push("");
  if (h.signals.length === 0) {
    out.push(import_picocolors.default.green("  Looking sharp. Nothing to refresh yet."));
  } else {
    for (const s of h.signals) {
      out.push("  " + sigMark(s.severity)(s.detail));
      out.push(import_picocolors.default.cyan("     \u2192 " + s.action));
      out.push("");
    }
  }
  if (tax) {
    const taxBlock = renderContextTax(tax, currency);
    if (taxBlock) {
      out.push(taxBlock);
      out.push("");
    }
  }
  out.push(
    import_picocolors.default.dim(
      "Why act early: usable context is only ~50\u201365% of the window (RULER), and recall sags past ~50% fill. Compacting before the wall keeps quality high \u2014 it doesn't make the agent do less."
    )
  );
  out.push("");
  return out.join("\n");
}
function healthOneLine(h) {
  if (!h) return "";
  const dot2 = h.status === "critical" ? "\u{1F534}" : h.status === "degrading" ? "\u{1F7E0}" : h.status === "watch" ? "\u{1F7E1}" : "\u{1F7E2}";
  const parts = [`${dot2} ctx ${Math.round(h.fill * 100)}%`, `${h.calls} turns`];
  const top = h.signals[0];
  if (top && top.severity !== "ok") parts.push(top.key.replace(/-/g, " "));
  return "\u{1F9E0} " + parts.join(" \xB7 ");
}
function guardLine(h) {
  const top = h.signals[0];
  const pctFull = Math.round(h.fill * 100);
  const head = `receipt: session ${h.status} (ctx ~${pctFull}%, ${h.calls} turns)`;
  return top ? `${head} \u2014 ${top.action}` : head;
}
function renderContextTax(t, currency = "USD") {
  if (t.totalTokens === 0) return "";
  const out = [];
  const sharePct = Math.round(t.resentShare * 100);
  const tag = sharePct >= 70 ? "\u{1F7E0}" : sharePct >= 50 ? "\u{1F7E1}" : "\u{1F7E2}";
  out.push("  " + import_picocolors.default.bold(`\u{1F4E6} Re-sent context: ${tag} ${sharePct}% of this session's tokens`));
  out.push(
    import_picocolors.default.dim(
      `     ${tokens(t.resentTokens)} of ${tokens(t.totalTokens)} were prior context carried forward; ${tokens(t.newTokens)} (${Math.round(t.newTokens / t.totalTokens * 100)}%) was new work.`
    )
  );
  if (t.resentCostUsd !== null && t.newCostUsd !== null) {
    const costPct = t.resentCostShare !== null ? Math.round(t.resentCostShare * 100) : 0;
    out.push(
      import_picocolors.default.dim(
        `     Caching kept the cost of that re-send to ${money(t.resentCostUsd, currency)} of ${money(t.resentCostUsd + t.newCostUsd, currency)} (${costPct}%).`
      )
    );
  }
  if (sharePct >= 50) {
    out.push(
      import_picocolors.default.cyan(
        "     \u2192 A long session mostly re-reads itself. A fresh session is cheaper and sharper."
      )
    );
  }
  return out.join("\n");
}
var STATUS_DOT = {
  fresh: "\u{1F7E2}",
  healthy: "\u{1F7E2}",
  watch: "\u{1F7E1}",
  degrading: "\u{1F7E0}",
  critical: "\u{1F534}"
};
function healthBlockMarkdown(ph, opts = {}) {
  if (!ph) return "";
  const worthIt = STATUS_RANK[ph.worst] >= STATUS_RANK.watch;
  if (!worthIt) {
    if (!opts.always) return "";
    return `\u{1F9E0} Session health \u2014 all ${ph.sessions} session${ph.sessions === 1 ? "" : "s"} stayed healthy (peaked ~${Math.round(ph.peakFill * 100)}% context).`;
  }
  const flagged = ph.analyzed.filter((h) => STATUS_RANK[h.status] >= STATUS_RANK.watch).length;
  const peakK = Math.round(ph.peakContextTokens / 1e3);
  const winK = Math.round(ph.peakWindow / 1e3);
  const lines = [];
  lines.push("<details>");
  lines.push(
    `<summary>\u{1F9E0} Session health \u2014 ${flagged} of ${ph.sessions} session${ph.sessions === 1 ? "" : "s"} was ${ph.worst}</summary>`
  );
  lines.push("");
  lines.push(
    `This PR's AI work spanned **${ph.sessions} session${ph.sessions === 1 ? "" : "s"}**. The longest ran **${ph.longestTurns} turns / ${Math.round(ph.longestMin)} min**, and context peaked at **~${Math.round(ph.peakFill * 100)}% full (${peakK}k/${winK}k)**` + (ph.totalCompactions > 0 ? ` with **~${ph.totalCompactions} auto-compaction${ph.totalCompactions === 1 ? "" : "s"}**` : "") + `. Long, compacted sessions drift \u2014 early decisions fade and summaries drop precise detail \u2014 so these changes are **worth a careful review** for consistency and correctness. Nothing here says the code is wrong; it's a pointer to where to look.`
  );
  lines.push("");
  for (const s of ph.topSignals) {
    const dotMark = s.severity === "high" ? "\u{1F534}" : s.severity === "watch" ? "\u{1F7E1}" : "\xB7";
    lines.push(`- ${dotMark} ${s.detail}`);
  }
  lines.push("");
  lines.push(
    "<sub>Measured from token counts only \u2014 no prompts or code were read. Usable context is ~50\u201365% of the window (RULER); recall sags past ~50% fill.</sub>"
  );
  lines.push("</details>");
  return lines.join("\n");
}
function renderHealthHistory(rows, limit = 12, profile) {
  const out = [];
  out.push("");
  out.push(import_picocolors.default.bold("\u{1F9E0} Session history \u2014 how your sessions have held up"));
  out.push("");
  if (rows.length === 0) {
    out.push(import_picocolors.default.dim("No sessions in the ledger yet. Run your agent (or import it), then check back."));
    out.push("");
    return out.join("\n");
  }
  const shown = rows.slice(-limit).reverse();
  out.push(import_picocolors.default.dim("  #    when             turns   peak ctx   ~compact   verdict"));
  for (const r of shown) {
    const h = r.health;
    const when = clockDate(r.startTs).padEnd(14);
    const turns = String(h.calls).padStart(4);
    const peak = `${Math.round(h.peakFill * 100)}%`.padStart(5);
    const peakDot = STATUS_DOT[h.status];
    const comp = String(h.compactions).padStart(4);
    const verdict = r.compactedLate ? import_picocolors.default.yellow("compacted late") : h.status === "fresh" ? import_picocolors.default.dim("fresh-ish") : h.status === "healthy" ? import_picocolors.default.green("healthy") : import_picocolors.default.yellow(h.status);
    out.push(
      `  ${String(r.index).padStart(3)}  ${when}  ${turns}    ${peak} ${peakDot}     ${comp}     ${verdict}`
    );
  }
  out.push("");
  if (profile) {
    const line = degradationProfileLine(profile);
    if (line) {
      out.push(line);
      out.push("");
    }
  }
  return out.join("\n");
}
function degradationProfileLine(p) {
  if (p.sessionsAnalyzed === 0) return "";
  const parts = [];
  if (p.medianTurnsToOnset !== void 0) {
    const tok = p.medianTokensToOnset !== void 0 ? ` (~${Math.round(p.medianTokensToOnset / 1e3)}k ctx tokens)` : "";
    parts.push(`You tend to drift around turn ~${p.medianTurnsToOnset}${tok}.`);
  }
  if (p.lateCompactionRate !== void 0 && p.lateCompactionRate > 0) {
    parts.push(
      `${Math.round(p.lateCompactionRate * 100)}% of your sessions that crossed 80% full compacted *after* the fact \u2014 try /compact at 60%.`
    );
  }
  return parts.length ? import_picocolors.default.dim("  " + parts.join("  ")) : "";
}
function renderAdvice(receipt, recs) {
  const out = [];
  out.push("");
  out.push(import_picocolors.default.bold("\u{1F4A1} Advice \u2014 cut the waste, keep the quality"));
  out.push("");
  if (receipt.totalTokens === 0) {
    out.push(import_picocolors.default.dim("No usage recorded for this scope yet. Run your agent, then check back."));
    out.push("");
    return out.join("\n");
  }
  const drivers = costDrivers(receipt);
  if (drivers.length) {
    out.push(import_picocolors.default.bold("What's driving the cost"));
    for (const d of drivers) out.push("  \u2022 " + d.replace(/`/g, ""));
    out.push("");
  }
  out.push(import_picocolors.default.bold("Recommendations"));
  for (const r of recs) {
    const mark = SEV_MARK[r.severity] ?? ((s) => s);
    out.push("  " + mark(r.title) + (r.impact ? import_picocolors.default.green(`   ${r.impact}`) : ""));
    out.push(import_picocolors.default.dim(wrap(r.detail.replace(/`/g, ""), 78, "     ")));
    out.push("");
  }
  return out.join("\n");
}
export {
  COMMENT_MARKER,
  FIVE_HOURS_MS,
  HEALTH_EXIT,
  PLAN_PRESETS,
  Pricing,
  STATUS_RANK,
  WEEK_MS,
  analyzeSession,
  append,
  appendMany,
  atOrAbove,
  buildDashboardData,
  buildReceipt,
  capacity,
  captureLimits,
  contextTax,
  contextWindowFor,
  costDrivers,
  degradationProfile,
  degradationProfileLine,
  efficiencyGrade,
  entryTokens,
  estimateRepoTokens,
  fuel,
  funEquivalences,
  guardLine,
  healthBlockMarkdown,
  healthExitCode,
  healthOneLine,
  importClaudeCode,
  importGeneric,
  inWorkUnits,
  knownRequestIds,
  latestSession,
  ledgerPath,
  paceState,
  personalStats,
  prHealth,
  presetFor,
  promptTokens,
  providerOf,
  quantile,
  readLedger,
  readObservedBudget,
  recommend,
  records,
  renderAdvice,
  renderContextTax,
  renderForecast,
  renderFuel,
  renderHealth,
  renderHealthHistory,
  renderMarkdown,
  renderRecords,
  renderStatusline,
  renderText,
  resolveBudget,
  selectEntries,
  sessionHealth,
  sessionHistory,
  sessionize,
  taskImpact,
  taskRollups,
  taskSizes,
  topRecommendation,
  usageBlockMarkdown,
  usageSummaryText,
  voiceLine,
  whatIf,
  whereItWent,
  windowState,
  writeObservedBudget
};
