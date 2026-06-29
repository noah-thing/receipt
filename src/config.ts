import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { ReceiptConfig } from "./types.js";

export function configPath(repoRoot: string): string {
  return join(repoRoot, ".receipt", "config.json");
}

export function loadConfig(repoRoot: string): ReceiptConfig {
  const path = configPath(repoRoot);
  if (!existsSync(path)) return {};
  try {
    return JSON.parse(readFileSync(path, "utf8")) as ReceiptConfig;
  } catch {
    return {};
  }
}

export function saveConfig(repoRoot: string, config: ReceiptConfig): void {
  const path = configPath(repoRoot);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(config, null, 2) + "\n", "utf8");
}
