# Omni Workbench

<p align="center">
  <a href="https://obsidian.md/">
    <img src="https://img.shields.io/badge/OBSIDIAN-1.9.14%2B-111111?style=flat-square&amp;logo=obsidian&amp;logoColor=white" height="28" alt="需要 Obsidian 1.9.14 或更高版本">
  </a>
  <img src="https://img.shields.io/badge/VERSION-0.3.12-65B500?style=flat-square" height="28" alt="版本 0.3.12">
  <a href="LICENSE">
    <img src="https://img.shields.io/badge/LICENSE-MIT-F97316?style=flat-square" height="28" alt="MIT 许可证">
  </a>
  <a href="README.md">
    <img src="https://img.shields.io/badge/README-ENGLISH-0284C7?style=flat-square" height="28" alt="Read in English">
  </a>
</p>

Omni Workbench 是一个为 Obsidian 打造的本地优先仪表盘和任务工作台。它将仓库中已有的 Markdown 笔记与 frontmatter 整合为专注工作主页，方便你随手记录想法、查看任务状态、选择当前专注任务并追踪用时，全程无需将笔记发送到外部服务。

## 功能

- 通过主页仪表盘集中展示当前专注任务、闪念收件箱和近期知识笔记。
- 提供任务工作台，可筛选今日、活跃、进行中、逾期和已完成任务。
- 创建、编辑、完成和删除任务笔记，同时保留以 Markdown 为核心的工作流。
- 提供本地专注计时器，并将计时数据保存在任务的 frontmatter 中。
- 从设置的任务目录读取任务，并支持自定义 frontmatter 字段映射；还可添加 `.base` 文件作为可选的 Obsidian Bases 视图。

## 隐私

Omni Workbench 坚持本地优先：它不会发起网络请求、收集遥测数据或上传仓库内容。插件只会读取设置中指定的任务、闪念、永久笔记和文献笔记目录，以及可选的任务模板与 `.base` 文件。所有任务和计时数据都保存在你的 Obsidian 仓库内，以 Markdown frontmatter 的形式存储。

## 从社区插件目录安装

插件通过审核后，打开 **设置 → 第三方插件**，搜索 **Omni Workbench**，安装并启用插件。随后可从命令面板运行 **Open Omni Workbench**。

新仓库建议先打开 **设置 → Omni Workbench**，点击 **一键初始化**。插件会安全创建三类知识文件夹、任务与项目目录、任务模板，以及可选的 Obsidian Bases 任务总表；已有文件不会被覆盖。

## 数据格式

插件使用带有 frontmatter 的 Markdown 文件。默认任务约定采用中文字段名；你可以在初始化向导或 **设置 → Omni Workbench** 中重新映射每一个字段：

```yaml
---
type: 任务
所属项目: ""
任务状态: 待做 # 待做 | 进行中 | 暂停 | 完成
任务优先级: P2 # P0 | P1 | P2
计划日期: 2026-07-22
预计耗时分钟: 25 # 可选
计时状态: 未开始 # 未开始 | 进行中 | 暂停 | 完成
计时开始时间:
累计耗时秒: 0
完成: false
---
```

专注计时器采用正向累计方式：当 `计时状态` 为 `进行中` 时，经过的秒数会累加到 `累计耗时秒`。如果设置了可选的 `预计耗时分钟`，计时标签会显示剩余时间；超时后不会停止，而是继续累计超时时间并发送一次提醒。工作台打开时，如果发现某次计时已连续运行超过 12 小时，会自动将其暂停。新任务会根据设置中的 Markdown 模板创建（默认为 `模板/任务模板.md`）；如果模板不存在，则使用上方所示的最简内置格式。

闪念笔记使用 `type: 闪念笔记`。默认任务目录为 `目标与任务/任务管理/任务`，默认 Base 文件为 `目标与任务/任务总表.base`。你可以在 **设置 → Omni Workbench** 中调整目录、字段名、任务模板和 Base 文件路径。`.base` 文件只是可选的配套视图，插件不会解析其中的筛选表达式。

## 开发

本仓库特意将插件源码保留为清晰可读的原生 JavaScript，即 [`main.js`](main.js)；这也是 Obsidian 实际加载的文件。代码审查不需要生成或压缩后的源码。

环境要求：Node.js 20 或更高版本。

```bash
npm run release:check
```

该命令会检查源码语法、验证插件清单，并在 `dist/` 中生成可用于发布的文件：

```text
dist/
├── main.js
├── manifest.json
└── styles.css
```

本地开发时，将 `main.js`、`manifest.json` 和 `styles.css` 复制到：

```text
<vault>/.obsidian/plugins/pavel-dashboard/
```

完成修改后，重启 Obsidian 或重新加载插件。

## 发布流程

1. 使用 `x.y.z` 格式更新 `manifest.json` 中的版本号。
2. 运行 `npm run release:check`。
3. 提交版本变更，并推送一个与版本号完全相同的标签，例如 `0.1.1`（不添加 `v` 前缀）。
4. 仓库内置的 GitHub Action 会创建 GitHub Release，并上传 `main.js`、`manifest.json` 和 `styles.css`。
5. 首个公开版本需提交到 [Obsidian Community](https://community.obsidian.md/)。

每次执行发布工作流时，还会为三个发布文件生成 GitHub 构件证明。可使用以下命令验证下载的文件：

```bash
gh attestation verify <asset-path> -R PavelPeng7/focus-workbench
```

## 许可证

[MIT](LICENSE)
