# Pavel Dashboard

Local-first Obsidian dashboard for the Pavel knowledge vault. It turns existing Markdown notes and frontmatter into a home workspace and task workbench without moving or duplicating data.

## Features

- Home dashboard: current focus, quick capture, idea inbox, and knowledge stream.
- Task workbench: task filters, focus switching, frontmatter editing, completion, deletion, and live focus timer.
- Unified task base: the plugin reads the selected `.base` file's top-level `type` and equality filters to determine the task scope.
- Visual system: high-contrast Maximalism / Dopamine theme with a reduced-motion fallback.

## Install for development

Copy these files into your vault:

```text
<vault>/.obsidian/plugins/pavel-dashboard/
├── main.js
├── manifest.json
└── styles.css
```

Then restart Obsidian or reload the plugin and run **Open Pavel Dashboard** from the Command Palette.

## Data contract

The plugin reads existing Markdown frontmatter. No task data is stored in the plugin.

| Concept | Required fields |
| --- | --- |
| Task | `type: 任务`, `任务状态`, `任务优先级`, `计划日期` |
| Timer | `计时状态`, `计时开始时间`, `累计耗时秒`, `预计耗时分钟` |
| Idea | `type: 闪念笔记`, optional `状态`, `tags`, `date` |

The default task base is `目标与任务/任务总表.base`. Configure another `.base` file in **Settings → Pavel Dashboard → 任务数据源**.

## Development notes

This repository currently ships the directly loadable Obsidian plugin files. `data.json`, `node_modules`, and `vendor` are intentionally ignored because they are runtime or local-only artifacts.
