# prepare-package

## Overview
NPM build tool that prepares packages for distribution. Supports two modes: **copy** (file copy with version replacement) and **bundle** (esbuild multi-format builds).

## Architecture

### Two Modes via `preparePackage.type`
- **`"copy"` (default)**: Copies `src/` to `dist/`, replaces `{version}` in the main file. Used by large projects that don't need bundling (e.g., UJM).
- **`"bundle"`**: Uses esbuild to produce ESM (`index.mjs`), CJS (`index.js`), and/or IIFE (minified, for CDN `<script>` tags). Used by client-side libraries (e.g., chatsy).

### Project Structure
```
src/
  index.js    # Main entry: resolves config, branches copy vs bundle, safety checks, CDN purge
  build.js    # Esbuild config generator, version plugin, build() and createWatchContexts()
  watch.js    # Watch mode: chokidar for copy, esbuild contexts for bundle
  cli.js      # Interactive CLI for project setup (npx pp / npx prepare-package)
  logger.js   # Timestamped console logger with chalk colors
dist/         # Copy-mode output of src/ (prepare-package builds itself with copy mode)
```

### CLI (`npx pp` / `npx prepare-package`)
Interactive setup wizard that configures a project's `package.json`:
1. Asks **copy** or **bundle** mode
2. Asks source/output directories (defaults: `src`/`dist`)
3. If bundle: asks formats, auto-derives `globalName` (TitleCase of package name) and `fileName` (`{name}.min.js`)
4. Writes `preparePackage` config and `prepare`/`prepare:watch` scripts to `package.json`

### How It Runs
- **`prepare` script**: Runs on `npm install` and `npm publish` in the consumer's project
- **`postinstall` script**: Runs when prepare-package itself is installed as a dependency. Skips bundle mode (esbuild may not be available yet during install)
- **`prepare:watch` script**: Starts watch mode (chokidar for copy, esbuild `.watch()` for bundle)
- **`bin` commands**: `prepare-package` and `pp` both point to `cli.js`

### Consumer Configuration
All config lives in `preparePackage` key in the consumer's `package.json`:

```jsonc
{
  "preparePackage": {
    "input": "src",           // Source directory
    "output": "dist",         // Output directory
    "type": "copy",           // "copy" (default) or "bundle"
    "build": {                // Only used when type: "bundle"
      "entry": "src/index.js",
      "formats": ["esm", "cjs", "iife"],
      "target": "es2020",
      "platform": "neutral",
      "external": [],
      "sourcemap": false,
      "iife": {
        "globalName": "MyLib",      // Required for IIFE
        "fileName": "my-lib.min.js" // Default: "{name}.min.js"
      }
    }
  }
}
```

### Publish Safety
- Blocks publish if any local `file:` dependencies are found
- Removes sensitive files (`.env`, `.DS_Store`, etc.) from the package
- Purges jsDelivr CDN cache after publish

### Key Details
- esbuild is a direct dependency but only `require()`'d inside bundle code paths (lazy-loaded)
- Bundle mode's version plugin replaces `{version}` in all `.js` files at build time
- IIFE build auto-unwraps default export: `GlobalName=GlobalName.default||GlobalName.GlobalName||GlobalName;`
- Copy mode's `{version}` replacement only applies to the main file
- prepare-package builds itself using copy mode (it's both the tool and a consumer of itself)

## Conventions
- Self-hosting: prepare-package uses itself (copy mode) to build `src/` → `dist/`
- No breaking changes to copy mode — existing consumers must keep working unchanged
- Bundle mode is opt-in via `type: "bundle"`
