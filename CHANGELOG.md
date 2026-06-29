# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project aims
for [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/noah-thing/receipt/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/noah-thing/receipt/releases/tag/v0.1.0
