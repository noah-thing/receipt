# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project aims
for [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.6.0] - 2026-10-28

Catches the tool up with the models and tools of late 2026.

### Added

- `receipt import codex`: token usage from Codex CLI session logs under `~/.codex/sessions`, with cached input split out and priced at the cache rate.
- Prices for the Claude 5 family (Opus 5.5, Sonnet 5.5, Haiku 5.5, Fable 5.1 and earlier 5.x), GPT-5 and GPT-6, Gemini 3 and 4, and Grok 4.x, checked against each provider's pricing page on 2026-10-28.
- An `xai` provider family, with its own badge and dashboard colour.

### Changed

- Claude Opus 4.5 to 4.8 are priced at $5 / $25 per million tokens, not $15 / $75. Opus 4.1 and earlier keep $15 / $75.
- The `opus`, `sonnet` and `haiku` aliases and the `claude-*` fallbacks resolve to the 5.5 models. Dated ids resolve to their own version instead of a neighbour.
- `gemini-2.5-flash-lite` no longer matches the `gemini-2.5-flash` prefix and is priced on its own.
- `o3`, `o4-mini` and the Gemini 2.5 models are no longer flagged unverified. Claude 3 models other than Haiku 3.5, which are retired and no longer listed by Anthropic, are flagged unverified.
- The Action and CI run on Node 24, and the package needs Node 22 or newer. CI uses `actions/checkout@v7` and `actions/setup-node@v7`.
- Dev dependencies updated: vitest 5, tsup 9, tsx and @types/node patch releases.
- The sample ledger and example receipts are recomputed at the new prices.

## [0.5.0] - 2026-06-30

Session health: keeping the agent sharp over long sessions, not just cheap. The
same token ledger that prices a PR also reveals *when a session is quietly
degrading*, because the research is consistent that quality drops well before any
hard limit (context rot, lost-in-the-middle, multi-turn drift, lossy
auto-compaction). Everything is computed locally from token counts and
timestamps; no prompts, completions, or code are read.

### Added

- `receipt health`: a per-session quality read-out covering context fill (by % and
  absolute size), session length and age, cache reuse, inferred auto-compaction
  cascades, looping, and output shrinkage, each with a quality-preserving move
  (`/compact`, `/clear`, a fresh session, `/rewind`), never "do less work."
- `receipt health --all`: scores every past session and learns your personal
  pattern (when you tend to drift, whether you compact too late).
- `receipt health --json` / `--quiet --gate <status>`: machine-readable output
  and severity exit codes (`0/10/20/30`) for hooks, editors, and CI.
- `receipt guard`: Claude Code hook entrypoint that nudges the agent the moment
  a session crosses a gate; `--notify` exits 2 so the message reaches the model.
  Highest-leverage on the `PreCompact` hook, right before lossy auto-compaction.
- The **context tax**: how much of a session is just re-sending itself, the
  quadratic re-send cost that drives both rising spend and fading quality.
- A collapsed, review-oriented **session-health note on the pull-request comment**
  when the work ran under degrading conditions; silent otherwise, opt out with
  `health: false`. Addresses the reviewer, proves conditions not correctness.
- Live session-health gauge in `receipt statusline` and `receipt fuel`.

## [0.1.0] - 2026-06-30

First public version.

### Added

- Logging proxy for the Anthropic and OpenAI API shapes, including streaming.
- Importer that reads token usage from coding-agent session logs.
- Generic JSON/JSONL importer for any usage export.
- Append-only ledger holding token and cost metadata only, never content.
- Price book covering common models, with a repo-level override file and
  per-model cache and tool pricing.
- Itemized markdown receipt with a model table, a spend sparkline, a budget
  bar, and a comparison to the median PR.
- `receipt post` and a composite GitHub Action that upsert one sticky comment.
- Local dashboard: spend over time, by model, by branch, top calls.
- `receipt show`, `receipt wrapped`, and budget configuration.

[Unreleased]: https://github.com/noah-thing/receipt/compare/v0.5.0...HEAD
[0.5.0]: https://github.com/noah-thing/receipt/compare/v0.1.0...v0.5.0
[0.1.0]: https://github.com/noah-thing/receipt/releases/tag/v0.1.0
