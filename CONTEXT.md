# Omni Workbench context

Omni Workbench is a local-first Obsidian dashboard that connects task execution, focus timers, fleeting-note triage, and knowledge navigation. It ships as one community-plugin bundle and must remain usable on desktop and mobile Obsidian.

## Shared language

- **Workbench**: the plugin view that hosts home, task, and knowledge workflows.
- **Task**: a Markdown file recognized through the configured task folder and frontmatter schema.
- **Focus task**: the task selected as the current work target. At most one timer should be running.
- **Fleeting note**: a captured idea awaiting conversion, consolidation, or disposal.
- **Release artifact**: the generated root `main.js` plus `manifest.json` and `styles.css`; the same three files are copied to `dist/`.
- **Legacy entry**: `src/main.ts`, the migrated monolithic implementation temporarily isolated from strict checking while typed deep modules are extracted.

## Boundaries

- Obsidian owns vault persistence, metadata, workspace leaves, and lifecycle cleanup.
- `src/core/` contains runtime-independent, strictly typed domain logic. It must not import Obsidian or browser globals.
- Visible UI remains scoped to `.pvd-*` and follows the local Claymorphism skill referenced by `AGENTS.md`.
- `main.js` is generated. Edit source under `src/`, then run `npm run build`.

## Current direction

New behavior enters through typed, tested modules with small interfaces. The legacy entry is reduced incrementally through specs and tracer-bullet tickets; a wholesale rewrite is outside the current baseline.
