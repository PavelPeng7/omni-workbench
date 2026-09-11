# ADR 0001: Adopt a staged Matt engineering baseline

- Status: Accepted
- Date: 2026-09-11

## Context

The plugin was maintained as a single handwritten `main.js` with release metadata checks but no static type, lint, test, or pull-request quality gate. A full rewrite would combine build, architecture, and behavior risk.

## Decision

Adopt Matt Pocock Skills `v1.2.3` for intent clarification, specs, tracer-bullet tickets, TDD implementation, and Standards + Spec review. Move the source entry to TypeScript and generate CommonJS `main.js` with esbuild. Keep the legacy entry temporarily isolated with `@ts-nocheck`; extract pure behavior into strict modules with unit tests. Require Node 20.19 or newer and the unified release check in CI.

## Consequences

- New behavior gets fast static and test feedback.
- The committed bundle remains directly loadable from this vault plugin directory.
- Generated bundle diffs remain in commits and CI verifies they are current.
- Historical type and Obsidian-lint debt stays visible and must shrink through later specs rather than a wholesale rewrite.
