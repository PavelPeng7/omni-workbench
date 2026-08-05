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
  constructor(app, file, data, projects, submit, workflow = []) { super(app); this.file = file; this.data = data; this.projects = projects; this.submit = submit; this.workflow = workflow; }
  onOpen() {
    const { contentEl } = this; this.modalEl.addClass("pvd-modal-shell"); contentEl.addClass("pvd-modal"); const data = this.data;
    contentEl.createEl("h2", { text: `编辑任务：${this.file.basename}` });
    contentEl.createEl("p", { cls: "pvd-modal-lead", text: "修改任务属性，或直接执行常用工作流。卡片本身保持简洁，不再展开操作面板。" });
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
    if (this.workflow.length) {
      const section = contentEl.createDiv({ cls: "pvd-modal-workflow" }); section.createEl("strong", { text: "快捷操作" });
      const workflowActions = section.createDiv({ cls: "pvd-modal-workflow-actions" });
      this.workflow.forEach(item => { const button = workflowActions.createEl("button", { text: item.label, cls: item.cls || "" }); button.addEventListener("click", async () => { this.close(); await item.run(); }); });
    }
    const actions = contentEl.createDiv({ cls: "pvd-modal-actions" });
    const save = actions.createEl("button", { text: "保存", cls: "mod-cta" });
    save.addEventListener("click", async () => { const minutes = estimate.value.trim(); if (minutes && (!/^\d+$/.test(minutes) || Number(minutes) < 0)) { new Notice("预计耗时请输入大于等于 0 的整数分钟数。"); return; } await this.submit({ project: project.value.trim(), priority: priority.value, status: status.value, plan: date.value, estimate: minutes }); this.close(); });
  }
}

class IdeaEditorModal extends Modal {
  constructor(app, view, file) { super(app); this.view = view; this.file = file; }
  onOpen() {
    const { contentEl } = this; const view = this.view; const file = this.file; const linkedTask = view.ideaLinkedTask(file);
    this.modalEl.addClass("pvd-modal-shell"); contentEl.addClass("pvd-modal"); contentEl.addClass("pvd-idea-editor-modal");
    contentEl.createEl("h2", { text: `编辑闪念：${view.ideaTitle(file)}` });
    contentEl.createEl("p", { cls: "pvd-modal-lead", text: `${view.ideaTimeLabel(file)}${linkedTask ? ` · 来源任务：${linkedTask.basename}` : " · 暂无关联任务"}` });
    const form = contentEl.createDiv({ cls: "pvd-task-editor" });
    const titleRow = form.createEl("label"); titleRow.createSpan({ text: "闪念标题" }); const title = titleRow.createEl("input", { type: "text", value: view.ideaTitle(file) });
    const tagsRow = form.createEl("label"); tagsRow.createSpan({ text: "标签（用逗号或空格分隔）" }); const tags = tagsRow.createEl("input", { type: "text", value: view.ideaTags(file).join(", "), placeholder: "例如：写作, Unity, 设计" });
    const section = contentEl.createDiv({ cls: "pvd-modal-workflow" }); section.createEl("strong", { text: "卡片笔记分流" }); section.createEl("p", { text: "完善后沉淀为永久笔记，保留外部来源时归档为文献笔记；形成明确行动则转任务，无价值则舍弃。" });
    const workflow = section.createDiv({ cls: "pvd-modal-workflow-actions" });
    const action = (label, run, cls = "") => { const button = workflow.createEl("button", { text: label, cls }); button.addEventListener("click", async () => { this.close(); await run(); }); };
    action("打开正文", () => view.openFile(file), "mod-cta");
    action("沉淀永久", () => view.convertIdeaToNote(file, "permanent"));
    action("归档文献", () => view.convertIdeaToNote(file, "literature"));
    if (linkedTask) action("打开来源任务", () => view.openFile(linkedTask)); else action("转为任务", () => view.convertIdeaToTask(file));
    action("舍弃", () => view.discardIdea(file), "pvd-danger");
    const actions = contentEl.createDiv({ cls: "pvd-modal-actions" }); const cancel = actions.createEl("button", { text: "取消" }); const save = actions.createEl("button", { text: "保存修改", cls: "mod-cta" });
    cancel.addEventListener("click", () => this.close());
    save.addEventListener("click", async () => { const nextTitle = title.value.trim(); const error = view.validateNoteTitle(nextTitle); if (error) { new Notice(error); return; } await view.updateIdea(file, { title: nextTitle, tags: tags.value }); this.close(); });
    window.setTimeout(() => title.focus(), 0);
  }
}

class SetupModal extends Modal {
  constructor(app, plugin) { super(app); this.plugin = plugin; }
  onOpen() {
    const { contentEl } = this; this.modalEl.addClass("pvd-modal-shell"); contentEl.addClass("pvd-modal"); contentEl.createEl("h2", { text: "连接现有仓库" });
    contentEl.createEl("p", { text: "仅在你已有自己的目录或 frontmatter 字段时使用。填写现有位置和字段名，不会移动或修改笔记。" });
    const form = contentEl.createDiv({ cls: "pvd-task-editor" }); const settings = this.plugin.settings; const schema = Object.assign({}, DEFAULT_SETTINGS.schema, settings.schema || {});
    const fields = [
      ["闪念笔记目录", "inboxFolder", settings.inboxFolder || ""], ["文献笔记目录", "literatureFolder", settings.literatureFolder || ""], ["永久笔记目录", "permanentFolder", settings.permanentFolder || ""],
      ["任务目录", "taskFolder", settings.taskFolder || ""], ["项目目录（可选）", "projectFolder", settings.projectFolder || ""],
      ["任务类型字段", "typeField", schema.typeField], ["任务类型值", "typeValue", schema.typeValue], ["状态字段", "statusField", schema.statusField],
      ["计划日期字段", "planField", schema.planField], ["所属项目字段", "projectField", schema.projectField], ["优先级字段", "priorityField", schema.priorityField]
    ];
    const inputs = new Map(); fields.forEach(([label, key, value]) => { const row = form.createEl("label"); row.createSpan({ text: label }); const input = row.createEl("input", { type: "text", value, placeholder: key.includes("Folder") ? "相对 vault 的目录路径" : "frontmatter 字段名" }); inputs.set(key, input); });
    const actions = contentEl.createDiv({ cls: "pvd-modal-actions" }); const save = actions.createEl("button", { text: "保存配置", cls: "mod-cta" });
    save.addEventListener("click", async () => { const taskFolder = inputs.get("taskFolder").value.trim().replace(/^\.\//, "").replace(/\/$/, ""); if (!taskFolder) { new Notice("请选择任务目录。"); return; } const nextSchema = Object.assign({}, schema); ["typeField", "typeValue", "statusField", "planField", "projectField", "priorityField"].forEach(key => nextSchema[key] = inputs.get(key).value.trim() || schema[key]); ["inboxFolder", "literatureFolder", "permanentFolder", "taskFolder", "projectFolder"].forEach(key => this.plugin.settings[key] = inputs.get(key).value.trim().replace(/^\.\//, "").replace(/\/$/, "")); this.plugin.settings.schema = nextSchema; await this.plugin.saveSettings(); this.close(); new Notice("omni-workbench 配置已保存。"); });
  }
}

class FocusWorkbenchView extends ItemView {
  constructor(leaf, plugin) { super(leaf); this.plugin = plugin; this.tab = "home"; this.taskView = "today"; this.taskVisualMode = "calendar"; this.taskVisualProject = ""; this.taskVisualPriority = ""; this.taskVisualStatus = "all"; this.timelineDays = 14; this.taskFilter = "active"; this.completedExpanded = false; this.focusPath = ""; this.taskSearch = ""; this.knowledgeFilter = "all"; this.knowledgeSearch = ""; this.calendarMonth = this.monthStart(new Date()); }
  getViewType() { return VIEW_TYPE; }
  getDisplayText() { return "omni-workbench"; }
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
  focusTask(tasks) { const selected = tasks.find(file => file.path === this.focusPath); if (selected) return selected; const active = tasks.filter(file => !this.taskDone(file)); return active.find(file => this.timerState(file) === "进行中") || active.filter(file => this.isTodayTask(file)).sort((a, b) => this.compareTasks(a, b))[0] || active.sort((a, b) => this.compareTasks(a, b))[0]; }
  async setFocus(file) { this.focusPath = file.path; await this.render(); }
  // Task labels select the shared focus; documents only open through explicit open actions.
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
  bindContextEditor(element, file, editor, label) {
    element.addEventListener("contextmenu", event => { event.preventDefault(); event.stopPropagation(); editor(); });
    element.addEventListener("keydown", event => { if (event.key === "ContextMenu" || (event.shiftKey && event.key === "F10")) { event.preventDefault(); editor(); } });
    element.setAttribute("title", `${label} · 右键编辑`);
  }
  bindCardOpenAndEdit(element, file, editor, label) {
    element.setAttribute("role", "button"); element.setAttribute("tabindex", "0"); element.setAttribute("aria-label", `${label}；左键打开，右键编辑`);
    element.addEventListener("click", event => { if (event.target.closest?.("button")) return; void this.openFile(file); });
    element.addEventListener("keydown", event => { if ((event.key === "Enter" || event.key === " ") && !event.shiftKey) { event.preventDefault(); void this.openFile(file); } });
    this.bindContextEditor(element, file, editor, label);
  }
  bindTaskLabel(element, file, label) {
    this.bindContextEditor(element, file, () => this.editTask(file), label);
    element.setAttribute("title", `${label} · 左键聚焦 · 右键编辑`);
    element.setAttribute("aria-label", `${label}；左键设为聚焦任务，右键编辑`);
  }
  bindTaskFocusAndEdit(element, file, label) {
    element.setAttribute("role", "button"); element.setAttribute("tabindex", "0");
    element.addEventListener("click", event => { if (event.target.closest?.("button")) return; void this.setFocus(file); });
    element.addEventListener("keydown", event => { if ((event.key === "Enter" || event.key === " ") && !event.shiftKey) { event.preventDefault(); void this.setFocus(file); } });
    this.bindTaskLabel(element, file, label);
  }
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
    title.createEl("h1", { text: this.tab === "home" ? "今天，做重要的事。" : this.tab === "tasks" ? "任务指挥舱" : "闪念处理与知识流" });
    title.createSpan({ text: this.dateKey() });
    const nav = header.createDiv({ cls: "pvd-tabs" });
    this.button(nav, "首页", async () => { this.tab = "home"; await this.render(); }, this.tab === "home" ? "is-active" : "");
    this.button(nav, "任务工作台", async () => { this.tab = "tasks"; await this.render(); }, this.tab === "tasks" ? "is-active" : "");
    this.button(nav, "知识工作台", async () => { this.tab = "knowledge"; await this.render(); }, this.tab === "knowledge" ? "is-active" : "");
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
    if (focus) this.bindTaskFocusAndEdit(focusCard, focus, `任务：${focus.basename}`);
    const actions = focusCard.createDiv({ cls: "pvd-actions" });
    if (focus) { if (!this.taskDone(focus)) { this.button(actions, this.timerState(focus) === "进行中" ? "暂停专注" : "开始专注", () => this.toggleTimer(focus), "mod-cta"); this.button(actions, "完成", () => this.complete(focus)); } this.button(actions, "查看", () => this.openFile(focus)); }
    else this.button(actions, "新建任务", () => this.createTask(), "mod-cta");

    const quick = shell.createDiv({ cls: "pvd-quick" });
    this.button(quick, "记录灵感", () => this.createIdea());
    this.button(quick, "新建任务", () => this.createTask());
    this.button(quick, "处理闪念", async () => { this.tab = "knowledge"; await this.render(); });
    const inbox = this.pendingIdeas().sort((a, b) => this.ideaCapturedAt(a) - this.ideaCapturedAt(b)).slice(0, 5);
    const inboxCard = shell.createEl("section", { cls: "pvd-card pvd-inbox" });
    const inboxHead = inboxCard.createDiv({ cls: "pvd-section-head" });
    const inboxCopy = inboxHead.createDiv(); inboxCopy.createEl("h2", { text: "灵感收集箱" }); inboxCopy.createEl("p", { text: "先快速捕捉，之后再整理成任务或知识卡片。" });
    this.button(inboxHead, "记录灵感", () => this.createIdea(), "mod-cta");
    const ideas = inboxCard.createDiv({ cls: "pvd-ideas" });
    if (!inbox.length) ideas.createEl("p", { text: "收集箱是空的。下一条灵感，先记下来。" });
    inbox.forEach(file => {
      const row = ideas.createDiv({ cls: "pvd-idea" }); const tags = Array.isArray(this.meta(file).tags) ? this.meta(file).tags.slice(0, 2).map(tag => `#${tag}`).join(" ") : "未分类";
      const ideaCopy = row.createDiv(); ideaCopy.createEl("strong", { text: this.ideaTitle(file) }); ideaCopy.createSpan({ text: `${tags} · ${this.ideaTimeLabel(file)}` });
      row.createSpan({ cls: "pvd-card-edit-hint", text: "左键打开 · 右键编辑" }); this.bindCardOpenAndEdit(row, file, () => this.editIdea(file), `闪念：${this.ideaTitle(file)}`);
    });
    const stream = shell.createEl("section", { cls: "pvd-card pvd-stream" });
    stream.createEl("h2", { text: "卡片笔记知识流" }); stream.createEl("p", { text: "闪念笔记捕捉想法，文献笔记保留来源与输入，永久笔记沉淀为可复用的独立知识。" });
    const lanes = stream.createDiv({ cls: "pvd-lanes" });
    [["① 闪念笔记", cfg.inbox], ["② 文献笔记", cfg.literature], ["③ 永久笔记", cfg.permanent]].forEach(([name, dir]) => {
      const lane = lanes.createDiv({ cls: "pvd-lane" }); lane.createEl("h3", { text: name });
      const notes = this.files().filter(file => this.starts(file, dir) && this.useful(file)).sort((a, b) => b.stat.mtime - a.stat.mtime).slice(0, 3);
      if (!notes.length) lane.createEl("span", { text: "暂无笔记" });
      notes.forEach(file => { const note = this.button(lane, "", () => this.openFile(file), "pvd-note"); note.createEl("strong", { text: file.basename }); if (this.starts(file, cfg.inbox)) this.bindContextEditor(note, file, () => this.editIdea(file), `闪念：${this.ideaTitle(file)}`); });
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
  knowledgeNotes(group) { const files = group.key === "fleeting" ? this.pendingIdeas() : this.files().filter(file => this.starts(file, group.dir) && this.useful(file)); return files.sort((a, b) => b.stat.mtime - a.stat.mtime); }
  pendingIdeas() {
    const completed = new Set(["已处理", "完成", "归档", "已转任务", "已转文献", "已转永久", "丢弃"]);
    return this.files().filter(file => this.starts(file, this.config().inbox) && this.useful(file))
      .filter(file => !completed.has(String(this.meta(file)["状态"] || this.meta(file)["处理状态"] || "收集")));
  }
  ideaCapturedAt(file) {
    const raw = this.meta(file).date || this.meta(file)["创建日期"];
    if (raw instanceof Date && !Number.isNaN(raw.getTime())) return new Date(raw.getTime());
    const match = String(raw || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    return new Date(file.stat.ctime);
  }
  ideaAgeDays(file) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const captured = this.ideaCapturedAt(file); captured.setHours(0, 0, 0, 0);
    return Math.max(0, Math.floor((today.getTime() - captured.getTime()) / 86400000));
  }
  ideaTitle(file) { return file.basename.replace(/^\d{4}-\d{2}-\d{2}\s+/, ""); }
  ideaTags(file) { const tags = this.meta(file).tags; return (Array.isArray(tags) ? tags : tags ? [tags] : []).map(tag => String(tag).replace(/^#/, "")).filter(Boolean); }
  ideaTimeLabel(file) {
    const age = this.ideaAgeDays(file);
    if (age === 0) return "今天捕捉 · 剩 7 天";
    if (age < 7) return `${age} 天前捕捉 · 剩 ${7 - age} 天`;
    if (age === 7) return "7 天前捕捉 · 今天到期";
    return `${age} 天前捕捉 · 已逾期 ${age - 7} 天`;
  }
  renderIdeaProcessingDesk(shell) {
    const pending = this.pendingIdeas().sort((a, b) => this.ideaCapturedAt(a) - this.ideaCapturedAt(b));
    const current = pending.filter(file => this.ideaAgeDays(file) <= 7);
    const overdue = pending.filter(file => this.ideaAgeDays(file) > 7);
    const dueToday = pending.filter(file => this.ideaAgeDays(file) === 7);
    const settled = this.knowledgeGroups().filter(group => group.key !== "fleeting").reduce((total, group) => total + this.knowledgeNotes(group).length, 0);
    const desk = shell.createEl("section", { cls: "pvd-card pvd-idea-desk" });
    const head = desk.createDiv({ cls: "pvd-idea-desk-head" });
    const copy = head.createDiv(); copy.createEl("p", { text: "CARD NOTE FLOW" }); copy.createEl("h2", { text: "从行动到知识" }); copy.createEl("span", { text: "任务旁捕捉闪念，七天内补清上下文，再沉淀为永久笔记、归档为文献笔记，或明确舍弃。" });
    const summary = head.createDiv({ cls: "pvd-idea-summary", attr: { "aria-label": `待处理 ${pending.length} 条，今日到期 ${dueToday.length} 条，逾期 ${overdue.length} 条，已沉淀 ${settled} 篇` } });
    const total = summary.createDiv(); total.createEl("strong", { text: String(pending.length) }); total.createSpan({ text: "待处理" });
    const due = summary.createDiv({ cls: dueToday.length ? "is-due" : "" }); due.createEl("strong", { text: String(dueToday.length) }); due.createSpan({ text: "今日到期" });
    const late = summary.createDiv({ cls: overdue.length ? "is-alert" : "" }); late.createEl("strong", { text: String(overdue.length) }); late.createSpan({ text: "已逾期" });
    const done = summary.createDiv(); done.createEl("strong", { text: String(settled) }); done.createSpan({ text: "知识笔记" });
    const timeline = desk.createDiv({ cls: "pvd-idea-timeline", attr: { role: "img", "aria-label": "卡片笔记流程：从任务或想法捕捉闪念，七天内澄清，并分流为永久笔记、文献笔记、任务或舍弃" } });
    [["TASK / IDEA", "就地捕捉", "在任务旁一键建立关联闪念"], ["DAY 0–6", "澄清闪念", "一次只保留一个想法，补足来源与上下文"], ["DAY 7", "必须分流", "沉淀永久 / 归档文献 / 转任务 / 舍弃"]].forEach(([day, title, description], index) => {
      const step = timeline.createDiv({ cls: "pvd-idea-time-step" }); step.createEl("b", { text: day }); step.createEl("strong", { text: title }); step.createSpan({ text: description });
      if (index < 2) timeline.createSpan({ cls: "pvd-idea-time-arrow", text: "→", attr: { "aria-hidden": "true" } });
    });
    const outcomes = desk.createDiv({ cls: "pvd-idea-outcomes" });
    [["永久笔记", "一个独立观点，用自己的话表达并可复用", "permanent"], ["文献笔记", "保留书籍、文章或外部资料的来源语境", "literature"], ["任务", "想法已经形成明确行动与完成标准", "task"], ["舍弃", "重复、无价值或已失去时效，不继续囤积", "discard"]].forEach(([name, description, kind]) => {
      const outcome = outcomes.createDiv({ cls: `pvd-idea-outcome is-${kind}` }); outcome.createEl("strong", { text: name }); outcome.createSpan({ text: description });
    });
    const queues = desk.createDiv({ cls: "pvd-idea-queues" });
    this.renderIdeaQueue(queues, "超过 7 天 · 优先处理", "这些闪念已经超过暂存周期，请先做去留判断", overdue, true);
    this.renderIdeaQueue(queues, "七天处理期", "按最早捕捉顺序整理；第七天必须完成分流", current, false);
  }
  renderIdeaQueue(parent, title, description, files, overdue) {
    const queue = parent.createEl("section", { cls: `pvd-idea-queue ${overdue ? "is-overdue" : ""}` });
    const head = queue.createDiv({ cls: "pvd-idea-queue-head" }); const copy = head.createDiv(); copy.createEl("h3", { text: title }); copy.createEl("p", { text: description }); head.createEl("strong", { text: String(files.length), attr: { "aria-label": `${files.length} 条` } });
    const list = queue.createDiv({ cls: "pvd-triage-list" });
    if (!files.length) { const empty = list.createDiv({ cls: "pvd-triage-empty" }); empty.createEl("strong", { text: overdue ? "没有逾期闪念" : "本周收件箱已清空" }); empty.createSpan({ text: overdue ? "很好，继续保持每周分流。" : "记录新想法后，它会出现在这里。" }); return; }
    files.forEach(file => this.renderIdeaTriageCard(list, file, overdue));
  }
  renderIdeaTriageCard(parent, file, overdue) {
    const age = this.ideaAgeDays(file); const linkedTask = this.ideaLinkedTask(file);
    const card = parent.createEl("article", { cls: `pvd-triage-card ${overdue ? "is-overdue" : age === 7 ? "is-due" : ""}` });
    const copy = card.createDiv({ cls: "pvd-triage-copy" });
    const eyebrow = copy.createDiv({ cls: "pvd-triage-meta" }); eyebrow.createSpan({ text: overdue ? "已逾期 · 立即判断" : age === 7 ? "今天必须分流" : "七天处理期" }); eyebrow.createSpan({ text: this.ideaTimeLabel(file) });
    if (linkedTask) eyebrow.createSpan({ cls: "is-linked", text: `来自任务 · ${linkedTask.basename}` });
    copy.createEl("h4", { text: this.ideaTitle(file) });
    const tags = Array.isArray(this.meta(file).tags) ? this.meta(file).tags.slice(0, 3).map(tag => `#${tag}`).join(" ") : "";
    copy.createEl("p", { text: tags || `捕捉于 ${this.dateKey(this.ideaCapturedAt(file))}` });
    const ageTrack = card.createDiv({ cls: "pvd-idea-age", attr: { role: "progressbar", "aria-label": "闪念处理周期", "aria-valuemin": "0", "aria-valuemax": "7", "aria-valuenow": String(Math.min(age, 7)) } });
    ageTrack.createSpan({ attr: { style: `width:${Math.min(100, Math.round(age / 7 * 100))}%` } });
    card.createSpan({ cls: "pvd-card-edit-hint", text: "左键打开正文 · 右键编辑与分流" });
    this.bindCardOpenAndEdit(card, file, () => this.editIdea(file), `闪念：${this.ideaTitle(file)}`);
  }
  ideaLinkedTask(file) {
    const value = this.meta(file)["关联任务"]; const raw = Array.isArray(value) ? value[0] : value;
    const link = String(raw || "").match(/\[\[([^\]|#]+)/)?.[1];
    return link ? this.app.metadataCache.getFirstLinkpathDest(link, file.path) : null;
  }
  async replaceTaskIdeaLink(task, previousPath, nextPath = "") {
    if (!task) return;
    const previousLink = `[[${previousPath.replace(/\.md$/, "")}]]`; const nextLink = nextPath ? `[[${nextPath.replace(/\.md$/, "")}]]` : "";
    await this.app.fileManager.processFrontMatter(task, fm => {
      const current = Array.isArray(fm["关联闪念"]) ? fm["关联闪念"] : fm["关联闪念"] ? [fm["关联闪念"]] : [];
      const updated = current.map(value => String(value) === previousLink ? nextLink : value).filter(Boolean);
      if (updated.length) fm["关联闪念"] = updated; else delete fm["关联闪念"];
    });
  }
  renderKnowledge(shell) {
    const groups = this.knowledgeGroups();
    const pending = this.pendingIdeas();
    const notes = groups.filter(group => group.key !== "fleeting").reduce((total, group) => total + this.knowledgeNotes(group).length, 0);
    const overview = shell.createDiv({ cls: "pvd-task-overview pvd-knowledge-overview" });
    overview.createEl("span", { text: `待处理闪念 ${pending.length} 条 · 已收录笔记 ${notes} 篇 · 在这里检索、整理并沉淀知识` });
    const quickCreate = shell.createEl("section", { cls: "pvd-today-actions pvd-knowledge-actions" });
    const quickCopy = quickCreate.createDiv({ cls: "pvd-today-actions-copy" });
    quickCopy.createEl("strong", { text: "捕捉要快，分流要明确" });
    quickCopy.createSpan({ text: pending.length ? `当前有 ${pending.length} 条闪念；优先处理超过七天的内容` : "收件箱已清空，可以记录下一条想法" });
    this.button(quickCreate, "＋ 记录闪念", () => this.createIdea(), "mod-cta");
    this.renderIdeaProcessingDesk(shell);
    const libraryHead = shell.createDiv({ cls: "pvd-knowledge-library-head" });
    const libraryCopy = libraryHead.createDiv(); libraryCopy.createEl("p", { text: "KNOWLEDGE LIBRARY" }); libraryCopy.createEl("h2", { text: "知识卡片库" }); libraryCopy.createSpan({ text: "检索已经沉淀或仍在处理的卡片笔记。" });
    const controls = shell.createEl("section", { cls: "pvd-card pvd-task-controls pvd-knowledge-controls" });
    const toolbar = controls.createDiv({ cls: "pvd-task-toolbar pvd-article-toolbar" });
    const search = toolbar.createEl("input", { cls: "pvd-task-search", type: "search", placeholder: "搜索文章标题…", value: this.knowledgeSearch, attr: { "aria-label": "搜索文章" } });
    search.addEventListener("input", event => { this.knowledgeSearch = event.target.value; this.renderArticleResults(this.articleResultsEl, groups); });
    toolbar.createSpan({ cls: "pvd-knowledge-search-hint", text: "按标题筛选知识库" });
    const filters = controls.createDiv({ cls: "pvd-filter pvd-article-filter" });
    // Partial update like the search box: keep scroll position and avoid rebuilding the whole tab.
    [["all", "全部文章"], ...groups.map(group => [group.key, group.name])].forEach(([key, label]) => this.button(filters, label, event => { this.knowledgeFilter = key; filters.querySelectorAll("button").forEach(option => option.removeClass("is-active")); event.currentTarget.addClass("is-active"); this.renderArticleResults(this.articleResultsEl, groups); }, this.knowledgeFilter === key ? "is-active" : ""));
    const results = shell.createDiv({ cls: "pvd-article-results pvd-knowledge-results" }); this.articleResultsEl = results; this.renderArticleResults(results, groups);
  }
  renderArticleResults(parent, groups = this.knowledgeGroups()) {
    parent.empty(); const query = this.knowledgeSearch.trim().toLocaleLowerCase();
    const visibleGroups = this.knowledgeFilter === "all" ? groups : groups.filter(group => group.key === this.knowledgeFilter);
    visibleGroups.forEach(group => {
      const section = parent.createEl("section", { cls: "pvd-card pvd-article-group" }); const notes = this.knowledgeNotes(group).filter(file => !query || file.basename.toLocaleLowerCase().includes(query));
      const head = section.createDiv({ cls: "pvd-section-head" }); const copy = head.createDiv(); copy.createEl("h2", { text: group.name }); copy.createEl("p", { text: `${group.description} · ${notes.length} 篇` });
      if (!notes.length) { section.createEl("p", { text: "暂无匹配文章。" }); return; }
      const list = section.createDiv({ cls: "pvd-article-list" }); notes.slice(0, 60).forEach(file => { const article = this.button(list, "", () => this.openFile(file), "pvd-article"); const text = article.createDiv(); text.createEl("strong", { text: file.basename }); text.createSpan({ text: this.dateKey(new Date(file.stat.mtime)) }); article.createEl("span", { text: group.key === "fleeting" ? "右键编辑" : "打开 →", cls: "pvd-article-open" }); if (group.key === "fleeting") this.bindContextEditor(article, file, () => this.editIdea(file), `闪念：${this.ideaTitle(file)}`); });
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
      dayTasks.slice(0, 3).forEach(file => { const chip = this.button(list, file.basename, () => this.setFocus(file), `pvd-calendar-task ${this.taskDone(file) ? "is-done" : ""} ${this.priority(file).toLowerCase()}`); this.bindTaskLabel(chip, file, `任务：${file.basename} · ${this.taskStatus(file)}`); });
      if (dayTasks.length > 3) dayEl.createEl("span", { cls: "pvd-calendar-more", text: `+${dayTasks.length - 3} 项任务` });
    }
    const trailing = (7 - ((firstOffset + days) % 7)) % 7; for (let index = 0; index < trailing; index += 1) grid.createDiv({ cls: "pvd-calendar-day is-empty", attr: { "aria-hidden": "true" } });
  }

  renderFocusPanel(parent, tasks) {
    const focus = this.focusTask(tasks);
    const mission = parent.createEl("section", { cls: "pvd-card pvd-mission pvd-water-focus-v2" });
    if (!focus) { mission.createEl("p", { text: "CURRENT FOCUS" }); mission.createEl("h2", { text: "还没有待推进的任务" }); this.button(mission, "新建任务", () => this.createTask(), "mod-cta"); return; }
    const missionHead = mission.createDiv({ cls: "pvd-mission-head" }); const missionCopy = missionHead.createDiv({ cls: "pvd-mission-copy" });
    missionCopy.createEl("p", { text: "CURRENT FOCUS" }); missionCopy.createEl("h2", { text: focus.basename });
    const missionMeta = missionCopy.createDiv({ cls: "pvd-mission-meta" }); this.timer(missionMeta, focus);
    const project = String(this.taskProperty(focus, "projectField") || "未关联项目").replace(/^\[\[|\]\]$/g, ""); missionMeta.createSpan({ text: `${project} · ${this.priority(focus)}` });
    this.bindTaskFocusAndEdit(mission, focus, `任务：${focus.basename}`);
    this.countdownLiquid(mission, focus);
    const track = mission.createDiv({ cls: "pvd-stage" }); ["待做", "进行中", "暂停", "完成"].forEach(stage => track.createEl("span", { text: stage, cls: this.taskStatus(focus) === stage ? "is-current" : this.taskDone(focus) ? "is-done" : "" }));
    if (!this.taskDone(focus)) { const actions = mission.createDiv({ cls: "pvd-actions" }); this.button(actions, this.timerState(focus) === "进行中" ? "暂停专注" : "开始专注", () => this.toggleTimer(focus), "mod-cta"); this.button(actions, "完成", () => this.complete(focus)); }
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
    groups.forEach((files, project) => { files.sort((a, b) => this.compareTasks(a, b)); const lane = board.createDiv({ cls: "pvd-timeline-lane" }); const laneRows = Math.max(files.length, 1); lane.style.setProperty("--pvd-lane-rows", String(laneRows)); lane.style.minHeight = `${laneRows * 36 + 18}px`; const label = lane.createDiv({ cls: "pvd-timeline-project" }); label.createEl("strong", { text: project }); label.createSpan({ text: `${files.length} 项` }); const track = lane.createDiv({ cls: "pvd-timeline-track" }); dates.forEach((date, index) => { const cell = track.createDiv({ cls: "pvd-timeline-cell" }); cell.style.gridColumn = String(index + 1); }); const todayIndex = dates.findIndex(date => this.dateKey(date) === this.todayKey()); if (todayIndex >= 0) { const marker = track.createDiv({ cls: "pvd-timeline-today-line", attr: { "aria-hidden": "true" } }); marker.style.gridColumn = String(todayIndex + 1); } files.forEach((file, rowIndex) => { const key = this.taskPlanKey(file); const index = dates.findIndex(date => this.dateKey(date) === key); if (index < 0) return; const chip = this.button(track, file.basename, () => this.setFocus(file), `pvd-timeline-task ${this.priority(file).toLowerCase()} ${this.taskDone(file) ? "is-done" : ""}`); chip.style.gridColumn = String(index + 1); chip.style.gridRow = String(rowIndex + 1); this.bindTaskLabel(chip, file, `任务：${file.basename} · ${key} · ${this.taskStatus(file)}`); }); });
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
    const todayActions = main.createEl("section", { cls: "pvd-today-actions" });
    const todayActionCopy = todayActions.createDiv({ cls: "pvd-today-actions-copy" });
    todayActionCopy.createEl("strong", { text: "今天要推进什么？" });
    todayActionCopy.createSpan({ text: todayCount ? `当前有 ${todayCount} 项今日任务` : "创建一项任务，开始安排今天" });
    this.button(todayActions, "＋ 新建任务", () => this.createTask(), "mod-cta");
    const todayResults = main.createDiv({ cls: "pvd-task-results pvd-today-results" });
    await this.renderTasksResults(todayResults, filters, tasks, today, "today", false);
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
    const card = parent.createDiv({ cls: `pvd-task ${this.taskDone(file) ? "is-done" : ""} ${this.focusPath === file.path ? "is-focus" : ""}` });
    if (this.focusPath === file.path) card.setAttribute("aria-current", "true");
    this.bindTaskFocusAndEdit(card, file, `任务：${file.basename}`);
    const stop = action => async event => { event.stopPropagation(); await action(); };
    const main = card.createDiv(); main.createEl("strong", { text: file.basename });
    const project = String(this.taskProperty(file, "projectField") || "未关联项目").replace(/^\[\[|\]\]$/g, "");
    main.createSpan({ text: `${project} · ${this.taskPlan(file) ? this.dateKey(this.taskPlan(file)) : "未安排日期"}` }); this.timer(main, file);
    const side = card.createDiv({ cls: "pvd-task-card-side" });
    const badges = side.createDiv({ cls: "pvd-badges" }); badges.createSpan({ text: this.priority(file) }); badges.createSpan({ text: this.taskStatus(file) });
    const quick = side.createDiv({ cls: "pvd-task-card-quick" });
    const open = this.button(quick, "打开文档 ↗", stop(() => this.openFile(file)), "pvd-task-open");
    open.setAttribute("aria-label", `打开任务文档：${file.basename}`);
    open.setAttribute("title", file.path);
    const capture = this.button(quick, "＋ 关联闪念", stop(() => this.createIdeaForTask(file)), "pvd-task-idea");
    capture.setAttribute("aria-label", `为任务“${file.basename}”创建关联闪念笔记`);
    main.createSpan({ cls: "pvd-card-edit-hint", text: "左键聚焦 · 右键编辑" });
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
  uniqueIdeaRenamePath(file, title) { const dir = file.path.includes("/") ? file.path.slice(0, file.path.lastIndexOf("/")) : ""; const date = file.basename.match(/^\d{4}-\d{2}-\d{2}/)?.[0] || this.dateKey(this.ideaCapturedAt(file)); const base = `${date} ${title}`; let path = `${dir ? `${dir}/` : ""}${base}.md`; let index = 2; while (this.app.vault.getAbstractFileByPath(path) && path !== file.path) path = `${dir ? `${dir}/` : ""}${base} ${index++}.md`; return path; }
  uniqueTaskPath(dir, title) { let path = `${dir}/${title}.md`; let index = 2; while (this.app.vault.getAbstractFileByPath(path)) path = `${dir}/${title} ${index++}.md`; return path; }
  uniqueMovePath(dir, file) { let path = `${dir}/${file.name}`; let index = 2; while (this.app.vault.getAbstractFileByPath(path) && path !== file.path) path = `${dir}/${file.basename} ${index++}.${file.extension}`; return path; }
  async createIdeaForTask(task) {
    const dir = this.config().inbox; const taskLink = `[[${task.path.replace(/\.md$/, "")}]]`;
    await this.ensureFolder(dir);
    const title = `${task.basename} · 闪念`;
    const idea = await this.app.vault.create(this.uniquePath(dir, title), `---\ntype: 闪念笔记\n状态: 收集\ndate: ${this.dateKey()}\n关联任务: ${taskLink}\n---\n\n# ${title}\n\n关联任务：${taskLink}\n\n`);
    await this.app.fileManager.processFrontMatter(task, fm => {
      const ideaLink = `[[${idea.path.replace(/\.md$/, "")}]]`;
      const existing = Array.isArray(fm["关联闪念"]) ? fm["关联闪念"] : fm["关联闪念"] ? [fm["关联闪念"]] : [];
      if (!existing.includes(ideaLink)) fm["关联闪念"] = [...existing, ideaLink];
    });
    new Notice("已创建关联闪念，并写入双向链接"); await this.openFile(idea); await this.render();
  }
  editIdea(file) { new IdeaEditorModal(this.app, this, file).open(); }
  async updateIdea(file, values) {
    const previousPath = file.path; const linkedTask = this.ideaLinkedTask(file); const title = values.title.trim();
    const tags = [...new Set(String(values.tags || "").split(/[,，\s]+/).map(tag => tag.trim().replace(/^#/, "")).filter(Boolean))];
    await this.app.fileManager.processFrontMatter(file, fm => { if (tags.length) fm.tags = tags; else delete fm.tags; });
    const content = await this.app.vault.cachedRead(file); const nextContent = /^# .+$/m.test(content) ? content.replace(/^# .+$/m, `# ${title}`) : `${content.trimEnd()}\n\n# ${title}\n`;
    if (nextContent !== content) await this.app.vault.modify(file, nextContent);
    const nextPath = this.uniqueIdeaRenamePath(file, title); if (nextPath !== file.path) await this.app.fileManager.renameFile(file, nextPath);
    if (linkedTask && nextPath !== previousPath) await this.replaceTaskIdeaLink(linkedTask, previousPath, nextPath);
    new Notice("闪念笔记已更新"); await this.render();
  }
  async createIdea() { new TextPromptModal(this.app, "记录灵感", "一句话写下想法", async title => { const dir = this.config().inbox; await this.ensureFolder(dir); const file = await this.app.vault.create(this.uniquePath(dir, title), `---\ntype: 闪念笔记\n状态: 收集\ndate: ${this.dateKey()}\n---\n\n# ${title}\n\n`); await this.openFile(file); await this.render(); }, title => this.validateNoteTitle(title)).open(); }
  async convertIdeaToTask(file) {
    const dir = this.config().task; const title = this.ideaTitle(file); await this.ensureFolder(dir);
    const task = await this.app.vault.create(this.uniqueTaskPath(dir, title), await this.newTaskContent(title));
    await this.app.fileManager.processFrontMatter(task, fm => { fm["来源闪念"] = `[[${file.path.replace(/\.md$/, "")}]]`; });
    await this.app.fileManager.processFrontMatter(file, fm => { fm["状态"] = "已转任务"; fm["处理日期"] = this.dateKey(); fm["关联任务"] = `[[${task.path.replace(/\.md$/, "")}]]`; });
    new Notice("已从闪念创建任务，并保留双向来源"); await this.render(); await this.openFile(task);
  }
  async convertIdeaToNote(file, kind) {
    const linkedTask = this.ideaLinkedTask(file); const previousPath = file.path;
    const target = kind === "literature"
      ? { dir: this.config().literature, type: "文献笔记", status: "待整理", notice: "已转为文献笔记" }
      : { dir: this.config().permanent, type: "永久笔记", status: "已沉淀", notice: "已转为永久笔记" };
    await this.ensureFolder(target.dir);
    await this.app.fileManager.processFrontMatter(file, fm => { fm.type = target.type; fm["状态"] = target.status; fm["处理日期"] = this.dateKey(); });
    const path = this.uniqueMovePath(target.dir, file); if (path !== file.path) await this.app.fileManager.renameFile(file, path);
    if (linkedTask && path !== previousPath) await this.replaceTaskIdeaLink(linkedTask, previousPath, path);
    new Notice(target.notice); await this.render();
  }
  discardIdea(file) { new ConfirmModal(this.app, "舍弃闪念", `将“${this.ideaTitle(file)}”移入 Obsidian 回收站，并清理任务中的关联？`, "舍弃", async () => { const linkedTask = this.ideaLinkedTask(file); await this.replaceTaskIdeaLink(linkedTask, file.path); await this.app.fileManager.trashFile(file); new Notice("闪念已移入回收站，任务关联已清理"); await this.render(); }).open(); }
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
    const workflow = [{ label: "打开文档", run: () => this.openFile(file) }];
    if (!this.taskDone(file)) {
      workflow.push({ label: this.timerState(file) === "进行中" ? "暂停专注" : "开始专注", cls: "mod-cta", run: () => this.toggleTimer(file) });
      if (this.focusPath !== file.path) workflow.push({ label: "设为焦点", run: () => this.setFocus(file) });
      workflow.push({ label: "标记完成", run: () => this.complete(file) });
    }
    workflow.push({ label: "＋ 关联闪念", run: () => this.createIdeaForTask(file) });
    workflow.push({ label: "删除任务", cls: "pvd-danger", run: () => this.deleteTask(file) });
    new TaskEditorModal(this.app, file, { project, priority: this.priority(file), status: this.taskStatus(file), plan: this.taskPlan(file) ? this.dateKey(this.taskPlan(file)) : "", estimate: this.taskProperty(file, "expectedField") || "" }, this.projectOptions(), async values => {
      await this.transitionTask(file, values.status);
      await this.app.fileManager.processFrontMatter(file, next => {
        this.setTaskProperty(next, "projectField", values.project ? `[[${values.project}]]` : "");
        this.setTaskProperty(next, "priorityField", values.priority);
        this.setTaskProperty(next, "planField", values.plan);
        this.setTaskProperty(next, "expectedField", values.estimate ? Number(values.estimate) : "");
      });
      new Notice("任务已更新"); await this.render();
    }, workflow).open();
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

function starterTaskTemplate(schema) {
  return `---\n${schema.typeField}: ${schema.typeValue}\n${schema.projectField}: ""\n${schema.statusField}: 待做\n${schema.priorityField}: P2\n${schema.planField}: \n${schema.expectedField}: \n${schema.timerStateField}: 未开始\n${schema.timerStartedField}: \n${schema.elapsedField}: 0\n${schema.doneField}: false\n${schema.completedAtField}: \n创建日期: \n---\n\n# 新任务\n\n## 完成标准\n\n- [ ] \n`;
}

async function ensureVaultFolder(vault, folder) {
  let current = "";
  for (const part of folder.split("/").filter(Boolean)) {
    current = current ? `${current}/${part}` : part;
    if (!vault.getAbstractFileByPath(current)) await vault.createFolder(current);
  }
}

class FocusWorkbenchSettingTab extends PluginSettingTab {
  constructor(app, plugin) { super(app, plugin); this.plugin = plugin; }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.addClass("pvd-settings-guide");

    const settings = this.plugin.settings;
    const defaults = {
      inboxFolder: "闪念笔记",
      literatureFolder: "文献笔记",
      permanentFolder: "永久笔记",
      taskFolder: "目标与任务/任务管理/任务",
      projectFolder: "目标与任务/任务管理/项目",
      taskTemplatePath: "模板/任务模板.md",
      taskBasePath: "目标与任务/任务总表.base"
    };
    const value = key => settings[key] || defaults[key];
    const entry = path => path ? this.app.vault.getAbstractFileByPath(path) : null;
    const folderExists = path => Boolean(entry(path)?.children);
    const fileExists = path => Boolean(entry(path) && !entry(path).children);
    const folderReady = ["inboxFolder", "literatureFolder", "permanentFolder", "taskFolder", "projectFolder"].every(key => folderExists(value(key))) && folderExists("目标与任务/任务管理/每日进展");
    const templateReady = fileExists(value("taskTemplatePath"));
    const baseReady = fileExists(value("taskBasePath"));
    const readyCount = [folderReady, templateReady, baseReady].filter(Boolean).length;

    const hero = containerEl.createDiv({ cls: "pvd-onboarding-hero" });
    const heroCopy = hero.createDiv({ cls: "pvd-onboarding-hero-copy" });
    heroCopy.createEl("p", { cls: "pvd-onboarding-kicker", text: "首次使用 · 约 1 分钟" });
    heroCopy.createEl("strong", { cls: "pvd-onboarding-title", text: "先搭好工作区，再开始记录" });
    heroCopy.createEl("p", { text: "推荐初始化会创建任务系统、任务模板、任务总表和三类知识文件夹。已有文件只会保留，不会覆盖或移动。" });
    const progress = hero.createDiv({ cls: "pvd-onboarding-progress", attr: { role: "status", "aria-label": `初始化进度：完成 ${readyCount}/3` } });
    progress.createEl("strong", { text: `${readyCount}/3` });
    progress.createSpan({ text: readyCount === 3 ? "准备完成" : "项已就绪" });

    new Setting(hero)
      .setName(readyCount === 3 ? "推荐结构已准备好" : "自动创建推荐结构")
      .setDesc("包括 3 个知识目录、任务、项目与每日进展目录，以及任务模板和 Obsidian Bases 任务总表；可以重复执行，已有内容不会被改写。")
      .addButton(button => button.setButtonText(readyCount === 3 ? "检查并补齐" : "一键初始化").setCta().onClick(() => new ConfirmModal(this.app, "初始化推荐工作区", "将补齐三类知识文件夹、任务与项目目录、任务模板和任务总表。已有文件不会被覆盖，是否继续？", "开始初始化", async () => {
        Object.entries(defaults).forEach(([key, path]) => { if (!settings[key]) settings[key] = path; });
        if (!settings.taskTemplatePath.endsWith(".md")) { new Notice("任务模板路径必须以 .md 结尾。"); return; }
        if (!settings.taskBasePath.endsWith(".base")) { new Notice("任务总表路径必须以 .base 结尾。"); return; }
        const folders = [settings.inboxFolder, settings.literatureFolder, settings.permanentFolder, settings.taskFolder, settings.projectFolder, "目标与任务/任务管理/每日进展"];
        for (const folder of folders) await ensureVaultFolder(this.app.vault, folder);
        const templatePath = settings.taskTemplatePath;
        await ensureVaultFolder(this.app.vault, templatePath.split("/").slice(0, -1).join("/"));
        if (this.app.vault.getAbstractFileByPath(templatePath)?.children) { new Notice("任务模板路径当前是一个文件夹，请换一个 .md 文件路径。"); return; }
        if (!this.app.vault.getAbstractFileByPath(templatePath)) await this.app.vault.create(templatePath, starterTaskTemplate(Object.assign({}, DEFAULT_SETTINGS.schema, settings.schema || {})));
        const basePath = settings.taskBasePath;
        await ensureVaultFolder(this.app.vault, basePath.split("/").slice(0, -1).join("/"));
        if (this.app.vault.getAbstractFileByPath(basePath)?.children) { new Notice("任务总表路径当前是一个文件夹，请换一个 .base 文件路径。"); return; }
        if (!this.app.vault.getAbstractFileByPath(basePath)) await this.app.vault.create(basePath, unifiedTaskBase());
        await this.plugin.saveSettings();
        this.display();
        new Notice("推荐工作区已准备好，可以打开 omni-workbench 开始使用。");
      }).open()));

    const map = containerEl.createDiv({ cls: "pvd-onboarding-map", attr: { "aria-label": "三步上手流程" } });
    [
      ["1", "收集", "想法先进入闪念笔记"],
      ["2", "整理", "阅读输入放入文献笔记"],
      ["3", "沉淀", "自己的结论写成永久笔记"]
    ].forEach(([number, title, description]) => {
      const item = map.createDiv({ cls: "pvd-onboarding-map-item" });
      item.createEl("b", { text: number });
      const copy = item.createDiv(); copy.createEl("strong", { text: title }); copy.createSpan({ text: description });
    });

    new Setting(containerEl).setName("第 1 步：理解三个知识文件夹").setDesc("它们代表内容从随手记录到可复用知识的三个阶段，而不是三个主题分类。").setHeading();
    const knowledgeGrid = containerEl.createDiv({ cls: "pvd-knowledge-folder-guide" });
    [
      ["inboxFolder", "闪念笔记", "先记下来", "临时想法、灵感、待整理的问题。允许不完整，重点是不丢失。", "例如：尝试把周报改成项目复盘"],
      ["literatureFolder", "文献笔记", "保留来源", "书籍、文章、播客和会议中的摘录与理解，应该能回到原始来源。", "例如：《深度工作》第 2 章摘录"],
      ["permanentFolder", "永久笔记", "形成自己的观点", "用自己的话写成一条独立结论，脱离原文也能理解、链接和复用。", "例如：减少切换成本比延长工时更有效"]
    ].forEach(([key, name, stage, description, example]) => {
      const card = knowledgeGrid.createDiv({ cls: `pvd-knowledge-folder-card is-${key}` });
      const head = card.createDiv({ cls: "pvd-knowledge-folder-head" });
      head.createEl("strong", { text: name }); head.createSpan({ text: stage });
      card.createEl("p", { text: description });
      card.createEl("small", { text: example });
      new Setting(card).setName("保存位置").setDesc(folderExists(value(key)) ? "目录已存在" : "初始化时会自动创建").addText(text => text.setValue(value(key)).setPlaceholder(defaults[key]).onChange(async next => { settings[key] = next.trim().replace(/^\.\//, "").replace(/\/$/, ""); await this.plugin.saveSettings(); }));
    });

    new Setting(containerEl).setName("第 2 步：确认任务如何保存").setDesc("任务目录是插件读取任务的来源；项目目录用于任务编辑器的项目选项。").setHeading();
    const taskSection = containerEl.createDiv({ cls: "pvd-settings-section" });
    new Setting(taskSection).setName("任务目录").setDesc("新建任务保存在这里，插件也只从这里读取符合字段规则的任务。").addText(text => text.setValue(value("taskFolder")).setPlaceholder(defaults.taskFolder).onChange(async next => { settings.taskFolder = next.trim().replace(/^\.\//, "").replace(/\/$/, ""); await this.plugin.saveSettings(); }));
    new Setting(taskSection).setName("项目目录").setDesc("此目录中的笔记会出现在任务的“所属项目”下拉菜单中。").addText(text => text.setValue(value("projectFolder")).setPlaceholder(defaults.projectFolder).onChange(async next => { settings.projectFolder = next.trim().replace(/^\.\//, "").replace(/\/$/, ""); await this.plugin.saveSettings(); }));

    new Setting(containerEl).setName("第 3 步：理解模板和任务总表").setDesc("模板决定新任务笔记的内容；任务总表只是额外的表格视图，两者用途不同。").setHeading();
    const assets = containerEl.createDiv({ cls: "pvd-settings-assets" });
    const templateCard = assets.createDiv({ cls: "pvd-settings-asset-card" });
    templateCard.createEl("strong", { text: "任务模板 · 决定新任务长什么样" });
    templateCard.createEl("p", { text: "每次在工作台点击“新建任务”时使用。插件会自动写入计划日期、创建日期和任务标题。模板不存在时仍可使用内置格式。" });
    new Setting(templateCard).setName(templateReady ? "模板已找到" : "等待初始化").setDesc(value("taskTemplatePath")).addText(text => text.setValue(value("taskTemplatePath")).setPlaceholder(defaults.taskTemplatePath).onChange(async next => { settings.taskTemplatePath = next.trim().replace(/^\.\//, ""); await this.plugin.saveSettings(); }));
    const baseCard = assets.createDiv({ cls: "pvd-settings-asset-card" });
    baseCard.createEl("strong", { text: "任务总表 · 用表格浏览同一批任务" });
    baseCard.createEl("p", { text: "这是可选的 Obsidian Bases 视图，提供“全部、今日、进行中、已完成”表格。它不会决定插件读取哪些任务。" });
    new Setting(baseCard).setName(baseReady ? "任务总表已找到" : "等待初始化").setDesc(value("taskBasePath")).addText(text => text.setValue(value("taskBasePath")).setPlaceholder(defaults.taskBasePath).onChange(async next => { settings.taskBasePath = next.trim().replace(/^\.\//, ""); await this.plugin.saveSettings(); }));

    new Setting(containerEl).setName("已有仓库或自定义字段").setDesc("如果你已经有自己的目录和 frontmatter 字段，再使用高级映射；全新用户可以跳过。").setHeading();
    new Setting(containerEl).setName("连接现有仓库").setDesc("映射已有任务、项目、三类知识目录与字段名称。不会移动或修改任何已有笔记。").addButton(button => button.setButtonText("打开高级映射").onClick(() => new SetupModal(this.app, this.plugin).open()));
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
/* v7 theme: omni-workbench surfaces with Notion-inspired data structures. */
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
    this.addRibbonIcon("layout-dashboard", "打开 omni-workbench", () => this.activateView());
    this.addCommand({ id: "open-focus-workbench", name: "Open omni-workbench", callback: () => this.activateView() });
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
