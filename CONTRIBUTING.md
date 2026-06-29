# Contributing

Thanks for looking. Receipt is small on purpose, and PRs that keep it that way are the most welcome kind.

## Getting set up

```bash
git clone https://github.com/noah-thing/receipt.git
cd receipt
npm install
npm run build
npm test
```

`npm run dev` runs the CLI from source with `tsx`, so you can try a command without rebuilding:

```bash
npm run dev -- show --all
```

## Before you open a PR

- `npm run typecheck` passes with no errors.
- `npm test` is green. Add a test for the behavior you changed.
- `npm run build`, then commit the updated `dist/`. CI fails if `dist/` is stale, because the GitHub Action runs the committed bundle.

## Good first contributions

- **Prices.** The numbers in [`src/prices.json`](src/prices.json) drift. A PR that corrects one, with a link to the provider's pricing page, is genuinely useful.
- **Importers.** A new tool that keeps its own usage log is a small addition under [`src/importers/`](src/importers). Model it on the generic importer.
- **Provider shapes.** If the proxy misses usage from a tool you run, open an issue with a redacted sample of the response and we will add the parse path.

## Style

Match the code around you. The runtime stays lean (no production dependencies ship), and comments explain why, not what. Prose in the docs avoids the usual filler.

By contributing you agree to license your work under the MIT License.
