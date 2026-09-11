# Matt engineering baseline

## Status

Accepted and implemented as the initial engineering baseline on 2026-09-11.

## Problem

The repository had a 1,300-line handwritten plugin entry and a release check limited to file presence, manifest fields, and JavaScript syntax. It had no source build, type checking, linting, tests, pull-request CI, shared domain context, ADR convention, or agent workflow documentation. Both README version badges also lagged behind package and manifest version `0.3.12`.

## Scope

- Pin and document Matt Pocock Skills `v1.2.3`.
- Add repository context, tracker, domain, workflow, ADR, and smoke-test documentation.
- Generate root `main.js` from `src/main.ts` through esbuild without changing UI or persisted data.
- Extract date, timer, and frontmatter helpers into strict modules with boundary tests.
- Add TypeScript, Obsidian-aware ESLint, Vitest, and CI gates.
- Preserve Node 20 with a toolchain-compatible minimum of 20.19, Obsidian 1.9.14+, plugin identity, mobile declaration, and the three-file release contract.

## Non-goals

- Redesigning visible UI or changing `styles.css`.
- Fully typing or decomposing the legacy plugin entry.
- Creating GitHub labels or issues.
- Changing vault schemas or adding product features.

## Acceptance criteria

- `npm run release:check` passes from a clean dependency install.
- Root `main.js` is a readable CommonJS bundle with `obsidian` externalized.
- Strict type checking and zero-warning lint apply to every extracted module.
- Unit tests cover local calendar parsing, timer edge cases, and frontmatter replacement/insertion, and report coverage without enforcing a percentage threshold.
- Pull requests and pushes to `main` run the same gate and reject stale generated bundles.
- README version badges match package and manifest metadata.
- Release-time behavior is covered by a documented desktop/mobile smoke checklist.

## Follow-up candidates

1. Remove the legacy lint exclusion in vertical slices, starting with lifecycle and file-operation boundaries.
2. Replace direct global document/window/timer usage with Obsidian-compatible ownership patterns.
3. Move runtime-injected CSS into the scoped stylesheet after a dedicated Claymorphism review.
4. Add an Obsidian integration harness for plugin load/unload and event cleanup.
5. Convert this list into reviewed GitHub tracer-bullet tickets before implementation.
