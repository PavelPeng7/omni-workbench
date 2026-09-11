# Matt engineering workflow

The project adopts Matt Pocock Skills `v1.2.3` as a workflow, not as a certification badge.

## Reproducible setup

Install the pinned upstream release for the user-level agent environment:

```sh
npx skills@latest add mattpocock/skills#v1.2.3 -g -y
```

The required project flow is `setup-matt-pocock-skills` → `grill-with-docs` → `to-spec` → `to-tickets` → `implement`. Implementation drives `tdd` internally and closes with `code-review`. Supporting skills include `grilling`, `domain-modeling`, `codebase-design`, `triage`, `diagnosing-bugs`, and `improve-codebase-architecture`.

## Delivery path

1. Grill until the design-tree frontier is empty.
2. Keep small, single-session work in the same context. For larger work, write a spec and tracer-bullet tickets with blocking edges.
3. Implement one red-green-refactor slice at a time behind a small testable seam.
4. Run `npm run release:check`.
5. Review the diff against repository Standards (`AGENTS.md` and referenced documents) and the originating Spec.
6. For releases, complete `docs/agents/release-smoke-checklist.md` in real Obsidian environments.

## Quality gate

`npm run release:check` builds the committed CommonJS artifact, type-checks extracted modules, runs ESLint with zero warnings, runs unit tests with a non-blocking coverage report, validates metadata, and checks JavaScript syntax. CI additionally rejects a generated `main.js` that is not committed.

`src/main.ts` is the documented legacy exception. It retains `// @ts-nocheck` and is excluded from ESLint while behavior is extracted into strict modules. New modules may not use that exception.
