import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

function git(args: string[], cwd: string): string | undefined {
  try {
    return execFileSync("git", args, {
      cwd,
      stdio: ["ignore", "pipe", "ignore"],
      encoding: "utf8",
    }).trim();
  } catch {
    return undefined;
  }
}

/** Walk up from `start` until a directory containing `.git` is found. */
export function findRepoRoot(start = process.cwd()): string {
  let dir = resolve(start);
  for (;;) {
    if (existsSync(join(dir, ".git"))) return dir;
    const parent = dirname(dir);
    if (parent === dir) return resolve(start); // not a repo; fall back to start
    dir = parent;
  }
}

export function currentBranch(cwd = process.cwd()): string | undefined {
  const b = git(["rev-parse", "--abbrev-ref", "HEAD"], cwd);
  return b && b !== "HEAD" ? b : undefined;
}

export function currentSha(cwd = process.cwd()): string | undefined {
  return git(["rev-parse", "HEAD"], cwd);
}

export function repoSlug(cwd = process.cwd()): string | undefined {
  const url = git(["config", "--get", "remote.origin.url"], cwd);
  if (!url) return undefined;
  // git@github.com:owner/repo.git  or  https://github.com/owner/repo.git
  const m = url.match(/[:/]([^/:]+\/[^/]+?)(?:\.git)?$/);
  return m ? m[1] : undefined;
}

/**
 * SHAs reachable from `branch` but not from `base` — i.e. the commits this
 * branch adds on top of the base. Used to attribute ledger entries to a PR.
 */
export function commitsInRange(base: string, branch: string, cwd = process.cwd()): string[] {
  const out = git(["rev-list", `${base}..${branch}`], cwd);
  if (!out) return [];
  return out.split("\n").filter(Boolean);
}

/** When did this branch diverge from base? Used as a time-window fallback. */
export function mergeBaseDate(base: string, branch: string, cwd = process.cwd()): string | undefined {
  const sha = git(["merge-base", base, branch], cwd);
  if (!sha) return undefined;
  return git(["show", "-s", "--format=%cI", sha], cwd);
}
