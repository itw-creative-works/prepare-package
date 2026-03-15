# CHANGELOG

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## Changelog Categories

- `BREAKING` for breaking changes.
- `Added` for new features.
- `Changed` for changes in existing functionality.
- `Deprecated` for soon-to-be removed features.
- `Removed` for now removed features.
- `Fixed` for any bug fixes.
- `Security` in case of vulnerabilities.

---
## [2.0.7] - 2026-03-15
### Changed
- Removed `.default` from `wonderful-fetch` require() since Node.js v22+ handles ESM default exports natively
- Bumped `wonderful-fetch` dependency from ^2.0.1 to ^2.0.4
- Added documentation for CJS default export footer configuration in README

---
## [2.0.6] - 2026-03-15
### Added
- Default CJS footer that unwraps `export default` so `require()` returns the function/class directly instead of `{ default: fn }`
- Configurable via `preparePackage.build.cjs.footer` for custom override

---
## [2.0.3] - 2026-03-14
### Fixed
- esbuild watch mode not detecting file changes due to onLoad plugin intercepting file loading
- Added `watchFiles` to one-shot build's onLoad plugin for proper dependency tracking
- Debounced rebuild logging across format contexts in watch mode

---
## [2.0.0] - 2026-03-14
### Added
- Bundle mode (`type: "bundle"`) using esbuild for ESM, CJS, and IIFE multi-format builds
- Interactive CLI (`npx pp` / `npx prepare-package`) for project setup
- Watch mode support for bundle type via esbuild context API
- `preparePackage.build` config for formats, entry, target, platform, external, sourcemap, and IIFE options
- CLAUDE.md project documentation

### Changed
- Upgraded chalk to ^5.6.2 (ESM)
- Upgraded chokidar to ^5.0.0 (ESM)
- Upgraded mocha to ^11.7.5
- Added esbuild ^0.27.4 as a dependency
- Rewrote README.md with full configuration reference for both modes

---
## [1.0.0] - 2024-06-19
### Added
- Initial release of the project 🚀
