# Changelog

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
