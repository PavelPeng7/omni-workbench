# Pavel Dashboard

A local-first dashboard and task workbench for Obsidian. It turns Markdown notes and frontmatter already in your vault into a focused home workspace: capture ideas, view task status, choose a focus task, and track time without sending your notes anywhere.

## What it does

- Shows a home dashboard with the current focus, idea inbox, and recent knowledge notes.
- Provides a task workbench with filters for today, active, in-progress, overdue, and completed tasks.
- Creates, edits, completes, and deletes task notes while preserving the Markdown-first workflow.
- Runs a local focus timer stored in each task's frontmatter.
- Optionally reads a `.base` file to scope the task list; otherwise it reads every note with `type: 任务`.

## Privacy

Pavel Dashboard is local-first. It does not make network requests, collect telemetry, or upload vault content. All task and timer data stays in Markdown frontmatter inside your vault.

## Install from the community directory

After the plugin is approved, open **Settings → Community plugins**, search for **Pavel Dashboard**, install it, and enable it. Run **Open Pavel Dashboard** from the Command Palette.

## Data format

The plugin works with Markdown files that use frontmatter. Its current task conventions use Chinese field names:

```yaml
---
type: 任务
所属项目: ""
任务状态: 待做 # 待做 | 进行中 | 暂停 | 完成
任务优先级: P2 # P0 | P1 | P2
计划日期: 2026-07-22
计时状态: 未开始 # 未开始 | 进行中
计时开始时间:
累计耗时秒: 0
完成: false
---
```

Ideas use `type: 闪念笔记`. The default task location is `目标与任务/任务管理/任务`, and the default Base file is `目标与任务/任务总表.base`. Both paths can be adapted to your vault from **Settings → Pavel Dashboard**.

## Development

This repository intentionally keeps the plugin source as readable, plain JavaScript in [`main.js`](main.js); it is the exact file loaded by Obsidian. No generated or minified source is required to review the plugin.

Requirements: Node.js 20 or newer.

```bash
npm run release:check
```

The command syntax-checks the source, validates the manifest, and creates release-ready files in `dist/`:

```text
dist/
├── main.js
├── manifest.json
└── styles.css
```

For local development, copy `main.js`, `manifest.json`, and `styles.css` into:

```text
<vault>/.obsidian/plugins/pavel-dashboard/
```

Restart Obsidian or reload the plugin after making changes.

## Release process

1. Update the version in `manifest.json` using `x.y.z` format.
2. Run `npm run release:check`.
3. Commit the version change and push a tag with the exact same version, for example `0.1.0` (no `v` prefix).
4. The included GitHub Action creates a GitHub Release and uploads `main.js`, `manifest.json`, and `styles.css` as assets.
5. For the first public version, submit the repository at [Obsidian Community](https://community.obsidian.md/).

## License

[MIT](LICENSE)
