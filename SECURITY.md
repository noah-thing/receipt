# Security

## What Receipt touches

The proxy forwards your API requests to the provider, which means it handles your API key in transit. It passes the `Authorization` and `x-api-key` headers straight through and never writes them anywhere. It runs on `localhost` by default. Do not expose it on a public interface.

The ledger holds token counts, model names, costs, timestamps, and git branch or commit names. It does not hold prompts, completions, headers, or source code.

The GitHub Action needs `pull-requests: write` to post a comment. It reads the ledger from your checkout and writes one sticky comment. It makes no other network calls.

## Reporting a vulnerability

Email the maintainer or open a [private security advisory](https://github.com/noah-thing/receipt/security/advisories/new) on GitHub. Please do not open a public issue for a vulnerability. You can expect a first reply within a few days.
