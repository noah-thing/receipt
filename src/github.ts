import { COMMENT_MARKER } from "./render.js";

const API = "https://api.github.com";

interface GitHubCtx {
  repo: string; // "owner/name"
  token: string;
}

function headers(token: string): Record<string, string> {
  return {
    authorization: `Bearer ${token}`,
    accept: "application/vnd.github+json",
    "x-github-api-version": "2022-11-28",
    "user-agent": "receipt-cli",
    "content-type": "application/json",
  };
}

async function gh(token: string, path: string, init: RequestInit = {}): Promise<any> {
  const res = await fetch(API + path, { ...init, headers: { ...headers(token), ...(init.headers ?? {}) } });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API ${res.status} ${res.statusText} on ${path}: ${text.slice(0, 300)}`);
  }
  if (res.status === 204) return undefined;
  return res.json();
}

/** Find an open PR whose head branch matches, when no number was supplied. */
export async function findPrForBranch(ctx: GitHubCtx, branch: string): Promise<number | undefined> {
  const owner = ctx.repo.split("/")[0];
  const pulls = (await gh(
    ctx.token,
    `/repos/${ctx.repo}/pulls?state=open&head=${owner}:${encodeURIComponent(branch)}&per_page=1`,
  )) as Array<{ number: number }>;
  return pulls[0]?.number;
}

async function findExistingComment(ctx: GitHubCtx, pr: number): Promise<number | undefined> {
  for (let page = 1; page <= 5; page++) {
    const comments = (await gh(
      ctx.token,
      `/repos/${ctx.repo}/issues/${pr}/comments?per_page=100&page=${page}`,
    )) as Array<{ id: number; body: string }>;
    const hit = comments.find((c) => c.body?.includes(COMMENT_MARKER));
    if (hit) return hit.id;
    if (comments.length < 100) break;
  }
  return undefined;
}

export interface PostResult {
  action: "created" | "updated";
  url: string;
}

/** Upsert the receipt as a single sticky comment on the pull request. */
export async function postReceipt(
  ctx: GitHubCtx,
  pr: number,
  body: string,
): Promise<PostResult> {
  const existing = await findExistingComment(ctx, pr);
  if (existing) {
    const updated = (await gh(ctx.token, `/repos/${ctx.repo}/issues/comments/${existing}`, {
      method: "PATCH",
      body: JSON.stringify({ body }),
    })) as { html_url: string };
    return { action: "updated", url: updated.html_url };
  }
  const created = (await gh(ctx.token, `/repos/${ctx.repo}/issues/${pr}/comments`, {
    method: "POST",
    body: JSON.stringify({ body }),
  })) as { html_url: string };
  return { action: "created", url: created.html_url };
}
