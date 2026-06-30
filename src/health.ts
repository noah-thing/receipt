/**
 * Session health — keeping the agent sharp, not just cheap.
 *
 * Long sessions get worse before they hit any hard limit: context rot, lost-in-
 * the-middle, instruction drift, looping, and lossy auto-compaction all set in
 * while the window still has room. The research is consistent — effective
 * context is only ~50–65% of the advertised window (RULER), recall sags past
 * ~50% fill (lost-in-the-middle), and multi-turn quality drops ~39% over a long
 * conversation. Anthropic's own advice is to compact *proactively at 50–60%*,
 * before the summary itself goes lossy.
 *
 * This module reads the same ledger as everything else and estimates, per
 * session, how close it is to that quality cliff — then tells you the right
 * move (/compact, /clear, a fresh session, /rewind) BEFORE the output degrades.
 * It never advises doing less work; it protects the work's quality.
 *
 * The key trick: for any call, input + cache-read + cache-write tokens ≈ the
 * size of the prompt sent that turn ≈ how full the context was. No internals
 * needed — the ledger already has it.
 */
import type { LedgerEntry } from "./types.js";

export const THIRTY_MIN_MS = 30 * 60 * 1000;

/**
 * Context-window sizes (tokens) by model, 2026. Marketed windows; the renderer
 * is honest that the *usable* window is smaller. Prefix fallback handles
 * versions not listed; default is the conservative 200k.
 */
const CONTEXT_WINDOWS: Record<string, number> = {
  "claude-opus-4-8": 1_000_000,
  "claude-opus-4-7": 1_000_000,
  "claude-opus-4-1": 200_000,
  "claude-opus-4": 200_000,
  "claude-sonnet-5": 1_000_000,
  "claude-sonnet-4-6": 1_000_000,
  "claude-sonnet-4-5": 1_000_000,
  "claude-sonnet-4": 1_000_000,
  "claude-fable-5": 1_000_000,
  "claude-haiku-4-5": 200_000,
  "claude-3-7-sonnet": 200_000,
  "claude-3-5-sonnet": 200_000,
  "claude-3-5-haiku": 200_000,
  "claude-3-opus": 200_000,
  "claude-3-haiku": 200_000,
  "gpt-4o": 128_000,
  "gpt-4o-mini": 128_000,
  "gpt-4.1": 1_000_000,
  "gpt-4.1-mini": 1_000_000,
  "gpt-4.1-nano": 1_000_000,
  "o3": 200_000,
  "o4-mini": 200_000,
  "gpt-4-turbo": 128_000,
  "gpt-3.5-turbo": 16_000,
  "gemini-2.5-pro": 2_000_000,
  "gemini-2.5-flash": 1_000_000,
  "gemini-2.0-flash": 1_000_000,
};

const PREFIX_WINDOWS: Array<[string, number]> = [
  ["claude-opus-4-8", 1_000_000],
  ["claude-opus-4-7", 1_000_000],
  ["claude-opus", 200_000],
  ["claude-sonnet", 1_000_000],
  ["claude-haiku", 200_000],
  ["claude-3", 200_000],
  ["claude-fable", 1_000_000],
  ["opus", 200_000],
  ["sonnet", 1_000_000],
  ["haiku", 200_000],
  ["gpt-4o", 128_000],
  ["gpt-4.1", 1_000_000],
  ["gpt-4-turbo", 128_000],
  ["gpt-3.5", 16_000],
  ["o3", 200_000],
  ["o4", 200_000],
  ["gemini-2.5-pro", 2_000_000],
  ["gemini", 1_000_000],
];

export function contextWindowFor(model: string): number {
  if (Object.prototype.hasOwnProperty.call(CONTEXT_WINDOWS, model)) {
    return CONTEXT_WINDOWS[model]!;
  }
  for (const [prefix, win] of PREFIX_WINDOWS) {
    if (model.startsWith(prefix)) return win;
  }
  return 200_000;
}

/** Tokens sent in one call ≈ context size at that turn. */
export function promptTokens(e: LedgerEntry): number {
  return e.inputTokens + e.cacheReadTokens + e.cacheWrite5mTokens + e.cacheWrite1hTokens;
}

function ms(ts: string): number {
  return new Date(ts).getTime();
}

/** Split the ledger into sessions by an idle gap (default 30 min). Ascending. */
export function sessionize(entries: LedgerEntry[], gapMs = THIRTY_MIN_MS): LedgerEntry[][] {
  const sorted = [...entries].sort((a, b) => ms(a.ts) - ms(b.ts));
  const sessions: LedgerEntry[][] = [];
  let cur: LedgerEntry[] = [];
  let prev = 0;
  for (const e of sorted) {
    const t = ms(e.ts);
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

/** The most recent session, or undefined if the ledger is empty. */
export function latestSession(entries: LedgerEntry[], gapMs = THIRTY_MIN_MS): LedgerEntry[] | undefined {
  const s = sessionize(entries, gapMs);
  return s[s.length - 1];
}

export type Severity = "ok" | "watch" | "high";
export type HealthStatus = "fresh" | "healthy" | "watch" | "degrading" | "critical";

export interface HealthSignal {
  key: string;
  severity: Severity;
  /** What's happening. */
  detail: string;
  /** The quality-preserving move to make. */
  action: string;
}

export interface SessionHealth {
  calls: number;
  durationMin: number;
  model: string;
  contextWindow: number;
  /** Estimated current context size (tokens), from the heaviest of the last few calls. */
  contextTokens: number;
  fill: number;
  cacheReadShare: number;
  compactions: number;
  recentRetries: number;
  status: HealthStatus;
  signals: HealthSignal[];
}

function dominantModel(session: LedgerEntry[]): string {
  const counts = new Map<string, number>();
  for (const e of session) counts.set(e.model, (counts.get(e.model) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "unknown";
}

const RANK: Record<Severity, number> = { ok: 0, watch: 1, high: 2 };

/**
 * Score one session's quality risk from its token shape. Thresholds are drawn
 * from the research: compact proactively ~60% fill, degradation well before
 * "full", multi-turn drift past ~12 turns, accumulation slowdown past ~2h.
 */
export function analyzeSession(session: LedgerEntry[], now: number): SessionHealth {
  const calls = session.length;
  const first = ms(session[0]!.ts);
  const last = ms(session[session.length - 1]!.ts);
  const durationMin = Math.max(0, (Math.max(last, now) - first) / 60000);

  // Current context ≈ heaviest of the last few calls (robust to one tiny call).
  const tail = session.slice(-3);
  let contextTokens = 0;
  let contextModel = session[session.length - 1]!.model;
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

  const cacheRead = session.reduce((s, e) => s + e.cacheReadTokens, 0);
  const cacheWrite = session.reduce((s, e) => s + e.cacheWrite5mTokens + e.cacheWrite1hTokens, 0);
  const cacheReadShare = cacheRead + cacheWrite > 0 ? cacheRead / (cacheRead + cacheWrite) : 1;

  // Auto-compaction events: prompt size collapses after having been large.
  let compactions = 0;
  for (let i = 1; i < session.length; i++) {
    const prev = promptTokens(session[i - 1]!);
    const cur = promptTokens(session[i]!);
    if (prev > contextWindow * 0.3 && cur < prev * 0.5) compactions++;
  }

  const recentRetries = session.slice(-5).reduce((s, e) => s + (e.retries ?? 0), 0);

  // Output shrinkage: average output in the last third vs the first third.
  let outputDecline = 0;
  if (calls >= 6) {
    const third = Math.floor(calls / 3);
    const early = session.slice(0, third);
    const lateArr = session.slice(-third);
    const avg = (xs: LedgerEntry[]) => xs.reduce((s, e) => s + e.outputTokens, 0) / xs.length;
    const e0 = avg(early);
    const e1 = avg(lateArr);
    if (e0 > 0) outputDecline = (e0 - e1) / e0;
  }

  const signals: HealthSignal[] = [];

  // 1. Context fill — % of window AND absolute (big windows degrade by absolute size).
  const fillSev: Severity = fill >= 0.9 ? "high" : fill >= 0.8 ? "high" : fill >= 0.6 ? "watch" : "ok";
  const absSev: Severity = contextTokens >= 400_000 ? "high" : contextTokens >= 200_000 ? "watch" : "ok";
  const ctxSev = RANK[fillSev] >= RANK[absSev] ? fillSev : absSev;
  if (ctxSev !== "ok") {
    signals.push({
      key: "context-fill",
      severity: ctxSev,
      detail:
        `Context is ~${Math.round(fill * 100)}% full (${Math.round(contextTokens / 1000)}k of ` +
        `${Math.round(contextWindow / 1000)}k). Usable context is only ~50–65% of the window, so quality ` +
        `sags before it's "full."`,
      action:
        ctxSev === "high"
          ? "/compact now (or start a fresh session) — past here, even the summary gets lossy"
          : "good moment to /compact — Anthropic suggests it around 50–60%, before quality dips",
    });
  }

  // 2. Session length — multi-turn drift and accumulation slowdown.
  const turnSev: Severity = calls >= 25 ? "high" : calls >= 12 ? "watch" : "ok";
  if (turnSev !== "ok") {
    signals.push({
      key: "session-length",
      severity: turnSev,
      detail: `${calls} turns this session. Multi-turn drift creeps in past ~12 turns (early decisions fade, the model re-litigates settled points).`,
      action: "switching tasks? /clear. Long task? checkpoint progress to a file and start a fresh session.",
    });
  }
  if (durationMin >= 120) {
    signals.push({
      key: "session-duration",
      severity: "watch",
      detail: `Running ${Math.round(durationMin)} min. Past ~2h, accumulated state slows the agent independent of context.`,
      action: "restart the agent to clear the slowdown (your files and git are untouched).",
    });
  }

  // 3. Cache health — low reuse = context churning / cache-invalidation cascade.
  if (cacheRead + cacheWrite > 50_000) {
    const cacheSev: Severity = cacheReadShare < 0.2 ? "high" : cacheReadShare < 0.5 ? "watch" : "ok";
    if (cacheSev !== "ok") {
      signals.push({
        key: "cache-health",
        severity: cacheSev,
        detail: `Only ${Math.round(cacheReadShare * 100)}% of cache activity is reuse — the context keeps changing, so cache (and coherence) reset each turn.`,
        action: "keep the stable parts (system prompt, key files) first and unchanged; let volatile context come last.",
      });
    }
  }

  // 4. Compaction cascade — each summary loses detail.
  if (compactions >= 2) {
    signals.push({
      key: "compaction-cascade",
      severity: "high",
      detail: `~${compactions} auto-compactions this session. Each summary drops precise detail (paths, line numbers, error codes), and summaries of summaries degrade fast.`,
      action: "start a fresh session with a short handoff note of decisions + next steps, rather than compacting again.",
    });
  }

  // 5. Looping — retries re-send everything and produce nothing new.
  if (recentRetries >= 3) {
    signals.push({
      key: "looping",
      severity: "watch",
      detail: `${recentRetries} retries in the last few turns — a sign the agent is stuck repeating an approach.`,
      action: "/rewind to before the loop and change approach, or restate the goal with an explicit success check.",
    });
  }

  // 6. Output shrinkage — responses getting shorter can signal drift/lost focus.
  if (outputDecline >= 0.4) {
    signals.push({
      key: "output-shrink",
      severity: "watch",
      detail: `Responses are ~${Math.round(outputDecline * 100)}% shorter than earlier in the session — often a sign focus is slipping.`,
      action: "re-state the task and constraints in a fresh message, or /compact to clear the bloat.",
    });
  }

  signals.sort((a, b) => RANK[b.severity] - RANK[a.severity]);

  let status: HealthStatus;
  if (calls < 3) status = "fresh";
  else {
    const worst = signals.reduce((m, s) => Math.max(m, RANK[s.severity]), 0);
    if (worst === RANK.high) status = fill >= 0.9 || compactions >= 2 ? "critical" : "degrading";
    else if (worst === RANK.watch) status = "watch";
    else status = "healthy";
  }

  return {
    calls,
    durationMin,
    model,
    contextWindow,
    contextTokens,
    fill,
    cacheReadShare,
    compactions,
    recentRetries,
    status,
    signals,
  };
}

/** Analyze the most recent session in the ledger. */
export function sessionHealth(entries: LedgerEntry[], now: number): SessionHealth | undefined {
  const s = latestSession(entries);
  if (!s || s.length === 0) return undefined;
  return analyzeSession(s, now);
}
