const { ItemView, Modal, Notice, Plugin, PluginSettingTab, Setting } = require("obsidian");

const VIEW_TYPE = "focus-workbench-view";
const DEFAULT_SETTINGS = {
  taskBasePath: "目标与任务/任务总表.base",
  taskFolder: "",
  projectFolder: "",
  inboxFolder: "",
  literatureFolder: "",
  permanentFolder: "",
  taskTemplatePath: "模板/任务模板.md",
  schema: {
    typeField: "type", typeValue: "任务", statusField: "任务状态", projectField: "所属项目", priorityField: "任务优先级", planField: "计划日期",
    doneField: "完成", expectedField: "预计耗时分钟", timerStateField: "计时状态", timerStartedField: "计时开始时间", elapsedField: "累计耗时秒", completedAtField: "完成日期"
  }
};

class TextPromptModal extends Modal {
  constructor(app, title, placeholder, submit, validate = () => "") { super(app); this.title = title; this.placeholder = placeholder; this.submit = submit; this.validate = validate; }
  onOpen() {
    const { contentEl } = this;
    this.modalEl.addClass("pvd-modal-shell");
    contentEl.addClass("pvd-modal");
    contentEl.createEl("h2", { text: this.title });
    const input = contentEl.createEl("input", { type: "text", placeholder: this.placeholder });
    const actions = contentEl.createDiv({ cls: "pvd-modal-actions" });
    const save = actions.createEl("button", { text: "创建", cls: "mod-cta" });
    const commit = async () => { const value = input.value.trim(); const error = this.validate(value); if (error) { new Notice(error); return; } await this.submit(value); this.close(); };
    save.addEventListener("click", () => void commit());
    input.addEventListener("keydown", event => { if (event.isComposing || event.keyCode === 229) return; if (event.key === "Enter") void commit(); });
    window.setTimeout(() => input.focus(), 0);
  }
}

class ConfirmModal extends Modal {
  constructor(app, title, message, confirmText, onConfirm) { super(app); this.title = title; this.message = message; this.confirmText = confirmText; this.onConfirm = onConfirm; }
  onOpen() {
    const { contentEl } = this;
    this.modalEl.addClass("pvd-modal-shell");
    contentEl.addClass("pvd-modal");
    contentEl.createEl("h2", { text: this.title });
    contentEl.createEl("p", { text: this.message });
    const actions = contentEl.createDiv({ cls: "pvd-modal-actions" });
    const cancel = actions.createEl("button", { text: "取消" });
    const ok = actions.createEl("button", { text: this.confirmText, cls: "mod-cta" });
    cancel.addEventListener("click", () => this.close());
    ok.addEventListener("click", async () => { await this.onConfirm(); this.close(); });
  }
}

class TaskEditorModal extends Modal {
  constructor(app, file, data, projects, submit) { super(app); this.file = file; this.data = data; this.projects = projects; this.submit = submit; }
  onOpen() {
    const { contentEl } = this; this.modalEl.addClass("pvd-modal-shell"); contentEl.addClass("pvd-modal"); const data = this.data;
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
    const { contentEl } = this; this.modalEl.addClass("pvd-modal-shell"); contentEl.addClass("pvd-modal"); contentEl.createEl("h2", { text: "初始化 Focus Workbench" });
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
  constructor(leaf, plugin) { super(leaf); this.plugin = plugin; this.tab = "home"; this.taskView = "today"; this.taskVisualMode = "calendar"; this.taskVisualProject = ""; this.taskVisualPriority = ""; this.taskVisualStatus = "all"; this.timelineDays = 14; this.taskFilter = "active"; this.completedExpanded = false; this.focusPath = ""; this.selectedTaskPath = ""; this.taskSearch = ""; this.knowledgeFilter = "all"; this.knowledgeSearch = ""; this.calendarMonth = this.monthStart(new Date()); }
  getViewType() { return VIEW_TYPE; }
  getDisplayText() { return "Focus Workbench"; }
  getIcon() { return "layout-dashboard"; }
  async onOpen() {
    this.sourceTasks = [];
    this.overtimeNotified = new Set();
    await this.reconcileStaleTimers();
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
  async reconcileStaleTimers() {
    const staleMs = 12 * 3600 * 1000;
    for (const file of this.allTaskFiles()) {
      if (this.timerState(file) !== "进行中") continue;
      const started = this.timestamp(this.taskProperty(file, "timerStartedField"));
      if (!started || Date.now() - started.getTime() <= staleMs) continue;
      await this.app.fileManager.processFrontMatter(file, fm => this.pauseTimerFrontmatter(fm));
      new Notice(`“${file.basename}”的计时已超过 12 小时，已自动暂停，累计时长已保留。`);
    }
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
  monthStart(value) { return new Date(value.getFullYear(), value.getMonth(), 1); }
  daysInMonth(value) { return new Date(value.getFullYear(), value.getMonth() + 1, 0).getDate(); }
  calendarDateKey(year, month, day) { return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`; }
  calendarMonthLabel() { return new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "long" }).format(this.calendarMonth); }
  changeCalendarMonth(offset) { this.calendarMonth = new Date(this.calendarMonth.getFullYear(), this.calendarMonth.getMonth() + offset, 1); void this.render(); }
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
  // Selection only expands the card; focus changes go through setFocus (切换焦点 / 设为焦点 / 开始专注).
  selectTask(file) { this.selectedTaskPath = this.selectedTaskPath === file.path ? "" : file.path; void this.render(); }
  handleShortcut(event) {
    if (event.defaultPrevented || event.altKey) return;
    const target = event.target;
    // Never steal keys from text entry: form fields, contenteditable, and the CodeMirror editor.
    if (target && (/(input|textarea|select)/i.test(target.tagName || "") || target.isContentEditable || (typeof target.closest === "function" && target.closest(".cm-editor")))) return;
    if (target && target !== document.body && target !== document.documentElement && !this.contentEl.contains(target)) return;
    if ((!target || target === document.body || target === document.documentElement) && this.app.workspace.activeLeaf !== this.leaf) return;
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
  isOvertime(file) { const expected = this.expectedSeconds(file); return expected > 0 && this.elapsedSeconds(file) > expected; }
  remainingPercent(file) {
    const expected = this.expectedSeconds(file);
    if (!expected) return null;
    return Math.max(0, Math.min(100, ((expected - this.elapsedSeconds(file)) / expected) * 100));
  }
  timer(parent, file) { return parent.createEl("strong", { cls: `pvd-timer ${this.timerState(file) === "进行中" ? "is-running" : ""} ${this.isOvertime(file) ? "is-over" : ""}`, text: this.timerLabel(file), attr: { "data-pvd-timer": file.path } }); }
  countdownLiquid(parent, file) {
    const percent = this.remainingPercent(file);
    const label = percent === null ? "未设时限" : `${Math.round(percent)}%`;
    const liquid = parent.createEl("aside", {
      cls: `pvd-countdown-liquid ${this.timerState(file) === "进行中" ? "is-running" : ""} ${this.isOvertime(file) ? "is-over" : ""} ${percent === null ? "is-unlimited" : ""}`,
      attr: { "data-pvd-liquid": file.path, role: "img", "aria-label": `倒计时液体：${percent === null ? "未设预计时长" : `剩余 ${Math.round(percent)}%`}` }
    });
    liquid.style.setProperty("--pvd-liquid-level", `${percent === null ? 100 : percent}%`);
    const glass = liquid.createDiv({ cls: "pvd-liquid-glass", attr: { "aria-hidden": "true" } });
    const fill = glass.createDiv({ cls: "pvd-liquid-fill" });
    glass.createDiv({ cls: "pvd-liquid-glint" });
    const copy = liquid.createDiv({ cls: "pvd-liquid-copy" });
    copy.createEl("strong", { text: label, attr: { "data-pvd-liquid-percent": "" } });
    copy.createSpan({ text: percent === null ? "未设时限" : "剩余时间", attr: { "data-pvd-liquid-caption": "" } });
    return liquid;
  }
  updateTimers() {
    // Re-check long-running sessions periodically, not just when the view opens.
    this.timerTick = (this.timerTick || 0) + 1;
    if (this.timerTick % 300 === 0) void this.reconcileStaleTimers();
    this.contentEl.querySelectorAll("[data-pvd-timer]").forEach(element => {
      const file = this.app.vault.getAbstractFileByPath(element.getAttribute("data-pvd-timer"));
      if (!file || file.children) return;
      const running = this.timerState(file) === "进行中";
      element.textContent = this.timerLabel(file);
      element.classList.toggle("is-running", running);
      element.classList.toggle("is-over", this.isOvertime(file));
      if (!running || !this.isOvertime(file)) return;
      const key = `${file.path}:${this.taskProperty(file, "timerStartedField")}`;
      if (this.overtimeNotified && !this.overtimeNotified.has(key)) { this.overtimeNotified.add(key); new Notice(`“${file.basename}”已超过预计耗时，继续计时中。`); }
    });
    this.contentEl.querySelectorAll("[data-pvd-liquid]").forEach(liquid => {
      const file = this.app.vault.getAbstractFileByPath(liquid.getAttribute("data-pvd-liquid"));
      if (!file || file.children) return;
      const percent = this.remainingPercent(file);
      const running = this.timerState(file) === "进行中";
      liquid.style.setProperty("--pvd-liquid-level", `${percent === null ? 100 : percent}%`);
      liquid.classList.toggle("is-running", running);
      liquid.classList.toggle("is-over", this.isOvertime(file));
      liquid.classList.toggle("is-unlimited", percent === null);
      liquid.setAttribute("aria-label", `倒计时液体：${percent === null ? "未设预计时长" : `剩余 ${Math.round(percent)}%`}`);
      liquid.querySelector("[data-pvd-liquid-percent]").textContent = percent === null ? "—" : `${Math.round(percent)}%`;
      liquid.querySelector("[data-pvd-liquid-caption]").textContent = percent === null ? "未设时限" : "剩余时间";
    });
  }

  async render() {
    await this.refreshTaskSource();
    const root = this.contentEl;
    const previousTab = this.renderedTab;
    const scrollTop = previousTab === this.tab ? root.scrollTop : 0;
    const focused = document.activeElement;
    const refocus = focused && root.contains(focused) && /^(input|textarea)$/i.test(focused.tagName) && typeof focused.className === "string" && focused.className.includes("pvd-task-search")
      ? { start: focused.selectionStart, end: focused.selectionEnd }
      : null;
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
    this.renderedTab = this.tab;
    root.scrollTop = scrollTop;
    if (refocus) {
      const search = root.querySelector(".pvd-task-search");
      if (search) { search.focus(); try { search.setSelectionRange(refocus.start, refocus.end); } catch (error) { /* selection not supported on this input */ } }
    }
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
    // Partial update like the search box: keep scroll position and avoid rebuilding the whole tab.
    [["all", "全部文章"], ...groups.map(group => [group.key, group.name])].forEach(([key, label]) => this.button(filters, label, event => { this.knowledgeFilter = key; filters.querySelectorAll("button").forEach(option => option.removeClass("is-active")); event.currentTarget.addClass("is-active"); this.renderArticleResults(this.articleResultsEl, groups); }, this.knowledgeFilter === key ? "is-active" : ""));
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

  renderTaskCalendar(shell, tasks) {
    const month = this.calendarMonth; const year = month.getFullYear(); const monthIndex = month.getMonth(); const todayKey = this.todayKey();
    const card = shell.createEl("section", { cls: "pvd-card pvd-task-calendar" });
    const header = card.createDiv({ cls: "pvd-calendar-header" });
    const copy = header.createDiv(); copy.createEl("p", { text: "TASK CALENDAR" }); copy.createEl("h2", { text: this.calendarMonthLabel() });
    const controls = header.createDiv({ cls: "pvd-calendar-controls" });
    this.button(controls, "‹ 上月", () => this.changeCalendarMonth(-1));
    this.button(controls, "本月", () => { this.calendarMonth = this.monthStart(new Date()); void this.render(); }, "mod-cta");
    this.button(controls, "下月 ›", () => this.changeCalendarMonth(1));
    const weekday = card.createDiv({ cls: "pvd-calendar-weekdays" }); ["一", "二", "三", "四", "五", "六", "日"].forEach(day => weekday.createEl("span", { text: day }));
    const grid = card.createDiv({ cls: "pvd-calendar-grid" }); const firstOffset = (month.getDay() + 6) % 7; const days = this.daysInMonth(month);
    for (let index = 0; index < firstOffset; index += 1) grid.createDiv({ cls: "pvd-calendar-day is-empty", attr: { "aria-hidden": "true" } });
    for (let day = 1; day <= days; day += 1) {
      const dateKey = this.calendarDateKey(year, monthIndex, day); const dayTasks = tasks.filter(file => this.taskPlanKey(file) === dateKey).sort((a, b) => this.compareTasks(a, b));
      const dayEl = grid.createDiv({ cls: `pvd-calendar-day ${dateKey === todayKey ? "is-today" : ""} ${dayTasks.length ? "has-tasks" : ""}` });
      const label = dayEl.createDiv({ cls: "pvd-calendar-day-label" }); label.createEl("strong", { text: String(day) }); if (dateKey === todayKey) label.createSpan({ text: "今天" });
      const list = dayEl.createDiv({ cls: "pvd-calendar-task-list" });
      dayTasks.slice(0, 3).forEach(file => { const chip = this.button(list, file.basename, () => { this.focusPath = file.path; this.selectedTaskPath = file.path; void this.render(); }, `pvd-calendar-task ${this.taskDone(file) ? "is-done" : ""} ${this.priority(file).toLowerCase()}`); chip.setAttribute("title", `${file.basename} · ${this.taskStatus(file)}`); });
      if (dayTasks.length > 3) dayEl.createEl("span", { cls: "pvd-calendar-more", text: `+${dayTasks.length - 3} 项任务` });
    }
    const trailing = (7 - ((firstOffset + days) % 7)) % 7; for (let index = 0; index < trailing; index += 1) grid.createDiv({ cls: "pvd-calendar-day is-empty", attr: { "aria-hidden": "true" } });
  }

  renderFocusPanel(parent, tasks) {
    const active = tasks.filter(file => !this.taskDone(file)); const focus = this.focusTask(tasks);
    const mission = parent.createEl("section", { cls: "pvd-card pvd-mission pvd-water-focus-v2" });
    if (!focus) { mission.createEl("p", { text: "CURRENT FOCUS" }); mission.createEl("h2", { text: "还没有待推进的任务" }); this.button(mission, "新建任务", () => this.createTask(), "mod-cta"); return; }
    const missionHead = mission.createDiv({ cls: "pvd-mission-head" }); const missionCopy = missionHead.createDiv({ cls: "pvd-mission-copy" });
    missionCopy.createEl("p", { text: "CURRENT FOCUS" }); missionCopy.createEl("h2", { text: focus.basename });
    const missionMeta = missionCopy.createDiv({ cls: "pvd-mission-meta" }); this.timer(missionMeta, focus);
    const project = String(this.taskProperty(focus, "projectField") || "未关联项目").replace(/^\[\[|\]\]$/g, ""); missionMeta.createSpan({ text: `${project} · ${this.priority(focus)}` });
    this.countdownLiquid(mission, focus);
    const track = mission.createDiv({ cls: "pvd-stage" }); ["待做", "进行中", "暂停", "完成"].forEach(stage => track.createEl("span", { text: stage, cls: this.taskStatus(focus) === stage ? "is-current" : this.taskDone(focus) ? "is-done" : "" }));
    const actions = mission.createDiv({ cls: "pvd-actions" }); this.button(actions, this.timerState(focus) === "进行中" ? "暂停专注" : "开始专注", () => this.toggleTimer(focus), "mod-cta"); this.button(actions, "编辑", () => this.editTask(focus)); this.button(actions, "完成", () => this.complete(focus));
    const switcher = mission.createDiv({ cls: "pvd-focus-switcher" }); switcher.createSpan({ text: "切换焦点" }); const chips = switcher.createDiv(); active.sort((a, b) => this.compareTasks(a, b)).slice(0, 6).forEach(file => this.button(chips, file.basename, () => this.setFocus(file), file.path === focus.path ? "is-active" : ""));
  }

  visualTasks(tasks) {
    return tasks.filter(file => {
      const project = String(this.taskProperty(file, "projectField") || "").replace(/^\[\[|\]\]$/g, "");
      if (this.taskVisualProject && project !== this.taskVisualProject) return false;
      if (this.taskVisualPriority && this.priority(file) !== this.taskVisualPriority) return false;
      if (this.taskVisualStatus === "active" && this.taskDone(file)) return false;
      if (this.taskVisualStatus === "doing" && this.taskStatus(file) !== "进行中") return false;
      if (this.taskVisualStatus === "done" && !this.taskDone(file)) return false;
      return true;
    });
  }
  selectVisual(parent, value, options, onChange, label) {
    const select = parent.createEl("select", { cls: "pvd-visual-select", attr: { "aria-label": label } });
    options.forEach(([optionValue, text]) => select.createEl("option", { value: optionValue, text })); select.value = value;
    select.addEventListener("change", event => { onChange(event.target.value); void this.render(); }); return select;
  }
  visualModeButton(parent, key, label) {
    const paths = {
      calendar: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
      timeline: '<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="8" cy="6" r="2"/><circle cx="15" cy="12" r="2"/><circle cx="11" cy="18" r="2"/>',
      stats: '<path d="M3 3v18h18"/><path d="M7 16v-4M12 16V7M17 16v-7"/>'
    };
    const button = parent.createEl("button", { cls: `pvd-visual-mode is-${key} ${this.taskVisualMode === key ? "is-active" : ""}`, attr: { title: label, "aria-label": label } });
    button.createSpan({ cls: "pvd-view-icon", attr: { "aria-hidden": "true" } }).innerHTML = `<svg width="16" height="16" style="display:block;width:16px;height:16px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths[key]}</svg>`;
    button.createSpan({ text: label }); button.addEventListener("click", () => { this.taskVisualMode = key; void this.render(); }); return button;
  }
  renderTaskVisualControls(parent, tasks) {
    const tools = parent.createDiv({ cls: "pvd-visual-controls" }); const modes = tools.createDiv({ cls: "pvd-visual-tabs" });
    [["calendar", "日历"], ["timeline", "时间轴"], ["stats", "统计"]].forEach(([key, label]) => this.visualModeButton(modes, key, label));
    const filters = tools.createDiv({ cls: "pvd-visual-filters" });
    const projects = [...new Set(tasks.map(file => String(this.taskProperty(file, "projectField") || "").replace(/^\[\[|\]\]$/g, "")).filter(Boolean))].sort((a, b) => a.localeCompare(b, "zh-CN"));
    this.selectVisual(filters, this.taskVisualProject, [["", "全部项目"], ...projects.map(value => [value, value])], value => { this.taskVisualProject = value; }, "项目筛选");
    this.selectVisual(filters, this.taskVisualPriority, [["", "全部优先级"], ["P0", "P0"], ["P1", "P1"], ["P2", "P2"]], value => { this.taskVisualPriority = value; }, "优先级筛选");
    this.selectVisual(filters, this.taskVisualStatus, [["all", "全部状态"], ["active", "未完成"], ["doing", "进行中"], ["done", "已完成"]], value => { this.taskVisualStatus = value; }, "状态筛选");
  }
  renderTimeline(parent, tasks) {
    const today = this.today(); const pastDays = this.timelineDays === 7 ? 2 : this.timelineDays === 14 ? 3 : 7; const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - pastDays); const dates = Array.from({ length: this.timelineDays }, (_, index) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + index));
    const startKey = this.dateKey(start); const endKey = this.dateKey(dates[dates.length - 1]); const scheduled = tasks.filter(file => { const key = this.taskPlanKey(file); return key >= startKey && key <= endKey; });
    const card = parent.createEl("section", { cls: "pvd-card pvd-timeline" }); card.style.setProperty("--pvd-timeline-days", String(this.timelineDays)); card.style.setProperty("--pvd-timeline-width", `${140 + this.timelineDays * 46}px`); const head = card.createDiv({ cls: "pvd-section-head" }); const copy = head.createDiv(); copy.createEl("h2", { text: "任务时间轴" }); copy.createEl("p", { text: `以今天为中心查看 ${this.timelineDays} 天排期，按项目分组显示。` });
    const ranges = head.createDiv({ cls: "pvd-timeline-ranges" }); [7, 14, 30].forEach(days => this.button(ranges, `${days} 天`, () => { this.timelineDays = days; void this.render(); }, this.timelineDays === days ? "is-active" : ""));
    const board = card.createDiv({ cls: "pvd-timeline-board" }); const months = board.createDiv({ cls: "pvd-timeline-months" }); months.createSpan({ cls: "pvd-timeline-corner", text: "项目" }); const monthGroups = []; dates.forEach((date, index) => { const key = `${date.getFullYear()}-${date.getMonth()}`; const current = monthGroups[monthGroups.length - 1]; if (current && current.key === key) current.count += 1; else monthGroups.push({ key, start: index, count: 1, label: `${date.getFullYear()} 年 ${date.getMonth() + 1} 月` }); }); monthGroups.forEach(month => { const label = months.createSpan({ text: month.label }); label.style.gridColumn = `${month.start + 2} / span ${month.count}`; });
    const header = board.createDiv({ cls: "pvd-timeline-header" }); header.createSpan({ text: "排期" }); dates.forEach(date => { const day = header.createSpan(); day.createEl("b", { text: String(date.getDate()) }); day.createEl("em", { text: ["日", "一", "二", "三", "四", "五", "六"][date.getDay()] }); if (this.dateKey(date) === this.todayKey()) day.addClass("is-today"); });
    const groups = new Map(); scheduled.forEach(file => { const project = String(this.taskProperty(file, "projectField") || "未关联项目").replace(/^\[\[|\]\]$/g, ""); if (!groups.has(project)) groups.set(project, []); groups.get(project).push(file); });
    if (!groups.size) board.createEl("p", { cls: "pvd-timeline-empty", text: "当前日期范围内没有已排期任务。" });
    groups.forEach((files, project) => { files.sort((a, b) => this.compareTasks(a, b)); const lane = board.createDiv({ cls: "pvd-timeline-lane" }); const laneRows = Math.max(files.length, 1); lane.style.setProperty("--pvd-lane-rows", String(laneRows)); lane.style.minHeight = `${laneRows * 36 + 18}px`; const label = lane.createDiv({ cls: "pvd-timeline-project" }); label.createEl("strong", { text: project }); label.createSpan({ text: `${files.length} 项` }); const track = lane.createDiv({ cls: "pvd-timeline-track" }); dates.forEach((date, index) => { const cell = track.createDiv({ cls: "pvd-timeline-cell" }); cell.style.gridColumn = String(index + 1); }); const todayIndex = dates.findIndex(date => this.dateKey(date) === this.todayKey()); if (todayIndex >= 0) { const marker = track.createDiv({ cls: "pvd-timeline-today-line", attr: { "aria-hidden": "true" } }); marker.style.gridColumn = String(todayIndex + 1); } files.forEach((file, rowIndex) => { const key = this.taskPlanKey(file); const index = dates.findIndex(date => this.dateKey(date) === key); if (index < 0) return; const chip = this.button(track, file.basename, () => { this.focusPath = file.path; this.selectedTaskPath = file.path; void this.render(); }, `pvd-timeline-task ${this.priority(file).toLowerCase()} ${this.taskDone(file) ? "is-done" : ""}`); chip.style.gridColumn = String(index + 1); chip.style.gridRow = String(rowIndex + 1); chip.setAttribute("title", `${file.basename} · ${key} · ${this.taskStatus(file)}`); }); });
    const overdue = tasks.filter(file => !this.taskDone(file) && this.taskPlanKey(file) && this.taskPlanKey(file) < startKey); const unscheduled = tasks.filter(file => !this.taskPlanKey(file));
    const foot = card.createDiv({ cls: "pvd-timeline-foot" }); if (overdue.length) foot.createSpan({ text: `范围外逾期 ${overdue.length} 项` }); if (unscheduled.length) foot.createSpan({ text: `未排期 ${unscheduled.length} 项` });
  }
  renderTaskStats(parent, tasks) {
    const total = tasks.length; const completed = tasks.filter(file => this.taskDone(file)); const active = tasks.filter(file => !this.taskDone(file)); const doing = active.filter(file => this.taskStatus(file) === "进行中"); const overdue = active.filter(file => this.isPastCalendarDay(this.taskPlanKey(file), this.today()));
    const card = parent.createEl("section", { cls: "pvd-card pvd-task-stats-view" }); card.createEl("h2", { text: "任务统计" }); card.createEl("p", { text: "统计基于当前筛选条件，不改变任务数据。" });
    const statIcons = { active: '<path d="M5 12h14M12 5l7 7-7 7"/>', doing: '<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>', done: '<circle cx="12" cy="12" r="8"/><path d="m8.5 12 2.2 2.2 4.8-5"/>', overdue: '<path d="M12 8v5M12 17h.01"/><path d="M10.3 3.7 2.5 17.2A2 2 0 0 0 4.2 20h15.6a2 2 0 0 0 1.7-2.8L13.7 3.7a2 2 0 0 0-3.4 0Z"/>' };
    const metrics = [["active", "待推进", active.length], ["doing", "进行中", doing.length], ["done", "已完成", completed.length], ["overdue", "已逾期", overdue.length]]; const summary = card.createDiv({ cls: "pvd-stats-grid" }); metrics.forEach(([tone, label, count]) => { const item = summary.createDiv({ cls: `is-${tone}` }); const icon = item.createSpan({ cls: "pvd-stat-icon", attr: { "aria-hidden": "true", style: "display:grid;width:28px;height:28px;overflow:hidden;place-items:center" } }); icon.innerHTML = `<svg width="15" height="15" style="display:block;width:15px;height:15px;max-width:15px;max-height:15px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${statIcons[tone]}</svg>`; item.createEl("b", { text: String(count) }); item.createSpan({ cls: "pvd-stat-label", text: label }); });
    // Chart bars must be mutually exclusive (待做/进行中/暂停/已完成); the KPI grid above intentionally shows overlapping counts.
    const chartMetrics = [["todo", "待做", active.filter(file => this.taskStatus(file) === "待做").length], ["doing", "进行中", doing.length], ["paused", "暂停", active.filter(file => this.taskStatus(file) === "暂停").length], ["done", "已完成", completed.length]];
    const maxMetric = Math.max(...chartMetrics.map(([, , count]) => count), 1); const chart = card.createDiv({ cls: "pvd-stats-chart" }); const chartHead = chart.createDiv({ cls: "pvd-stats-chart-head" }); const chartTitle = chartHead.createDiv(); chartTitle.createEl("h3", { text: "任务状态分布" }); chartTitle.createEl("p", { text: `共 ${total} 项任务 · 完成率 ${total ? Math.round(completed.length / total * 100) : 0}%` }); chartHead.createSpan({ text: "当前筛选" }); const plot = chart.createDiv({ cls: "pvd-chart-plot" }); const grid = plot.createDiv({ cls: "pvd-chart-grid", attr: { "aria-hidden": "true" } }); [100, 75, 50, 25, 0].forEach(value => grid.createSpan({ attr: { style: `--pvd-grid:${value}%` } })); const bars = plot.createDiv({ cls: "pvd-chart-bars" }); chartMetrics.forEach(([tone, label, count]) => { const column = bars.createDiv({ cls: `pvd-chart-column is-${tone}` }); column.createEl("b", { text: String(count) }); const bar = column.createDiv({ cls: "pvd-chart-bar", attr: { title: `${label}：${count} 项` } }); bar.style.setProperty("--pvd-bar-height", `${count ? Math.max(8, Math.round(count / maxMetric * 100)) : 2}%`); column.createSpan({ text: label }); });
    const analysis = card.createDiv({ cls: "pvd-stats-analysis" }); const priority = analysis.createDiv({ cls: "pvd-stats-panel" }); priority.createEl("h3", { text: "优先级分布" }); ["P0", "P1", "P2"].forEach(level => { const count = active.filter(file => this.priority(file) === level).length; const row = priority.createDiv({ cls: "pvd-stats-row" }); row.createSpan({ text: level }); const bar = row.createDiv({ cls: "pvd-stats-bar" }); bar.createSpan({ attr: { style: `width:${active.length ? Math.round(count / active.length * 100) : 0}%` } }); row.createEl("b", { text: String(count) }); });
    const projects = analysis.createDiv({ cls: "pvd-stats-panel" }); projects.createEl("h3", { text: "项目进展" }); const grouped = new Map(); tasks.forEach(file => { const project = String(this.taskProperty(file, "projectField") || "未关联项目").replace(/^\[\[|\]\]$/g, ""); if (!grouped.has(project)) grouped.set(project, []); grouped.get(project).push(file); }); [...grouped.entries()].sort((a, b) => b[1].length - a[1].length).slice(0, 6).forEach(([project, files]) => { const done = files.filter(file => this.taskDone(file)).length; const row = projects.createDiv({ cls: "pvd-stats-row" }); row.createSpan({ text: project }); const bar = row.createDiv({ cls: "pvd-stats-bar" }); bar.createSpan({ attr: { style: `width:${files.length ? Math.round(done / files.length * 100) : 0}%` } }); row.createEl("b", { text: `${done}/${files.length}` }); });
  }

  async renderTasks(shell) {
    const tasks = this.tasks(); const active = tasks.filter(file => !this.taskDone(file)); const today = this.today(); const todayKey = this.calendarKey(today);
    const todayCount = active.filter(file => this.isTodayTask(file, todayKey)).length; const doingCount = active.filter(file => this.taskStatus(file) === "进行中").length; const overdueCount = active.filter(file => this.isPastCalendarDay(this.taskPlanKey(file), today)).length;
    const views = shell.createDiv({ cls: "pvd-task-view-tabs" });
    [["today", "今日任务"], ["visual", "任务视图"], ["all", "全部任务"]].forEach(([key, label]) => this.button(views, label, () => { this.taskView = key; if (key === "today") this.taskFilter = "today"; if (key === "all" && this.taskFilter === "today") this.taskFilter = "active"; void this.render(); }, this.taskView === key ? "is-active" : ""));
    const overview = shell.createDiv({ cls: "pvd-task-overview" });
    const overviewText = this.taskView === "today" ? `今日 ${todayCount} 项 · 进行中 ${doingCount} 项 · 已逾期 ${overdueCount} 项` : this.taskView === "visual" ? `${this.taskVisualMode === "calendar" ? this.calendarMonthLabel() : this.taskVisualMode === "timeline" ? `${this.timelineDays} 天排期` : "当前筛选"} · 已应用项目、优先级与状态筛选` : `待推进 ${active.length} 项 · 进行中 ${doingCount} 项 · 已逾期 ${overdueCount} 项`;
    overview.createEl("span", { text: overviewText });
    const workspace = shell.createDiv({ cls: `pvd-task-workspace is-${this.taskView}` }); const main = workspace.createDiv({ cls: "pvd-task-main" }); const sidebar = workspace.createDiv({ cls: "pvd-task-sidebar" });
    this.renderFocusPanel(sidebar, tasks);
    const filters = { today: "今日", active: "全部待办", doing: "进行中", overdue: "已逾期" };
    if (this.taskView === "visual") {
      workspace.addClass("pvd-visual-workspace-v5"); workspace.addClass("pvd-visual-workspace-v7"); main.addClass("pvd-visual-v5"); main.addClass("pvd-visual-v7");
      this.renderTaskVisualControls(main, tasks); const visualTasks = this.visualTasks(tasks);
      if (this.taskVisualMode === "calendar") this.renderTaskCalendar(main, visualTasks);
      else if (this.taskVisualMode === "timeline") this.renderTimeline(main, visualTasks);
      else this.renderTaskStats(main, visualTasks);
      return;
    }
    if (this.taskView === "all") {
      const controls = main.createEl("section", { cls: "pvd-card pvd-task-controls" }); const toolbar = controls.createDiv({ cls: "pvd-task-toolbar" });
      const search = toolbar.createEl("input", { cls: "pvd-task-search", type: "search", placeholder: "搜索任务、项目或优先级…", value: this.taskSearch, attr: { "aria-label": "搜索任务" } });
      search.addEventListener("input", event => { this.taskSearch = event.target.value; void this.renderTasksResults(this.taskResultsEl, filters, tasks, today, this.taskFilter, true); });
      this.button(toolbar, "＋ 新建任务", () => this.createTask(), "mod-cta");
      const filterBar = controls.createDiv({ cls: "pvd-filter" }); Object.entries(filters).forEach(([key, label]) => this.button(filterBar, label, () => { this.taskFilter = key; void this.render(); }, this.taskFilter === key ? "is-active" : ""));
      const results = main.createDiv({ cls: "pvd-task-results" }); this.taskResultsEl = results; await this.renderTasksResults(results, filters, tasks, today, this.taskFilter, true); return;
    }
    await this.renderTasksResults(main, filters, tasks, today, "today", false);
  }

  matchesTaskSearch(file) {
    const query = this.taskSearch.trim().toLocaleLowerCase(); if (!query) return true;
    const project = String(this.taskProperty(file, "projectField") || "");
    return `${file.basename} ${project} ${this.priority(file)} ${this.taskStatus(file)}`.toLocaleLowerCase().includes(query);
  }
  renderCompletedTasks(parent, tasks) {
    const completed = tasks.filter(file => this.taskDone(file) && this.matchesTaskSearch(file)).sort((a, b) => this.calendarKey(this.taskProperty(b, "completedAtField")).localeCompare(this.calendarKey(this.taskProperty(a, "completedAtField"))) || b.stat.mtime - a.stat.mtime);
    if (!completed.length) return;
    const section = parent.createEl("section", { cls: `pvd-card pvd-completed-tasks ${this.completedExpanded ? "is-expanded" : ""}` });
    const toggle = this.button(section, `已完成 · ${completed.length} 项`, () => { this.completedExpanded = !this.completedExpanded; void this.render(); }, "pvd-completed-toggle");
    toggle.setAttribute("aria-expanded", String(this.completedExpanded));
    if (this.completedExpanded) { const list = section.createDiv({ cls: "pvd-completed-list" }); completed.forEach(file => this.renderTaskCard(list, file)); }
  }
  async renderTasksResults(parent, filters, suppliedTasks, suppliedToday, filterKey = this.taskFilter, showCompleted = false) {
    const tasks = suppliedTasks || this.tasks(); const today = suppliedToday || this.today();
    parent.empty();
    const filtered = tasks.filter(file => {
      if (filterKey === "today") return this.isTodayTask(file, this.calendarKey(today));
      if (filterKey === "active") return !this.taskDone(file); if (filterKey === "doing") return !this.taskDone(file) && this.taskStatus(file) === "进行中";
      return !this.taskDone(file) && this.isPastCalendarDay(this.taskPlanKey(file), today);
    }).filter(file => this.matchesTaskSearch(file)).sort((a, b) => this.compareTasks(a, b));
    const board = parent.createEl("section", { cls: "pvd-card pvd-board" }); board.createEl("h2", { text: `${filters[filterKey]} · ${filtered.length} 项` });
    if (!filtered.length) board.createEl("p", { text: "这里还没有任务。" });
    filtered.forEach(file => this.renderTaskCard(board, file));
    if (showCompleted) this.renderCompletedTasks(parent, tasks);
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
    if (!this.taskDone(file)) { this.button(actions, this.timerState(file) === "进行中" ? "暂停专注" : "开始专注", stop(() => this.toggleTimer(file)), "mod-cta"); this.button(actions, "标记完成", stop(() => this.complete(file))); if (this.focusPath !== file.path) this.button(actions, "设为焦点", stop(() => this.setFocus(file))); }
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
  uniqueTaskPath(dir, title) { let path = `${dir}/${title}.md`; let index = 2; while (this.app.vault.getAbstractFileByPath(path)) path = `${dir}/${title} ${index++}.md`; return path; }
  async createIdea() { new TextPromptModal(this.app, "记录灵感", "一句话写下想法", async title => { const dir = this.config().inbox; await this.ensureFolder(dir); const file = await this.app.vault.create(this.uniquePath(dir, title), `---\ntype: 闪念笔记\n状态: 收集\ndate: ${this.dateKey()}\n---\n\n# ${title}\n\n`); await this.openFile(file); await this.render(); }, title => this.validateNoteTitle(title)).open(); }
  async archiveIdea(file) { await this.app.fileManager.processFrontMatter(file, fm => { fm["状态"] = "已处理"; }); new Notice("灵感已标记为已处理"); await this.render(); }
  async createTask() { new TextPromptModal(this.app, "新建任务", "任务标题", async title => { const dir = this.config().task; await this.ensureFolder(dir); const file = await this.app.vault.create(this.uniqueTaskPath(dir, title), await this.newTaskContent(title)); await this.openFile(file); await this.render(); }, title => this.validateNoteTitle(title)).open(); }
  escapeRegExp(text) { return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
  setFrontmatterField(source, field, value) {
    const pattern = new RegExp(`^(${this.escapeRegExp(field)}\\s*:).*$`, "m");
    if (pattern.test(source)) return source.replace(pattern, (match, prefix) => `${prefix} ${value}`);
    // Template lacks the field: append it inside the existing frontmatter block instead of dropping the value.
    return source.replace(/^---\r?\n([\s\S]*?)\r?\n---/, (match, body) => `---\n${body}\n${field}: ${value}\n---`);
  }
  async newTaskContent(title) {
    const schema = this.schema();
    const templatePath = this.plugin.settings.taskTemplatePath;
    const template = templatePath ? this.app.vault.getAbstractFileByPath(templatePath) : null;
    if (template && !template.children) {
      let content = await this.app.vault.cachedRead(template);
      content = this.setFrontmatterField(content, schema.planField, this.dateKey());
      content = this.setFrontmatterField(content, "创建日期", this.dateKey());
      return /^# .+$/m.test(content) ? content.replace(/^# .+$/m, () => `# ${title}`) : `${content.trimEnd()}\n\n# ${title}\n`;
    }
    return `---\n${schema.typeField}: ${schema.typeValue}\n${schema.projectField}: \"\"\n${schema.statusField}: 待做\n${schema.priorityField}: P2\n${schema.planField}: ${this.dateKey()}\n${schema.timerStateField}: 未开始\n${schema.timerStartedField}: \n${schema.elapsedField}: 0\n${schema.doneField}: false\n---\n\n# ${title}\n\n## 完成标准\n\n- [ ] \n`;
  }
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
  async deleteTask(file) { new ConfirmModal(this.app, "删除任务", `将“${file.basename}”移入 Obsidian 回收站？`, "删除", async () => { await this.app.fileManager.trashFile(file); new Notice("任务已移入回收站"); await this.render(); }).open(); }
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
    new Setting(containerEl).setName("初始化卡片笔记仓库结构").setDesc("创建闪念笔记、文献笔记、永久笔记、任务、项目与每日进展目录；不会覆盖或移动已有文件。").addButton(button => button.setButtonText("创建目录").setCta().onClick(() => new ConfirmModal(this.app, "初始化目录结构", "将创建标准卡片笔记与任务目录。已有文件不会被修改，是否继续？", "创建", async () => {
      const settings = this.plugin.settings; const goals = "目标与任务";
      const defaults = { inboxFolder: "闪念笔记", literatureFolder: "文献笔记", permanentFolder: "永久笔记", taskFolder: `${goals}/任务管理/任务`, projectFolder: `${goals}/任务管理/项目` };
      Object.entries(defaults).forEach(([key, value]) => { if (!settings[key]) settings[key] = value; });
      const folders = [settings.inboxFolder, settings.literatureFolder, settings.permanentFolder, settings.taskFolder, settings.projectFolder, `${goals}/任务管理/每日进展`];
      for (const folder of folders) { let current = ""; for (const part of folder.split("/").filter(Boolean)) { current = current ? `${current}/${part}` : part; if (!this.app.vault.getAbstractFileByPath(current)) await this.app.vault.createFolder(current); } }
      await this.plugin.saveSettings(); this.display(); new Notice("标准卡片笔记仓库结构已创建。");
    }).open()));
    new Setting(containerEl).setName("任务目录").setDesc("只读取此目录及子目录内、符合任务类型字段和值的 Markdown 文件。").addText(text => text.setPlaceholder("Tasks").setValue(this.plugin.settings.taskFolder).onChange(async value => { this.plugin.settings.taskFolder = value.trim().replace(/^\.\//, "").replace(/\/$/, ""); await this.plugin.saveSettings(); }));
    new Setting(containerEl).setName("项目目录").setDesc("编辑任务时用于生成所属项目下拉选项。").addText(text => text.setPlaceholder("Projects").setValue(this.plugin.settings.projectFolder).onChange(async value => { this.plugin.settings.projectFolder = value.trim().replace(/^\.\//, "").replace(/\/$/, ""); await this.plugin.saveSettings(); }));
    new Setting(containerEl).setName("任务模板路径").setDesc("新建任务时优先使用该 Markdown 模板，自动填写计划日期与创建日期，并替换首个一级标题；文件不存在时使用内置格式。").addText(text => text.setPlaceholder("模板/任务模板.md").setValue(this.plugin.settings.taskTemplatePath).onChange(async value => { this.plugin.settings.taskTemplatePath = value.trim().replace(/^\.\//, ""); await this.plugin.saveSettings(); }));
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

const VISUAL_RUNTIME_STYLE_ID = "pvd-visual-runtime-v7";
const VISUAL_RUNTIME_CSS = `
.pvd-visual-workspace-v5{grid-template-columns:minmax(0,1fr) minmax(260px,310px)!important;gap:18px!important}
.pvd-visual-v5{gap:14px!important;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Microsoft YaHei",sans-serif!important}
.pvd-visual-v5 .pvd-timeline,.pvd-visual-v5 .pvd-task-stats-view{display:grid!important;gap:14px!important;overflow:visible!important;padding:0!important;border:0!important;border-radius:0!important;background:transparent!important;box-shadow:none!important;transform:none!important}
.pvd-visual-v5 .pvd-timeline>.pvd-section-head{min-height:48px!important;padding:0 2px!important}.pvd-visual-v5 .pvd-timeline .pvd-section-head h2,.pvd-visual-v5 .pvd-task-stats-view>h2{margin:0!important;color:#302e36!important;font:700 20px/1.2 -apple-system,BlinkMacSystemFont,"Segoe UI","Microsoft YaHei",sans-serif!important;letter-spacing:-.015em!important}.pvd-visual-v5 .pvd-timeline .pvd-section-head p,.pvd-visual-v5 .pvd-task-stats-view>p{color:#8b8994!important;font:500 11px/1.4 -apple-system,BlinkMacSystemFont,"Segoe UI","Microsoft YaHei",sans-serif!important}.pvd-visual-v5 .pvd-task-stats-view>p{margin:-9px 0 0!important}
.pvd-visual-v5 .pvd-timeline-board{overflow-x:auto!important;border:1px solid rgba(88,83,115,.12)!important;border-radius:12px!important;background:#fff!important;box-shadow:0 8px 24px rgba(56,48,91,.05)!important}.pvd-visual-v5 .pvd-timeline-months,.pvd-visual-v5 .pvd-timeline-header,.pvd-visual-v5 .pvd-timeline-lane{display:grid!important;grid-template-columns:140px repeat(var(--pvd-timeline-days),minmax(46px,1fr))!important;width:max(100%,var(--pvd-timeline-width))!important;min-width:var(--pvd-timeline-width)!important}.pvd-visual-v5 .pvd-timeline-months{min-height:34px!important;border-bottom:1px solid #eceaf0!important;background:#faf9fc!important}.pvd-visual-v5 .pvd-timeline-months>span{display:flex!important;align-items:center!important;padding:0 10px!important;border-left:1px solid #efedf2!important;color:#55525e!important;font:600 10px/1 -apple-system,BlinkMacSystemFont,"Segoe UI","Microsoft YaHei",sans-serif!important}.pvd-visual-v5 .pvd-timeline-months .pvd-timeline-corner{grid-column:1!important;border-left:0!important}.pvd-visual-v5 .pvd-timeline-header{min-height:46px!important;padding:0!important;border-bottom:1px solid #eceaf0!important;background:#fff!important}.pvd-visual-v5 .pvd-timeline-header>span{display:grid!important;align-content:center!important;gap:4px!important;border-left:1px solid #f0eef3!important;color:#9a98a1!important;text-align:center!important}.pvd-visual-v5 .pvd-timeline-header>span:first-child{padding-left:10px!important;border-left:0!important;text-align:left!important}.pvd-visual-v5 .pvd-timeline-header b{font:600 10px/1 -apple-system,BlinkMacSystemFont,"Segoe UI","Microsoft YaHei",sans-serif!important}.pvd-visual-v5 .pvd-timeline-header em{font:500 8px/1 -apple-system,BlinkMacSystemFont,"Segoe UI","Microsoft YaHei",sans-serif!important;font-style:normal!important}.pvd-visual-v5 .pvd-timeline-header .is-today b{display:grid!important;width:22px!important;height:22px!important;margin:auto!important;place-items:center!important;border-radius:50%!important;background:#7357d7!important;color:#fff!important}
.pvd-visual-v5 .pvd-timeline-lane{border-bottom:1px solid #eceaf0!important}.pvd-visual-v5 .pvd-timeline-project{display:flex!important;flex-direction:column!important;justify-content:center!important;min-width:0!important;padding:10px 12px!important;border-right:1px solid #eceaf0!important;background:#fbfafc!important}.pvd-visual-v5 .pvd-timeline-project strong{overflow:hidden!important;color:#4d4a55!important;font:600 11px/1.25 -apple-system,BlinkMacSystemFont,"Segoe UI","Microsoft YaHei",sans-serif!important;text-overflow:ellipsis!important;white-space:nowrap!important}.pvd-visual-v5 .pvd-timeline-project span{margin-top:5px!important;color:#aaa7b0!important;font:500 9px/1 -apple-system,BlinkMacSystemFont,"Segoe UI","Microsoft YaHei",sans-serif!important}.pvd-visual-v5 .pvd-timeline-track{display:grid!important;grid-template-columns:repeat(var(--pvd-timeline-days),minmax(46px,1fr))!important;grid-template-rows:repeat(var(--pvd-lane-rows),36px)!important;position:relative!important;align-content:center!important;background:transparent!important}.pvd-visual-v5 .pvd-timeline-cell{grid-row:1/-1!important;border-right:1px solid #f0eef3!important}.pvd-visual-v5 .pvd-timeline-task{z-index:2!important;align-self:center!important;width:max-content!important;max-width:170px!important;min-height:25px!important;margin:0 4px!important;padding:4px 8px!important;border:0!important;border-radius:5px!important;background:#e9f3fb!important;box-shadow:none!important;color:#3878a4!important;font:600 10px/1.2 -apple-system,BlinkMacSystemFont,"Segoe UI","Microsoft YaHei",sans-serif!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important}.pvd-visual-v5 .pvd-timeline-task.p0{background:#fbe7eb!important;color:#ae4f62!important}.pvd-visual-v5 .pvd-timeline-task.p1{background:#faeed9!important;color:#956822!important}
.pvd-visual-v5 .pvd-stats-grid{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:0!important;overflow:hidden!important;border:1px solid #eceaf0!important;border-radius:11px!important;background:#fff!important;box-shadow:0 6px 18px rgba(56,48,91,.04)!important}.pvd-visual-v5 .pvd-stats-grid>div{display:grid!important;grid-template-columns:28px 1fr!important;grid-template-areas:"icon value" "icon label"!important;column-gap:9px!important;min-height:66px!important;padding:11px 12px!important;border:0!important;border-right:1px solid #eceaf0!important;border-radius:0!important;background:#fff!important;box-shadow:none!important}.pvd-visual-v5 .pvd-stats-grid>div:last-child{border-right:0!important}.pvd-visual-v5 .pvd-stat-icon{grid-area:icon!important;display:grid!important;width:28px!important;height:28px!important;min-width:28px!important;min-height:28px!important;margin:0!important;padding:0!important;place-items:center!important;border-radius:7px!important;overflow:hidden!important}.pvd-visual-v5 .pvd-stat-icon svg{display:block!important;width:15px!important;height:15px!important;max-width:15px!important;max-height:15px!important}.pvd-visual-v5 .pvd-stats-grid b{grid-area:value!important;align-self:end!important;color:#403d47!important;font:700 20px/1 -apple-system,BlinkMacSystemFont,"Segoe UI","Microsoft YaHei",sans-serif!important}.pvd-visual-v5 .pvd-stats-grid .pvd-stat-label{grid-area:label!important;align-self:start!important;margin-top:3px!important;color:#85818b!important;font:500 10px/1 -apple-system,BlinkMacSystemFont,"Segoe UI","Microsoft YaHei",sans-serif!important}
.pvd-visual-v5 .pvd-stat-icon{background:#eee9ff!important;color:#6d51ca!important}.pvd-visual-v5 .is-doing .pvd-stat-icon{background:#e3f2ff!important;color:#418bc8!important}.pvd-visual-v5 .is-done .pvd-stat-icon{background:#e5f7ef!important;color:#3d9a73!important}.pvd-visual-v5 .is-overdue .pvd-stat-icon{background:#ffe8ee!important;color:#bf5870!important}
.pvd-visual-v5 .pvd-stats-chart,.pvd-visual-v5 .pvd-stats-panel{border:1px solid #eceaf0!important;border-radius:11px!important;background:#fff!important;box-shadow:0 6px 18px rgba(56,48,91,.04)!important}.pvd-visual-v5 .pvd-stats-chart{display:grid!important;gap:12px!important;padding:16px 18px 14px!important}.pvd-visual-v5 .pvd-stats-chart-head{display:flex!important;align-items:flex-start!important;justify-content:space-between!important;gap:16px!important}.pvd-visual-v5 .pvd-stats-chart-head h3,.pvd-visual-v5 .pvd-stats-panel h3{margin:0!important;color:#44414b!important;font:650 14px/1.2 -apple-system,BlinkMacSystemFont,"Segoe UI","Microsoft YaHei",sans-serif!important}.pvd-visual-v5 .pvd-stats-chart-head p{margin:5px 0 0!important;color:#99969f!important;font:500 10px/1.3 -apple-system,BlinkMacSystemFont,"Segoe UI","Microsoft YaHei",sans-serif!important}.pvd-visual-v5 .pvd-stats-chart-head>span{padding:5px 7px!important;border-radius:5px!important;background:#f0edf8!important;color:#71658c!important;font:600 9px/1 -apple-system,BlinkMacSystemFont,"Segoe UI","Microsoft YaHei",sans-serif!important}.pvd-visual-v5 .pvd-chart-plot{position:relative!important;height:210px!important;border-bottom:1px solid #dedbe3!important}.pvd-visual-v5 .pvd-chart-grid{position:absolute!important;inset:0!important}.pvd-visual-v5 .pvd-chart-grid span{position:absolute!important;right:0!important;left:0!important;bottom:var(--pvd-grid)!important;height:1px!important;border-top:1px dashed #eceaf0!important}.pvd-visual-v5 .pvd-chart-bars{position:absolute!important;inset:0 4%!important;display:grid!important;grid-template-columns:repeat(4,minmax(50px,1fr))!important;align-items:end!important;gap:7%!important}.pvd-visual-v5 .pvd-chart-column{display:grid!important;grid-template-rows:18px minmax(0,1fr) 24px!important;align-items:end!important;height:100%!important;justify-items:center!important;color:#85818b!important}.pvd-visual-v5 .pvd-chart-column>b,.pvd-visual-v5 .pvd-chart-column>span{color:#6d6974!important;font:600 10px/1 -apple-system,BlinkMacSystemFont,"Segoe UI","Microsoft YaHei",sans-serif!important}.pvd-visual-v5 .pvd-chart-bar{align-self:end!important;width:min(34px,48%)!important;height:var(--pvd-bar-height)!important;min-height:2px!important;border-radius:5px 5px 2px 2px!important;background:#8167df!important;box-shadow:none!important}.pvd-visual-v5 .pvd-chart-column.is-doing .pvd-chart-bar{background:#58a6df!important}.pvd-visual-v5 .pvd-chart-column.is-done .pvd-chart-bar{background:#4caf83!important}.pvd-visual-v5 .pvd-chart-column.is-overdue .pvd-chart-bar{background:#df6b82!important}.pvd-visual-v5 .pvd-stats-analysis{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important}.pvd-visual-v5 .pvd-stats-panel{display:grid!important;gap:11px!important;padding:14px 15px!important}.pvd-visual-v5 .pvd-stats-row{display:grid!important;grid-template-columns:minmax(72px,1fr) minmax(80px,2fr) auto!important;align-items:center!important;gap:10px!important;color:#85818b!important;font:500 10px/1.2 -apple-system,BlinkMacSystemFont,"Segoe UI","Microsoft YaHei",sans-serif!important}.pvd-visual-v5 .pvd-stats-bar{height:5px!important;overflow:hidden!important;border-radius:999px!important;background:#f0eef3!important}.pvd-visual-v5 .pvd-stats-bar span{display:block!important;height:100%!important;border-radius:inherit!important;background:#8167df!important}
@media(max-width:900px){.pvd-visual-workspace-v5{grid-template-columns:1fr!important}.pvd-visual-v5 .pvd-stats-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}}
/* v7 theme: Focus Workbench surfaces with Notion-inspired data structures. */
.pvd-visual-v7{--v7-purple:#7857df;--v7-blue:#52a5e3;--v7-ink:#2e3040;--v7-muted:#7189a0;--v7-line:rgba(99,126,158,.13)}
.pvd-visual-v7 .pvd-visual-controls{padding:8px 10px!important;border:1px solid rgba(255,255,255,.88)!important;border-radius:18px!important;background:rgba(255,255,255,.61)!important;box-shadow:0 12px 30px rgba(74,77,122,.08),inset 0 1px 0 #fff!important;backdrop-filter:blur(16px)!important}.pvd-visual-v7 .pvd-visual-tabs .pvd-visual-mode{min-height:38px!important;border-radius:12px!important;color:#66839d!important;font:800 12px/1 "Nunito","Microsoft YaHei",sans-serif!important}.pvd-visual-v7 .pvd-visual-tabs .pvd-visual-mode.is-active{background:linear-gradient(135deg,#eee9ff,#e3ddff)!important;box-shadow:0 5px 14px rgba(112,80,207,.13)!important;color:#674bc4!important}.pvd-visual-v7 .pvd-visual-select{min-height:36px!important;border:1px solid rgba(105,126,158,.14)!important;border-radius:11px!important;background:rgba(255,255,255,.78)!important;color:#668099!important;font:800 11px "Nunito","Microsoft YaHei",sans-serif!important}
.pvd-visual-v7 .pvd-timeline,.pvd-visual-v7 .pvd-task-stats-view{gap:18px!important;padding:26px!important;border:1px solid rgba(255,255,255,.90)!important;border-radius:30px!important;background:linear-gradient(145deg,rgba(255,255,255,.91),rgba(239,247,255,.76))!important;box-shadow:0 22px 52px rgba(77,78,124,.11),inset 0 1px 0 #fff!important}
.pvd-visual-v7 .pvd-timeline>.pvd-section-head{min-height:58px!important;padding:0!important}.pvd-visual-v7 .pvd-timeline .pvd-section-head h2,.pvd-visual-v7 .pvd-task-stats-view>h2{color:var(--v7-ink)!important;font:900 clamp(27px,2.7vw,35px)/1.12 "Nunito","Microsoft YaHei",sans-serif!important;letter-spacing:-.03em!important}.pvd-visual-v7 .pvd-timeline .pvd-section-head p,.pvd-visual-v7 .pvd-task-stats-view>p{color:var(--v7-muted)!important;font:700 12px/1.5 "Nunito","Microsoft YaHei",sans-serif!important}.pvd-visual-v7 .pvd-task-stats-view>p{margin:-12px 0 0!important}
.pvd-visual-v7 .pvd-timeline-ranges{padding:5px!important;border:1px solid rgba(255,255,255,.88)!important;border-radius:15px!important;background:rgba(255,255,255,.63)!important;box-shadow:0 8px 20px rgba(66,83,121,.07)!important}.pvd-visual-v7 .pvd-timeline-ranges button{min-height:36px!important;padding:0 12px!important;border-radius:11px!important;color:#6c86a0!important;font:800 11px "Nunito","Microsoft YaHei",sans-serif!important}.pvd-visual-v7 .pvd-timeline-ranges button.is-active{background:linear-gradient(135deg,#8b70ed,#7151d5)!important;box-shadow:0 7px 16px rgba(112,78,209,.20)!important;color:#fff!important}
.pvd-visual-v7 .pvd-timeline-board{border:1px solid rgba(255,255,255,.91)!important;border-radius:20px!important;background:rgba(255,255,255,.67)!important;box-shadow:0 12px 30px rgba(72,86,125,.08),inset 0 1px 0 #fff!important}.pvd-visual-v7 .pvd-timeline-months{min-height:40px!important;border-bottom-color:var(--v7-line)!important;background:linear-gradient(90deg,rgba(243,239,255,.76),rgba(235,247,255,.72))!important}.pvd-visual-v7 .pvd-timeline-months>span{border-left-color:var(--v7-line)!important;color:#536e88!important;font:900 11px/1 "Nunito","Microsoft YaHei",sans-serif!important}.pvd-visual-v7 .pvd-timeline-header{min-height:52px!important;border-bottom-color:var(--v7-line)!important;background:rgba(255,255,255,.73)!important}.pvd-visual-v7 .pvd-timeline-header>span{border-left-color:rgba(103,132,166,.09)!important;color:#8da3b8!important}.pvd-visual-v7 .pvd-timeline-header b{font:900 11px/1 "Nunito","Microsoft YaHei",sans-serif!important}.pvd-visual-v7 .pvd-timeline-header em{font:700 8px/1 "Nunito","Microsoft YaHei",sans-serif!important}.pvd-visual-v7 .pvd-timeline-header .is-today b{width:24px!important;height:24px!important;background:linear-gradient(135deg,#8b70ed,#7151d5)!important;box-shadow:0 5px 12px rgba(112,78,209,.22)!important}
.pvd-visual-v7 .pvd-timeline-lane{border-bottom-color:var(--v7-line)!important}.pvd-visual-v7 .pvd-timeline-project{border-right-color:var(--v7-line)!important;background:rgba(248,250,255,.70)!important}.pvd-visual-v7 .pvd-timeline-project strong{color:#4d6a84!important;font:900 11px/1.25 "Nunito","Microsoft YaHei",sans-serif!important}.pvd-visual-v7 .pvd-timeline-project span{color:#91a6b8!important;font:800 9px/1 "Nunito","Microsoft YaHei",sans-serif!important}.pvd-visual-v7 .pvd-timeline-cell{border-right-color:rgba(102,133,168,.09)!important}.pvd-visual-v7 .pvd-timeline-task{min-height:28px!important;padding:5px 9px!important;border:1px solid rgba(79,155,213,.12)!important;border-radius:9px!important;background:linear-gradient(135deg,#e8f6ff,#dceeff)!important;box-shadow:0 5px 12px rgba(68,133,186,.10)!important;color:#347cab!important;font:800 10px/1.2 "Nunito","Microsoft YaHei",sans-serif!important}.pvd-visual-v7 .pvd-timeline-task.p0{background:linear-gradient(135deg,#ffeaf0,#ffdde6)!important;color:#b45169!important}.pvd-visual-v7 .pvd-timeline-task.p1{background:linear-gradient(135deg,#fff4dc,#ffebc8)!important;color:#a36f20!important}
.pvd-visual-v7 .pvd-stats-grid{gap:11px!important;overflow:visible!important;border:0!important;border-radius:0!important;background:transparent!important;box-shadow:none!important}.pvd-visual-v7 .pvd-stats-grid>div{min-height:88px!important;padding:15px!important;border:1px solid rgba(255,255,255,.90)!important;border-radius:19px!important;background:rgba(255,255,255,.69)!important;box-shadow:0 10px 24px rgba(70,78,122,.07),inset 0 1px 0 #fff!important}.pvd-visual-v7 .pvd-stat-icon{width:38px!important;height:38px!important;min-width:38px!important;min-height:38px!important;border-radius:13px!important}.pvd-visual-v7 .pvd-stat-icon svg{width:19px!important;height:19px!important;max-width:19px!important;max-height:19px!important}.pvd-visual-v7 .pvd-stats-grid b{color:#353747!important;font:900 27px/1 "Nunito","Microsoft YaHei",sans-serif!important}.pvd-visual-v7 .pvd-stats-grid .pvd-stat-label{color:#748ca3!important;font:800 10px/1 "Nunito","Microsoft YaHei",sans-serif!important}
.pvd-visual-v7 .pvd-stats-chart,.pvd-visual-v7 .pvd-stats-panel{border:1px solid rgba(255,255,255,.91)!important;border-radius:21px!important;background:rgba(255,255,255,.61)!important;box-shadow:0 12px 28px rgba(70,78,122,.07),inset 0 1px 0 #fff!important}.pvd-visual-v7 .pvd-stats-chart{padding:20px 22px 17px!important}.pvd-visual-v7 .pvd-stats-chart-head h3,.pvd-visual-v7 .pvd-stats-panel h3{color:#3c3e50!important;font:900 15px/1.2 "Nunito","Microsoft YaHei",sans-serif!important}.pvd-visual-v7 .pvd-stats-chart-head p{color:#8298ac!important;font:700 10px/1.3 "Nunito","Microsoft YaHei",sans-serif!important}.pvd-visual-v7 .pvd-stats-chart-head>span{padding:7px 10px!important;border-radius:10px!important;background:#eee9ff!important;color:#6c51c7!important;font:800 9px/1 "Nunito","Microsoft YaHei",sans-serif!important}.pvd-visual-v7 .pvd-chart-plot{height:230px!important;border-bottom-color:rgba(104,128,158,.18)!important}.pvd-visual-v7 .pvd-chart-grid span{border-color:rgba(104,128,158,.11)!important}.pvd-visual-v7 .pvd-chart-bar{width:min(42px,52%)!important;border-radius:9px 9px 3px 3px!important;background:linear-gradient(180deg,#ae96f6,#7758de)!important;box-shadow:0 9px 18px rgba(119,85,220,.17)!important}.pvd-visual-v7 .pvd-chart-column.is-doing .pvd-chart-bar{background:linear-gradient(180deg,#86c9f4,#50a1df)!important}.pvd-visual-v7 .pvd-chart-column.is-done .pvd-chart-bar{background:linear-gradient(180deg,#7ed8b2,#45a77d)!important}.pvd-visual-v7 .pvd-chart-column.is-overdue .pvd-chart-bar{background:linear-gradient(180deg,#f49caf,#df687f)!important}.pvd-visual-v7 .pvd-chart-column>b,.pvd-visual-v7 .pvd-chart-column>span{color:#6b8196!important;font:800 10px/1 "Nunito","Microsoft YaHei",sans-serif!important}.pvd-visual-v7 .pvd-stats-panel{padding:18px!important}.pvd-visual-v7 .pvd-stats-row{color:#7189a0!important;font:800 10px/1.2 "Nunito","Microsoft YaHei",sans-serif!important}.pvd-visual-v7 .pvd-stats-bar{height:7px!important;background:rgba(111,128,160,.12)!important}.pvd-visual-v7 .pvd-stats-bar span{background:linear-gradient(90deg,#a089ee,#7657da)!important}
@media(max-width:720px){.pvd-visual-v7 .pvd-timeline,.pvd-visual-v7 .pvd-task-stats-view{padding:18px!important;border-radius:23px!important}.pvd-visual-v7 .pvd-stats-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}.pvd-visual-v7 .pvd-stats-grid>div{min-height:76px!important}.pvd-visual-v7 .pvd-chart-plot{height:190px!important}}
/* Exclusive status chart: todo uses the default violet bar; doing/done keep theirs. */
.pvd-visual-v5 .pvd-chart-column.is-paused .pvd-chart-bar{background:#e3b23c!important}
.pvd-visual-v7 .pvd-chart-column.is-todo .pvd-chart-bar{background:linear-gradient(180deg,#b3a6e8,#8f7ce0)!important}
.pvd-visual-v7 .pvd-chart-column.is-paused .pvd-chart-bar{background:linear-gradient(180deg,#f2cd6e,#e0a92e)!important}
/* Dark theme: remap hard-coded light surfaces to Obsidian-adjacent dark tones. */
.theme-dark .pvd-visual-v7{--v7-ink:#e8e5f0;--v7-muted:#a6a1b3;--v7-line:rgba(255,255,255,.09)}
.theme-dark .pvd-visual-v5 .pvd-timeline-board,.theme-dark .pvd-visual-v5 .pvd-timeline-header,.theme-dark .pvd-visual-v5 .pvd-stats-grid,.theme-dark .pvd-visual-v5 .pvd-stats-chart,.theme-dark .pvd-visual-v5 .pvd-stats-panel{background:#26242f!important;border-color:#3a3746!important;box-shadow:none!important}
.theme-dark .pvd-visual-v5 .pvd-stats-grid>div{background:#26242f!important;border-color:#3a3746!important;box-shadow:none!important}
.theme-dark .pvd-visual-v5 .pvd-timeline-months,.theme-dark .pvd-visual-v5 .pvd-timeline-project{background:#2c2a37!important;border-color:#3a3746!important}
.theme-dark .pvd-visual-v5 .pvd-timeline-months>span,.theme-dark .pvd-visual-v5 .pvd-timeline-header b,.theme-dark .pvd-visual-v5 .pvd-timeline-header em{color:#a6a1b3!important}
.theme-dark .pvd-visual-v5 .pvd-timeline-months>span,.theme-dark .pvd-visual-v5 .pvd-timeline-header>span{border-color:#3a3746!important}
.theme-dark .pvd-visual-v5 .pvd-timeline-project strong{color:#e8e5f0!important}
.theme-dark .pvd-visual-v5 .pvd-timeline-project span{color:#8a8696!important}
.theme-dark .pvd-visual-v5 .pvd-timeline-lane,.theme-dark .pvd-visual-v5 .pvd-timeline-cell,.theme-dark .pvd-visual-v5 .pvd-timeline-months,.theme-dark .pvd-visual-v5 .pvd-timeline-header{border-color:#3a3746!important}
.theme-dark .pvd-visual-v5 .pvd-timeline .pvd-section-head h2,.theme-dark .pvd-visual-v5 .pvd-task-stats-view>h2{color:#e8e5f0!important}
.theme-dark .pvd-visual-v5 .pvd-timeline .pvd-section-head p,.theme-dark .pvd-visual-v5 .pvd-task-stats-view>p,.theme-dark .pvd-visual-v5 .pvd-stats-row,.theme-dark .pvd-visual-v5 .pvd-chart-column>b,.theme-dark .pvd-visual-v5 .pvd-chart-column>span{color:#a6a1b3!important}
.theme-dark .pvd-visual-v5 .pvd-stats-grid b{color:#e8e5f0!important}
.theme-dark .pvd-visual-v5 .pvd-stats-grid .pvd-stat-label,.theme-dark .pvd-visual-v5 .pvd-stats-chart-head p,.theme-dark .pvd-visual-v5 .pvd-stats-chart-head h3,.theme-dark .pvd-visual-v5 .pvd-stats-panel h3{color:#a6a1b3!important}
.theme-dark .pvd-visual-v5 .pvd-stats-chart-head h3,.theme-dark .pvd-visual-v5 .pvd-stats-panel h3{color:#e8e5f0!important}
.theme-dark .pvd-visual-v5 .pvd-stats-chart-head>span{background:#3b3750!important;color:#b9aee8!important}
.theme-dark .pvd-visual-v5 .pvd-chart-grid span{border-top-color:#3a3746!important}
.theme-dark .pvd-visual-v5 .pvd-chart-plot{border-bottom-color:#4a4658!important}
.theme-dark .pvd-visual-v5 .pvd-stats-bar{background:#3a3746!important}
.theme-dark .pvd-visual-v5 .pvd-timeline-task{background:rgba(88,140,190,.28)!important;color:#9fd0f0!important}
.theme-dark .pvd-visual-v5 .pvd-timeline-task.p0{background:rgba(190,88,110,.30)!important;color:#f2a9b8!important}
.theme-dark .pvd-visual-v5 .pvd-timeline-task.p1{background:rgba(200,160,70,.28)!important;color:#eed49a!important}
.theme-dark .pvd-visual-v7 .pvd-visual-controls,.theme-dark .pvd-visual-v7 .pvd-timeline-ranges{background:rgba(38,36,50,.85)!important;border-color:rgba(255,255,255,.10)!important;box-shadow:0 12px 30px rgba(0,0,0,.35)!important;backdrop-filter:none!important}
.theme-dark .pvd-visual-v7 .pvd-visual-tabs .pvd-visual-mode,.theme-dark .pvd-visual-v7 .pvd-timeline-ranges button{color:#a6a1b3!important}
.theme-dark .pvd-visual-v7 .pvd-visual-tabs .pvd-visual-mode.is-active{background:linear-gradient(135deg,#4c4570,#3f3a5e)!important;color:#dcd6f5!important;box-shadow:0 5px 14px rgba(0,0,0,.35)!important}
.theme-dark .pvd-visual-v7 .pvd-timeline-ranges button.is-active{background:linear-gradient(135deg,#7a63d8,#5f49b8)!important;color:#fff!important}
.theme-dark .pvd-visual-v7 .pvd-visual-select{background:rgba(30,28,42,.9)!important;border-color:rgba(255,255,255,.12)!important;color:#c7c2d4!important}
.theme-dark .pvd-visual-v7 .pvd-timeline,.theme-dark .pvd-visual-v7 .pvd-task-stats-view{background:linear-gradient(145deg,rgba(34,32,46,.96),rgba(30,32,46,.92))!important;border-color:rgba(255,255,255,.10)!important;box-shadow:0 22px 52px rgba(0,0,0,.45),inset 0 1px 0 rgba(255,255,255,.06)!important}
.theme-dark .pvd-visual-v7 .pvd-timeline-board{background:rgba(30,28,42,.9)!important;border-color:rgba(255,255,255,.10)!important;box-shadow:none!important}
.theme-dark .pvd-visual-v7 .pvd-timeline-months{background:linear-gradient(90deg,rgba(52,48,74,.85),rgba(44,48,72,.82))!important}
.theme-dark .pvd-visual-v7 .pvd-timeline-header{background:rgba(38,36,52,.9)!important}
.theme-dark .pvd-visual-v7 .pvd-timeline-header>span{color:#8a8696!important}
.theme-dark .pvd-visual-v7 .pvd-timeline-project{background:rgba(42,40,56,.85)!important}
.theme-dark .pvd-visual-v7 .pvd-timeline-project strong{color:#c7c2d4!important}
.theme-dark .pvd-visual-v7 .pvd-timeline-task{background:linear-gradient(135deg,rgba(70,120,170,.4),rgba(58,105,155,.35))!important;color:#a8d8f2!important;border-color:rgba(120,180,230,.25)!important;box-shadow:none!important}
.theme-dark .pvd-visual-v7 .pvd-timeline-task.p0{background:linear-gradient(135deg,rgba(180,80,105,.4),rgba(160,70,95,.35))!important;color:#f2aeb9!important}
.theme-dark .pvd-visual-v7 .pvd-timeline-task.p1{background:linear-gradient(135deg,rgba(190,150,60,.4),rgba(170,132,50,.35))!important;color:#eed49a!important}
.theme-dark .pvd-visual-v7 .pvd-stats-grid>div,.theme-dark .pvd-visual-v7 .pvd-stats-chart,.theme-dark .pvd-visual-v7 .pvd-stats-panel{background:rgba(38,36,52,.85)!important;border-color:rgba(255,255,255,.10)!important;box-shadow:0 10px 24px rgba(0,0,0,.35),inset 0 1px 0 rgba(255,255,255,.05)!important}
.theme-dark .pvd-visual-v7 .pvd-stats-grid b{color:#e8e5f0!important}
.theme-dark .pvd-visual-v7 .pvd-stats-grid .pvd-stat-label,.theme-dark .pvd-visual-v7 .pvd-stats-chart-head p,.theme-dark .pvd-visual-v7 .pvd-stats-row,.theme-dark .pvd-visual-v7 .pvd-chart-column>b,.theme-dark .pvd-visual-v7 .pvd-chart-column>span{color:#a6a1b3!important}
.theme-dark .pvd-visual-v7 .pvd-stats-chart-head h3,.theme-dark .pvd-visual-v7 .pvd-stats-panel h3{color:#e8e5f0!important}
.theme-dark .pvd-visual-v7 .pvd-stats-chart-head>span{background:#3b3750!important;color:#b9aee8!important}
.theme-dark .pvd-visual-v7 .pvd-chart-grid span{border-color:rgba(255,255,255,.07)!important}
.theme-dark .pvd-visual-v7 .pvd-chart-plot{border-bottom-color:rgba(255,255,255,.14)!important}
.theme-dark .pvd-visual-v7 .pvd-stats-bar{background:rgba(255,255,255,.10)!important}`;

module.exports = class FocusWorkbenchPlugin extends Plugin {
  async onload() {
    await this.loadSettings();
    document.getElementById(VISUAL_RUNTIME_STYLE_ID)?.remove();
    const visualStyle = document.createElement("style"); visualStyle.id = VISUAL_RUNTIME_STYLE_ID; visualStyle.textContent = VISUAL_RUNTIME_CSS; document.head.appendChild(visualStyle); this.register(() => visualStyle.remove());
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
      leaf = workspace.getLeaf("tab");
      await leaf.setViewState({ type: VIEW_TYPE, active: true, state: {} });
    }
    await workspace.revealLeaf(leaf);
  }
  onunload() { document.getElementById(VISUAL_RUNTIME_STYLE_ID)?.remove(); this.app.workspace.detachLeavesOfType(VIEW_TYPE); }
};

/* nosourcemap */

/* nosourcemap */

/* nosourcemap */

/* nosourcemap */
