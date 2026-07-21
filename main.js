const { ItemView, Modal, Notice, Plugin, PluginSettingTab, Setting } = require("obsidian");

const VIEW_TYPE = "pavel-dashboard-view";
const DEFAULT_SETTINGS = { taskBasePath: "目标与任务/任务总表.base" };

class TextPromptModal extends Modal {
  constructor(app, title, placeholder, submit) { super(app); this.title = title; this.placeholder = placeholder; this.submit = submit; }
  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h2", { text: this.title });
    const input = contentEl.createEl("input", { type: "text", placeholder: this.placeholder });
    const actions = contentEl.createDiv({ cls: "pvd-modal-actions" });
    const save = actions.createEl("button", { text: "创建", cls: "mod-cta" });
    const commit = async () => { const value = input.value.trim(); if (!value) return; await this.submit(value); this.close(); };
    save.addEventListener("click", () => void commit());
    input.addEventListener("keydown", event => { if (event.key === "Enter") void commit(); });
    window.setTimeout(() => input.focus(), 0);
  }
}

class TaskEditorModal extends Modal {
  constructor(app, file, data, submit) { super(app); this.file = file; this.data = data; this.submit = submit; }
  onOpen() {
    const { contentEl } = this; const data = this.data;
    contentEl.createEl("h2", { text: `编辑任务：${this.file.basename}` });
    const form = contentEl.createDiv({ cls: "pvd-task-editor" });
    const field = (label, element) => { const row = form.createEl("label"); row.createSpan({ text: label }); row.appendChild(element); return element; };
    const project = field("所属项目", document.createElement("input")); project.type = "text"; project.placeholder = "项目名称（可选）"; project.value = String(data.project || "");
    const priority = field("优先级", document.createElement("select")); ["P0", "P1", "P2"].forEach(value => priority.createEl("option", { text: value, value })); priority.value = data.priority || "P2";
    const status = field("任务状态", document.createElement("select")); ["待做", "进行中", "暂停", "完成"].forEach(value => status.createEl("option", { text: value, value })); status.value = data.status || "待做";
    const date = field("计划日期", document.createElement("input")); date.type = "date"; date.value = data.plan || "";
    const estimate = field("预计耗时（分钟）", document.createElement("input")); estimate.type = "number"; estimate.min = "0"; estimate.step = "1"; estimate.value = data.estimate || "";
    const actions = contentEl.createDiv({ cls: "pvd-modal-actions" });
    const save = actions.createEl("button", { text: "保存", cls: "mod-cta" });
    save.addEventListener("click", async () => { const minutes = estimate.value.trim(); if (minutes && (!/^\d+$/.test(minutes) || Number(minutes) < 0)) { new Notice("预计耗时请输入大于等于 0 的整数分钟数。"); return; } await this.submit({ project: project.value.trim(), priority: priority.value, status: status.value, plan: date.value, estimate: minutes }); this.close(); });
  }
}

class PavelDashboardView extends ItemView {
  constructor(leaf, plugin) { super(leaf); this.plugin = plugin; this.tab = "home"; this.taskFilter = "today"; this.focusPath = ""; }
  getViewType() { return VIEW_TYPE; }
  getDisplayText() { return "Pavel Dashboard"; }
  getIcon() { return "layout-dashboard"; }
  async onOpen() { this.sourceTasks = []; await this.render(); this.timerId = window.setInterval(() => this.updateTimers(), 1000); }
  async onClose() { if (this.timerId) window.clearInterval(this.timerId); }

  config() {
    const file = this.app.vault.getAbstractFileByPath("知识库配置.md");
    const fm = file ? this.app.metadataCache.getFileCache(file)?.frontmatter || {} : {};
    const path = (key, fallback) => String(fm[key] || fallback).replace(/^\.\//, "").replace(/\/$/, "");
    const goals = path("goals_folder", "目标与任务");
    return { inbox: path("inbox_folder", "闪念笔记"), permanent: path("permanent_folder", "永久笔记"), literature: path("literature_folder", "文献笔记"), goals, task: path("task_folder", `${goals}/任务管理/任务`), taskBase: this.plugin.settings.taskBasePath };
  }
  files() { return this.app.vault.getMarkdownFiles(); }
  meta(file) { return this.app.metadataCache.getFileCache(file)?.frontmatter || {}; }
  starts(file, dir) { return file.path === dir || file.path.startsWith(`${dir}/`); }
  useful(file) { return file.extension === "md" && file.basename !== "首页" && !file.name.startsWith("README"); }
  date(value) {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value.toJSDate === "function") return value.toJSDate();
    const parsed = new Date(String(value).slice(0, 10).replaceAll("/", "-"));
    return Number.isFinite(parsed.getTime()) ? parsed : null;
  }
  today() { const date = new Date(); date.setHours(0, 0, 0, 0); return date; }
  dateKey(value) { const date = value || this.today(); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
  taskStatus(file) { return String(this.meta(file)["任务状态"] || "待做"); }
  taskDone(file) { return this.taskStatus(file) === "完成" || this.meta(file)["完成"] === true; }
  taskPlan(file) { const fm = this.meta(file); return this.date(fm["计划开始时间"] || fm["计划日期"] || fm["预计完成时间"]); }
  priority(file) { const value = String(this.meta(file)["任务优先级"] || "P2"); return ["P0", "P1", "P2"].includes(value) ? value : "P2"; }
  timerState(file) { return String(this.meta(file)["计时状态"] || "未开始"); }
  expectedSeconds(file) { return Math.max(0, Number(this.meta(file)["预计耗时分钟"]) || 0) * 60; }
  elapsedSeconds(file, now = Date.now()) { const fm = this.meta(file); const stored = Math.max(0, Number(fm["累计耗时秒"]) || 0); const started = this.timerState(file) === "进行中" ? this.date(fm["计时开始时间"]) : null; return stored + (started ? Math.max(0, Math.floor((now - started.getTime()) / 1000)) : 0); }
  formatDuration(seconds) { const value = Math.max(0, Math.floor(Math.abs(seconds))); return `${seconds < 0 ? "-" : ""}${String(Math.floor(value / 3600)).padStart(2, "0")}:${String(Math.floor(value % 3600 / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`; }
  timerLabel(file) { const expected = this.expectedSeconds(file); const elapsed = this.elapsedSeconds(file); return expected ? `剩余 ${this.formatDuration(expected - elapsed)}` : `已专注 ${this.formatDuration(elapsed)}`; }
  allTaskFiles() { return this.files().filter(file => this.meta(file).type === "任务"); }
  tasks() { return this.sourceTasks || []; }
  async refreshTaskSource() {
    const allTasks = this.allTaskFiles();
    const basePath = this.config().taskBase;
    const base = this.app.vault.getAbstractFileByPath(basePath);
    if (!base || base.extension !== "base") { this.sourceTasks = allTasks; this.sourceMode = "fallback"; return; }
    const topLevel = (await this.app.vault.cachedRead(base)).split(/\nviews:/)[0];
    const typeMatch = topLevel.match(/note\.type\s*==\s*["']([^"']+)["']/);
    const equals = [...topLevel.matchAll(/note\["([^"]+)"\]\s*==\s*["']([^"']*)["']/g)];
    this.sourceTasks = allTasks.filter(file => {
      const fm = this.meta(file);
      if (typeMatch && String(fm.type || "") !== typeMatch[1]) return false;
      return equals.every(([, field, value]) => String(fm[field] ?? "") === value);
    });
    this.sourceMode = "base";
  }
  compareTasks(a, b) { const rank = { P0: 0, P1: 1, P2: 2 }; return rank[this.priority(a)] - rank[this.priority(b)] || (this.taskPlan(a)?.getTime() || Infinity) - (this.taskPlan(b)?.getTime() || Infinity) || a.basename.localeCompare(b.basename, "zh-CN"); }
  focusTask(tasks) { const active = tasks.filter(file => !this.taskDone(file)); return active.find(file => file.path === this.focusPath) || active.find(file => this.timerState(file) === "进行中") || active.filter(file => this.taskPlan(file)?.getTime() === this.today().getTime()).sort((a, b) => this.compareTasks(a, b))[0] || active.sort((a, b) => this.compareTasks(a, b))[0]; }
  async setFocus(file) { this.focusPath = file.path; await this.render(); }
  async openFile(fileOrPath) {
    const path = typeof fileOrPath === "string" ? fileOrPath : fileOrPath?.path;
    const file = path ? this.app.vault.getAbstractFileByPath(path) : null;
    if (!file || file.children) { new Notice(`无法打开：${path || "未指定文件"}`); return; }
    await this.app.workspace.getLeaf(false).openFile(file);
  }
  button(parent, text, action, cls = "") { const button = parent.createEl("button", { text, cls }); button.addEventListener("click", () => void action()); return button; }
  timer(parent, file) { return parent.createEl("strong", { cls: `pvd-timer ${this.timerState(file) === "进行中" ? "is-running" : ""}`, text: this.timerLabel(file), attr: { "data-pvd-timer": file.path } }); }
  updateTimers() { this.contentEl.querySelectorAll("[data-pvd-timer]").forEach(element => { const file = this.app.vault.getAbstractFileByPath(element.getAttribute("data-pvd-timer")); if (!file || file.children) return; element.textContent = this.timerLabel(file); element.classList.toggle("is-running", this.timerState(file) === "进行中"); }); }

  async render() {
    await this.refreshTaskSource();
    const root = this.contentEl;
    root.empty();
    root.addClass("pvd-root");
    const shell = root.createDiv({ cls: "pvd-shell" });
    const header = shell.createEl("header", { cls: "pvd-header" });
    const title = header.createDiv();
    title.createEl("p", { text: "PERSONAL WORKSPACE" });
    title.createEl("h1", { text: this.tab === "home" ? "今天，做重要的事。" : "任务指挥舱" });
    title.createSpan({ text: this.dateKey() });
    const nav = header.createDiv({ cls: "pvd-tabs" });
    this.button(nav, "首页", async () => { this.tab = "home"; await this.render(); }, this.tab === "home" ? "is-active" : "");
    this.button(nav, "任务工作台", async () => { this.tab = "tasks"; await this.render(); }, this.tab === "tasks" ? "is-active" : "");
    this.button(nav, "打开任务总表", () => this.openFile(this.config().taskBase));
    this.button(nav, "刷新", () => this.render());
    if (this.tab === "home") await this.renderHome(shell); else await this.renderTasks(shell);
  }

  async renderHome(shell) {
    const cfg = this.config(); const tasks = this.tasks(); const active = tasks.filter(file => !this.taskDone(file));
    const focus = this.focusTask(tasks);
    const focusCard = shell.createEl("section", { cls: "pvd-focus pvd-card" });
    const copy = focusCard.createDiv(); copy.createEl("p", { text: "MISSION CONTROL" });
    copy.createEl("h2", { text: focus ? focus.basename : "还没有可推进的任务" });
    const project = focus ? String(this.meta(focus)["所属项目"] || "未关联项目").replace(/^\[\[|\]\]$/g, "") : "创建一项任务后，它会自动出现在这里。";
    copy.createSpan({ text: focus ? `${project} · ${this.taskStatus(focus)} · ${this.priority(focus)}` : project });
    if (focus) this.timer(copy, focus);
    const actions = focusCard.createDiv({ cls: "pvd-actions" });
    if (focus) { this.button(actions, this.timerState(focus) === "进行中" ? "暂停专注" : "开始专注", () => this.toggleTimer(focus), "mod-cta"); this.button(actions, "编辑", () => this.editTask(focus)); this.button(actions, "完成", () => this.complete(focus)); this.button(actions, "查看", () => this.openFile(focus)); }
    else this.button(actions, "新建任务", () => this.createTask(), "mod-cta");

    const quick = shell.createDiv({ cls: "pvd-quick" });
    this.button(quick, "💡 记录灵感", () => this.createIdea());
    this.button(quick, "✓ 新建任务", () => this.createTask());
    this.button(quick, "打开任务工作台", async () => { this.tab = "tasks"; await this.render(); });
    const inbox = this.files().filter(file => this.starts(file, cfg.inbox) && this.useful(file))
      .filter(file => !["已处理", "完成", "归档"].includes(String(this.meta(file)["状态"] || this.meta(file)["处理状态"] || "收集")))
      .sort((a, b) => b.stat.mtime - a.stat.mtime).slice(0, 5);
    const inboxCard = shell.createEl("section", { cls: "pvd-card pvd-inbox" });
    const inboxHead = inboxCard.createDiv({ cls: "pvd-section-head" });
    const inboxCopy = inboxHead.createDiv(); inboxCopy.createEl("h2", { text: "灵感收集箱" }); inboxCopy.createEl("p", { text: "先快速捕捉，之后再整理成任务或知识卡片。" });
    this.button(inboxHead, "记录灵感", () => this.createIdea(), "mod-cta");
    const ideas = inboxCard.createDiv({ cls: "pvd-ideas" });
    if (!inbox.length) ideas.createEl("p", { text: "收集箱是空的。下一条灵感，先记下来。" });
    inbox.forEach(file => {
      const row = ideas.createDiv({ cls: "pvd-idea" }); const tags = Array.isArray(this.meta(file).tags) ? this.meta(file).tags.slice(0, 2).map(tag => `#${tag}`).join(" ") : "未分类";
      const ideaCopy = row.createDiv(); ideaCopy.createEl("strong", { text: file.basename }); ideaCopy.createSpan({ text: `${tags} · ${this.dateKey(new Date(file.stat.mtime))}` });
      const ideaActions = row.createDiv({ cls: "pvd-actions" }); this.button(ideaActions, "打开", () => this.openFile(file)); this.button(ideaActions, "已处理", () => this.archiveIdea(file));
    });
    const stream = shell.createEl("section", { cls: "pvd-card pvd-stream" });
    stream.createEl("h2", { text: "知识流" }); stream.createEl("p", { text: "从捕捉到沉淀，最近的知识卡片始终在眼前。" });
    const lanes = stream.createDiv({ cls: "pvd-lanes" });
    [["捕捉中", cfg.inbox], ["正在沉淀", cfg.permanent], ["阅读输入", cfg.literature]].forEach(([name, dir]) => {
      const lane = lanes.createDiv({ cls: "pvd-lane" }); lane.createEl("h3", { text: name });
      const notes = this.files().filter(file => this.starts(file, dir) && this.useful(file)).sort((a, b) => b.stat.mtime - a.stat.mtime).slice(0, 3);
      if (!notes.length) lane.createEl("span", { text: "暂无笔记" });
      notes.forEach(file => { const note = this.button(lane, "", () => this.openFile(file), "pvd-note"); note.createEl("strong", { text: file.basename }); note.createSpan({ text: this.dateKey(new Date(file.stat.mtime)) }); });
    });
  }

  async renderTasks(shell) {
    const cfg = this.config(); const tasks = this.tasks(); const active = tasks.filter(file => !this.taskDone(file)); const today = this.today();
    if (!this.app.vault.getAbstractFileByPath(cfg.taskBase)) {
      const setup = shell.createEl("section", { cls: "pvd-card pvd-source-warning" });
      setup.createEl("h2", { text: "尚未指定任务总表" });
      setup.createEl("p", { text: "插件仍可读取任务笔记，但请在插件设置中指定现有 .base 文件，或一键创建统一的任务总表。" });
      this.button(setup, "打开插件设置", () => { this.app.setting.open(); this.app.setting.openTabById(this.plugin.manifest.id); }, "mod-cta");
    }
    const summary = shell.createDiv({ cls: "pvd-task-summary" });
    [["今日", active.filter(file => this.taskPlan(file)?.getTime() === today.getTime()).length], ["进行中", active.filter(file => this.taskStatus(file) === "进行中").length], ["已逾期", active.filter(file => { const plan = this.taskPlan(file); return plan && plan < today; }).length], ["待推进", active.length]].forEach(([label, count]) => { const stat = summary.createDiv(); stat.createEl("b", { text: String(count) }); stat.createSpan({ text: label }); });
    const filters = { today: "今日", active: "全部待办", doing: "进行中", overdue: "已逾期", done: "已完成" };
    const filterBar = shell.createDiv({ cls: "pvd-filter" });
    Object.entries(filters).forEach(([key, label]) => this.button(filterBar, label, async () => { this.taskFilter = key; await this.render(); }, this.taskFilter === key ? "is-active" : ""));
    const focus = this.focusTask(tasks);
    if (focus) {
      const mission = shell.createEl("section", { cls: "pvd-card pvd-mission" }); mission.createEl("p", { text: "CURRENT FOCUS" }); mission.createEl("h2", { text: focus.basename }); this.timer(mission, focus);
      const track = mission.createDiv({ cls: "pvd-stage" }); ["待做", "进行中", "暂停", "完成"].forEach(stage => track.createEl("span", { text: stage, cls: this.taskStatus(focus) === stage ? "is-current" : this.taskDone(focus) ? "is-done" : "" }));
      const missionActions = mission.createDiv({ cls: "pvd-actions" }); this.button(missionActions, this.timerState(focus) === "进行中" ? "暂停专注" : "开始专注", () => this.toggleTimer(focus), "mod-cta"); this.button(missionActions, "编辑", () => this.editTask(focus)); this.button(missionActions, "完成", () => this.complete(focus));
      const switcher = mission.createDiv({ cls: "pvd-focus-switcher" }); switcher.createSpan({ text: "切换焦点" }); const chips = switcher.createDiv(); active.sort((a, b) => this.compareTasks(a, b)).slice(0, 6).forEach(file => this.button(chips, file.basename, () => this.setFocus(file), file.path === focus.path ? "is-active" : ""));
    }
    const filtered = tasks.filter(file => {
      const plan = this.taskPlan(file); if (this.taskFilter === "today") return !this.taskDone(file) && plan?.getTime() === today.getTime();
      if (this.taskFilter === "active") return !this.taskDone(file); if (this.taskFilter === "doing") return !this.taskDone(file) && this.taskStatus(file) === "进行中";
      if (this.taskFilter === "overdue") return !this.taskDone(file) && plan && plan < today; return this.taskDone(file);
    }).sort((a, b) => this.compareTasks(a, b));
    const board = shell.createEl("section", { cls: "pvd-card pvd-board" }); board.createEl("h2", { text: `${filters[this.taskFilter]} · ${filtered.length} 项` });
    if (!filtered.length) board.createEl("p", { text: "这里还没有任务。" });
    filtered.forEach(file => this.renderTaskCard(board, file));
  }

  renderTaskCard(parent, file) {
    const card = parent.createDiv({ cls: `pvd-task ${this.taskDone(file) ? "is-done" : ""}` });
    const main = card.createDiv(); main.createEl("strong", { text: file.basename });
    const project = String(this.meta(file)["所属项目"] || "未关联项目").replace(/^\[\[|\]\]$/g, "");
    main.createSpan({ text: `${project} · ${this.taskPlan(file) ? this.dateKey(this.taskPlan(file)) : "未安排日期"}` }); this.timer(main, file);
    const badges = card.createDiv({ cls: "pvd-badges" }); badges.createSpan({ text: this.priority(file) }); badges.createSpan({ text: this.taskStatus(file) });
    const actions = card.createDiv({ cls: "pvd-actions" });
    if (!this.taskDone(file)) { this.button(actions, this.timerState(file) === "进行中" ? "暂停" : "专注", () => this.toggleTimer(file), "mod-cta"); this.button(actions, "完成", () => this.complete(file)); }
    this.button(actions, "编辑", () => this.editTask(file));
    this.button(actions, "删除", () => this.deleteTask(file), "pvd-danger");
    this.button(actions, "打开", () => this.openFile(file));
  }

  async ensureFolder(dir) { let current = ""; for (const part of dir.split("/").filter(Boolean)) { current = current ? `${current}/${part}` : part; if (!this.app.vault.getAbstractFileByPath(current)) await this.app.vault.createFolder(current); } }
  uniquePath(dir, title) { const date = this.dateKey(); let path = `${dir}/${date} ${title}.md`; let index = 2; while (this.app.vault.getAbstractFileByPath(path)) path = `${dir}/${date} ${title} ${index++}.md`; return path; }
  async createIdea() { new TextPromptModal(this.app, "记录灵感", "一句话写下想法", async title => { const dir = this.config().inbox; await this.ensureFolder(dir); const file = await this.app.vault.create(this.uniquePath(dir, title), `---\ntype: 闪念笔记\n状态: 收集\ndate: ${this.dateKey()}\n---\n\n# ${title}\n\n`); await this.openFile(file); await this.render(); }).open(); }
  async archiveIdea(file) { await this.app.fileManager.processFrontMatter(file, fm => { fm["状态"] = "已处理"; }); new Notice("灵感已标记为已处理"); await this.render(); }
  async createTask() { new TextPromptModal(this.app, "新建任务", "任务标题", async title => { const dir = this.config().task; await this.ensureFolder(dir); const file = await this.app.vault.create(this.uniquePath(dir, title), `---\ntype: 任务\n所属项目: \"\"\n任务状态: 待做\n任务优先级: P2\n创建日期: ${this.dateKey()}\n计划日期: ${this.dateKey()}\n计时状态: 未开始\n计时开始时间: \n累计耗时秒: 0\n完成: false\n---\n\n# ${title}\n\n## 完成标准\n\n- [ ] \n`); await this.openFile(file); await this.render(); }).open(); }
  async editTask(file) {
    const fm = this.meta(file); const project = String(fm["所属项目"] || "").replace(/^\[\[|\]\]$/g, "");
    new TaskEditorModal(this.app, file, { project, priority: this.priority(file), status: this.taskStatus(file), plan: this.taskPlan(file) ? this.dateKey(this.taskPlan(file)) : "", estimate: fm["预计耗时分钟"] || "" }, async values => {
      await this.transitionTask(file, values.status);
      await this.app.fileManager.processFrontMatter(file, next => {
        next["所属项目"] = values.project ? `[[${values.project}]]` : "";
        next["任务优先级"] = values.priority;
        next["计划日期"] = values.plan;
        next["预计耗时分钟"] = values.estimate ? Number(values.estimate) : "";
      });
      new Notice("任务已更新"); await this.render();
    }).open();
  }
  async deleteTask(file) { if (!window.confirm(`将“${file.basename}”移入 Obsidian 回收站？`)) return; await this.app.fileManager.trashFile(file); new Notice("任务已移入回收站"); await this.render(); }
  pauseTimerFrontmatter(fm) {
    const started = this.date(fm["计时开始时间"]);
    if (fm["计时状态"] === "进行中" && started) fm["累计耗时秒"] = Math.max(0, Number(fm["累计耗时秒"]) || 0) + Math.max(0, Math.floor((Date.now() - started.getTime()) / 1000));
    fm["计时状态"] = "暂停";
    fm["计时开始时间"] = "";
  }
  async transitionTask(file, targetStatus) {
    if (targetStatus === "进行中") {
      const other = this.allTaskFiles().find(task => task.path !== file.path && this.timerState(task) === "进行中");
      if (other) await this.app.fileManager.processFrontMatter(other, fm => { this.pauseTimerFrontmatter(fm); fm["任务状态"] = "暂停"; });
      await this.app.fileManager.processFrontMatter(file, fm => {
        if (fm["计时状态"] !== "进行中") { fm["计时状态"] = "进行中"; fm["计时开始时间"] = new Date().toISOString(); }
        fm["任务状态"] = "进行中"; fm["完成"] = false; fm["完成日期"] = "";
      });
      return;
    }
    await this.app.fileManager.processFrontMatter(file, fm => {
      if (fm["计时状态"] === "进行中") this.pauseTimerFrontmatter(fm);
      fm["任务状态"] = targetStatus;
      if (targetStatus === "完成") { fm["完成"] = true; fm["完成日期"] = fm["完成日期"] || this.dateKey(); fm["计时状态"] = "完成"; fm["计时开始时间"] = ""; }
      else {
        fm["完成"] = false; fm["完成日期"] = "";
        if (targetStatus === "暂停") fm["计时状态"] = "暂停";
        if (targetStatus === "待做") fm["计时状态"] = "未开始";
      }
    });
  }
  async toggleTimer(file) {
    this.focusPath = file.path;
    const running = this.timerState(file) === "进行中";
    await this.transitionTask(file, running ? "暂停" : "进行中");
    new Notice(running ? "已暂停专注" : "已开始专注"); await this.render();
  }
  async complete(file) { await this.transitionTask(file, "完成"); new Notice("任务已完成"); await this.render(); }
}

function unifiedTaskBase() {
  return `filters:\n  and:\n    - note.type == "任务"\nproperties:\n  file.name:\n    displayName: 任务名\n  所属项目:\n    displayName: 所属项目\n  任务状态:\n    displayName: 状态\n  任务优先级:\n    displayName: 优先级\n  计划日期:\n    displayName: 计划日期\n  预计耗时分钟:\n    displayName: 预计分钟\n  完成:\n    displayName: 完成\n  完成日期:\n    displayName: 完成日期\nviews:\n  - type: table\n    name: 全部任务\n    order:\n      - file.name\n      - 所属项目\n      - 任务状态\n      - 任务优先级\n      - 计划日期\n      - 预计耗时分钟\n      - 完成\n  - type: table\n    name: 今日\n    filters:\n      and:\n        - 计划日期 == today()\n        - 任务状态 != "完成"\n    order:\n      - file.name\n      - 所属项目\n      - 任务优先级\n  - type: table\n    name: 进行中\n    filters:\n      and:\n        - 任务状态 == "进行中"\n    order:\n      - file.name\n      - 所属项目\n      - 计划日期\n  - type: table\n    name: 已完成\n    filters:\n      and:\n        - 任务状态 == "完成"\n    order:\n      - file.name\n      - 所属项目\n      - 完成日期\n`;
}

class PavelDashboardSettingTab extends PluginSettingTab {
  constructor(app, plugin) { super(app, plugin); this.plugin = plugin; }
  display() {
    const { containerEl } = this; containerEl.empty();
    containerEl.createEl("h2", { text: "Pavel Dashboard · 任务数据源" });
    containerEl.createEl("p", { text: "任务总表（.base）定义插件的任务范围；任务数据仍保存在 Markdown 笔记的 frontmatter 中。插件会应用表顶层的 type 与属性等值过滤，不会复制或迁移已有任务。" });
    new Setting(containerEl)
      .setName("任务总表路径")
      .setDesc("可填写已有 .base 文件，例如：目标与任务/任务总表.base")
      .addText(text => text.setPlaceholder("目标与任务/任务总表.base").setValue(this.plugin.settings.taskBasePath).onChange(async value => {
        this.plugin.settings.taskBasePath = value.trim().replace(/^\.\//, ""); await this.plugin.saveSettings();
      }));
    new Setting(containerEl)
      .setName("创建统一任务总表")
      .setDesc("当当前路径不存在时，一键创建含全部、今日、进行中、已完成视图的任务总表。不会覆盖已有文件。")
      .addButton(button => button.setButtonText("一键新建").setCta().onClick(async () => {
        const path = this.plugin.settings.taskBasePath;
        if (!path.endsWith(".base")) { new Notice("任务总表路径必须以 .base 结尾。"); return; }
        if (this.app.vault.getAbstractFileByPath(path)) { new Notice("该任务总表已存在，不会覆盖。"); return; }
        const parts = path.split("/"); parts.pop(); let current = "";
        for (const part of parts.filter(Boolean)) { current = current ? `${current}/${part}` : part; if (!this.app.vault.getAbstractFileByPath(current)) await this.app.vault.createFolder(current); }
        await this.app.vault.create(path, unifiedTaskBase()); new Notice("任务总表已创建。");
      }));
    const current = this.app.vault.getAbstractFileByPath(this.plugin.settings.taskBasePath);
    containerEl.createEl("p", { cls: current ? "pvd-setting-ok" : "pvd-setting-warning", text: current ? `当前数据表：${this.plugin.settings.taskBasePath}` : "当前路径没有找到任务总表。可指定已有 .base 文件，或点击“一键新建”。" });
  }
}

module.exports = class PavelDashboardPlugin extends Plugin {
  async onload() {
    await this.loadSettings();
    this.registerView(VIEW_TYPE, leaf => new PavelDashboardView(leaf, this));
    this.addSettingTab(new PavelDashboardSettingTab(this.app, this));
    this.addRibbonIcon("layout-dashboard", "打开 Pavel Dashboard", () => this.activateView());
    this.addCommand({ id: "open-pavel-dashboard", name: "Open Pavel Dashboard", callback: () => this.activateView() });
  }
  async loadSettings() { this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData()); }
  async saveSettings() { await this.saveData(this.settings); }
  async activateView() {
    const { workspace } = this.app;
    let leaf = workspace.getLeavesOfType(VIEW_TYPE)[0];
    if (!leaf) {
      leaf = workspace.getLeaf(true);
      await leaf.setViewState({ type: VIEW_TYPE, active: true, state: {} });
    }
    await workspace.revealLeaf(leaf);
  }
  onunload() { this.app.workspace.detachLeavesOfType(VIEW_TYPE); }
};
