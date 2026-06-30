/**
 * Renderers for the usage-awareness engine.
 *
 * Two surfaces: plain markdown blocks for the PR comment / `receipt show`, and
 * colorized terminal views for `receipt fuel`, `records`, `forecast`, and the
 * one-line `statusline`. All numbers come from src/usage.ts; nothing is faked.
 */
import pc from "picocolors";
import { money, progressBar, tokens } from "./util.js";
import type { PlanBudget, Receipt } from "./types.js";
import {
  capacity,
  efficiencyGrade,
  funEquivalences,
  inWorkUnits,
  records,
  taskImpact,
  voiceLine,
  whereItWent,
  type Fuel,
} from "./usage.js";
import { costDrivers, type Recommendation } from "./advice.js";
import { STATUS_RANK } from "./health.js";
import type {
  ContextTax,
  HealthStatus,
  PrHealth,
  SessionHealth,
  SessionSummary,
} from "./health.js";
import type { LedgerEntry } from "./types.js";

// ── small formatters ─────────────────────────────────────────────────────────

/** "2h14m" / "3d 4h" / "12m" from now to a target time. */
export function until(now: number, target: number): string {
  let s = Math.max(0, Math.round((target - now) / 1000));
  const d = Math.floor(s / 86400);
  s -= d * 86400;
  const h = Math.floor(s / 3600);
  s -= h * 3600;
  const m = Math.floor(s / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h${String(m).padStart(2, "0")}m`;
  return `${m}m`;
}

/** "Thu 3pm" style, local time. */
export function clockDate(ms: number): string {
  const d = new Date(ms);
  const day = d.toLocaleDateString(undefined, { weekday: "short" });
  let hr = d.getHours();
  const ampm = hr >= 12 ? "pm" : "am";
  hr = hr % 12 || 12;
  return `${day} ${hr}${ampm}`;
}

function dot(frac: number | undefined): string {
  if (frac === undefined) return "⚪";
  if (frac >= 1) return "🔴";
  if (frac >= 0.85) return "🟠";
  if (frac >= 0.6) return "🟡";
  return "🟢";
}

function sourceNote(b: PlanBudget | undefined): string {
  if (!b) return "";
  if (b.source === "observed") return "from live rate-limit headers";
  if (b.source === "calibrated") return "calibrated from a real limit you hit";
  if (b.source === "custom") return "your custom budget";
  return "estimated preset — run the proxy or `receipt calibrate` for real numbers";
}

function capacityPhrase(items: ReturnType<typeof capacity>): string {
  if (items.length === 0) return "not enough left for a full task";
  return items.map((i) => `~${i.count} ${i.label}`).join(" · ");
}

// ── markdown block for the PR comment / show ─────────────────────────────────

export interface UsageBlockExtras {
  topTip?: Recommendation;
  repoTokens?: number;
  fun?: boolean;
}

/**
 * The "% of you" block appended to the pull-request receipt. Only renders the
 * window-percentage lines when a budget is known; otherwise it leans on the
 * history-based framings, which always work.
 */
export function usageBlockMarkdown(receipt: Receipt, fuel: Fuel, extras: UsageBlockExtras = {}): string {
  if (receipt.totalTokens === 0) return "";
  const lines: string[] = [];
  lines.push("<details><summary>🔋 <b>Usage impact</b> — what this cost <i>you</i></summary>");
  lines.push("");

  const impact = taskImpact(receipt.totalTokens, fuel.budget);
  if (impact && fuel.budget) {
    lines.push(
      `This PR ate **${(impact.fiveHour * 100).toFixed(1)}%** of a 5-hour window ` +
        `and **${(impact.weekly * 100).toFixed(1)}%** of your weekly cap.`,
    );
    const left = capacityPhrase(fuel.capacityFiveHour);
    lines.push(`Right now you've got **${left}** left in this 5-hour window.`);
    lines.push("");
  }

  lines.push(`That's about **${inWorkUnits(receipt.totalTokens, fuel.sizes)}** in your own work.`);

  const grade = efficiencyGrade(receipt);
  lines.push(
    `Efficiency: **${grade.letter}** (${grade.score}/100) — ` +
      `${Math.round(grade.cacheHitRate * 100)}% served from cache, ` +
      `${receipt.retries} ${receipt.retries === 1 ? "retry" : "retries"}.`,
  );

  if (extras.topTip) {
    const t = extras.topTip;
    lines.push(
      `💡 **Biggest win:** ${t.title}${t.impact ? ` (${t.impact})` : ""}. ` +
        "Run `receipt advice` for the full list.",
    );
  }

  if (extras.fun) {
    const eq = funEquivalences(receipt.totalTokens, extras.repoTokens);
    if (eq.length) lines.push(`For scale: ${eq.slice(0, 2).join(", ")}.`);
  }

  if (fuel.budget) {
    lines.push("");
    lines.push(`<sub>window budget ${sourceNote(fuel.budget)}</sub>`);
  }
  lines.push("");
  lines.push("</details>");
  return lines.join("\n");
}

// ── terminal: the full fuel dashboard ────────────────────────────────────────

function gaugeLine(label: string, w: { used: number; budget?: number; frac?: number; resetAt: number }, now: number): string {
  if (w.budget && w.frac !== undefined) {
    const bar = progressBar(w.frac, 24);
    const color = w.frac >= 1 ? pc.red : w.frac >= 0.85 ? pc.yellow : w.frac >= 0.6 ? pc.yellow : pc.green;
    return (
      `${dot(w.frac)} ${pc.bold(label.padEnd(14))} ${color(bar)} ${pc.bold(`${Math.round(w.frac * 100)}%`)}  ` +
      pc.dim(`${tokens(w.used)} / ${tokens(w.budget)} · resets in ${until(now, w.resetAt)}`)
    );
  }
  return `${dot(undefined)} ${pc.bold(label.padEnd(14))} ${pc.dim(`${tokens(w.used)} used · resets in ${until(now, w.resetAt)} · no plan set`)}`;
}

export function renderFuel(fuel: Fuel, now: number, extras: { fun?: boolean; repoTokens?: number } = {}): string {
  const out: string[] = [];
  out.push("");
  out.push(pc.bold("🔋 Fuel — how much of you this is using"));
  out.push("");
  out.push(gaugeLine("5-hour window", fuel.fiveHour, now));
  out.push(gaugeLine("weekly cap", fuel.weekly, now));
  out.push("");

  if (fuel.budget) {
    out.push(pc.bold("You could still do"));
    out.push(`  5h: ${capacityPhrase(fuel.capacityFiveHour)}`);
    out.push(`  week: ${capacityPhrase(fuel.capacityWeekly)}`);
    out.push("");

    const p = fuel.pace;
    if (p.sustainablePerHour > 0) {
      const arrow = p.ratio > 1.25 ? pc.red(`↑ ${p.ratio.toFixed(1)}× too fast`) : p.ratio < 0.75 ? pc.green("↓ sustainable") : pc.yellow("≈ on pace");
      out.push(`Pace: ${arrow} ${pc.dim(`(${tokens(p.lastHour)}/hr vs ${tokens(p.sustainablePerHour)}/hr sustainable)`)}`);
    }
    if (p.runsDryAt && p.runwayDays !== undefined && p.runwayDays < 14) {
      out.push(pc.dim(`At today's burn, the weekly budget runs dry ~${clockDate(p.runsDryAt)}.`));
    }
    const vl = voiceLine(fuel.weekly.frac);
    if (vl) out.push(pc.italic(pc.dim(`“${vl}”`)));
    out.push("");
    out.push(pc.dim(`window budget ${sourceNote(fuel.budget)}`));
  } else {
    out.push(pc.dim("No plan set, so percentages are off. Set one to unlock the gauges:"));
    out.push(pc.dim("  receipt budget plan pro|max5x|max20x"));
    out.push(pc.dim("  …or run `receipt proxy` and it learns your real limit from the provider."));
    if (fuel.sizes.learned) {
      out.push("");
      out.push(pc.dim(`Your typical sizes: quick ${tokens(fuel.sizes.quick)} · PR ${tokens(fuel.sizes.pr)} · refactor ${tokens(fuel.sizes.refactor)} · feature ${tokens(fuel.sizes.feature)} tokens.`));
    }
  }
  out.push("");
  return out.join("\n");
}

// ── terminal: one-line statusline for Claude Code ────────────────────────────

/** Compact, plain (Claude Code colorizes its own statusline). */
export function renderStatusline(fuel: Fuel, now: number): string {
  const parts: string[] = [];
  if (fuel.fiveHour.frac !== undefined) {
    parts.push(`${dot(fuel.fiveHour.frac)} 5h ${Math.round(fuel.fiveHour.frac * 100)}%`);
  } else {
    parts.push(`5h ${tokens(fuel.fiveHour.used)}`);
  }
  if (fuel.weekly.frac !== undefined) parts.push(`wk ${Math.round(fuel.weekly.frac * 100)}%`);
  const p = fuel.pace;
  if (p.sustainablePerHour > 0 && p.ratio >= 1.25) parts.push(`↑${p.ratio.toFixed(1)}x`);
  if (fuel.budget && fuel.capacityFiveHour[0]) {
    parts.push(`~${fuel.capacityFiveHour[0].count} ${fuel.capacityFiveHour[0].label}`);
  }
  if (fuel.budget && fuel.fiveHour.frac !== undefined) {
    parts.push(`resets ${until(now, fuel.fiveHour.resetAt)}`);
  }
  return "🔋 " + parts.join(" · ");
}

// ── terminal: records ────────────────────────────────────────────────────────

export function renderRecords(entries: LedgerEntry[]): string {
  const r = records(entries);
  const out: string[] = [];
  out.push("");
  out.push(pc.bold("🏆 Your usage records"));
  out.push("");
  if (!r.priciest) {
    out.push(pc.dim("Not enough branch history yet. Keep working and check back."));
    out.push("");
    return out.join("\n");
  }
  out.push(`🥇 Heaviest task: ${pc.bold(r.priciest.key)} ${pc.dim(`(${tokens(r.priciest.tokens)} tokens)`)}`);
  if (r.leanest) out.push(`🪶 Leanest task:  ${pc.bold(r.leanest.key)} ${pc.dim(`(${tokens(r.leanest.tokens)} tokens)`)}`);
  if (r.latest && r.latestRank) {
    out.push(
      `📍 Most recent:  ${pc.bold(r.latest.key)} — #${r.latestRank} heaviest of ${r.priciest ? "all" : ""} your tasks`,
    );
  }
  if (r.streakUnderMedian > 0) {
    out.push(pc.green(`🔥 Streak: ${r.streakUnderMedian} task(s) in a row under your median. Tidy.`));
  }
  out.push("");
  return out.join("\n");
}

// ── terminal: forecast ───────────────────────────────────────────────────────

export function renderForecast(fuel: Fuel, now: number): string {
  const out: string[] = [];
  out.push("");
  out.push(pc.bold("🔮 Forecast"));
  out.push("");
  const typical = fuel.sizes.pr;
  out.push(`A typical task for you runs ~${tokens(typical)} tokens.`);
  if (fuel.budget) {
    const imp5 = (typical / fuel.budget.fiveHour) * 100;
    out.push(`That's ~${imp5.toFixed(1)}% of a 5-hour window each.`);
    const left = fuel.budget.fiveHour - fuel.fiveHour.used;
    const fits = Math.floor(Math.max(0, left) / typical);
    out.push(
      fits > 0
        ? pc.green(`You can fit ~${fits} more before this window resets in ${until(now, fuel.fiveHour.resetAt)}.`)
        : pc.yellow(`Not enough window left for another typical task; resets in ${until(now, fuel.fiveHour.resetAt)}.`),
    );
    if (fuel.pace.runsDryAt && fuel.pace.runwayDays !== undefined && fuel.pace.runwayDays < 14) {
      out.push(pc.dim(`Weekly runway at today's pace: ~${fuel.pace.runwayDays.toFixed(1)} days (dry ~${clockDate(fuel.pace.runsDryAt)}).`));
    }
  } else {
    out.push(pc.dim("Set a plan (`receipt budget plan …`) to forecast against your real window."));
  }
  out.push("");
  return out.join("\n");
}

// ── terminal: where it went + what-if (for `show`) ───────────────────────────

export function whereItWentText(receipt: Receipt): string {
  const c = whereItWent(receipt);
  const pctOf = (n: number) => `${Math.round(n * 100)}%`;
  return (
    `where it went: ${pctOf(c.output)} output · ${pctOf(c.freshInput)} fresh input · ` +
    `${pctOf(c.cacheRead)} cache reads · ${pctOf(c.cacheWrite)} cache writes`
  );
}

/** Compact usage summary appended to `receipt show`. */
export function usageSummaryText(
  receipt: Receipt,
  fuel: Fuel,
  extras: { topTip?: Recommendation; fun?: boolean; repoTokens?: number } = {},
): string {
  if (receipt.totalTokens === 0) return "";
  const out: string[] = [];
  const impact = taskImpact(receipt.totalTokens, fuel.budget);
  const grade = efficiencyGrade(receipt);
  const head: string[] = [];
  if (impact && fuel.budget) {
    head.push(`${(impact.fiveHour * 100).toFixed(1)}% of 5h · ${(impact.weekly * 100).toFixed(1)}% of week`);
  }
  head.push(`≈ ${inWorkUnits(receipt.totalTokens, fuel.sizes)}`);
  head.push(`grade ${grade.letter} (${grade.score}/100)`);
  out.push(pc.bold("🔋 ") + head.join(pc.dim(" · ")));
  out.push(pc.dim("   " + whereItWentText(receipt)));
  if (impact && fuel.budget) {
    out.push(pc.dim(`   ${capacityPhrase(fuel.capacityFiveHour)} left in this 5h window`));
  }
  if (extras.topTip) {
    out.push(pc.dim(`   💡 ${extras.topTip.title}${extras.topTip.impact ? ` (${extras.topTip.impact})` : ""}`));
  }
  if (extras.fun) {
    const eq = funEquivalences(receipt.totalTokens, extras.repoTokens);
    if (eq.length) out.push(pc.dim("   = " + eq.slice(0, 2).join(", ")));
  }
  return out.join("\n");
}

// ── terminal: advice ─────────────────────────────────────────────────────────

const SEV_MARK: Record<string, (s: string) => string> = {
  high: (s) => pc.red("‼ " + s),
  medium: (s) => pc.yellow("⚠ " + s),
  low: (s) => pc.dim("· " + s),
};

/** Word-wrap a paragraph to a width with a hanging indent. */
function wrap(text: string, width: number, indent: string): string {
  const words = text.split(/\s+/);
  const lines: string[] = [];
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

// ── terminal: session health ─────────────────────────────────────────────────

const STATUS_BADGE: Record<HealthStatus, string> = {
  fresh: "🟢 Fresh",
  healthy: "🟢 Healthy",
  watch: "🟡 Watch",
  degrading: "🟠 Degrading",
  critical: "🔴 Critical",
};

function sigMark(sev: "ok" | "watch" | "high"): (s: string) => string {
  if (sev === "high") return (s) => pc.red("🔴 " + s);
  if (sev === "watch") return (s) => pc.yellow("🟡 " + s);
  return (s) => pc.dim("· " + s);
}

export function renderHealth(
  h: SessionHealth | undefined,
  tax?: ContextTax,
  currency = "USD",
): string {
  const out: string[] = [];
  out.push("");
  out.push(pc.bold("🧠 Session health — keeping the agent sharp"));
  out.push("");
  if (!h) {
    out.push(pc.dim("No recent session in the ledger yet. Run your agent (or import it), then check back."));
    out.push("");
    return out.join("\n");
  }
  const head =
    `${STATUS_BADGE[h.status]}  ` +
    pc.dim(
      `context ${Math.round(h.fill * 100)}% full (${Math.round(h.contextTokens / 1000)}k/${Math.round(h.contextWindow / 1000)}k) · ` +
        `${h.calls} turns · ${Math.round(h.durationMin)} min · ${Math.round(h.cacheReadShare * 100)}% cache reuse`,
    );
  out.push(head);
  out.push("");

  if (h.signals.length === 0) {
    out.push(pc.green("  Looking sharp. Nothing to refresh yet."));
  } else {
    for (const s of h.signals) {
      out.push("  " + sigMark(s.severity)(s.detail));
      out.push(pc.cyan("     → " + s.action));
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
    pc.dim(
      "Why act early: usable context is only ~50–65% of the window (RULER), and recall sags past ~50% fill. " +
        "Compacting before the wall keeps quality high — it doesn't make the agent do less.",
    ),
  );
  out.push("");
  return out.join("\n");
}

/** Compact health fragment for the statusline / fuel. */
export function healthOneLine(h: SessionHealth | undefined): string {
  if (!h) return "";
  const dot = h.status === "critical" ? "🔴" : h.status === "degrading" ? "🟠" : h.status === "watch" ? "🟡" : "🟢";
  const parts = [`${dot} ctx ${Math.round(h.fill * 100)}%`, `${h.calls} turns`];
  const top = h.signals[0];
  if (top && top.severity !== "ok") parts.push(top.key.replace(/-/g, " "));
  return "🧠 " + parts.join(" · ");
}

/**
 * One imperative line for a Claude Code hook (`receipt guard`): the status plus
 * the single most important move. Short enough to read at a glance mid-task.
 */
export function guardLine(h: SessionHealth): string {
  const top = h.signals[0];
  const pctFull = Math.round(h.fill * 100);
  const head = `receipt: session ${h.status} (ctx ~${pctFull}%, ${h.calls} turns)`;
  return top ? `${head} — ${top.action}` : head;
}

/** The "context tax" block: how much of a session is just re-sending itself. */
export function renderContextTax(t: ContextTax, currency = "USD"): string {
  if (t.totalTokens === 0) return "";
  const out: string[] = [];
  const sharePct = Math.round(t.resentShare * 100);
  const tag = sharePct >= 70 ? "🟠" : sharePct >= 50 ? "🟡" : "🟢";
  out.push("  " + pc.bold(`📦 Re-sent context: ${tag} ${sharePct}% of this session's tokens`));
  out.push(
    pc.dim(
      `     ${tokens(t.resentTokens)} of ${tokens(t.totalTokens)} were prior context carried ` +
        `forward; ${tokens(t.newTokens)} (${Math.round((t.newTokens / t.totalTokens) * 100)}%) was new work.`,
    ),
  );
  if (t.resentCostUsd !== null && t.newCostUsd !== null) {
    const costPct = t.resentCostShare !== null ? Math.round(t.resentCostShare * 100) : 0;
    out.push(
      pc.dim(
        `     Caching kept the cost of that re-send to ${money(t.resentCostUsd, currency)} ` +
          `of ${money(t.resentCostUsd + t.newCostUsd, currency)} (${costPct}%).`,
      ),
    );
  }
  if (sharePct >= 50) {
    out.push(
      pc.cyan(
        "     → A long session mostly re-reads itself. A fresh session is cheaper and sharper.",
      ),
    );
  }
  return out.join("\n");
}

const STATUS_DOT: Record<HealthStatus, string> = {
  fresh: "🟢",
  healthy: "🟢",
  watch: "🟡",
  degrading: "🟠",
  critical: "🔴",
};

/**
 * The retrospective health block for the pull-request comment. Collapsed, and
 * SILENT by default unless a session reached "watch" or worse — it speaks to the
 * reviewer ("look carefully here"), never scolds the author. With `always` it
 * emits a single green reassurance line instead.
 */
export function healthBlockMarkdown(
  ph: PrHealth | undefined,
  opts: { always?: boolean; currency?: string } = {},
): string {
  if (!ph) return "";
  const worthIt = STATUS_RANK[ph.worst] >= STATUS_RANK.watch;
  if (!worthIt) {
    if (!opts.always) return "";
    return (
      `🧠 Session health — all ${ph.sessions} session${ph.sessions === 1 ? "" : "s"} stayed healthy ` +
      `(peaked ~${Math.round(ph.peakFill * 100)}% context).`
    );
  }

  const flagged = ph.analyzed.filter((h) => STATUS_RANK[h.status] >= STATUS_RANK.watch).length;
  const peakK = Math.round(ph.peakContextTokens / 1000);
  const winK = Math.round(ph.peakWindow / 1000);
  const lines: string[] = [];
  lines.push("<details>");
  lines.push(
    `<summary>🧠 Session health — ${flagged} of ${ph.sessions} session${ph.sessions === 1 ? "" : "s"} ` +
      `was ${ph.worst}</summary>`,
  );
  lines.push("");
  lines.push(
    `This PR's AI work spanned **${ph.sessions} session${ph.sessions === 1 ? "" : "s"}**. The longest ran ` +
      `**${ph.longestTurns} turns / ${Math.round(ph.longestMin)} min**, and context peaked at ` +
      `**~${Math.round(ph.peakFill * 100)}% full (${peakK}k/${winK}k)**` +
      (ph.totalCompactions > 0 ? ` with **~${ph.totalCompactions} auto-compaction${ph.totalCompactions === 1 ? "" : "s"}**` : "") +
      `. Long, compacted sessions drift — early decisions fade and summaries drop precise detail — so these ` +
      `changes are **worth a careful review** for consistency and correctness. Nothing here says the code is ` +
      `wrong; it's a pointer to where to look.`,
  );
  lines.push("");
  for (const s of ph.topSignals) {
    const dotMark = s.severity === "high" ? "🔴" : s.severity === "watch" ? "🟡" : "·";
    lines.push(`- ${dotMark} ${s.detail}`);
  }
  lines.push("");
  lines.push(
    "<sub>Measured from token counts only — no prompts or code were read. Usable context is ~50–65% of " +
      "the window (RULER); recall sags past ~50% fill.</sub>",
  );
  lines.push("</details>");
  return lines.join("\n");
}

/** Terminal table of how past sessions held up, newest first, plus a profile footer. */
export function renderHealthHistory(
  rows: SessionSummary[],
  limit = 12,
  profile?: Parameters<typeof degradationProfileLine>[0],
): string {
  const out: string[] = [];
  out.push("");
  out.push(pc.bold("🧠 Session history — how your sessions have held up"));
  out.push("");
  if (rows.length === 0) {
    out.push(pc.dim("No sessions in the ledger yet. Run your agent (or import it), then check back."));
    out.push("");
    return out.join("\n");
  }
  const shown = rows.slice(-limit).reverse();
  out.push(pc.dim("  #    when             turns   peak ctx   ~compact   verdict"));
  for (const r of shown) {
    const h = r.health;
    const when = clockDate(r.startTs).padEnd(14);
    const turns = String(h.calls).padStart(4);
    const peak = `${Math.round(h.peakFill * 100)}%`.padStart(5);
    const peakDot = STATUS_DOT[h.status];
    const comp = String(h.compactions).padStart(4);
    const verdict = r.compactedLate
      ? pc.yellow("compacted late")
      : h.status === "fresh"
        ? pc.dim("fresh-ish")
        : h.status === "healthy"
          ? pc.green("healthy")
          : pc.yellow(h.status);
    out.push(
      `  ${String(r.index).padStart(3)}  ${when}  ${turns}    ${peak} ${peakDot}     ${comp}     ${verdict}`,
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

/** One-line personal-pattern footer for `receipt health --all` and `wrapped`. */
export function degradationProfileLine(p: {
  sessionsAnalyzed: number;
  degradedCount: number;
  medianTurnsToOnset?: number;
  medianTokensToOnset?: number;
  lateCompactionRate?: number;
}): string {
  if (p.sessionsAnalyzed === 0) return "";
  const parts: string[] = [];
  if (p.medianTurnsToOnset !== undefined) {
    const tok =
      p.medianTokensToOnset !== undefined ? ` (~${Math.round(p.medianTokensToOnset / 1000)}k ctx tokens)` : "";
    parts.push(`You tend to drift around turn ~${p.medianTurnsToOnset}${tok}.`);
  }
  if (p.lateCompactionRate !== undefined && p.lateCompactionRate > 0) {
    parts.push(
      `${Math.round(p.lateCompactionRate * 100)}% of your sessions that crossed 80% full compacted ` +
        `*after* the fact — try /compact at 60%.`,
    );
  }
  return parts.length ? pc.dim("  " + parts.join("  ")) : "";
}

export function renderAdvice(receipt: Receipt, recs: Recommendation[]): string {
  const out: string[] = [];
  out.push("");
  out.push(pc.bold("💡 Advice — cut the waste, keep the quality"));
  out.push("");
  if (receipt.totalTokens === 0) {
    out.push(pc.dim("No usage recorded for this scope yet. Run your agent, then check back."));
    out.push("");
    return out.join("\n");
  }
  const drivers = costDrivers(receipt);
  if (drivers.length) {
    out.push(pc.bold("What's driving the cost"));
    for (const d of drivers) out.push("  • " + d.replace(/`/g, ""));
    out.push("");
  }
  out.push(pc.bold("Recommendations"));
  for (const r of recs) {
    const mark = SEV_MARK[r.severity] ?? ((s: string) => s);
    out.push("  " + mark(r.title) + (r.impact ? pc.green(`   ${r.impact}`) : ""));
    out.push(pc.dim(wrap(r.detail.replace(/`/g, ""), 78, "     ")));
    out.push("");
  }
  return out.join("\n");
}
