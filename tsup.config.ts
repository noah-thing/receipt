import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    cli: "src/cli.ts",
    index: "src/index.ts",
  },
  format: ["esm"],
  target: "node18",
  dts: { entry: { index: "src/index.ts" } },
  clean: true,
  shims: false,
  splitting: false,
  sourcemap: false,
  // Bundle runtime deps so the built CLI is self-contained: the GitHub Action
  // runs `node dist/cli.js` with no install step, and the npm package has no
  // production dependencies to resolve.
  noExternal: ["commander", "picocolors"],
  // commander is CommonJS and calls require() for Node builtins. Give the ESM
  // bundle a real require so those resolve. (The hashbang stays on line one.)
  banner: {
    js: "import { createRequire as __cr } from 'module'; const require = __cr(import.meta.url);",
  },
});
