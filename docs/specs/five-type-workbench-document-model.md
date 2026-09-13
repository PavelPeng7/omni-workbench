# Five-type Workbench document model

## Status

Draft on 2026-09-13. Derived from the proposed five-type document-model ADR and `CONTEXT.md`; it has not been published as a GitHub Issue.

## Problem Statement

Omni Workbench currently treats tasks, projects, and knowledge notes as separate systems with incompatible location and relationship rules. A project is only a selectable frontmatter value, rather than a bounded workspace with its own child tasks. A user cannot consistently classify or convert a Workbench document between an actionable task, a project, and the three knowledge-note types. Existing notes also need to remain safe: the Workbench must not silently migrate or reinterpret legacy task and project documents.

## Solution

Make task, project, fleeting note, literature note, and permanent note the five peer types of a Workbench document. Each task belongs to exactly one project workspace, which contains its project document and child-task directory. Creating or moving a task between project workspaces refreshes each affected project's managed child-task index.

Provide one shared document-conversion workflow that validates a requested conversion before changing the vault, applies the target template and target-owned fields, preserves common content and archived incompatible metadata, and moves the original file to the correct destination without overwriting an entry. It supports the approved directed knowledge path, task/project promotion, and safe returns to fleeting notes.

## User Stories

1. As a Workbench user, I want every managed Markdown file to have exactly one document type, so that tasks, projects, and knowledge notes have consistent behavior.
2. As a new user, I want every task created inside a project workspace, so that its parent outcome is always unambiguous.
3. As a project owner, I want a project to create a dedicated workspace, so that its entry document and child tasks stay together.
4. As a project owner, I want child tasks stored under the project workspace, so that path expresses the parent relationship unambiguously.
5. As a task owner, I want to create a task in a project, so that it is part of a bounded outcome from the start.
6. As a task owner, I want to move a child task to another project, so that its parent outcome stays accurate.
7. As a user, I want project assignment to update the compatibility `所属项目` field, so that existing metadata-based views remain useful.
8. As a user, I want the task's workspace path to win when it conflicts with `所属项目`, so that the authoritative relationship is not ambiguous.
9. As a project owner, I want the project document to list current child tasks in a managed region, so that I can see progress without manually maintaining an index.
10. As a writer, I want the Workbench to preserve all text outside its managed child-task region, so that it never overwrites my project notes.
11. As a user, I want a missing child-task region added at the end of the project document, so that an older or custom project document can gain an index safely.
12. As a user, I want to convert a fleeting note to a literature or permanent note, so that knowledge can mature through the Workbench.
13. As a user, I want to convert a fleeting note into a task or project, so that an idea with a concrete outcome becomes actionable.
15. As a user, I want to return a task or project to a fleeting note when appropriate, so that I can reclassify work that no longer belongs in execution.
16. As a focus user, I want conversion blocked while a task is focused or timed, so that an active work session cannot lose its task identity.
17. As a project owner, I want conversion back to a fleeting note blocked while child tasks exist, so that no child tasks are orphaned.
18. As a user, I want conversion to retain title, body, creation date, tags, links, and task–fleeting-note relationships, so that reclassification does not lose work.
19. As a user, I want source-type-specific fields preserved as archived metadata, so that conversion remains reversible by hand and auditable.
20. As a template author, I want each of the five types to use its configured template and status defaults, so that new and converted documents follow my vault conventions.
21. As a cautious user, I want all predictable errors detected before the vault changes, so that invalid configuration or content cannot leave a partial conversion.
22. As a user, I want a destination-name collision resolved to a non-conflicting name without overwriting a vault entry, so that my existing notes are safe.
23. As an existing user, I want legacy task and project documents left untouched and unrecognized, so that adopting the new model never performs a surprise migration.
24. As an existing user, I want a legacy document explicitly converted to a fleeting note when I choose, so that I can bring selected old content into the Workbench model.
25. As a user with custom folders, I want the five default document folders to be distinct and non-overlapping, so that location remains an unambiguous destination rule.
26. As a user, I want a valid `type` frontmatter value to be authoritative, so that documents retain their identity even outside a configured folder.
27. As a user with an old file missing valid type metadata, I want the configured folder to infer its type without rewriting it, so that legacy content can be read safely.
28. As a mobile user, I want all document actions and conversion feedback to remain usable in the responsive Workbench, so that the model works across supported Obsidian clients.

## Implementation Decisions

- Define a closed `WorkbenchDocumentType` vocabulary: task, project, fleeting note, literature note, and permanent note. Use the shared terms in `CONTEXT.md`; do not introduce competing labels.
- Treat a recognized `type` frontmatter value as authoritative document-type evidence. Folder membership is only a non-mutating fallback for legacy Markdown with missing or invalid type evidence.
- Model project association from the workspace path. `所属项目` remains a compatibility mirror and is regenerated on assignment changes; it does not override the path.
- A project workspace consists of its entry project Markdown document plus a `任务/` child-task directory. Every new-model task belongs in one such child-task directory.
- The Workbench owns only the delimited child-task index region. Index rendering replaces that region atomically in planned output, or appends a fresh region when none exists.
- Introduce one runtime-independent document-model planner as the primary test seam. Given parsed source document data, configured folders/templates, desired operation, current task focus/timer state, workspace occupancy, and project child-task data, it returns either a complete immutable operation plan or a typed failure. It has no Obsidian, DOM, filesystem, or clock dependency.
- Keep Obsidian adapters thin: resolve files and metadata, provide planner input, perform planned writes and moves through Obsidian APIs, refresh Workbench state, and surface translated notices. Mutation must use compensation where a multi-file operation cannot be atomic.
- Supported conversion edges are fleeting→literature, literature→permanent, fleeting→task, fleeting→project, task→fleeting, and project→fleeting. No other type transitions are implied.
- Conversion applies the target document template and initializes target-owned `type` and `状态` fields to: task `待做`, project `进行中`, fleeting `收集`, literature `待整理`, permanent `已沉淀`.
- Conversion preserves title, body, creation time, tags, links, and existing task–fleeting-note relationships. Incompatible source-type metadata is retained as archived frontmatter rather than discarded.
- A task cannot convert while focused or while a timer is running. A project cannot convert to a fleeting note if it contains child tasks.
- Folder settings for all five types are validated together as distinct, non-overlapping vault-relative destinations. Each type has a configurable document template; setup creates only missing starter templates.
- Destination collisions create a unique non-conflicting destination name and never overwrite a vault entry.
- Legacy task and project documents outside the new workspace model are neither migrated, recognized, nor indexed. Explicit conversion to a fleeting note is the sole entry path for them.
- Changes to interactive menus, cards, dialogs, or settings UI follow the project Claymorphism skill and preserve scoped `.pvd-*` styling, accessibility states, responsive behavior, and reduced-motion behavior.

## Testing Decisions

- Test external behavior through the single document-model planner seam, not its parsing helpers or adapter internals.
- Planner tests cover every supported conversion edge, target type/status defaults, source-content preservation, archived metadata, collision-safe destination selection, and each rejection condition.
- Planner tests cover independent-task/project workspace creation, task assignment and unassignment, path precedence over `所属项目`, and correct managed-region replacement or append without modifying surrounding project text.
- Planner tests cover authoritative type frontmatter, non-mutating folder fallback for invalid/missing legacy metadata, distinct/non-overlapping folder validation, and legacy-document exclusion.
- Adapter-level tests, only where existing mocks support them, assert observable operation ordering: all preflight checks precede writes; a successful plan performs the stated vault mutations; a later failure triggers best-effort compensation and reports failure.
- UI tests assert visible available actions and notices for each type and blocked state, without asserting private menu construction or DOM implementation details.
- Follow the existing pure frontmatter, note-conversion, and template-setup unit-test style as prior art. Add manual desktop and mobile release smoke coverage for project assignment, index refresh, blocked conversions, collision handling, and legacy-document safety.
- Completion requires `npm run release:check` and review against this specification, `AGENTS.md`, `CONTEXT.md`, the ADRs, and the Claymorphism UI rules.

## Out of Scope

- Automatic migration, recognition, or indexing of legacy task or project documents.
- User-defined document types, nested projects, or projects with arbitrary task-storage layouts.
- Batch conversion, arbitrary cross-vault moves, or overwriting an existing vault entry.
- A general undo system beyond Obsidian behavior and best-effort compensation for a failed operation.
- A wholesale rewrite of the legacy plugin entry.

## Further Notes

- This specification supersedes the older three-type conversion scope where the rules conflict. The existing knowledge-note conversion planner is prior art, but the new planner owns the broader five-type model.
- The five-type model changes a persistent document boundary and project workspace contract; ADR 0003 records that durable architectural decision.
