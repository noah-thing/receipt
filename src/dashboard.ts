import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { readLedger } from "./ledger.js";
import { ledgerPath } from "./ledger.js";
import { loadConfig } from "./config.js";
import type { LedgerEntry, ReceiptConfig } from "./types.js";

export interface DashboardData {
  generatedAt: string;
  currency: string;
  budget?: ReceiptConfig["budget"];
  totals: { cost: number; tokens: number; calls: number; firstTs?: string; lastTs?: string };
  daily: Array<{ date: string; cost: number; tokens: number; calls: number }>;
  byModel: Array<{ model: string; provider: string; cost: number; tokens: number; calls: number }>;
  byBranch: Array<{ branch: string; cost: number; calls: number }>;
  byProvider: Array<{ provider: string; cost: number }>;
  topCalls: Array<{ ts: string; model: string; cost: number; tokens: number; branch?: string }>;
}

const totalTokens = (e: LedgerEntry) =>
  e.inputTokens + e.outputTokens + e.cacheReadTokens + e.cacheWrite5mTokens + e.cacheWrite1hTokens;

export function buildDashboardData(entries: LedgerEntry[], config: ReceiptConfig = {}): DashboardData {
  const daily = new Map<string, { cost: number; tokens: number; calls: number }>();
  const byModel = new Map<string, { provider: string; cost: number; tokens: number; calls: number }>();
  const byBranch = new Map<string, { cost: number; calls: number }>();
  const byProvider = new Map<string, number>();

  let cost = 0;
  let tokens = 0;
  let first: string | undefined;
  let last: string | undefined;

  for (const e of entries) {
    const c = e.costUsd ?? 0;
    const tk = totalTokens(e);
    cost += c;
    tokens += tk;
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
    generatedAt: new Date().toISOString(),
    currency: config.currency ?? "USD",
    budget: config.budget,
    totals: { cost, tokens, calls: entries.length, firstTs: first, lastTs: last },
    daily: [...daily.entries()]
      .map(([date, v]) => ({ date, ...v }))
      .sort((a, b) => a.date.localeCompare(b.date)),
    byModel: [...byModel.entries()]
      .map(([model, v]) => ({ model, ...v }))
      .sort((a, b) => b.cost - a.cost),
    byBranch: [...byBranch.entries()]
      .map(([branch, v]) => ({ branch, ...v }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 20),
    byProvider: [...byProvider.entries()]
      .map(([provider, cost]) => ({ provider, cost }))
      .sort((a, b) => b.cost - a.cost),
    topCalls: [...entries]
      .filter((e) => e.costUsd !== null)
      .sort((a, b) => (b.costUsd ?? 0) - (a.costUsd ?? 0))
      .slice(0, 12)
      .map((e) => ({
        ts: e.ts,
        model: e.model,
        cost: e.costUsd ?? 0,
        tokens: totalTokens(e),
        branch: e.git?.branch,
      })),
  };
}

function templatePath(): string {
  // dist/ sits next to dashboard/ once published; src/ resolves the same way in dev.
  const here = dirname(fileURLToPath(import.meta.url));
  for (const candidate of [
    join(here, "..", "dashboard", "template.html"),
    join(here, "dashboard", "template.html"),
  ]) {
    try {
      readFileSync(candidate);
      return candidate;
    } catch {
      /* try next */
    }
  }
  throw new Error("Could not locate dashboard/template.html");
}

export function renderDashboardHtml(data: DashboardData): string {
  const tpl = readFileSync(templatePath(), "utf8");
  return tpl.replace("/*__RECEIPT_DATA__*/", `window.__RECEIPT__ = ${JSON.stringify(data)};`);
}

export function serveDashboard(
  repoRoot: string,
  port: number,
): Promise<{ url: string; close: () => void }> {
  const entries = readLedger(ledgerPath(repoRoot));
  const data = buildDashboardData(entries, loadConfig(repoRoot));
  const html = renderDashboardHtml(data);

  return new Promise((resolve) => {
    const server = createServer((_req, res) => {
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      res.end(html);
    });
    server.listen(port, () => {
      resolve({ url: `http://localhost:${port}`, close: () => server.close() });
    });
  });
}
