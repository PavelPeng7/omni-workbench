# Changelog

## 0.3.11

### Fixed

- Added `versions.json` at the repository root mapping every released version to its `minAppVersion`, so Obsidian's community review and older app versions can resolve plugin compatibility.
- The release check now fails the build if `versions.json` is missing, lacks an entry for the current version, or disagrees with `manifest.minAppVersion`.

## 0.3.10

### Added

- The "全部任务" and "今日任务" views now support multi-select batch editing: each task card has a checkbox in its top-right corner, and Ctrl/Cmd+click toggles selection. A selection toolbar appears for select-all, batch-edit, and clear-selection.

### Changed

- "全部任务" and "今日任务" task cards now expose a selection checkbox in the top-right corner alongside the existing focus and edit affordances.
- Right-clicking a task card opens single-task editing when one task is selected, and the multi-select batch editor when more than one is selected.

## 0.3.9

### Added

- Creating a task now opens a focused editor modal with title, project, priority, status, planned date, and estimated duration, saving in place without navigating away from the workbench.
- The knowledge card workflow's two queues (待处理 / 过期闪念) can now be collapsed and expanded.

### Changed

- The fleeting-note processing area is renamed from "闪念处理" to "知识卡片笔记流程", and the home quick action to "知识卡片流程".
- Queue naming is clarified: "超过 7 天" becomes "过期闪念" and "七天处理期" becomes "待处理", with 待处理 listed above 过期闪念.

### Improved

- The knowledge card workflow now uses a cohesive Claymorphism treatment: unified glass-clay surface for the two queues, refined step badges and flow arrows, tighter spacing, and smoother visual bridging into the knowledge card library.
- Settings paths are normalized with the official `normalizePath` API for consistent slash, duplicate-slash, and trailing-slash handling.

## 0.3.8

### Changed

- Standardized the user-facing plugin name as **Omni Workbench** across the Obsidian manifest, workspace title, commands, notices, and documentation.
- Kept the stable `pavel-dashboard` plugin ID so existing installations and settings continue to work.

## 0.3.7

### Added

- Tasks can create linked fleeting notes directly, preserving the path from action to captured idea and onward to literature or permanent notes.
- The knowledge workbench now includes a seven-day fleeting-note triage flow with due, overdue, linked-task, and processing-state visualization.
- A project-level UI design skill documents and enforces the plugin's Claymorphism theme for future interface changes.

### Changed

- The knowledge workbench now follows the task workbench's visual hierarchy with a roomier, more focused layout.
- Task and fleeting-note editing has moved from expanded card panels to focused right-click modals.
- Clicking a task card or task label now sets the current focus instead of opening its document; documents open only through explicit actions.
- The redundant focus switcher list has been removed from the focus panel.

### Improved

- Completed tasks can be inspected as the current focus without exposing invalid timer or completion actions.
- Keyboard labels, focus states, responsive layouts, and dark-theme styling now reflect the updated interactions.

## 0.3.4

### Added

- The Today Tasks view now includes a persistent quick-create button above the task list, including when no tasks are scheduled for today.

### Fixed

- The Today Tasks quick action is rendered outside the refreshable results container so task-list updates no longer remove it.

## 0.3.3

### Fixed

- Global shortcuts (N, Cmd/Ctrl+K) no longer fire while typing in the editor, form fields, or other panes; they only respond when the workbench is the active leaf.
- Creating notes with an IME no longer submits early when Enter confirms a composition candidate.
- Re-rendering preserves the scroll position and search-box focus instead of jumping back to the top.
- Full dark theme support for the dashboard and the calendar, timeline, and statistics views.
- Deleting a task and initializing the folder structure now use an in-app confirm dialog that also works on mobile.
- Task templates missing a mapped frontmatter field now get the field appended instead of silently dropping the value.

### Changed

- Selecting a task card no longer changes the current focus; use the new "设为焦点" action, the focus switcher, or start a focus session.
- The statistics status chart uses mutually exclusive buckets (待做/进行中/暂停/已完成) instead of overlapping counts.
- Completed tasks sort by completion date, falling back to modification time.
- The workbench opens in a main-area tab instead of a split.
- Stale focus sessions (running over 12 hours) are auto-paused periodically while the view stays open, not only when it opens.
- Knowledge tab filter buttons update results in place, like the search box.

## 0.2.8

### Added

- Task workbench primary views for Today, visual planning, and all tasks.
- Calendar, project timeline, and task statistics views with shared project, priority, and status filters.
- Notion-inspired timeline grouping and status charts styled to match Focus Workbench.
- Card-note workflow for fleeting, literature, and permanent notes with article navigation.
- Optional initializer for the standard card-note and task repository structure.
- Runtime-scoped visual styles so task visualization markup and CSS load together.

### Improved

- Completed tasks stay collapsed until explicitly expanded.
- The focus panel remains available beside task views and adapts to narrow screens.
- New task filenames use the entered title without automatically adding a date or time.
- Timeline tasks use separate rows to prevent overlapping within the same project.

### Fixed

- Today tasks are detected consistently from mapped task fields.
- Task editor project options are populated from the configured project folder.
- Statistics SVG icons have explicit dimensions and cannot expand across the page.
- Visual view styles are isolated from legacy calendar, timeline, and statistics rules.

## 0.2.1

### Added

- Remaining-time percentage and animated liquid level for the Current Focus task.

### Improved

- Reorganized Current Focus metadata, stage indicators, actions, and focus switching for clearer interaction.
- Moved task search and status filters below Current Focus.
- Refined the responsive water animation, button reflections, and card edge glow.

## 0.2.0

### Added

- Setup wizard, configurable folders, and frontmatter field mapping (schema).
- Knowledge navigation tab, task and article search, and keyboard shortcuts (Ctrl/Cmd+K, N).
- Project dropdown in the task editor, populated from the configured project folder.
- Filename validation for newly created notes.
- New tasks are created from a configurable Markdown template (default `模板/任务模板.md`) with a built-in fallback.
- The workbench auto-refreshes when watched notes change outside the plugin.
- Overtime notice when a focus session passes its estimate; sessions left running over 12 hours are auto-paused on open.

### Fixed

- Date-only frontmatter values are parsed in local time, so today and overdue filters follow the local calendar.
- Pausing the previously focused task now writes through the schema-mapped status field.

### Changed

- The focus timer counts up via `累计耗时秒` with an optional estimate; `倒计时剩余秒` is no longer used.
- The `.base` file is an optional companion view; the plugin no longer interprets its filter expressions.

## 0.1.3

### Improved

- Restricted note discovery to folders explicitly configured in Focus Workbench instead of enumerating the entire vault.
- Added GitHub Artifact Attestations for release assets.
- Added an npm lockfile for reproducible builds.
- Removed `!important` declarations to improve compatibility with Obsidian themes and user styles.

## 0.1.2

### Fixed

- Restored the stable plugin ID `pavel-dashboard` so existing Community directory records and installations continue to resolve correctly.

## 0.1.1

### Changed

- Renamed the plugin from **Pavel Dashboard** to **Focus Workbench**.
- Renamed the plugin ID to `focus-workbench` and updated its view and command identifiers.
- Refined the public description to reflect task management, focus, and knowledge notes.

## 0.1.0

### Added

- Initial public release with a local-first dashboard, task workbench, idea capture, and focus timer.
