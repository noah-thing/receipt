/**
 * Usage awareness — the "% of you" engine.
 *
 * Receipt's ledger already knows what every call cost in tokens and dollars.
 * This module turns those raw numbers into the things that actually change how
 * you work: how much of your plan a task ate, what you could still do before
 * the window resets, how this task compares to your own history, and whether
 * you are burning faster than a pace that lasts the week.
 *
 * Everything here is pure and testable except the small IO helpers at the
 * bottom (reading the calibrated/observed budget and estimating repo size).
 *
 * Honesty: subscription window budgets are not published, so a budget is either
 * observed from the provider's own rate-limit headers (real), calibrated from a
 * limit you actually hit, or a labeled preset estimate. The renderers always
 * say which.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { LedgerEntry, PlanBudget, PlanId, Receipt, ReceiptConfig } from "./types.js";
import { Pricing } from "./pricing.js";

export const FIVE_HOURS_MS = 5 * 60 * 60 * 1000;
export const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Rough per-window token budgets by plan. These are ESTIMATES — Anthropic does
 * not publish exact figures — and exist only so the feature works before you
 * calibrate. Run the proxy (which reads real rate-limit headers) or
 * `receipt calibrate` to replace them with your true ceiling.
 */
export const PLAN_PRESETS: Record<Exclude<PlanId, "custom">, PlanBudget> = {
  pro: { fiveHour: 2_500_000, weekly: 25_000_000, source: "preset", plan: "pro" },
  max5x: { fiveHour: 12_500_000, weekly: 125_000_000, source: "preset", plan: "max5x" },
  max20x: { fiveHour: 50_000_000, weekly: 500_000_000, source: "preset", plan: "max20x" },
};

/** Total tokens an entry moved, cached and uncached alike. */
export function entryTokens(e: LedgerEntry): number {
  return (
    e.inputTokens +
    e.outputTokens +
    e.cacheReadTokens +
    e.cacheWrite5mTokens +
    e.cacheWrite1hTokens
  );
}

function ms(ts: string): number {
  return new Date(ts).getTime();
}

// ── windows ──────────────────────────────────────────────────────────────────

export interface WindowState {
  /** Tokens used inside the current window. */
  used: number;
  /** Calls inside the current window. */
  calls: number;
  /** When the current window opened (first call inside it). */
  openedAt: number;
  /** When the window resets and usage frees up. */
  resetAt: number;
  /** Estimated budget for the window, if known. */
  budget?: number;
  /** used / budget, when a budget is known. */
  frac?: number;
}

/**
 * State of one rolling window (5h or weekly).
 *
 * Approximates Anthropic's fixed-from-first-use window: the window opens at the
 * earliest call still inside the look-back and resets a window-length later.
 */
export function windowState(
  entries: LedgerEntry[],
  durationMs: number,
  now: number,
  budget?: number,
): WindowState {
  const since = now - durationMs;
  const inWindow = entries.filter((e) => ms(e.ts) >= since);
  if (inWindow.length === 0) {
    return { used: 0, calls: 0, openedAt: now, resetAt: now + durationMs, budget, frac: budget ? 0 : undefined };
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
    frac: budget && budget > 0 ? used / budget : undefined,
  };
}

// ── tasks, sizes, personal stats ─────────────────────────────────────────────

export interface TaskRollup {
  key: string;
  tokens: number;
  cost: number;
  calls: number;
  firstTs: number;
  lastTs: number;
}

/** Group the ledger into tasks (one per branch) for distribution math. */
export function taskRollups(entries: LedgerEntry[]): TaskRollup[] {
  const map = new Map<string, TaskRollup>();
  for (const e of entries) {
    const key = e.git?.branch || e.label || "(unscoped)";
    const r =
      map.get(key) ??
      { key, tokens: 0, cost: 0, calls: 0, firstTs: ms(e.ts), lastTs: ms(e.ts) };
    r.tokens += entryTokens(e);
    r.cost += e.costUsd ?? 0;
    r.calls += 1;
    r.firstTs = Math.min(r.firstTs, ms(e.ts));
    r.lastTs = Math.max(r.lastTs, ms(e.ts));
    map.set(key, r);
  }
  return [...map.values()];
}

export function quantile(sortedAsc: number[], q: number): number {
  if (sortedAsc.length === 0) return 0;
  const pos = (sortedAsc.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  if (lo === hi) return sortedAsc[lo]!;
  return sortedAsc[lo]! + (sortedAsc[hi]! - sortedAsc[lo]!) * (pos - lo);
}

export interface TaskSizes {
  quick: number;
  pr: number;
  refactor: number;
  feature: number;
  /** True once there is enough history to derive these from real data. */
  learned: boolean;
}

const DEFAULT_SIZES: TaskSizes = {
  quick: 50_000,
  pr: 300_000,
  refactor: 900_000,
  feature: 2_000_000,
  learned: false,
};

/** Learn typical task sizes (in tokens) from the branch distribution. */
export function taskSizes(entries: LedgerEntry[]): TaskSizes {
  const totals = taskRollups(entries)
    .map((t) => t.tokens)
    .filter((n) => n > 0)
    .sort((a, b) => a - b);
  if (totals.length < 4) return DEFAULT_SIZES;
  return {
    quick: Math.max(1, Math.round(quantile(totals, 0.25))),
    pr: Math.max(1, Math.round(quantile(totals, 0.5))),
    refactor: Math.max(1, Math.round(quantile(totals, 0.75))),
    feature: Math.max(1, Math.round(quantile(totals, 0.9))),
    learned: true,
  };
}

export interface PersonalStats {
  taskCount: number;
  medianTaskTokens: number;
  medianTaskCost: number;
  meanTaskTokens: number;
}

export function personalStats(entries: LedgerEntry[]): PersonalStats {
  const tasks = taskRollups(entries).filter((t) => t.tokens > 0);
  const tokensSorted = tasks.map((t) => t.tokens).sort((a, b) => a - b);
  const costSorted = tasks.map((t) => t.cost).sort((a, b) => a - b);
  const meanTokens = tasks.length ? tasks.reduce((s, t) => s + t.tokens, 0) / tasks.length : 0;
  return {
    taskCount: tasks.length,
    medianTaskTokens: quantile(tokensSorted, 0.5),
    medianTaskCost: quantile(costSorted, 0.5),
    meanTaskTokens: meanTokens,
  };
}

// ── pace ─────────────────────────────────────────────────────────────────────

export interface PaceState {
  /** Tokens used in the last hour. */
  lastHour: number;
  /** Tokens that would last all week, per hour. */
  sustainablePerHour: number;
  /** lastHour / sustainablePerHour. >1 means burning too fast. */
  ratio: number;
  /** Tokens used in the last 24h. */
  lastDay: number;
  /** Days of weekly budget left at the last-24h burn rate. */
  runwayDays?: number;
  /** When the weekly budget runs dry at that rate. */
  runsDryAt?: number;
}

export function paceState(
  entries: LedgerEntry[],
  weeklyBudget: number | undefined,
  now: number,
  weeklyUsed: number,
): PaceState {
  const lastHour = entries
    .filter((e) => ms(e.ts) >= now - 60 * 60 * 1000)
    .reduce((s, e) => s + entryTokens(e), 0);
  const lastDay = entries
    .filter((e) => ms(e.ts) >= now - 24 * 60 * 60 * 1000)
    .reduce((s, e) => s + entryTokens(e), 0);
  const sustainablePerHour = weeklyBudget ? weeklyBudget / 168 : 0;
  const ratio = sustainablePerHour > 0 ? lastHour / sustainablePerHour : 0;

  let runwayDays: number | undefined;
  let runsDryAt: number | undefined;
  if (weeklyBudget && lastDay > 0) {
    const remaining = Math.max(0, weeklyBudget - weeklyUsed);
    runwayDays = remaining / lastDay;
    runsDryAt = now + runwayDays * 24 * 60 * 60 * 1000;
  }
  return { lastHour, sustainablePerHour, ratio, lastDay, runwayDays, runsDryAt };
}

// ── capacity ("what you could still do") ─────────────────────────────────────

export interface CapacityItem {
  label: string;
  count: number;
}

/** What the remaining window budget buys, in your own task sizes. */
export function capacity(remainingTokens: number, sizes: TaskSizes): CapacityItem[] {
  const r = Math.max(0, remainingTokens);
  const items: CapacityItem[] = [
    { label: "PRs this size", count: Math.floor(r / sizes.pr) },
    { label: "big refactors", count: Math.floor(r / sizes.refactor) },
    { label: "quick edits", count: Math.floor(r / sizes.quick) },
  ];
  return items.filter((i) => i.count > 0);
}

/** Express a token amount in your own work-units, biggest unit that fits first. */
export function inWorkUnits(tokensUsed: number, sizes: TaskSizes): string {
  const units: Array<[string, number]> = [
    ["features", sizes.feature],
    ["refactors", sizes.refactor],
    ["PRs", sizes.pr],
    ["quick edits", sizes.quick],
  ];
  for (const [name, size] of units) {
    const n = tokensUsed / size;
    if (n >= 0.8) return `${n.toFixed(n >= 10 ? 0 : 1)} ${name}`;
  }
  return `${Math.max(1, Math.round(tokensUsed / sizes.quick))} quick edits`;
}

// ── efficiency grade ─────────────────────────────────────────────────────────

export interface EfficiencyGrade {
  score: number;
  letter: string;
  cacheHitRate: number;
  retryRate: number;
}

/**
 * A heuristic 0–100 grade for how tight a task was. Rewards cache reuse,
 * punishes retries. Not a precise measure — a nudge, not a verdict.
 */
export function efficiencyGrade(receipt: Receipt): EfficiencyGrade {
  const inputAll = receipt.byModel.reduce((s, m) => s + m.inputTokens + m.cacheReadTokens, 0);
  const cacheRead = receipt.byModel.reduce((s, m) => s + m.cacheReadTokens, 0);
  const cacheHitRate = inputAll > 0 ? cacheRead / inputAll : 0;
  const retryRate = receipt.entryCount > 0 ? receipt.retries / receipt.entryCount : 0;

  let score = 55 + 45 * cacheHitRate - 35 * Math.min(1, retryRate);
  score = Math.max(0, Math.min(100, Math.round(score)));
  const letter =
    score >= 90 ? "A" : score >= 80 ? "B" : score >= 70 ? "C" : score >= 60 ? "D" : "F";
  return { score, letter, cacheHitRate, retryRate };
}

// ── where the tokens went ────────────────────────────────────────────────────

export interface Composition {
  output: number;
  freshInput: number;
  cacheRead: number;
  cacheWrite: number;
}

/** Fractions of the total tokens by kind, so you can see where they went. */
export function whereItWent(receipt: Receipt): Composition {
  const total = receipt.totalTokens || 1;
  const output = receipt.byModel.reduce((s, m) => s + m.outputTokens, 0);
  const freshInput = receipt.byModel.reduce((s, m) => s + m.inputTokens, 0);
  const cacheRead = receipt.byModel.reduce((s, m) => s + m.cacheReadTokens, 0);
  const cacheWrite = receipt.byModel.reduce((s, m) => s + m.cacheWriteTokens, 0);
  return {
    output: output / total,
    freshInput: freshInput / total,
    cacheRead: cacheRead / total,
    cacheWrite: cacheWrite / total,
  };
}

// ── what-if (model mix lever) ────────────────────────────────────────────────

export interface WhatIf {
  fromModel: string;
  toModel: string;
  currentCost: number;
  cheaperCost: number;
  saved: number;
  savedFrac: number;
}

/**
 * Estimate the saving from running the heaviest model's *read* work (fresh
 * input + cache reads) on a cheaper model. The lever everyone has but rarely
 * pulls: stop paying Opus prices to re-read files.
 */
export function whatIf(receipt: Receipt, pricing: Pricing, cheaper = "claude-haiku-4-5"): WhatIf | undefined {
  const top = receipt.byModel.find((m) => m.priced && m.costUsd > 0);
  if (!top || top.model === cheaper) return undefined;
  const readTokens = { inputTokens: top.inputTokens, cacheReadTokens: top.cacheReadTokens };
  const base = {
    outputTokens: 0,
    cacheWrite5mTokens: 0,
    cacheWrite1hTokens: 0,
    toolCalls: {},
  };
  const current = pricing.cost({ model: top.model, ...readTokens, ...base });
  const swapped = pricing.cost({ model: cheaper, ...readTokens, ...base });
  if (current === null || swapped === null || current <= swapped) return undefined;
  const saved = current - swapped;
  return {
    fromModel: top.model,
    toModel: cheaper,
    currentCost: current,
    cheaperCost: swapped,
    saved,
    savedFrac: receipt.total > 0 ? saved / receipt.total : 0,
  };
}

// ── records & rankings ───────────────────────────────────────────────────────

export interface Records {
  priciest?: TaskRollup;
  leanest?: TaskRollup;
  latest?: TaskRollup;
  /** 1-based rank of the latest task by tokens (1 = heaviest). */
  latestRank?: number;
  /** Consecutive most-recent tasks under the median, newest-first. */
  streakUnderMedian: number;
}

export function records(entries: LedgerEntry[]): Records {
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
    latestRank: latest ? byTokens.findIndex((t) => t.key === latest.key) + 1 : undefined,
    streakUnderMedian: streak,
  };
}

// ── fun equivalences ─────────────────────────────────────────────────────────

/** Playful but honest comparisons. Anchored to real token counts. */
export function funEquivalences(tokensUsed: number, repoTokens?: number): string[] {
  const out: string[] = [];
  if (repoTokens && repoTokens > 0) {
    const times = tokensUsed / repoTokens;
    if (times >= 0.3) out.push(`re-reading your entire repo ${times.toFixed(1)}×`);
  }
  const WAR_AND_PEACE = 780_000; // ~587k words at ~1.33 tokens/word
  const NOVEL = 105_000; // ~80k-word novel
  const wp = tokensUsed / WAR_AND_PEACE;
  if (wp >= 0.5) out.push(`reading War and Peace ${wp.toFixed(1)}× over`);
  const novels = tokensUsed / NOVEL;
  if (novels >= 1) out.push(`reading ${Math.round(novels)} average novels`);
  // A person reads ~250 wpm ≈ ~330 tokens/min.
  const readerHours = tokensUsed / 330 / 60;
  if (readerHours >= 1) out.push(`${readerHours.toFixed(0)} hours of human reading`);
  return out;
}

// ── voice ────────────────────────────────────────────────────────────────────

/** A dry one-liner sized to how close to the wall you are. */
export function voiceLine(frac: number | undefined): string | undefined {
  if (frac === undefined) return undefined;
  if (frac >= 1) return "Window's gone. The wall is right there.";
  if (frac >= 0.85) return "You're nearly out of road for this window.";
  if (frac >= 0.6) return "Past the halfway mark. Spend the rest on purpose.";
  if (frac >= 0.3) return "Cruising. Plenty of window left.";
  return "Barely touched it.";
}

// ── the assembled current-state snapshot ─────────────────────────────────────

export interface Fuel {
  budget?: PlanBudget;
  fiveHour: WindowState;
  weekly: WindowState;
  pace: PaceState;
  sizes: TaskSizes;
  /** What the remaining 5h window buys. */
  capacityFiveHour: CapacityItem[];
  /** What the remaining weekly window buys. */
  capacityWeekly: CapacityItem[];
}

/** Assemble everything about right-now from the ledger. */
export function fuel(entries: LedgerEntry[], budget: PlanBudget | undefined, now: number): Fuel {
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
    capacityWeekly: budget ? capacity(remainingWk, sizes) : [],
  };
}

/** A task's share of each window, as fractions. */
export function taskImpact(taskTokens: number, budget: PlanBudget | undefined) {
  if (!budget) return undefined;
  return {
    fiveHour: budget.fiveHour > 0 ? taskTokens / budget.fiveHour : 0,
    weekly: budget.weekly > 0 ? taskTokens / budget.weekly : 0,
  };
}

// ── budget resolution + IO (calibration, observed limits, repo size) ──────────

function limitsPath(root: string): string {
  return join(root, ".receipt", "limits.json");
}

/** Read the live/calibrated budget written by the proxy or `receipt calibrate`. */
export function readObservedBudget(root: string): PlanBudget | undefined {
  const path = limitsPath(root);
  if (!existsSync(path)) return undefined;
  try {
    const b = JSON.parse(readFileSync(path, "utf8")) as PlanBudget;
    if (typeof b.fiveHour === "number" && typeof b.weekly === "number") return b;
  } catch {
    /* ignore a corrupt file */
  }
  return undefined;
}

export function writeObservedBudget(root: string, budget: PlanBudget): void {
  const path = limitsPath(root);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(budget, null, 2) + "\n", "utf8");
}

/**
 * Resolve the budget to use, best source first: a live/calibrated value, then
 * a custom config value, then the plan preset. Undefined when no plan is set,
 * in which case the renderers fall back to history-only framings.
 */
export function resolveBudget(config: ReceiptConfig, root: string): PlanBudget | undefined {
  const observed = readObservedBudget(root);
  if (observed) return observed;
  if (config.planBudget) return config.planBudget;
  if (config.plan && config.plan !== "custom") return PLAN_PRESETS[config.plan];
  return undefined;
}

/**
 * Capture rate-limit headers from a provider response into limits.json.
 *
 * Anthropic returns `anthropic-ratelimit-unified-*` headers with the limit and
 * remaining tokens for the current window. When present, this gives a real
 * budget with no guessing. Safe to call on every response; it only writes when
 * it finds a usable limit number.
 */
export function captureLimits(getHeader: (name: string) => string | null, root: string): void {
  const num = (name: string): number | undefined => {
    const v = getHeader(name);
    if (v == null) return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };
  // Anthropic unified rate-limit headers (tokens).
  const limit =
    num("anthropic-ratelimit-unified-limit") ??
    num("anthropic-ratelimit-tokens-limit") ??
    num("anthropic-ratelimit-input-tokens-limit");
  if (!limit || limit <= 0) return;

  const existing = readObservedBudget(root);
  // The header reflects a short window; keep the larger of what we have seen so
  // the weekly estimate grows toward the true ceiling rather than thrashing.
  const fiveHour = Math.max(limit, existing?.fiveHour ?? 0);
  const weekly = Math.max(existing?.weekly ?? 0, fiveHour * 5);
  writeObservedBudget(root, { fiveHour, weekly, source: "observed" });
}

const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  "coverage",
  ".next",
  ".turbo",
  "vendor",
]);
const TEXT_EXT = /\.(ts|tsx|js|jsx|mjs|cjs|py|go|rs|rb|java|kt|c|h|cpp|cc|cs|php|swift|scala|sh|sql|json|yaml|yml|toml|md|css|scss|html|vue|svelte)$/i;

/**
 * Estimate the repo's size in tokens (~4 chars/token) by walking tracked-looking
 * source files. Bounded so it never crawls a giant tree. Used for the playful
 * "re-read your repo N×" equivalence.
 */
export function estimateRepoTokens(root: string, maxFiles = 4000): number {
  let chars = 0;
  let seen = 0;
  const walk = (dir: string): void => {
    if (seen >= maxFiles) return;
    let ents: import("node:fs").Dirent[];
    try {
      ents = readdirSync(dir, { withFileTypes: true }) as import("node:fs").Dirent[];
    } catch {
      return;
    }
    for (const ent of ents) {
      if (seen >= maxFiles) return;
      if (ent.isDirectory()) {
        if (SKIP_DIRS.has(ent.name) || ent.name.startsWith(".")) continue;
        walk(join(dir, ent.name));
      } else if (ent.isFile() && TEXT_EXT.test(ent.name)) {
        try {
          const size = statSync(join(dir, ent.name)).size;
          if (size <= 2_000_000) {
            chars += size;
            seen += 1;
          }
        } catch {
          /* ignore */
        }
      }
    }
  };
  walk(root);
  return Math.round(chars / 4);
}
