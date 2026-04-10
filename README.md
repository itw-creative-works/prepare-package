<p align="center">
  <a href="https://itwcreativeworks.com">
    <img src="https://cdn.itwcreativeworks.com/assets/itw-creative-works/images/logo/itw-creative-works-brandmark-black-x.svg" width="100px">
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/github/package-json/v/itw-creative-works/prepare-package.svg">
  <br>
  <img src="https://img.shields.io/librariesio/release/npm/prepare-package.svg">
  <img src="https://img.shields.io/bundlephobia/min/prepare-package.svg">
  <img src="https://img.shields.io/codeclimate/maintainability-percentage/itw-creative-works/prepare-package.svg">
  <img src="https://img.shields.io/npm/dm/prepare-package.svg">
  <img src="https://img.shields.io/node/v/prepare-package.svg">
  <img src="https://img.shields.io/website/https/itwcreativeworks.com.svg">
  <img src="https://img.shields.io/github/license/itw-creative-works/prepare-package.svg">
  <img src="https://img.shields.io/github/contributors/itw-creative-works/prepare-package.svg">
  <img src="https://img.shields.io/github/last-commit/itw-creative-works/prepare-package.svg">
  <br>
  <br>
  <a href="https://itwcreativeworks.com">Site</a> | <a href="https://www.npmjs.com/package/prepare-package">NPM Module</a> | <a href="https://github.com/itw-creative-works/prepare-package">GitHub Repo</a>
  <br>
  <br>
  <strong>Prepare Package</strong> is a helpful NPM module that prepares your package before distribution.
</p>

## Install
```shell
npm install prepare-package --save-dev
```

## Quick Setup
Run the interactive CLI to configure your project:
```shell
npx pp
```

This will walk you through selecting a build type (**copy** or **bundle**), configuring formats, and auto-deriving IIFE settings (global name from package name in TitleCase, filename as `{name}.min.js`). The CLI writes the `preparePackage` config and scripts directly to your `package.json`.

You can also use the full name:
```shell
npx prepare-package
```

## Features
* Two modes: **copy** (default) and **bundle** (esbuild)
* Copy mode: copies `src/` to `dist/`, replaces `{version}` in main file
* Bundle mode: builds ESM, CJS, and/or IIFE outputs via esbuild
* **Before/after hooks** — run arbitrary shell commands as part of the prepare lifecycle
* Blocks `npm publish` when local `file:` dependencies are detected
* Cleans up sensitive files (`.env`, `.DS_Store`, etc.) before publish
* Purges jsDelivr CDN cache after publish
* Watch mode for both copy and bundle types
* Auto-adds `prepare` and `prepare:watch` scripts to consumer's `package.json`

## Configuration

All configuration lives in the `preparePackage` key in your `package.json`.

### Copy Mode (default)

Copies files from `input` to `output` and replaces `{version}` in the main file.

```json
{
  "main": "dist/index.js",
  "preparePackage": {
    "input": "src",
    "output": "dist"
  }
}
```

| Key | Default | Description |
|-----|---------|-------------|
| `type` | `"copy"` | Processing mode |
| `input` | `"src"` | Source directory to copy from |
| `output` | `"dist"` | Destination directory to copy to |
| `replace` | `{}` | Additional replacements (reserved) |

### Bundle Mode

Uses esbuild to produce optimized builds in multiple module formats.

```json
{
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "preparePackage": {
    "input": "src",
    "output": "dist",
    "type": "bundle",
    "build": {
      "formats": ["esm", "cjs", "iife"],
      "iife": {
        "globalName": "MyLib",
        "fileName": "my-lib.min.js"
      }
    }
  }
}
```

| Key | Default | Description |
|-----|---------|-------------|
| `type` | — | Must be `"bundle"` to enable this mode |
| `build.entry` | `"{input}/index.js"` | Entry point for esbuild |
| `build.formats` | `["esm", "cjs"]` | Output formats: `"esm"`, `"cjs"`, `"iife"` |
| `build.target` | `"es2020"` | esbuild target for ESM/CJS builds |
| `build.platform` | `"neutral"` | esbuild platform |
| `build.external` | `[]` | Packages to exclude from bundle |
| `build.sourcemap` | `false` | Generate source maps |
| `build.cjs.footer` | `"module.exports=module.exports.default\|\|module.exports;"` | CJS footer — unwraps `export default` so `require()` returns the value directly |
| `build.iife.globalName` | — | **Required** when `"iife"` is in formats. The global variable name (e.g., `window.MyLib`) |
| `build.iife.fileName` | `"{name}.min.js"` | Output filename for IIFE build |
| `build.iife.target` | `"es2015"` | esbuild target for IIFE build |

#### Output files
| Format | File | Minified |
|--------|------|----------|
| ESM | `dist/index.mjs` | No |
| CJS | `dist/index.js` | No |
| IIFE | `dist/{fileName}` | Yes |

#### Version replacement
In bundle mode, all occurrences of `{version}` in `.js` source files are replaced with the version from `package.json` at build time via an esbuild plugin.

#### CJS default export
The CJS build automatically appends a footer that unwraps `export default` so `require('your-package')` returns the function/class directly — not `{ default: fn }`. This means both of these just work:

```js
// ESM
import MyLib from 'your-package';

// CJS
const MyLib = require('your-package');
```

To override the footer, set `build.cjs.footer` in your config.

#### IIFE global export
The IIFE build automatically unwraps the default export so `window[globalName]` is the class/function directly, not a `{ default }` wrapper.

### Hooks

Run arbitrary shell commands before or after the copy/bundle step. Useful for fetching remote data, generating files, uploading artifacts, or running any command that needs to happen as part of the prepare lifecycle — so the output lands in both your git commits and your published tarball.

```json
{
  "preparePackage": {
    "input": "src",
    "output": "dist",
    "hooks": {
      "before": "node scripts/update-disposable-domains.js",
      "after": "node scripts/notify-deploy.js"
    }
  }
}
```

| Hook | When it runs | On failure |
|------|-------------|-----------|
| `before` | After publish safety checks, before the copy/bundle step | **Blocks** — throws and aborts prepare |
| `after` | After the copy/bundle step, before the CDN purge | **Warns** — logs a warning and continues |

Both hooks accept a single command string or an array of commands:

```json
{
  "preparePackage": {
    "hooks": {
      "before": [
        "node scripts/update-disposable-domains.js",
        "node scripts/build-manifest.js"
      ]
    }
  }
}
```

Commands run synchronously from the package root with `stdio` inherited, so their output appears in the parent process. Hooks are **skipped** in watch mode (single-file updates) and during postinstall — they only run on full prepare runs (`npm run prepare`, `npm publish`, etc.).

## Usage

```shell
# Build once
npm run prepare

# Watch for changes
npm run prepare:watch

# These scripts are auto-added to your package.json:
# "prepare": "node -e \"require('prepare-package')()\""
# "prepare:watch": "node -e \"require('prepare-package/watch')()\""
```

## Publish Safety

When running via `npm publish`, prepare-package will:

1. **Block local dependencies** — fails if any `file:`, `../`, `./`, `/`, or `~` dependency versions are found
2. **Remove sensitive files** — deletes `.env`, `.env.local`, `.env.development`, `.env.production`, `firebase-debug.log`, `.DS_Store`, `Thumbs.db` from the package
3. **Purge CDN cache** — purges the jsDelivr cache for your package after publish

## Questions
If you are still having difficulty, post a question to [the Prepare Package issues page](https://github.com/itw-creative-works/prepare-package/issues).
