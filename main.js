const { ItemView, Modal, Notice, Plugin, PluginSettingTab, Setting } = require("obsidian");

const VIEW_TYPE = "focus-workbench-view";
const DEFAULT_SETTINGS = {
  taskBasePath: "目标与任务/任务总表.base",
  taskFolder: "",
  projectFolder: "",
  inboxFolder: "",
  literatureFolder: "",
  permanentFolder: "",
  schema: {
    typeField: "type", typeValue: "任务", statusField: "任务状态", projectField: "所属项目", priorityField: "任务优先级", planField: "计划日期",
    doneField: "完成", expectedField: "预计耗时分钟", timerStateField: "计时状态", timerStartedField: "计时开始时间", elapsedField: "累计耗时秒", completedAtField: "完成日期"
  }
};

class TextPromptModal extends Modal {
  constructor(app, title, placeholder, submit, validate = () => "") { super(app); this.title = title; this.placeholder = placeholder; this.submit = submit; this.validate = validate; }
  onOpen() {
    const { contentEl } = this;
    contentEl.addClass("pvd-modal");
    contentEl.createEl("h2", { text: this.title });
    const input = contentEl.createEl("input", { type: "text", placeholder: this.placeholder });
    const actions = contentEl.createDiv({ cls: "pvd-modal-actions" });
    const save = actions.createEl("button", { text: "创建", cls: "mod-cta" });
    const commit = async () => { const value = input.value.trim(); const error = this.validate(value); if (error) { new Notice(error); return; } await this.submit(value); this.close(); };
    save.addEventListener("click", () => void commit());
    input.addEventListener("keydown", event => { if (event.key === "Enter") void commit(); });
    window.setTimeout(() => input.focus(), 0);
  }
}

class TaskEditorModal extends Modal {
  constructor(app, file, data, projects, submit) { super(app); this.file = file; this.data = data; this.projects = projects; this.submit = submit; }
  onOpen() {
    const { contentEl } = this; contentEl.addClass("pvd-modal"); const data = this.data;
    contentEl.createEl("h2", { text: `编辑任务：${this.file.basename}` });
    const form = contentEl.createDiv({ cls: "pvd-task-editor" });
    const field = (label, element) => { const row = form.createEl("label"); row.createSpan({ text: label }); row.appendChild(element); return element; };
    const project = field("所属项目", document.createElement("select"));
    project.createEl("option", { text: "未关联项目", value: "" });
    const options = [...new Set([...this.projects, String(data.project || "")].filter(Boolean))].sort((a, b) => a.localeCompare(b, "zh-CN"));
    options.forEach(name => project.createEl("option", { text: name, value: name }));
    project.value = String(data.project || "");
    const priority = field("优先级", document.createElement("select")); ["P0", "P1", "P2"].forEach(value => priority.createEl("option", { text: value, value })); priority.value = data.priority || "P2";
    const status = field("任务状态", document.createElement("select")); ["待做", "进行中", "暂停", "完成"].forEach(value => status.createEl("option", { text: value, value })); status.value = data.status || "待做";
    const date = field("计划日期", document.createElement("input")); date.type = "date"; date.value = data.plan || "";
    const estimate = field("预计耗时（分钟）", document.createElement("input")); estimate.type = "number"; estimate.min = "0"; estimate.step = "1"; estimate.value = data.estimate || "";
    const actions = contentEl.createDiv({ cls: "pvd-modal-actions" });
    const save = actions.createEl("button", { text: "保存", cls: "mod-cta" });
    save.addEventListener("click", async () => { const minutes = estimate.value.trim(); if (minutes && (!/^\d+$/.test(minutes) || Number(minutes) < 0)) { new Notice("预计耗时请输入大于等于 0 的整数分钟数。"); return; } await this.submit({ project: project.value.trim(), priority: priority.value, status: status.value, plan: date.value, estimate: minutes }); this.close(); });
  }
}

class SetupModal extends Modal {
  constructor(app, plugin) { super(app); this.plugin = plugin; }
  onOpen() {
    const { contentEl } = this; contentEl.addClass("pvd-modal"); contentEl.createEl("h2", { text: "初始化 Focus Workbench" });
    contentEl.createEl("p", { text: "选择你的任务目录，并映射现有任务的字段名称。不会修改已有笔记。" });
    const form = contentEl.createDiv({ cls: "pvd-task-editor" }); const settings = this.plugin.settings; const schema = Object.assign({}, DEFAULT_SETTINGS.schema, settings.schema || {});
    const fields = [
      ["闪念笔记目录", "inboxFolder", settings.inboxFolder || ""], ["文献笔记目录", "literatureFolder", settings.literatureFolder || ""], ["永久笔记目录", "permanentFolder", settings.permanentFolder || ""],
      ["任务目录", "taskFolder", settings.taskFolder || ""], ["项目目录（可选）", "projectFolder", settings.projectFolder || ""],
      ["任务类型字段", "typeField", schema.typeField], ["任务类型值", "typeValue", schema.typeValue], ["状态字段", "statusField", schema.statusField],
      ["计划日期字段", "planField", schema.planField], ["所属项目字段", "projectField", schema.projectField], ["优先级字段", "priorityField", schema.priorityField]
    ];
    const inputs = new Map(); fields.forEach(([label, key, value]) => { const row = form.createEl("label"); row.createSpan({ text: label }); const input = row.createEl("input", { type: "text", value, placeholder: key.includes("Folder") ? "相对 vault 的目录路径" : "frontmatter 字段名" }); inputs.set(key, input); });
    const actions = contentEl.createDiv({ cls: "pvd-modal-actions" }); const save = actions.createEl("button", { text: "保存配置", cls: "mod-cta" });
    save.addEventListener("click", async () => { const taskFolder = inputs.get("taskFolder").value.trim().replace(/^\.\//, "").replace(/\/$/, ""); if (!taskFolder) { new Notice("请选择任务目录。"); return; } const nextSchema = Object.assign({}, schema); ["typeField", "typeValue", "statusField", "planField", "projectField", "priorityField"].forEach(key => nextSchema[key] = inputs.get(key).value.trim() || schema[key]); ["inboxFolder", "literatureFolder", "permanentFolder", "taskFolder", "projectFolder"].forEach(key => this.plugin.settings[key] = inputs.get(key).value.trim().replace(/^\.\//, "").replace(/\/$/, "")); this.plugin.settings.schema = nextSchema; await this.plugin.saveSettings(); this.close(); new Notice("Focus Workbench 配置已保存。"); });
  }
}

class FocusWorkbenchView extends ItemView {
  constructor(leaf, plugin) { super(leaf); this.plugin = plugin; this.tab = "home"; this.taskFilter = "today"; this.focusPath = ""; this.selectedTaskPath = ""; this.taskSearch = ""; this.knowledgeFilter = "all"; this.knowledgeSearch = ""; }
  getViewType() { return VIEW_TYPE; }
  getDisplayText() { return "Focus Workbench"; }
  getIcon() { return "layout-dashboard"; }
  async onOpen() {
    this.sourceTasks = [];
    await this.render();
    this.timerId = window.setInterval(() => this.updateTimers(), 1000);
    this.registerDomEvent(window, "keydown", event => this.handleShortcut(event));
    this.registerEvent(this.app.metadataCache.on("changed", file => this.scheduleRefreshIfWatched(file.path)));
    this.registerEvent(this.app.vault.on("create", file => this.scheduleRefreshIfWatched(file.path)));
    this.registerEvent(this.app.vault.on("delete", file => this.scheduleRefreshIfWatched(file.path)));
    this.registerEvent(this.app.vault.on("rename", (file, oldPath) => this.scheduleRefreshIfWatched(file.path, oldPath)));
  }
  async onClose() { if (this.timerId) window.clearInterval(this.timerId); if (this.refreshTimeout) window.clearTimeout(this.refreshTimeout); }

  isWatchedPath(path) {
    if (!path) return false;
    const cfg = this.config();
    return path === "知识库配置.md" || [cfg.task, cfg.project, cfg.inbox, cfg.permanent, cfg.literature].some(dir => dir && (path === dir || path.startsWith(`${dir}/`)));
  }
  scheduleRefreshIfWatched(...paths) { if (paths.some(path => this.isWatchedPath(path))) this.scheduleRefresh(); }
  scheduleRefresh() {
    if (this.refreshTimeout) window.clearTimeout(this.refreshTimeout);
    this.refreshTimeout = window.setTimeout(() => {
      this.refreshTimeout = null;
      const active = document.activeElement;
      if (active && this.contentEl.contains(active) && /^(input|textarea|select)$/i.test(active.tagName)) { this.scheduleRefresh(); return; }
      void this.render();
    }, 300);
  }

  config() {
    const file = this.app.vault.getAbstractFileByPath("知识库配置.md");
    const fm = file ? this.app.metadataCache.getFileCache(file)?.frontmatter || {} : {};
    const path = (key, fallback) => String(fm[key] || fallback).replace(/^\.\//, "").replace(/\/$/, "");
    const goals = path("goals_folder", "目标与任务");
    const configured = this.plugin.settings;
    return { inbox: configured.inboxFolder || path("inbox_folder", "闪念笔记"), permanent: configured.permanentFolder || path("permanent_folder", "永久笔记"), literature: configured.literatureFolder || path("literature_folder", "文献笔记"), goals, task: configured.taskFolder || path("task_folder", `${goals}/任务管理/任务`), project: configured.projectFolder || path("project_folder", `${goals}/任务管理/项目`), taskBase: configured.taskBasePath };
  }
  schema() { return Object.assign({}, DEFAULT_SETTINGS.schema, this.plugin.settings.schema || {}); }
  taskProperty(file, key) { return this.meta(file)[this.schema()[key]]; }
  setTaskProperty(frontmatter, key, value) { frontmatter[this.schema()[key]] = value; }
  files() { return this.app.vault.getMarkdownFiles(); }
  meta(file) { return this.app.metadataCache.getFileCache(file)?.frontmatter || {}; }
  starts(file, dir) { return file.path === dir || file.path.startsWith(`${dir}/`); }
  useful(file) { return file.extension === "md" && file.basename !== "首页" && !file.name.startsWith("README"); }
  date(value) {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value.toJSDate === "function") return value.toJSDate();
    const normalized = String(value).slice(0, 10).replaceAll("/", "-");
    const parts = normalized.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (parts) return new Date(Number(parts[1]), Number(parts[2]) - 1, Number(parts[3]));
    const parsed = new Date(normalized);
    return Number.isFinite(parsed.getTime()) ? parsed : null;
  }
  timestamp(value) {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value.toJSDate === "function") return value.toJSDate();
    const parsed = new Date(String(value));
    return Number.isFinite(parsed.getTime()) ? parsed : null;
  }
  today() { const date = new Date(); date.setHours(0, 0, 0, 0); return date; }
  dateKey(value) { const date = value || this.today(); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
  calendarKey(value) {
    if (!value) return "";
    if (typeof value.toISODate === "function") return value.toISODate() || "";
    const match = String(value).match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (match) return `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`;
    const date = this.date(value); return date ? this.dateKey(date) : "";
  }
  todayKey() { return this.dateKey(this.today()); }
  sameCalendarDay(left, right = this.today()) { return Boolean(left) && this.calendarKey(left) === this.calendarKey(right); }
  isPastCalendarDay(value, reference = this.today()) { const key = this.calendarKey(value); return Boolean(key) && key < this.calendarKey(reference); }
  taskStatus(file) { return String(this.taskProperty(file, "statusField") || "待做"); }
  taskDone(file) { return this.taskStatus(file) === "完成" || this.taskProperty(file, "doneField") === true; }
  taskPlan(file) { return this.date(this.taskProperty(file, "planField")); }
  taskPlanKey(file) { return this.calendarKey(this.taskProperty(file, "planField")); }
  isTodayTask(file, todayKey = this.todayKey()) { return !this.taskDone(file) && this.taskPlanKey(file) === todayKey; }
  priority(file) { const value = String(this.taskProperty(file, "priorityField") || "P2"); return ["P0", "P1", "P2"].includes(value) ? value : "P2"; }
  timerState(file) { return String(this.taskProperty(file, "timerStateField") || "未开始"); }
  expectedSeconds(file) { return Math.max(0, Number(this.taskProperty(file, "expectedField")) || 0) * 60; }
  elapsedSeconds(file, now = Date.now()) { const stored = Math.max(0, Number(this.taskProperty(file, "elapsedField")) || 0); const started = this.timerState(file) === "进行中" ? this.timestamp(this.taskProperty(file, "timerStartedField")) : null; return stored + (started ? Math.max(0, Math.floor((now - started.getTime()) / 1000)) : 0); }
  formatDuration(seconds) { const value = Math.max(0, Math.floor(Math.abs(seconds))); return `${seconds < 0 ? "-" : ""}${String(Math.floor(value / 3600)).padStart(2, "0")}:${String(Math.floor(value % 3600 / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`; }
  timerLabel(file) { const expected = this.expectedSeconds(file); const elapsed = this.elapsedSeconds(file); return expected ? `剩余 ${this.formatDuration(expected - elapsed)}` : `已专注 ${this.formatDuration(elapsed)}`; }
  allTaskFiles() { const schema = this.schema(); const taskFolder = this.config().task; return this.files().filter(file => this.starts(file, taskFolder) && String(this.meta(file)[schema.typeField] || "") === schema.typeValue); }
  projectOptions() { return this.files().filter(file => this.starts(file, this.config().project) && this.useful(file)).map(file => file.basename).sort((a, b) => a.localeCompare(b, "zh-CN")); }
  tasks() { return this.sourceTasks || []; }
  async refreshTaskSource() {
    // A .base file is an optional companion view only. Its filter language is intentionally
    // not interpreted here, so every supported Base expression cannot silently change scope.
    this.sourceTasks = this.allTaskFiles();
    this.sourceMode = "schema";
  }
  compareTasks(a, b) { const rank = { P0: 0, P1: 1, P2: 2 }; return rank[this.priority(a)] - rank[this.priority(b)] || (this.taskPlan(a)?.getTime() || Infinity) - (this.taskPlan(b)?.getTime() || Infinity) || a.basename.localeCompare(b.basename, "zh-CN"); }
  focusTask(tasks) { const active = tasks.filter(file => !this.taskDone(file)); return active.find(file => file.path === this.focusPath) || active.find(file => this.timerState(file) === "进行中") || active.filter(file => this.isTodayTask(file)).sort((a, b) => this.compareTasks(a, b))[0] || active.sort((a, b) => this.compareTasks(a, b))[0]; }
  async setFocus(file) { this.focusPath = file.path; await this.render(); }
  selectTask(file) { this.selectedTaskPath = this.selectedTaskPath === file.path ? "" : file.path; this.focusPath = file.path; void this.render(); }
  handleShortcut(event) {
    if (event.defaultPrevented || event.altKey || (event.target && /input|textarea|select/i.test(event.target.tagName))) return;
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") { event.preventDefault(); this.tab = "tasks"; this.taskSearch = ""; void this.render().then(() => this.contentEl.querySelector(".pvd-task-search")?.focus()); }
    if (event.key.toLowerCase() === "n" && !event.ctrlKey && !event.metaKey) { event.preventDefault(); void this.createTask(); }
  }
  async openFile(fileOrPath) {
    const path = typeof fileOrPath === "string" ? fileOrPath : fileOrPath?.path;
    const file = path ? this.app.vault.getAbstractFileByPath(path) : null;
    if (!file || file.children) { new Notice(`无法打开：${path || "未指定文件"}`); return; }
    await this.app.workspace.getLeaf(false).openFile(file);
  }
  button(parent, text, action, cls = "") { const button = parent.createEl("button", { text, cls }); button.addEventListener("click", event => void action(event)); return button; }
  isOverdue(file) { const expected = this.expectedSeconds(file); return expected > 0 && this.elapsedSeconds(file) > expected; }
  timer(parent, file) { return parent.createEl("strong", { cls: `pvd-timer ${this.timerState(file) === "进行中" ? "is-running" : ""} ${this.isOverdue(file) ? "is-over" : ""}`, text: this.timerLabel(file), attr: { "data-pvd-timer": file.path } }); }
  updateTimers() { this.contentEl.querySelectorAll("[data-pvd-timer]").forEach(element => { const file = this.app.vault.getAbstractFileByPath(element.getAttribute("data-pvd-timer")); if (!file || file.children) return; element.textContent = this.timerLabel(file); element.classList.toggle("is-running", this.timerState(file) === "进行中"); element.classList.toggle("is-over", this.isOverdue(file)); }); }

  async render() {
    await this.refreshTaskSource();
    const root = this.contentEl;
    root.empty();
    root.addClass("pvd-root");
    const shell = root.createDiv({ cls: "pvd-shell" });
    const header = shell.createEl("header", { cls: "pvd-header" });
    const title = header.createDiv();
    title.createEl("p", { text: "PERSONAL WORKSPACE" });
    title.createEl("h1", { text: this.tab === "home" ? "今天，做重要的事。" : this.tab === "tasks" ? "任务指挥舱" : "知识流与文章导航" });
    title.createSpan({ text: this.dateKey() });
    const nav = header.createDiv({ cls: "pvd-tabs" });
    this.button(nav, "首页", async () => { this.tab = "home"; await this.render(); }, this.tab === "home" ? "is-active" : "");
    this.button(nav, "任务工作台", async () => { this.tab = "tasks"; await this.render(); }, this.tab === "tasks" ? "is-active" : "");
    this.button(nav, "文章导航", async () => { this.tab = "knowledge"; await this.render(); }, this.tab === "knowledge" ? "is-active" : "");
    this.button(nav, "打开任务总表", () => this.openFile(this.config().taskBase));
    this.button(nav, "刷新", () => this.render());
    if (this.tab === "home") await this.renderHome(shell); else if (this.tab === "tasks") await this.renderTasks(shell); else await this.renderKnowledge(shell);
  }

  async renderHome(shell) {
    const cfg = this.config(); const tasks = this.tasks(); const active = tasks.filter(file => !this.taskDone(file));
    const focus = this.focusTask(tasks);
    const focusCard = shell.createEl("section", { cls: "pvd-focus pvd-card" });
    const copy = focusCard.createDiv(); copy.createEl("p", { text: "MISSION CONTROL" });
    copy.createEl("h2", { text: focus ? focus.basename : "还没有可推进的任务" });
    const project = focus ? String(this.taskProperty(focus, "projectField") || "未关联项目").replace(/^\[\[|\]\]$/g, "") : "创建一项任务后，它会自动出现在这里。";
    copy.createSpan({ text: focus ? `${project} · ${this.taskStatus(focus)} · ${this.priority(focus)}` : project });
    if (focus) this.timer(copy, focus);
    const actions = focusCard.createDiv({ cls: "pvd-actions" });
    if (focus) { this.button(actions, this.timerState(focus) === "进行中" ? "暂停专注" : "开始专注", () => this.toggleTimer(focus), "mod-cta"); this.button(actions, "编辑", () => this.editTask(focus)); this.button(actions, "完成", () => this.complete(focus)); this.button(actions, "查看", () => this.openFile(focus)); }
    else this.button(actions, "新建任务", () => this.createTask(), "mod-cta");

    const quick = shell.createDiv({ cls: "pvd-quick" });
    this.button(quick, "记录灵感", () => this.createIdea());
    this.button(quick, "新建任务", () => this.createTask());
    this.button(quick, "文章导航", async () => { this.tab = "knowledge"; await this.render(); });
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
    stream.createEl("h2", { text: "卡片笔记知识流" }); stream.createEl("p", { text: "闪念笔记捕捉想法，文献笔记保留来源与输入，永久笔记沉淀为可复用的独立知识。" });
    const lanes = stream.createDiv({ cls: "pvd-lanes" });
    [["① 闪念笔记", cfg.inbox], ["② 文献笔记", cfg.literature], ["③ 永久笔记", cfg.permanent]].forEach(([name, dir]) => {
      const lane = lanes.createDiv({ cls: "pvd-lane" }); lane.createEl("h3", { text: name });
      const notes = this.files().filter(file => this.starts(file, dir) && this.useful(file)).sort((a, b) => b.stat.mtime - a.stat.mtime).slice(0, 3);
      if (!notes.length) lane.createEl("span", { text: "暂无笔记" });
      notes.forEach(file => { const note = this.button(lane, "", () => this.openFile(file), "pvd-note"); note.createEl("strong", { text: file.basename }); });
    });
  }

  knowledgeGroups() {
    const cfg = this.config();
    return [
      { key: "fleeting", name: "闪念笔记", description: "快速捕捉、尚未整理的想法。", dir: cfg.inbox },
      { key: "literature", name: "文献笔记", description: "带来源、摘录与阅读线索的输入卡片。", dir: cfg.literature },
      { key: "permanent", name: "永久笔记", description: "用自己的话写成、可以独立链接和复用的知识。", dir: cfg.permanent }
    ];
  }
  knowledgeNotes(group) { return this.files().filter(file => this.starts(file, group.dir) && this.useful(file)).sort((a, b) => b.stat.mtime - a.stat.mtime); }
  renderKnowledge(shell) {
    const groups = this.knowledgeGroups();
    const flow = shell.createEl("section", { cls: "pvd-card pvd-knowledge-flow" });
    flow.createEl("p", { text: "CARD NOTE METHOD" }); flow.createEl("h2", { text: "从捕捉到可复用的知识" });
    flow.createEl("p", { text: "不要直接把闪念当结论：先捕捉，再保留来源，最后写成一张只表达一个观点的永久笔记。" });
    const steps = flow.createDiv({ cls: "pvd-knowledge-steps" });
    groups.forEach((group, index) => { const step = steps.createDiv({ cls: "pvd-knowledge-step" }); step.createEl("b", { text: `0${index + 1}` }); step.createEl("h3", { text: group.name }); step.createEl("span", { text: group.description }); });
    const toolbar = shell.createDiv({ cls: "pvd-article-toolbar" });
    const search = toolbar.createEl("input", { cls: "pvd-task-search", type: "search", placeholder: "搜索文章标题…", value: this.knowledgeSearch, attr: { "aria-label": "搜索文章" } });
    search.addEventListener("input", event => { this.knowledgeSearch = event.target.value; this.renderArticleResults(this.articleResultsEl, groups); });
    this.button(toolbar, "＋ 记录闪念", () => this.createIdea(), "mod-cta");
    const filters = shell.createDiv({ cls: "pvd-filter pvd-article-filter" });
    [["all", "全部文章"], ...groups.map(group => [group.key, group.name])].forEach(([key, label]) => this.button(filters, label, () => { this.knowledgeFilter = key; void this.render(); }, this.knowledgeFilter === key ? "is-active" : ""));
    const results = shell.createDiv({ cls: "pvd-article-results" }); this.articleResultsEl = results; this.renderArticleResults(results, groups);
  }
  renderArticleResults(parent, groups = this.knowledgeGroups()) {
    parent.empty(); const query = this.knowledgeSearch.trim().toLocaleLowerCase();
    const visibleGroups = this.knowledgeFilter === "all" ? groups : groups.filter(group => group.key === this.knowledgeFilter);
    visibleGroups.forEach(group => {
      const section = parent.createEl("section", { cls: "pvd-card pvd-article-group" }); const notes = this.knowledgeNotes(group).filter(file => !query || file.basename.toLocaleLowerCase().includes(query));
      const head = section.createDiv({ cls: "pvd-section-head" }); const copy = head.createDiv(); copy.createEl("h2", { text: group.name }); copy.createEl("p", { text: `${group.description} · ${notes.length} 篇` });
      if (!notes.length) { section.createEl("p", { text: "暂无匹配文章。" }); return; }
      const list = section.createDiv({ cls: "pvd-article-list" }); notes.slice(0, 60).forEach(file => { const article = this.button(list, "", () => this.openFile(file), "pvd-article"); const text = article.createDiv(); text.createEl("strong", { text: file.basename }); text.createSpan({ text: this.dateKey(new Date(file.stat.mtime)) }); article.createEl("span", { text: "打开 →", cls: "pvd-article-open" }); });
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
    const todayKey = this.calendarKey(today);
    [["今日", active.filter(file => this.isTodayTask(file, todayKey)).length], ["进行中", active.filter(file => this.taskStatus(file) === "进行中").length], ["已逾期", active.filter(file => this.isPastCalendarDay(this.taskPlanKey(file), today)).length], ["待推进", active.length]].forEach(([label, count]) => { const stat = summary.createDiv(); stat.createEl("b", { text: String(count) }); stat.createSpan({ text: label }); });
    const filters = { today: "今日", active: "全部待办", doing: "进行中", overdue: "已逾期", done: "已完成" };
    const toolbar = shell.createDiv({ cls: "pvd-task-toolbar" });
    const search = toolbar.createEl("input", { cls: "pvd-task-search", type: "search", placeholder: "搜索任务、项目或优先级…", value: this.taskSearch, attr: { "aria-label": "搜索任务" } });
    search.addEventListener("input", event => { this.taskSearch = event.target.value; void this.renderTasksResults(this.taskResultsEl, filters); });
    this.button(toolbar, "＋ 新建任务", () => this.createTask(), "mod-cta");
    const filterBar = shell.createDiv({ cls: "pvd-filter" });
    Object.entries(filters).forEach(([key, label]) => this.button(filterBar, label, async () => { this.taskFilter = key; await this.render(); }, this.taskFilter === key ? "is-active" : ""));
    const focus = this.focusTask(tasks);
    if (focus) {
      const mission = shell.createEl("section", { cls: "pvd-card pvd-mission" }); mission.createEl("p", { text: "CURRENT FOCUS" }); mission.createEl("h2", { text: focus.basename }); this.timer(mission, focus);
      const track = mission.createDiv({ cls: "pvd-stage" }); ["待做", "进行中", "暂停", "完成"].forEach(stage => track.createEl("span", { text: stage, cls: this.taskStatus(focus) === stage ? "is-current" : this.taskDone(focus) ? "is-done" : "" }));
      const missionActions = mission.createDiv({ cls: "pvd-actions" }); this.button(missionActions, this.timerState(focus) === "进行中" ? "暂停专注" : "开始专注", () => this.toggleTimer(focus), "mod-cta"); this.button(missionActions, "编辑", () => this.editTask(focus)); this.button(missionActions, "完成", () => this.complete(focus));
      const switcher = mission.createDiv({ cls: "pvd-focus-switcher" }); switcher.createSpan({ text: "切换焦点" }); const chips = switcher.createDiv(); active.sort((a, b) => this.compareTasks(a, b)).slice(0, 6).forEach(file => this.button(chips, file.basename, () => this.setFocus(file), file.path === focus.path ? "is-active" : ""));
    }
    const results = shell.createDiv({ cls: "pvd-task-results" });
    this.taskResultsEl = results;
    await this.renderTasksResults(results, filters, tasks, today);
  }

  async renderTasksResults(parent, filters, suppliedTasks, suppliedToday) {
    const tasks = suppliedTasks || this.tasks(); const today = suppliedToday || this.today();
    parent.empty();
    const filtered = tasks.filter(file => {
      const plan = this.taskPlan(file); if (this.taskFilter === "today") return this.isTodayTask(file, this.calendarKey(today));
      if (this.taskFilter === "active") return !this.taskDone(file); if (this.taskFilter === "doing") return !this.taskDone(file) && this.taskStatus(file) === "进行中";
      if (this.taskFilter === "overdue") return !this.taskDone(file) && this.isPastCalendarDay(this.taskPlanKey(file), today); return this.taskDone(file);
    }).filter(file => {
      const query = this.taskSearch.trim().toLocaleLowerCase();
      if (!query) return true;
      const project = String(this.taskProperty(file, "projectField") || "");
      return `${file.basename} ${project} ${this.priority(file)} ${this.taskStatus(file)}`.toLocaleLowerCase().includes(query);
    }).sort((a, b) => this.compareTasks(a, b));
    const board = parent.createEl("section", { cls: "pvd-card pvd-board" }); board.createEl("h2", { text: `${filters[this.taskFilter]} · ${filtered.length} 项` });
    if (!filtered.length) board.createEl("p", { text: "这里还没有任务。" });
    filtered.forEach(file => this.renderTaskCard(board, file));
  }

  renderTaskCard(parent, file) {
    const selected = this.selectedTaskPath === file.path;
    const card = parent.createDiv({ cls: `pvd-task ${this.taskDone(file) ? "is-done" : ""} ${selected ? "is-selected" : ""}`, attr: { role: "button", tabindex: "0", "aria-expanded": String(selected) } });
    card.addEventListener("click", () => this.selectTask(file));
    card.addEventListener("keydown", event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); this.selectTask(file); } });
    const main = card.createDiv(); main.createEl("strong", { text: file.basename });
    const project = String(this.taskProperty(file, "projectField") || "未关联项目").replace(/^\[\[|\]\]$/g, "");
    main.createSpan({ text: `${project} · ${this.taskPlan(file) ? this.dateKey(this.taskPlan(file)) : "未安排日期"}` }); this.timer(main, file);
    const badges = card.createDiv({ cls: "pvd-badges" }); badges.createSpan({ text: this.priority(file) }); badges.createSpan({ text: this.taskStatus(file) });
    if (!selected) return;
    const actions = card.createDiv({ cls: "pvd-actions pvd-task-actions" });
    const stop = action => async event => { event.stopPropagation(); await action(); };
    if (!this.taskDone(file)) { this.button(actions, this.timerState(file) === "进行中" ? "暂停专注" : "开始专注", stop(() => this.toggleTimer(file)), "mod-cta"); this.button(actions, "标记完成", stop(() => this.complete(file))); }
    this.button(actions, "编辑详情", stop(() => this.editTask(file)));
    this.button(actions, "打开笔记", stop(() => this.openFile(file)));
    this.button(actions, "删除", stop(() => this.deleteTask(file)), "pvd-danger");
  }

  async ensureFolder(dir) { let current = ""; for (const part of dir.split("/").filter(Boolean)) { current = current ? `${current}/${part}` : part; if (!this.app.vault.getAbstractFileByPath(current)) await this.app.vault.createFolder(current); } }
  validateNoteTitle(title) {
    if (!title) return "请输入标题。";
    if (title.length > 120) return "标题过长，请控制在 120 个字符以内。";
    if (/[\\/:*?"<>|]/.test(title) || /(^|\/)\.\.?(\/|$)/.test(title)) return "标题不能包含 \\ / : * ? \" < > | 或路径片段。";
    if (/[. ]$/.test(title)) return "标题不能以句点或空格结尾。";
    if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i.test(title)) return "该标题是 Windows 保留文件名。";
    return "";
  }
  uniquePath(dir, title) { const date = this.dateKey(); let path = `${dir}/${date} ${title}.md`; let index = 2; while (this.app.vault.getAbstractFileByPath(path)) path = `${dir}/${date} ${title} ${index++}.md`; return path; }
  async createIdea() { new TextPromptModal(this.app, "记录灵感", "一句话写下想法", async title => { const dir = this.config().inbox; await this.ensureFolder(dir); const file = await this.app.vault.create(this.uniquePath(dir, title), `---\ntype: 闪念笔记\n状态: 收集\ndate: ${this.dateKey()}\n---\n\n# ${title}\n\n`); await this.openFile(file); await this.render(); }, title => this.validateNoteTitle(title)).open(); }
  async archiveIdea(file) { await this.app.fileManager.processFrontMatter(file, fm => { fm["状态"] = "已处理"; }); new Notice("灵感已标记为已处理"); await this.render(); }
  async createTask() { new TextPromptModal(this.app, "新建任务", "任务标题", async title => { const dir = this.config().task; const schema = this.schema(); await this.ensureFolder(dir); const file = await this.app.vault.create(this.uniquePath(dir, title), `---\n${schema.typeField}: ${schema.typeValue}\n${schema.projectField}: \"\"\n${schema.statusField}: 待做\n${schema.priorityField}: P2\n${schema.planField}: ${this.dateKey()}\n${schema.timerStateField}: 未开始\n${schema.timerStartedField}: \n${schema.elapsedField}: 0\n${schema.doneField}: false\n---\n\n# ${title}\n\n## 完成标准\n\n- [ ] \n`); await this.openFile(file); await this.render(); }, title => this.validateNoteTitle(title)).open(); }
  async editTask(file) {
    const fm = this.meta(file); const project = String(this.taskProperty(file, "projectField") || "").replace(/^\[\[|\]\]$/g, "");
    new TaskEditorModal(this.app, file, { project, priority: this.priority(file), status: this.taskStatus(file), plan: this.taskPlan(file) ? this.dateKey(this.taskPlan(file)) : "", estimate: this.taskProperty(file, "expectedField") || "" }, this.projectOptions(), async values => {
      await this.transitionTask(file, values.status);
      await this.app.fileManager.processFrontMatter(file, next => {
        this.setTaskProperty(next, "projectField", values.project ? `[[${values.project}]]` : "");
        this.setTaskProperty(next, "priorityField", values.priority);
        this.setTaskProperty(next, "planField", values.plan);
        this.setTaskProperty(next, "expectedField", values.estimate ? Number(values.estimate) : "");
      });
      new Notice("任务已更新"); await this.render();
    }).open();
  }
  async deleteTask(file) { if (!window.confirm(`将“${file.basename}”移入 Obsidian 回收站？`)) return; await this.app.fileManager.trashFile(file); new Notice("任务已移入回收站"); await this.render(); }
  pauseTimerFrontmatter(fm) {
    const started = this.timestamp(fm[this.schema().timerStartedField]);
    if (fm[this.schema().timerStateField] === "进行中" && started) this.setTaskProperty(fm, "elapsedField", Math.max(0, Number(fm[this.schema().elapsedField]) || 0) + Math.max(0, Math.floor((Date.now() - started.getTime()) / 1000)));
    this.setTaskProperty(fm, "timerStateField", "暂停");
    this.setTaskProperty(fm, "timerStartedField", "");
  }
  async transitionTask(file, targetStatus) {
    if (targetStatus === "进行中") {
      const other = this.allTaskFiles().find(task => task.path !== file.path && this.timerState(task) === "进行中");
      if (other) await this.app.fileManager.processFrontMatter(other, fm => { this.pauseTimerFrontmatter(fm); this.setTaskProperty(fm, "statusField", "暂停"); });
      await this.app.fileManager.processFrontMatter(file, fm => {
        if (fm[this.schema().timerStateField] !== "进行中") { this.setTaskProperty(fm, "timerStateField", "进行中"); this.setTaskProperty(fm, "timerStartedField", new Date().toISOString()); }
        this.setTaskProperty(fm, "statusField", "进行中"); this.setTaskProperty(fm, "doneField", false); this.setTaskProperty(fm, "completedAtField", "");
      });
      return;
    }
    await this.app.fileManager.processFrontMatter(file, fm => {
      if (fm[this.schema().timerStateField] === "进行中") this.pauseTimerFrontmatter(fm);
      this.setTaskProperty(fm, "statusField", targetStatus);
      if (targetStatus === "完成") { this.setTaskProperty(fm, "doneField", true); this.setTaskProperty(fm, "completedAtField", fm[this.schema().completedAtField] || this.dateKey()); this.setTaskProperty(fm, "timerStateField", "完成"); this.setTaskProperty(fm, "timerStartedField", ""); }
      else {
        this.setTaskProperty(fm, "doneField", false); this.setTaskProperty(fm, "completedAtField", "");
        if (targetStatus === "暂停") this.setTaskProperty(fm, "timerStateField", "暂停");
        if (targetStatus === "待做") this.setTaskProperty(fm, "timerStateField", "未开始");
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

class FocusWorkbenchSettingTab extends PluginSettingTab {
  constructor(app, plugin) { super(app, plugin); this.plugin = plugin; }
  display() {
    const { containerEl } = this; containerEl.empty();
    containerEl.createEl("h2", { text: "Focus Workbench · 初始化与任务数据" });
    containerEl.createEl("p", { text: "任务范围由任务目录和字段映射决定。.base 文件仅作为可选的 Obsidian Bases 视图，插件不会解析或执行其中的筛选表达式。" });
    new Setting(containerEl).setName("初始化向导").setDesc("为当前 vault 选择任务目录、项目目录和核心 frontmatter 字段。不会改动已有笔记。").addButton(button => button.setButtonText("打开向导").setCta().onClick(() => new SetupModal(this.app, this.plugin).open()));
    new Setting(containerEl).setName("初始化卡片笔记仓库结构").setDesc("创建闪念笔记、文献笔记、永久笔记、任务、项目与每日进展目录；不会覆盖或移动已有文件。").addButton(button => button.setButtonText("创建目录").setCta().onClick(async () => {
      if (!window.confirm("将创建标准卡片笔记与任务目录。已有文件不会被修改，是否继续？")) return;
      const settings = this.plugin.settings; const goals = "目标与任务";
      const defaults = { inboxFolder: "闪念笔记", literatureFolder: "文献笔记", permanentFolder: "永久笔记", taskFolder: `${goals}/任务管理/任务`, projectFolder: `${goals}/任务管理/项目` };
      Object.entries(defaults).forEach(([key, value]) => { if (!settings[key]) settings[key] = value; });
      const folders = [settings.inboxFolder, settings.literatureFolder, settings.permanentFolder, settings.taskFolder, settings.projectFolder, `${goals}/任务管理/每日进展`];
      for (const folder of folders) { let current = ""; for (const part of folder.split("/").filter(Boolean)) { current = current ? `${current}/${part}` : part; if (!this.app.vault.getAbstractFileByPath(current)) await this.app.vault.createFolder(current); } }
      await this.plugin.saveSettings(); this.display(); new Notice("标准卡片笔记仓库结构已创建。");
    }));
    new Setting(containerEl).setName("任务目录").setDesc("只读取此目录及子目录内、符合任务类型字段和值的 Markdown 文件。").addText(text => text.setPlaceholder("Tasks").setValue(this.plugin.settings.taskFolder).onChange(async value => { this.plugin.settings.taskFolder = value.trim().replace(/^\.\//, "").replace(/\/$/, ""); await this.plugin.saveSettings(); }));
    new Setting(containerEl).setName("项目目录").setDesc("编辑任务时用于生成所属项目下拉选项。").addText(text => text.setPlaceholder("Projects").setValue(this.plugin.settings.projectFolder).onChange(async value => { this.plugin.settings.projectFolder = value.trim().replace(/^\.\//, "").replace(/\/$/, ""); await this.plugin.saveSettings(); }));
    new Setting(containerEl)
      .setName("任务总表路径")
      .setDesc("可填写已有 .base 文件，例如：目标与任务/任务总表.base")
      .addText(text => text.setPlaceholder("目标与任务/任务总表.base").setValue(this.plugin.settings.taskBasePath).onChange(async value => {
        this.plugin.settings.taskBasePath = value.trim().replace(/^\.\//, ""); await this.plugin.saveSettings();
      }));
    new Setting(containerEl)
      .setName("创建统一任务总表")
      .setDesc("可选：创建供 Obsidian Bases 打开的任务视图。它不会影响插件自身的任务范围。不会覆盖已有文件。")
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

module.exports = class FocusWorkbenchPlugin extends Plugin {
  async onload() {
    await this.loadSettings();
    this.registerView(VIEW_TYPE, leaf => new FocusWorkbenchView(leaf, this));
    this.addSettingTab(new FocusWorkbenchSettingTab(this.app, this));
    this.addRibbonIcon("layout-dashboard", "打开 Focus Workbench", () => this.activateView());
    this.addCommand({ id: "open-focus-workbench", name: "Open Focus Workbench", callback: () => this.activateView() });
  }
  async loadSettings() { const saved = await this.loadData() || {}; this.settings = Object.assign({}, DEFAULT_SETTINGS, saved, { schema: Object.assign({}, DEFAULT_SETTINGS.schema, saved.schema || {}) }); }
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

/* nosourcemap */
