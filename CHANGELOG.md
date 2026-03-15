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
