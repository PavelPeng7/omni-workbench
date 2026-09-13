# ADR 0002: Plan knowledge-note conversion before vault mutation

- Status: Proposed
- Date: 2026-09-13

## Context

Knowledge-note conversion combines Markdown parsing, frontmatter precedence, template rendering, destination classification, collision handling, file mutation, file movement, link behavior, and two separate UI entry points. The current fleeting-note conversion performs frontmatter and move operations directly inside the Workbench view and silently chooses a suffixed destination when a name collides. It cannot safely serve arbitrary Markdown files or template-based conversion.

The new workflow also introduces three persisted template-path settings and a documented body-placeholder contract. Those choices become compatibility boundaries for existing vaults and user-authored templates.

## Decision

Create one typed, runtime-independent conversion planner that receives already-read source and template inputs plus target configuration and returns either a complete immutable conversion plan or a typed failure. Keep Obsidian reads, writes, moves, link handling, notices, menus, and lifecycle registration in thin adapters that consume that plan.

Provide one configurable template per supported knowledge-note type. One-click setup creates missing starter templates without overwriting existing files. `{{content}}` is the stable body placeholder: one occurrence is replaced by the complete source body, no occurrence appends the body once, and multiple occurrences are rejected. Template-owned type and workflow fields win; source-owned metadata is preserved and list fields are merged without duplicates.

Require all predictable validation before mutation. Use Obsidian's file manager for the move and best-effort compensation if the post-write move fails. A destination collision is an error rather than an instruction to overwrite or invent a new file name.

Both Workbench and Obsidian native menus invoke the same adapter and planner. Existing fleeting-note conversion actions are routed through this boundary rather than retaining a second behavior path.

## Consequences

- The highest-value conversion behavior can be tested without loading Obsidian or a DOM.
- Both menus and existing fleeting-note triage produce consistent results and errors.
- New persisted settings are additive, but existing installations must create or configure the three knowledge-note templates before conversion succeeds.
- User-authored templates can rely on the documented `{{content}}` behavior; changing it later requires an explicit compatibility decision.
- The adapter needs compensation logic because content modification and file movement are not one atomic Obsidian transaction.
- The existing silent unique-name behavior is intentionally not reused; users must resolve destination collisions themselves.
- This extracts a focused vertical slice from the legacy entry without requiring a broad rewrite.
