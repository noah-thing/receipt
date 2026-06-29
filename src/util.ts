/** Format a USD amount with sensible precision for small agent costs. */
export function money(usd: number, currency = "USD"): string {
  const symbol = currency === "USD" ? "$" : "";
  const suffix = currency === "USD" ? "" : ` ${currency}`;
  if (usd === 0) return `${symbol}0.00${suffix}`;
  const abs = Math.abs(usd);
  const dp = abs < 0.01 ? 4 : abs < 0.1 ? 3 : 2;
  return `${symbol}${usd.toFixed(dp)}${suffix}`;
}

/** Compact token counts: 1_234 -> "1.2k", 2_100_000 -> "2.1M". */
export function tokens(n: number): string {
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0)}k`;
  return `${(n / 1_000_000).toFixed(1)}M`;
}

const BARS = ["▁", "▂", "▃", "▄", "▅", "▆", "▇", "█"];

/** A unicode sparkline from a series of values. */
export function sparkline(values: number[]): string {
  if (values.length === 0) return "";
  const max = Math.max(...values);
  if (max === 0) return BARS[0]!.repeat(values.length);
  return values
    .map((v) => {
      const idx = Math.min(BARS.length - 1, Math.round((v / max) * (BARS.length - 1)));
      return BARS[idx];
    })
    .join("");
}

/**
 * Sum values into equal-time buckets across the first..last span. Works for a
 * two-hour session (a spend ramp) and a two-week branch (a daily-ish shape)
 * alike, so the sparkline is always legible.
 */
export function timeBuckets(timestamps: string[], values: number[], maxBuckets = 16): number[] {
  if (timestamps.length === 0) return [];
  const times = timestamps.map((t) => new Date(t).getTime());
  const min = Math.min(...times);
  const max = Math.max(...times);
  const span = max - min;
  const n = Math.max(1, Math.min(maxBuckets, timestamps.length));
  const buckets = new Array(n).fill(0);
  for (let i = 0; i < times.length; i++) {
    const frac = span === 0 ? 0 : (times[i]! - min) / span;
    const idx = Math.min(n - 1, Math.floor(frac * n));
    buckets[idx] += values[i]!;
  }
  return buckets;
}

/** Render a fixed-width ASCII progress bar, e.g. budget used. */
export function progressBar(fraction: number, width = 20): string {
  const f = Math.max(0, Math.min(1, fraction));
  const filled = Math.round(f * width);
  return "█".repeat(filled) + "░".repeat(width - filled);
}

export function pct(fraction: number): string {
  return `${Math.round(fraction * 100)}%`;
}
