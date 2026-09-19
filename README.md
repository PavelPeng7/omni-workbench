# Omni Workbench

<p align="center">
  <a href="https://obsidian.md/">
    <img src="https://img.shields.io/badge/OBSIDIAN-1.9.14%2B-111111?style=flat-square&amp;logo=obsidian&amp;logoColor=white" height="28" alt="Requires Obsidian 1.9.14 or newer">
  </a>
  <img src="https://img.shields.io/badge/VERSION-0.3.14-65B500?style=flat-square" height="28" alt="Version 0.3.14">
  <a href="LICENSE">
    <img src="https://img.shields.io/badge/LICENSE-MIT-F97316?style=flat-square" height="28" alt="MIT license">
  </a>
  <a href="README.zh-CN.md">
    <img src="https://img.shields.io/badge/README-%E4%B8%AD%E6%96%87-0284C7?style=flat-square" height="28" alt="阅读简体中文">
  </a>
</p>

A local-first dashboard and task workbench for Obsidian. It turns Markdown notes and frontmatter already in your vault into a focused home workspace: capture ideas, view task status, choose a focus task, and track time without sending your notes anywhere.

## What it does

- Shows a home dashboard with the current focus, idea inbox, and recent knowledge notes.
- Provides a task workbench with filters for today, active, in-progress, overdue, and completed tasks.
- Creates, edits, completes, and deletes task notes while preserving the Markdown-first workflow.
- Runs a local focus timer stored in each task's frontmatter.
- Reads tasks from the configured task folder using a configurable frontmatter field mapping; a `.base` file can be added as an optional Obsidian Bases view.

## Privacy

Omni Workbench is local-first. It does not make network requests, collect telemetry, or upload vault content. It reads only the task, inbox, permanent-note, and literature-note folders configured in its settings, plus the optional task template and `.base` file. All task and timer data stays in Markdown frontmatter inside your vault.

## Install from the community directory

After the plugin is approved, open **Settings → Community plugins**, search for **Omni Workbench**, install it, and enable it. Run **Open Omni Workbench** from the Command Palette.

For a new vault, open **Settings → Omni Workbench** and choose **One-click initialization**. It safely creates the recommended knowledge folders, task and project folders, a starter task template, and an optional Obsidian Bases task table. Existing files are never overwritten.

## Data format

The plugin works with Markdown files that use frontmatter. Its default task conventions use Chinese field names, and every field name can be remapped in the setup wizard or **Settings → Omni Workbench**:

```yaml
---
type: 任务
所属项目: ""
任务状态: 待做 # 待做 | 进行中 | 暂停 | 完成
任务优先级: P2 # P0 | P1 | P2
计划日期: 2026-07-22
预计耗时分钟: 25 # optional
计时状态: 未开始 # 未开始 | 进行中 | 暂停 | 完成
计时开始时间:
累计耗时秒: 0
完成: false
---
```

The focus timer counts up: elapsed seconds accumulate in `累计耗时秒` while `计时状态` is `进行中`. With the optional `预计耗时分钟` estimate set, the timer pill shows remaining time and keeps counting into overtime (with a one-time notice) instead of stopping; a session left running for more than 12 hours is auto-paused when the workbench opens. New tasks are created from the Markdown template configured in settings (default `模板/任务模板.md`), falling back to the minimal built-in format above when the file does not exist.

Ideas use `type: 闪念笔记`. The default task location is `目标与任务/任务管理/任务`, and the default Base file is `目标与任务/任务总表.base`. Folders, field names, the task template, and the Base path can all be adapted to your vault from **Settings → Omni Workbench**. The `.base` file is an optional companion view; the plugin does not interpret its filter expressions.

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
3. Commit the version change and push a tag with the exact same version, for example `0.1.1` (no `v` prefix).
4. The included GitHub Action creates a GitHub Release and uploads `main.js`, `manifest.json`, and `styles.css` as assets.
5. For the first public version, submit the repository at [Obsidian Community](https://community.obsidian.md/).

Each release workflow also generates GitHub artifact attestations for the three release assets. To verify a downloaded asset, run:

```bash
gh attestation verify <asset-path> -R PavelPeng7/focus-workbench
```

## License

[MIT](LICENSE)
