# Project management and creation

Approved in the design interview on 2026-10-10. This is a single-session improvement to the task workbench.

## Problem

Project creation is available only on Home. The task editor requires a project but offers no way to create one, and task-derived project filters hide empty projects.

## Accepted behavior

- Add a Projects view alongside Today, Task views, and All tasks. List every supported project workspace, including those with no tasks.
- Each project offers its entry document, child-task counts, an expandable child-task list, and New task with that project selected.
- Keep New project and New task available in every task-workbench view, including visual views. With no projects, explain the required relationship and offer project creation.
- During task creation, allow creating a project without closing the task form. Select the actual created workspace (including any collision suffix); preserve all entered task fields. Canceling project creation leaves the task form intact.
- Reject a task with no project without closing its form. Prevent duplicate submissions and keep forms open on creation errors.
- Preserve the existing project workspace, templates, task metadata, and document creation collision policy. Do not introduce independent tasks or migrate legacy documents.
- Follow the project's Claymorphism theme, keyboard operation, mobile layout, dark mode, localization, and reduced-motion conventions.

## Verification

Run the release quality gate and review against project standards and this spec. Exercise empty-project discovery, project-scoped task creation, nested project creation/cancel, duplicate names, missing selection, and preservation of task input.

## Delivery evidence

- `npm run release:check`: 9 test files / 38 tests pass, plus build, strict module typechecking, lint, metadata and syntax checks.
- Mock-Obsidian interaction smoke: missing project preserves the task draft; canceling nested creation preserves it; a duplicate project name selects the suffixed workspace; task title, date, priority, and estimate survive nested creation; empty projects appear; project-scoped creation preselects the project; duplicate submissions are blocked; errors leave the form open.
- Standards and Spec review findings addressed: theme-aware modal/input surfaces, keyboard focus after expanding child tasks, and English project-tab translation.
- Actual Obsidian desktop/mobile visual and nested-modal focus checks remain unverified in this environment.
