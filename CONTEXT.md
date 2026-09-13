# Omni Workbench context

Omni Workbench is a local-first Obsidian dashboard that connects task execution, focus timers, fleeting-note triage, and knowledge navigation. It ships as one community-plugin bundle and must remain usable on desktop and mobile Obsidian.

## Shared language

- **Workbench**: the plugin view that hosts home, task, and knowledge workflows.
- **Workbench document**: a Markdown file managed by the Workbench and assigned exactly one document type: task, project, fleeting note, literature note, or permanent note.
- **Task**: a workbench document for an actionable unit of work.
- **Project**: a parent workbench document for a bounded outcome. It is the entry document of a project workspace and indexes its child tasks.
- **Project workspace**: a project-specific directory containing `项目.md` and a `任务/` subdirectory for that project's child tasks.
- **Workbench project root**: the new-model default location for project workspaces, `Omni Workbench/项目/`.
- **Child task**: a task Markdown file stored in the `任务/` subdirectory of its project workspace.
- **Legacy task or project document**: a pre-workspace task or project Markdown file. It is outside the new model, remains untouched, and is not migrated, recognized, or indexed by the Workbench; a user may explicitly convert it to a fleeting note to bring it into the new model.
- **Project association**: the parent relationship derived from a task's workspace path. `所属项目` is a compatibility mirror of that relationship and loses to the path on conflict.
- **Project assignment**: selecting a project while creating a task, or moving a child task between project workspaces. Every new-model task belongs to exactly one project; the Workbench updates the compatibility mirror and affected child-task indexes.
- **Child-task index**: the plugin-managed `## 子任务` section of a project document, delimited by `<!-- omni:child-tasks:start -->` and `<!-- omni:child-tasks:end -->`. It lists child-task links, states, and priorities; the plugin changes only its marked managed region. If the region is missing, it appends a replacement at the end of the document.
- **Fleeting note**: a workbench document for a captured idea awaiting conversion, consolidation, or disposal.
- **Literature note**: a workbench document that records information derived from a source.
- **Permanent note**: a workbench document that expresses a durable, independently understandable idea.
- **Document conversion**: changing a workbench document's sole type, applying the target type template and relocating it to that type's default folder. The supported knowledge directions are fleeting→literature→permanent, fleeting→task, fleeting→project, task→fleeting, and project→fleeting. A task being promoted or returned must not be focused or have a running timer. A project containing child tasks cannot return to a fleeting note. Conversion preserves the title, body, creation time, tags, links, and existing task–fleeting-note relationships; incompatible source-type metadata is retained as archived frontmatter rather than silently discarded. A conflicting target name is resolved by generating a non-conflicting destination name, never by overwriting a vault entry.
- **Archived metadata**: source-type-specific frontmatter retained during a document conversion after it no longer applies to the document's current type.
- **Default document folder**: the configurable destination folder for each workbench document type. The five folders must be distinct and non-overlapping. Existing documents outside these folders remain recognizable by their type frontmatter and are not forcibly migrated.
- **Document type evidence**: a recognized `type` frontmatter value is the authoritative type of a workbench document. Only a legacy file with missing or invalid type frontmatter may be inferred from its configured default folder; that inference does not rewrite the file.
- **Document template**: the configurable Markdown template for one workbench document type. Each of the five types has its own template, and setup creates only missing starter templates.
- **Target-owned fields**: a target document template's `type` and `状态` fields. Conversion writes these fields and initializes target-specific defaults: task=待做, project=进行中, fleeting=收集, literature=待整理, permanent=已沉淀.
- **Focus task**: the task selected as the current work target. At most one timer should be running.
- **Release artifact**: the generated root `main.js` plus `manifest.json` and `styles.css`; the same three files are copied to `dist/`.
- **Legacy entry**: `src/main.ts`, the migrated monolithic implementation temporarily isolated from strict checking while typed deep modules are extracted.

## Boundaries

- Obsidian owns vault persistence, metadata, workspace leaves, and lifecycle cleanup.
- `src/core/` contains runtime-independent, strictly typed domain logic. It must not import Obsidian or browser globals.
- Visible UI remains scoped to `.pvd-*` and follows the local Claymorphism skill referenced by `AGENTS.md`.
- `main.js` is generated. Edit source under `src/`, then run `npm run build`.

## Current direction

New behavior enters through typed, tested modules with small interfaces. The legacy entry is reduced incrementally through specs and tracer-bullet tickets; a wholesale rewrite is outside the current baseline.
