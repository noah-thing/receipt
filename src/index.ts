/**
 * Receipt — programmatic API.
 *
 * The CLI is the product; these exports let you build on the same pieces: the
 * price book, the append-only ledger, the receipt aggregation, and the
 * markdown renderer that produces the pull-request comment.
 */
export { Pricing, providerOf } from "./pricing.js";
export { append, appendMany, readLedger, ledgerPath, knownRequestIds } from "./ledger.js";
export { buildReceipt, selectEntries } from "./receipt.js";
export { renderMarkdown, renderText, COMMENT_MARKER } from "./render.js";
export { buildDashboardData } from "./dashboard.js";
export { importGeneric } from "./importers/generic.js";
export { importClaudeCode } from "./importers/claude-code.js";
export {
  fuel,
  windowState,
  taskSizes,
  taskRollups,
  personalStats,
  paceState,
  capacity,
  inWorkUnits,
  efficiencyGrade,
  whereItWent,
  whatIf,
  records,
  funEquivalences,
  voiceLine,
  taskImpact,
  resolveBudget,
  presetFor,
  readObservedBudget,
  writeObservedBudget,
  captureLimits,
  estimateRepoTokens,
  quantile,
  entryTokens,
  PLAN_PRESETS,
  FIVE_HOURS_MS,
  WEEK_MS,
} from "./usage.js";
export {
  renderFuel,
  renderStatusline,
  renderRecords,
  renderForecast,
  renderAdvice,
  usageBlockMarkdown,
  usageSummaryText,
} from "./usage-render.js";
export { recommend, costDrivers, topRecommendation } from "./advice.js";
export type { Recommendation, Severity } from "./advice.js";
export {
  sessionHealth,
  analyzeSession,
  sessionize,
  latestSession,
  contextWindowFor,
  promptTokens,
  prHealth,
  sessionHistory,
  contextTax,
  degradationProfile,
  atOrAbove,
  healthExitCode,
  STATUS_RANK,
  HEALTH_EXIT,
} from "./health.js";
export type {
  SessionHealth,
  HealthSignal,
  HealthStatus,
  PrHealth,
  SessionSummary,
  ContextTax,
  DegradationProfile,
} from "./health.js";
export {
  renderHealth,
  healthOneLine,
  guardLine,
  healthBlockMarkdown,
  renderHealthHistory,
  renderContextTax,
  degradationProfileLine,
} from "./usage-render.js";
export type {
  LedgerEntry,
  ModelPrice,
  PriceBook,
  Receipt,
  ModelRollup,
  Budget,
  ReceiptConfig,
  PlanId,
  PlanBudget,
} from "./types.js";
