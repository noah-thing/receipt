import { readFileSync } from "node:fs";
import { commitsInRange, currentBranch, mergeBaseDate, repoSlug } from "./git.js";

/**
 * Where the receipt should be scoped and posted, resolved from CLI flags first
 * and GitHub Actions environment variables second. This is what lets the same
 * `receipt post` work on a laptop and inside a workflow with no extra config.
 */
export interface ResolvedContext {
  repo?: string;
  token?: string;
  pr?: number;
  branch?: string;
  base: string;
}

interface Flags {
  repo?: string;
  token?: string;
  pr?: string;
  branch?: string;
  base?: string;
}

export function resolveContext(repoRoot: string, flags: Flags): ResolvedContext {
  const env = process.env;
  const inActions = env.GITHUB_ACTIONS === "true";

  let pr = flags.pr ? Number(flags.pr) : undefined;
  let branch = flags.branch;

  if (inActions) {
    if (!pr && env.GITHUB_EVENT_PATH) {
      try {
        const event = JSON.parse(readFileSync(env.GITHUB_EVENT_PATH, "utf8"));
        if (event.pull_request?.number) pr = event.pull_request.number;
        else if (event.number) pr = event.number;
      } catch {
        /* not a PR event */
      }
    }
    branch ??= env.GITHUB_HEAD_REF || undefined;
  }

  branch ??= currentBranch(repoRoot);

  return {
    repo: flags.repo ?? env.GITHUB_REPOSITORY ?? repoSlug(repoRoot),
    token: flags.token ?? env.GITHUB_TOKEN ?? env.GH_TOKEN,
    pr,
    branch,
    base: flags.base ?? env.GITHUB_BASE_REF ?? "main",
  };
}

/** Commit SHAs the branch adds over base, plus a time floor at their split. */
export function rangeFor(
  repoRoot: string,
  base: string,
  branch?: string,
): { shas: Set<string>; sinceTs?: string } {
  if (!branch) return { shas: new Set() };
  const shas = new Set(commitsInRange(base, branch, repoRoot));
  const sinceTs = mergeBaseDate(base, branch, repoRoot);
  return { shas, sinceTs };
}
