#!/usr/bin/env node
import { writeFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { Command } from "commander";
import pc from "picocolors";
import { Pricing } from "./pricing.js";
import { findRepoRoot } from "./git.js";
import { append, knownRequestIds, ledgerPath, readLedger } from "./ledger.js";
import { loadConfig, saveConfig } from "./config.js";
import { buildReceipt, selectEntries } from "./receipt.js";
import { renderMarkdown, renderText } from "./render.js";
import { resolveContext, rangeFor } from "./context.js";
import { importClaudeCode } from "./importers/claude-code.js";
import { importGeneric } from "./importers/generic.js";
import { startProxy } from "./proxy.js";
import { buildDashboardData, serveDashboard } from "./dashboard.js";
import { findPrForBranch, postReceipt } from "./github.js";
import { money, tokens } from "./util.js";
import {
  fuel,
  resolveBudget,
  writeObservedBudget,
  windowState,
  whatIf,
  estimateRepoTokens,
  PLAN_PRESETS,
  FIVE_HOURS_MS,
  WEEK_MS,
} from "./usage.js";
import {
  renderFuel,
  renderRecords,
  renderForecast,
  renderStatusline,
  usageBlockMarkdown,
  usageSummaryText,
} from "./usage-render.js";
import type { LedgerEntry, PlanBudget, PlanId } from "./types.js";

const program = new Command();

program
  .name("receipt")
  .description("See exactly what your AI coding agent cost — itemized on every pull request.")
  .version("0.2.0");

function repoRoot(): string {
  return findRepoRoot();
}

function fail(message: string): never {
  process.stderr.write(pc.red("✗ ") + message + "\n");
  process.exit(1);
}

// ── proxy ──────────────────────────────────────────────────────────────────
program
  .command("proxy")
  .description("Run a logging proxy. Point ANTHROPIC_BASE_URL / OPENAI_BASE_URL at it.")
  .option("-p, --port <port>", "port to listen on", "8787")
  .option("--anthropic-url <url>", "upstream Anthropic API", "https://api.anthropic.com")
  .option("--openai-url <url>", "upstream OpenAI API", "https://api.openai.com")
  .option("-q, --quiet", "do not print a line per call")
  .action(async (opts) => {
    const root = repoRoot();
    const pricing = Pricing.load(root);
    const port = Number(opts.port);
    const { close } = await startProxy({
      port,
      repoRoot: root,
      pricing,
      anthropicUrl: opts.anthropicUrl,
      openaiUrl: opts.openaiUrl,
      quiet: Boolean(opts.quiet),
    });
    process.stderr.write(
      pc.green("● ") +
        `receipt proxy on ${pc.bold(`http://localhost:${port}`)}\n` +
        pc.dim(`  export ANTHROPIC_BASE_URL=http://localhost:${port}\n`) +
        pc.dim(`  export OPENAI_BASE_URL=http://localhost:${port}/v1\n`) +
        pc.dim(`  logging to ${ledgerPath(root)}\n`),
    );
    const shutdown = () => {
      close();
      process.exit(0);
    };
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  });

// ── import ─────────────────────────────────────────────────────────────────
const importCmd = program.command("import").description("Pull usage into the ledger from a tool's own logs.");

importCmd
  .command("claude-code")
  .alias("claude")
  .description("Import token usage from Claude Code session logs.")
  .option("--all", "import every repo, not just this one")
  .option("--branch <branch>", "only this branch")
  .option("--since <iso>", "only calls at or after this time")
  .option("--dir <path>", "Claude projects dir (default ~/.claude/projects)")
  .action(async (opts) => {
    const root = repoRoot();
    const pricing = Pricing.load(root);
    const seen = knownRequestIds(ledgerPath(root));
    const entries = await importClaudeCode({
      pricing,
      repoRoot: root,
      all: Boolean(opts.all),
      branch: opts.branch,
      sinceTs: opts.since,
      dir: opts.dir,
      seen,
    });
    writeEntries(root, entries, "claude-code");
  });

importCmd
  .command("generic <file>")
  .description("Import a JSON/JSONL file of usage rows (OpenAI- or Anthropic-shaped).")
  .option("--source <name>", "label the source", "generic")
  .action((file, opts) => {
    const root = repoRoot();
    const pricing = Pricing.load(root);
    const seen = knownRequestIds(ledgerPath(root));
    const all = importGeneric(file, pricing, { source: opts.source });
    const entries = all.filter((e) => !e.requestId || !seen.has(e.requestId));
    writeEntries(root, entries, "generic");
  });

function writeEntries(root: string, entries: LedgerEntry[], source: string): void {
  if (entries.length === 0) {
    process.stderr.write(pc.dim(`Nothing new to import from ${source}.\n`));
    return;
  }
  for (const e of entries) append(root, e);
  const total = entries.reduce((s, e) => s + (e.costUsd ?? 0), 0);
  process.stderr.write(
    pc.green("✓ ") + `imported ${pc.bold(String(entries.length))} calls from ${source} · ${money(total)}\n`,
  );
}

// ── show ───────────────────────────────────────────────────────────────────
program
  .command("show")
  .description("Print the receipt for the current branch to the terminal.")
  .option("--branch <branch>", "branch to scope to (default: current)")
  .option("--base <base>", "base branch to diff against", "main")
  .option("--all", "every entry in the ledger, ignoring branch")
  .option("--today", "only today's calls")
  .option("--fun", "include playful real-world equivalences")
  .option("--json", "machine-readable output")
  .action((opts) => {
    const root = repoRoot();
    const config = loadConfig(root);
    const receipt = computeReceipt(root, {
      branch: opts.all ? undefined : opts.branch,
      base: opts.base,
      allEntries: Boolean(opts.all),
      today: Boolean(opts.today),
    });
    if (opts.json) {
      process.stdout.write(JSON.stringify(receipt, null, 2) + "\n");
      return;
    }
    let out = "\n" + colorizeText(renderText(receipt), config) + "\n";
    // The usage block: what this branch cost *you*, against your plan window.
    const allEntries = readLedger(ledgerPath(root));
    const f = fuel(allEntries, resolveBudget(config, root), Date.now());
    const fun = Boolean(opts.fun) || config.fun === true;
    const summary = usageSummaryText(receipt, f, {
      whatIf: whatIf(receipt, Pricing.load(root)),
      fun,
      repoTokens: fun ? estimateRepoTokens(root) : undefined,
    });
    if (summary) out += "\n" + summary + "\n";
    process.stdout.write(out + "\n");
  });

// ── pr (render markdown) ─────────────────────────────────────────────────────
program
  .command("pr")
  .description("Render the pull-request receipt as markdown (prints to stdout).")
  .option("--branch <branch>", "branch to scope to (default: current)")
  .option("--base <base>", "base branch to diff against", "main")
  .option("--out <file>", "write to a file instead of stdout")
  .action((opts) => {
    const root = repoRoot();
    const md = renderPrMarkdown(root, opts.branch, opts.base);
    if (opts.out) {
      writeFileSync(opts.out, md, "utf8");
      process.stderr.write(pc.green("✓ ") + `wrote ${opts.out}\n`);
    } else {
      process.stdout.write(md + "\n");
    }
  });

// ── post (upsert PR comment) ─────────────────────────────────────────────────
program
  .command("post")
  .description("Post or update the receipt as a sticky comment on the pull request.")
  .option("--repo <owner/name>", "target repository")
  .option("--pr <number>", "pull request number")
  .option("--branch <branch>", "branch to scope to (default: current)")
  .option("--base <base>", "base branch", "main")
  .option("--token <token>", "GitHub token (else GITHUB_TOKEN / GH_TOKEN)")
  .option("--dry-run", "print the comment instead of posting")
  .action(async (opts) => {
    const root = repoRoot();
    const ctx = resolveContext(root, opts);
    const md = renderPrMarkdown(root, ctx.branch, ctx.base);

    if (opts.dryRun) {
      process.stdout.write(md + "\n");
      return;
    }
    if (!ctx.repo) fail("No repository. Pass --repo owner/name or set a git remote.");
    if (!ctx.token) fail("No token. Pass --token or set GITHUB_TOKEN / GH_TOKEN.");

    let pr = ctx.pr;
    if (!pr && ctx.branch) {
      pr = await findPrForBranch({ repo: ctx.repo, token: ctx.token }, ctx.branch);
    }
    if (!pr) fail("No open pull request found. Pass --pr <number>.");

    const result = await postReceipt({ repo: ctx.repo, token: ctx.token }, pr, md);
    process.stderr.write(pc.green("✓ ") + `${result.action} receipt on ${ctx.repo}#${pr}\n  ${result.url}\n`);
  });

// ── dashboard ────────────────────────────────────────────────────────────────
program
  .command("dashboard")
  .description("Serve a local dashboard of all recorded spend.")
  .option("-p, --port <port>", "port", "4123")
  .option("--no-open", "do not open a browser")
  .action(async (opts) => {
    const root = repoRoot();
    const { url } = await serveDashboard(root, Number(opts.port));
    process.stderr.write(pc.green("● ") + `dashboard on ${pc.bold(url)} ${pc.dim("(ctrl-c to stop)")}\n`);
    if (opts.open !== false) openBrowser(url);
  });

// ── wrapped ──────────────────────────────────────────────────────────────────
program
  .command("wrapped")
  .description("A shareable summary of recent AI spend.")
  .option("--days <n>", "look-back window in days", "30")
  .action((opts) => {
    const root = repoRoot();
    const config = loadConfig(root);
    const days = Number(opts.days);
    const since = Date.now() - days * 86_400_000;
    const entries = readLedger(ledgerPath(root)).filter((e) => new Date(e.ts).getTime() >= since);
    const data = buildDashboardData(entries, config);
    const top = data.byModel[0];
    const share = data.byModel.length
      ? Math.round(((top?.cost ?? 0) / (data.totals.cost || 1)) * 100)
      : 0;
    const lines = [
      "",
      pc.bold(`🧾 Receipt — last ${days} days`),
      "",
      `  ${pc.bold(money(data.totals.cost))} across ${data.totals.calls} calls and ${data.byBranch.length} branches`,
      `  ${tokens(data.totals.tokens)} tokens`,
      top ? `  ${top.model} did the heavy lifting (${share}% of spend)` : "",
      data.topCalls[0]
        ? `  priciest single call: ${money(data.topCalls[0].cost)} (${data.topCalls[0].model})`
        : "",
      "",
    ].filter(Boolean);
    process.stdout.write(lines.join("\n") + "\n");
  });

// ── budget ───────────────────────────────────────────────────────────────────
const budgetCmd = program.command("budget").description("Set or show spend ceilings.");
budgetCmd
  .command("set <scope> <amount>")
  .description("Set a budget. scope is 'pr' or 'day'; amount is in USD.")
  .action((scope: string, amount: string) => {
    const root = repoRoot();
    const config = loadConfig(root);
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) fail("Amount must be a positive number.");
    config.budget ??= {};
    if (scope === "pr") config.budget.perPr = value;
    else if (scope === "day") config.budget.perDay = value;
    else fail("Scope must be 'pr' or 'day'.");
    saveConfig(root, config);
    process.stderr.write(pc.green("✓ ") + `budget per ${scope} set to ${money(value)}\n`);
  });
budgetCmd
  .command("plan <id>")
  .description("Set your subscription tier for usage-window math: pro, max5x, or max20x.")
  .action((id: string) => {
    const root = repoRoot();
    if (!(id in PLAN_PRESETS)) fail("Plan must be one of: pro, max5x, max20x.");
    const config = loadConfig(root);
    config.plan = id as PlanId;
    saveConfig(root, config);
    const p = PLAN_PRESETS[id as Exclude<PlanId, "custom">];
    process.stderr.write(
      pc.green("✓ ") +
        `plan set to ${pc.bold(id)} ` +
        pc.dim(`(~${tokens(p.fiveHour)} per 5h, ~${tokens(p.weekly)} per week — estimates; calibrate for real numbers)\n`),
    );
  });
budgetCmd.action(() => {
  const root = repoRoot();
  const config = loadConfig(root);
  const b = config.budget ?? {};
  const wb = resolveBudget(config, root);
  process.stdout.write(
    `per PR:  ${b.perPr ? money(b.perPr) : "—"}\n` +
      `per day: ${b.perDay ? money(b.perDay) : "—"}\n` +
      `plan:    ${config.plan ?? "—"}\n` +
      `window:  ${wb ? `~${tokens(wb.fiveHour)} / 5h · ~${tokens(wb.weekly)} / week (${wb.source})` : "— (set one with `receipt budget plan …`)"}\n`,
  );
});

// ── fuel (current usage state) ───────────────────────────────────────────────
program
  .command("fuel")
  .description("How much of your plan you're using right now, and what's left.")
  .option("--fun", "include playful real-world equivalences")
  .action((opts) => {
    const root = repoRoot();
    const config = loadConfig(root);
    const entries = readLedger(ledgerPath(root));
    const now = Date.now();
    const f = fuel(entries, resolveBudget(config, root), now);
    const fun = Boolean(opts.fun) || config.fun === true;
    process.stdout.write(renderFuel(f, now, { fun, repoTokens: fun ? estimateRepoTokens(root) : undefined }));
  });

// ── records ──────────────────────────────────────────────────────────────────
program
  .command("records")
  .description("Your heaviest, leanest, and most recent tasks, ranked.")
  .action(() => {
    const root = repoRoot();
    process.stdout.write(renderRecords(readLedger(ledgerPath(root))));
  });

// ── forecast ─────────────────────────────────────────────────────────────────
program
  .command("forecast")
  .description("Predict a typical task's impact and your weekly runway.")
  .action(() => {
    const root = repoRoot();
    const config = loadConfig(root);
    const now = Date.now();
    const f = fuel(readLedger(ledgerPath(root)), resolveBudget(config, root), now);
    process.stdout.write(renderForecast(f, now));
  });

// ── statusline (for Claude Code) ─────────────────────────────────────────────
program
  .command("statusline")
  .description("One-line usage gauge, designed for the Claude Code statusline.")
  .action(() => {
    const root = repoRoot();
    const config = loadConfig(root);
    const now = Date.now();
    const f = fuel(readLedger(ledgerPath(root)), resolveBudget(config, root), now);
    process.stdout.write(renderStatusline(f, now) + "\n");
  });

// ── calibrate (set a real window budget) ─────────────────────────────────────
program
  .command("calibrate")
  .description("Set your real window budget from a limit you just hit.")
  .argument("[tokens]", "tokens used at the wall; omit to use the current window's usage")
  .option("--window <w>", "which window you hit: 5h or week", "5h")
  .action((tokArg: string | undefined, opts: { window: string }) => {
    const root = repoRoot();
    const entries = readLedger(ledgerPath(root));
    const now = Date.now();
    const isWeek = String(opts.window).toLowerCase().startsWith("w");
    const current = isWeek
      ? windowState(entries, WEEK_MS, now).used
      : windowState(entries, FIVE_HOURS_MS, now).used;
    const used = tokArg ? Number(tokArg) : current;
    if (!Number.isFinite(used) || used <= 0) {
      fail("Give a positive token count, or run the proxy/importer first so there's usage to read.");
    }
    const budget: PlanBudget = isWeek
      ? { fiveHour: Math.round(used / 5), weekly: Math.round(used), source: "calibrated" }
      : { fiveHour: Math.round(used), weekly: Math.round(used * 5), source: "calibrated" };
    writeObservedBudget(root, budget);
    process.stderr.write(
      pc.green("✓ ") +
        `calibrated from your ${isWeek ? "weekly" : "5-hour"} wall: ` +
        pc.bold(`~${tokens(budget.fiveHour)} / 5h · ~${tokens(budget.weekly)} / week\n`),
    );
  });

// ── helpers ──────────────────────────────────────────────────────────────────
function computeReceipt(
  root: string,
  o: { branch?: string; base: string; allEntries: boolean; today: boolean },
) {
  const config = loadConfig(root);
  const pricing = Pricing.load(root); // ensures override parses; surfaces errors early
  void pricing;
  const entries = readLedger(ledgerPath(root));
  const currency = config.currency ?? "USD";

  if (o.allEntries) {
    return buildReceipt(entries, { currency });
  }

  let sinceTs: string | undefined;
  let shas: Set<string> | undefined;
  if (o.today) {
    sinceTs = new Date(new Date().toDateString()).toISOString();
  } else {
    const r = rangeFor(root, o.base, o.branch);
    shas = r.shas;
    sinceTs = r.sinceTs;
  }
  const selected = selectEntries(entries, { branch: o.branch, sinceTs, rangeShas: shas, currency });
  return buildReceipt(selected, { branch: o.branch, base: o.base, currency });
}

function renderPrMarkdown(root: string, branch: string | undefined, base: string): string {
  const config = loadConfig(root);
  const currency = config.currency ?? "USD";
  const entries = readLedger(ledgerPath(root));
  const b = branch;
  const { shas, sinceTs } = rangeFor(root, base, b);
  const selected = selectEntries(entries, { branch: b, rangeShas: shas, sinceTs, currency });
  const receipt = buildReceipt(selected, { branch: b, base, currency });
  const pricing = Pricing.load(root);
  let md = renderMarkdown(receipt, {
    budget: config.budget,
    series: selected.map((e) => ({ ts: e.ts, cost: e.costUsd ?? 0 })),
    priceUpdated: pricing.updated(),
  });
  // Append the usage-impact block: what this PR cost *you* against your plan.
  const f = fuel(entries, resolveBudget(config, root), Date.now());
  const fun = config.fun === true;
  const block = usageBlockMarkdown(receipt, f, {
    whatIf: whatIf(receipt, pricing),
    fun,
    repoTokens: fun ? estimateRepoTokens(root) : undefined,
  });
  if (block) md += "\n\n" + block;
  return md;
}

function colorizeText(text: string, _config: ReturnType<typeof loadConfig>): string {
  return text
    .split("\n")
    .map((line, i) => (i === 0 ? pc.bold(line) : i === 1 ? pc.green(line) : line))
    .join("\n");
}

function openBrowser(url: string): void {
  const cmd = process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";
  try {
    spawn(cmd, [url], { stdio: "ignore", detached: true }).unref();
  } catch {
    /* best effort */
  }
}

program.parseAsync(process.argv).catch((err) => fail((err as Error).message));
