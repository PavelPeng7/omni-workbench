"use strict";

// src/core/date.ts
function hasMethod(value, key) {
  return typeof value === "object" && value !== null && typeof value[key] === "function";
}
function primitiveText(value) {
  if (typeof value === "string") return value;
  if (["number", "boolean", "bigint", "symbol"].includes(typeof value)) return String(value);
  return "";
}
function parseDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (hasMethod(value, "toJSDate")) return value.toJSDate();
  const normalized = primitiveText(value).slice(0, 10).replace(/\//g, "-");
  const parts = normalized.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (parts) return new Date(Number(parts[1]), Number(parts[2]) - 1, Number(parts[3]));
  const parsed = new Date(normalized);
  return Number.isFinite(parsed.getTime()) ? parsed : null;
}
function parseTimestamp(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (hasMethod(value, "toJSDate")) return value.toJSDate();
  const parsed = new Date(primitiveText(value));
  return Number.isFinite(parsed.getTime()) ? parsed : null;
}
function dateKey(value) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}
function calendarKey(value) {
  var _a;
  if (!value) return "";
  if (hasMethod(value, "toISODate")) return (_a = value.toISODate()) != null ? _a : "";
  const match = primitiveText(value).match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (match) return `${match[1]}-${match[2].padStart(2, "0")}-${match[3].padStart(2, "0")}`;
  const parsed = parseDate(value);
  return parsed ? dateKey(parsed) : "";
}
function sameCalendarDay(left, right) {
  return Boolean(left) && calendarKey(left) === calendarKey(right);
}
function isPastCalendarDay(value, reference) {
  const key = calendarKey(value);
  return Boolean(key) && key < calendarKey(reference);
}

// src/core/timer.ts
function expectedSeconds(minutes) {
  return Math.max(0, Number(minutes) || 0) * 60;
}
function elapsedSeconds(input, now = Date.now()) {
  const stored = Math.max(0, Number(input.stored) || 0);
  const started = input.running ? parseTimestamp(input.started) : null;
  return stored + (started ? Math.max(0, Math.floor((now - started.getTime()) / 1e3)) : 0);
}
function formatDuration(seconds) {
  const value = Math.max(0, Math.floor(Math.abs(seconds)));
  const sign = seconds < 0 ? "-" : "";
  const hours = String(Math.floor(value / 3600)).padStart(2, "0");
  const minutes = String(Math.floor(value % 3600 / 60)).padStart(2, "0");
  const remainingSeconds = String(value % 60).padStart(2, "0");
  return `${sign}${hours}:${minutes}:${remainingSeconds}`;
}

// src/core/frontmatter.ts
function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function setFrontmatterField(source, field, value) {
  const pattern = new RegExp(`^(${escapeRegExp(field)}\\s*:).*$`, "m");
  if (pattern.test(source)) return source.replace(pattern, (_match, prefix) => `${prefix} ${value}`);
  return source.replace(
    /^---\r?\n([\s\S]*?)\r?\n---/,
    (_match, body) => `---
${body}
${field}: ${value}
---`
  );
}

// src/core/knowledge-templates.ts
var knowledgeNoteTemplateDefinitions = [
  { type: "fleeting", pathKey: "fleetingNoteTemplatePath", defaultPath: "模板/闪念笔记模板.md", label: "闪念笔记模板", typeValue: "闪念笔记", workflowStatus: "收集", title: "闪念笔记", sections: "## 想法\n\n{{content}}\n\n## 后续整理\n\n- [ ] 补充上下文" },
  { type: "literature", pathKey: "literatureNoteTemplatePath", defaultPath: "模板/文献笔记模板.md", label: "文献笔记模板", typeValue: "文献笔记", workflowStatus: "待整理", title: "文献笔记", sections: "## 来源\n\n\n## 摘录与理解\n\n{{content}}" },
  { type: "permanent", pathKey: "permanentNoteTemplatePath", defaultPath: "模板/永久笔记模板.md", label: "永久笔记模板", typeValue: "永久笔记", workflowStatus: "已沉淀", title: "永久笔记", sections: "## 核心观点\n\n{{content}}\n\n## 关联\n\n" }
];
function knowledgeNoteTemplateDefaults() {
  return knowledgeNoteTemplateDefinitions.reduce((defaults, template) => {
    defaults[template.pathKey] = template.defaultPath;
    return defaults;
  }, {});
}
function configuredKnowledgeNoteTemplates(paths) {
  return knowledgeNoteTemplateDefinitions.map((template) => ({
    type: template.type,
    path: paths[template.pathKey],
    content: `---
type: ${template.typeValue}
状态: ${template.workflowStatus}
创建日期:
---

# ${template.title}

${template.sections}
`
  }));
}

// node_modules/yaml/browser/dist/nodes/identity.js
var ALIAS = /* @__PURE__ */ Symbol.for("yaml.alias");
var DOC = /* @__PURE__ */ Symbol.for("yaml.document");
var MAP = /* @__PURE__ */ Symbol.for("yaml.map");
var PAIR = /* @__PURE__ */ Symbol.for("yaml.pair");
var SCALAR = /* @__PURE__ */ Symbol.for("yaml.scalar");
var SEQ = /* @__PURE__ */ Symbol.for("yaml.seq");
var NODE_TYPE = /* @__PURE__ */ Symbol.for("yaml.node.type");
var isAlias = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === ALIAS;
var isDocument = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === DOC;
var isMap = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === MAP;
var isPair = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === PAIR;
var isScalar = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === SCALAR;
var isSeq = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === SEQ;
function isCollection(node) {
  if (node && typeof node === "object")
    switch (node[NODE_TYPE]) {
      case MAP:
      case SEQ:
        return true;
    }
  return false;
}
function isNode(node) {
  if (node && typeof node === "object")
    switch (node[NODE_TYPE]) {
      case ALIAS:
      case MAP:
      case SCALAR:
      case SEQ:
        return true;
    }
  return false;
}
var hasAnchor = (node) => (isScalar(node) || isCollection(node)) && !!node.anchor;

// node_modules/yaml/browser/dist/visit.js
var BREAK = /* @__PURE__ */ Symbol("break visit");
var SKIP = /* @__PURE__ */ Symbol("skip children");
var REMOVE = /* @__PURE__ */ Symbol("remove node");
function visit(node, visitor) {
  const visitor_ = initVisitor(visitor);
  if (isDocument(node)) {
    const cd = visit_(null, node.contents, visitor_, Object.freeze([node]));
    if (cd === REMOVE)
      node.contents = null;
  } else
    visit_(null, node, visitor_, Object.freeze([]));
}
visit.BREAK = BREAK;
visit.SKIP = SKIP;
visit.REMOVE = REMOVE;
function visit_(key, node, visitor, path) {
  const ctrl = callVisitor(key, node, visitor, path);
  if (isNode(ctrl) || isPair(ctrl)) {
    replaceNode(key, path, ctrl);
    return visit_(key, ctrl, visitor, path);
  }
  if (typeof ctrl !== "symbol") {
    if (isCollection(node)) {
      path = Object.freeze(path.concat(node));
      for (let i = 0; i < node.items.length; ++i) {
        const ci = visit_(i, node.items[i], visitor, path);
        if (typeof ci === "number")
          i = ci - 1;
        else if (ci === BREAK)
          return BREAK;
        else if (ci === REMOVE) {
          node.items.splice(i, 1);
          i -= 1;
        }
      }
    } else if (isPair(node)) {
      path = Object.freeze(path.concat(node));
      const ck = visit_("key", node.key, visitor, path);
      if (ck === BREAK)
        return BREAK;
      else if (ck === REMOVE)
        node.key = null;
      const cv = visit_("value", node.value, visitor, path);
      if (cv === BREAK)
        return BREAK;
      else if (cv === REMOVE)
        node.value = null;
    }
  }
  return ctrl;
}
async function visitAsync(node, visitor) {
  const visitor_ = initVisitor(visitor);
  if (isDocument(node)) {
    const cd = await visitAsync_(null, node.contents, visitor_, Object.freeze([node]));
    if (cd === REMOVE)
      node.contents = null;
  } else
    await visitAsync_(null, node, visitor_, Object.freeze([]));
}
visitAsync.BREAK = BREAK;
visitAsync.SKIP = SKIP;
visitAsync.REMOVE = REMOVE;
async function visitAsync_(key, node, visitor, path) {
  const ctrl = await callVisitor(key, node, visitor, path);
  if (isNode(ctrl) || isPair(ctrl)) {
    replaceNode(key, path, ctrl);
    return visitAsync_(key, ctrl, visitor, path);
  }
  if (typeof ctrl !== "symbol") {
    if (isCollection(node)) {
      path = Object.freeze(path.concat(node));
      for (let i = 0; i < node.items.length; ++i) {
        const ci = await visitAsync_(i, node.items[i], visitor, path);
        if (typeof ci === "number")
          i = ci - 1;
        else if (ci === BREAK)
          return BREAK;
        else if (ci === REMOVE) {
          node.items.splice(i, 1);
          i -= 1;
        }
      }
    } else if (isPair(node)) {
      path = Object.freeze(path.concat(node));
      const ck = await visitAsync_("key", node.key, visitor, path);
      if (ck === BREAK)
        return BREAK;
      else if (ck === REMOVE)
        node.key = null;
      const cv = await visitAsync_("value", node.value, visitor, path);
      if (cv === BREAK)
        return BREAK;
      else if (cv === REMOVE)
        node.value = null;
    }
  }
  return ctrl;
}
function initVisitor(visitor) {
  if (typeof visitor === "object" && (visitor.Collection || visitor.Node || visitor.Value)) {
    return Object.assign({
      Alias: visitor.Node,
      Map: visitor.Node,
      Scalar: visitor.Node,
      Seq: visitor.Node
    }, visitor.Value && {
      Map: visitor.Value,
      Scalar: visitor.Value,
      Seq: visitor.Value
    }, visitor.Collection && {
      Map: visitor.Collection,
      Seq: visitor.Collection
    }, visitor);
  }
  return visitor;
}
function callVisitor(key, node, visitor, path) {
  var _a, _b, _c, _d, _e;
  if (typeof visitor === "function")
    return visitor(key, node, path);
  if (isMap(node))
    return (_a = visitor.Map) == null ? void 0 : _a.call(visitor, key, node, path);
  if (isSeq(node))
    return (_b = visitor.Seq) == null ? void 0 : _b.call(visitor, key, node, path);
  if (isPair(node))
    return (_c = visitor.Pair) == null ? void 0 : _c.call(visitor, key, node, path);
  if (isScalar(node))
    return (_d = visitor.Scalar) == null ? void 0 : _d.call(visitor, key, node, path);
  if (isAlias(node))
    return (_e = visitor.Alias) == null ? void 0 : _e.call(visitor, key, node, path);
  return void 0;
}
function replaceNode(key, path, node) {
  const parent = path[path.length - 1];
  if (isCollection(parent)) {
    parent.items[key] = node;
  } else if (isPair(parent)) {
    if (key === "key")
      parent.key = node;
    else
      parent.value = node;
  } else if (isDocument(parent)) {
    parent.contents = node;
  } else {
    const pt = isAlias(parent) ? "alias" : "scalar";
    throw new Error(`Cannot replace node with ${pt} parent`);
  }
}

// node_modules/yaml/browser/dist/doc/directives.js
var escapeChars = {
  "!": "%21",
  ",": "%2C",
  "[": "%5B",
  "]": "%5D",
  "{": "%7B",
  "}": "%7D"
};
var escapeTagName = (tn) => tn.replace(/[!,[\]{}]/g, (ch) => escapeChars[ch]);
var Directives = class _Directives {
  constructor(yaml, tags) {
    this.docStart = null;
    this.docEnd = false;
    this.yaml = Object.assign({}, _Directives.defaultYaml, yaml);
    this.tags = Object.assign({}, _Directives.defaultTags, tags);
  }
  clone() {
    const copy = new _Directives(this.yaml, this.tags);
    copy.docStart = this.docStart;
    return copy;
  }
  /**
   * During parsing, get a Directives instance for the current document and
   * update the stream state according to the current version's spec.
   */
  atDocument() {
    const res = new _Directives(this.yaml, this.tags);
    switch (this.yaml.version) {
      case "1.1":
        this.atNextDocument = true;
        break;
      case "1.2":
        this.atNextDocument = false;
        this.yaml = {
          explicit: _Directives.defaultYaml.explicit,
          version: "1.2"
        };
        this.tags = Object.assign({}, _Directives.defaultTags);
        break;
    }
    return res;
  }
  /**
   * @param onError - May be called even if the action was successful
   * @returns `true` on success
   */
  add(line, onError) {
    if (this.atNextDocument) {
      this.yaml = { explicit: _Directives.defaultYaml.explicit, version: "1.1" };
      this.tags = Object.assign({}, _Directives.defaultTags);
      this.atNextDocument = false;
    }
    const parts = line.trim().split(/[ \t]+/);
    const name = parts.shift();
    switch (name) {
      case "%TAG": {
        if (parts.length !== 2) {
          onError(0, "%TAG directive should contain exactly two parts");
          if (parts.length < 2)
            return false;
        }
        const [handle, prefix] = parts;
        this.tags[handle] = prefix;
        return true;
      }
      case "%YAML": {
        this.yaml.explicit = true;
        if (parts.length !== 1) {
          onError(0, "%YAML directive should contain exactly one part");
          return false;
        }
        const [version] = parts;
        if (version === "1.1" || version === "1.2") {
          this.yaml.version = version;
          return true;
        } else {
          const isValid = /^\d+\.\d+$/.test(version);
          onError(6, `Unsupported YAML version ${version}`, isValid);
          return false;
        }
      }
      default:
        onError(0, `Unknown directive ${name}`, true);
        return false;
    }
  }
  /**
   * Resolves a tag, matching handles to those defined in %TAG directives.
   *
   * @returns Resolved tag, which may also be the non-specific tag `'!'` or a
   *   `'!local'` tag, or `null` if unresolvable.
   */
  tagName(source, onError) {
    if (source === "!")
      return "!";
    if (source[0] !== "!") {
      onError(`Not a valid tag: ${source}`);
      return null;
    }
    if (source[1] === "<") {
      const verbatim = source.slice(2, -1);
      if (verbatim === "!" || verbatim === "!!") {
        onError(`Verbatim tags aren't resolved, so ${source} is invalid.`);
        return null;
      }
      if (source[source.length - 1] !== ">")
        onError("Verbatim tags must end with a >");
      return verbatim;
    }
    const [, handle, suffix] = source.match(/^(.*!)([^!]*)$/s);
    if (!suffix)
      onError(`The ${source} tag has no suffix`);
    const prefix = this.tags[handle];
    if (prefix) {
      try {
        return prefix + decodeURIComponent(suffix);
      } catch (error) {
        onError(String(error));
        return null;
      }
    }
    if (handle === "!")
      return source;
    onError(`Could not resolve tag: ${source}`);
    return null;
  }
  /**
   * Given a fully resolved tag, returns its printable string form,
   * taking into account current tag prefixes and defaults.
   */
  tagString(tag) {
    for (const [handle, prefix] of Object.entries(this.tags)) {
      if (tag.startsWith(prefix))
        return handle + escapeTagName(tag.substring(prefix.length));
    }
    return tag[0] === "!" ? tag : `!<${tag}>`;
  }
  toString(doc) {
    const lines = this.yaml.explicit ? [`%YAML ${this.yaml.version || "1.2"}`] : [];
    const tagEntries = Object.entries(this.tags);
    let tagNames;
    if (doc && tagEntries.length > 0 && isNode(doc.contents)) {
      const tags = {};
      visit(doc.contents, (_key, node) => {
        if (isNode(node) && node.tag)
          tags[node.tag] = true;
      });
      tagNames = Object.keys(tags);
    } else
      tagNames = [];
    for (const [handle, prefix] of tagEntries) {
      if (handle === "!!" && prefix === "tag:yaml.org,2002:")
        continue;
      if (!doc || tagNames.some((tn) => tn.startsWith(prefix)))
        lines.push(`%TAG ${handle} ${prefix}`);
    }
    return lines.join("\n");
  }
};
Directives.defaultYaml = { explicit: false, version: "1.2" };
Directives.defaultTags = { "!!": "tag:yaml.org,2002:" };

// node_modules/yaml/browser/dist/doc/anchors.js
function anchorIsValid(anchor) {
  if (/[\x00-\x19\s,[\]{}]/.test(anchor)) {
    const sa = JSON.stringify(anchor);
    const msg = `Anchor must not contain whitespace or control characters: ${sa}`;
    throw new Error(msg);
  }
  return true;
}
function anchorNames(root) {
  const anchors = /* @__PURE__ */ new Set();
  visit(root, {
    Value(_key, node) {
      if (node.anchor)
        anchors.add(node.anchor);
    }
  });
  return anchors;
}
function findNewAnchor(prefix, exclude) {
  for (let i = 1; true; ++i) {
    const name = `${prefix}${i}`;
    if (!exclude.has(name))
      return name;
  }
}
function createNodeAnchors(doc, prefix) {
  const aliasObjects = [];
  const sourceObjects = /* @__PURE__ */ new Map();
  let prevAnchors = null;
  return {
    onAnchor: (source) => {
      aliasObjects.push(source);
      prevAnchors != null ? prevAnchors : prevAnchors = anchorNames(doc);
      const anchor = findNewAnchor(prefix, prevAnchors);
      prevAnchors.add(anchor);
      return anchor;
    },
    /**
     * With circular references, the source node is only resolved after all
     * of its child nodes are. This is why anchors are set only after all of
     * the nodes have been created.
     */
    setAnchors: () => {
      for (const source of aliasObjects) {
        const ref = sourceObjects.get(source);
        if (typeof ref === "object" && ref.anchor && (isScalar(ref.node) || isCollection(ref.node))) {
          ref.node.anchor = ref.anchor;
        } else {
          const error = new Error("Failed to resolve repeated object (this should not happen)");
          error.source = source;
          throw error;
        }
      }
    },
    sourceObjects
  };
}

// node_modules/yaml/browser/dist/doc/applyReviver.js
function applyReviver(reviver, obj, key, val) {
  if (val && typeof val === "object") {
    if (Array.isArray(val)) {
      for (let i = 0, len = val.length; i < len; ++i) {
        const v0 = val[i];
        const v1 = applyReviver(reviver, val, String(i), v0);
        if (v1 === void 0)
          delete val[i];
        else if (v1 !== v0)
          val[i] = v1;
      }
    } else if (val instanceof Map) {
      for (const k of Array.from(val.keys())) {
        const v0 = val.get(k);
        const v1 = applyReviver(reviver, val, k, v0);
        if (v1 === void 0)
          val.delete(k);
        else if (v1 !== v0)
          val.set(k, v1);
      }
    } else if (val instanceof Set) {
      for (const v0 of Array.from(val)) {
        const v1 = applyReviver(reviver, val, v0, v0);
        if (v1 === void 0)
          val.delete(v0);
        else if (v1 !== v0) {
          val.delete(v0);
          val.add(v1);
        }
      }
    } else {
      for (const [k, v0] of Object.entries(val)) {
        const v1 = applyReviver(reviver, val, k, v0);
        if (v1 === void 0)
          delete val[k];
        else if (v1 !== v0)
          val[k] = v1;
      }
    }
  }
  return reviver.call(obj, key, val);
}

// node_modules/yaml/browser/dist/nodes/toJS.js
function toJS(value, arg, ctx) {
  if (Array.isArray(value))
    return value.map((v, i) => toJS(v, String(i), ctx));
  if (value && typeof value.toJSON === "function") {
    if (!ctx || !hasAnchor(value))
      return value.toJSON(arg, ctx);
    const data = { aliasCount: 0, count: 1, res: void 0 };
    ctx.anchors.set(value, data);
    ctx.onCreate = (res2) => {
      data.res = res2;
      delete ctx.onCreate;
    };
    const res = value.toJSON(arg, ctx);
    if (ctx.onCreate)
      ctx.onCreate(res);
    return res;
  }
  if (typeof value === "bigint" && !(ctx == null ? void 0 : ctx.keep))
    return Number(value);
  return value;
}

// node_modules/yaml/browser/dist/nodes/Node.js
var NodeBase = class {
  constructor(type) {
    Object.defineProperty(this, NODE_TYPE, { value: type });
  }
  /** Create a copy of this node.  */
  clone() {
    const copy = Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this));
    if (this.range)
      copy.range = this.range.slice();
    return copy;
  }
  /** A plain JavaScript representation of this node. */
  toJS(doc, { mapAsMap, maxAliasCount, onAnchor, reviver } = {}) {
    if (!isDocument(doc))
      throw new TypeError("A document argument is required");
    const ctx = {
      anchors: /* @__PURE__ */ new Map(),
      doc,
      keep: true,
      mapAsMap: mapAsMap === true,
      mapKeyWarned: false,
      maxAliasCount: typeof maxAliasCount === "number" ? maxAliasCount : 100
    };
    const res = toJS(this, "", ctx);
    if (typeof onAnchor === "function")
      for (const { count, res: res2 } of ctx.anchors.values())
        onAnchor(res2, count);
    return typeof reviver === "function" ? applyReviver(reviver, { "": res }, "", res) : res;
  }
};

// node_modules/yaml/browser/dist/nodes/Alias.js
var Alias = class extends NodeBase {
  constructor(source) {
    super(ALIAS);
    this.source = source;
    Object.defineProperty(this, "tag", {
      set() {
        throw new Error("Alias nodes cannot have tags");
      }
    });
  }
  /**
   * Resolve the value of this alias within `doc`, finding the last
   * instance of the `source` anchor before this node.
   */
  resolve(doc, ctx) {
    if ((ctx == null ? void 0 : ctx.maxAliasCount) === 0)
      throw new ReferenceError("Alias resolution is disabled");
    let nodes;
    if (ctx == null ? void 0 : ctx.aliasResolveCache) {
      nodes = ctx.aliasResolveCache;
    } else {
      nodes = [];
      visit(doc, {
        Node: (_key, node) => {
          if (isAlias(node) || hasAnchor(node))
            nodes.push(node);
        }
      });
      if (ctx)
        ctx.aliasResolveCache = nodes;
    }
    let found = void 0;
    for (const node of nodes) {
      if (node === this)
        break;
      if (node.anchor === this.source)
        found = node;
    }
    if (found && ctx) {
      const { anchors, doc: doc2, maxAliasCount } = ctx;
      let data = anchors.get(found);
      if (!data) {
        toJS(found, null, ctx);
        data = anchors.get(found);
      }
      if ((data == null ? void 0 : data.res) === void 0) {
        const msg = "This should not happen: Alias anchor was not resolved?";
        throw new ReferenceError(msg);
      }
      if (maxAliasCount >= 0) {
        data.count += 1;
        if (data.aliasCount === 0)
          data.aliasCount = getAliasCount(doc2, found, anchors);
        if (data.count * data.aliasCount > maxAliasCount) {
          const msg = "Excessive alias count indicates a resource exhaustion attack";
          throw new ReferenceError(msg);
        }
      }
    }
    return found;
  }
  toJSON(_arg, ctx) {
    if (!ctx)
      return { source: this.source };
    const source = this.resolve(ctx.doc, ctx);
    if (!source) {
      const msg = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
      throw new ReferenceError(msg);
    }
    return ctx.anchors.get(source).res;
  }
  toString(ctx, _onComment, _onChompKeep) {
    const src = `*${this.source}`;
    if (ctx) {
      anchorIsValid(this.source);
      if (ctx.options.verifyAliasOrder && !ctx.anchors.has(this.source)) {
        const msg = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
        throw new Error(msg);
      }
      if (ctx.implicitKey)
        return `${src} `;
    }
    return src;
  }
};
function getAliasCount(doc, node, anchors) {
  if (isAlias(node)) {
    const source = node.resolve(doc);
    const anchor = anchors && source && anchors.get(source);
    return anchor ? anchor.count * anchor.aliasCount : 0;
  } else if (isCollection(node)) {
    let count = 0;
    for (const item of node.items) {
      const c = getAliasCount(doc, item, anchors);
      if (c > count)
        count = c;
    }
    return count;
  } else if (isPair(node)) {
    const kc = getAliasCount(doc, node.key, anchors);
    const vc = getAliasCount(doc, node.value, anchors);
    return Math.max(kc, vc);
  }
  return 1;
}

// node_modules/yaml/browser/dist/nodes/Scalar.js
var isScalarValue = (value) => !value || typeof value !== "function" && typeof value !== "object";
var Scalar = class extends NodeBase {
  constructor(value) {
    super(SCALAR);
    this.value = value;
  }
  toJSON(arg, ctx) {
    return (ctx == null ? void 0 : ctx.keep) ? this.value : toJS(this.value, arg, ctx);
  }
  toString() {
    return String(this.value);
  }
};
Scalar.BLOCK_FOLDED = "BLOCK_FOLDED";
Scalar.BLOCK_LITERAL = "BLOCK_LITERAL";
Scalar.PLAIN = "PLAIN";
Scalar.QUOTE_DOUBLE = "QUOTE_DOUBLE";
Scalar.QUOTE_SINGLE = "QUOTE_SINGLE";

// node_modules/yaml/browser/dist/doc/createNode.js
var defaultTagPrefix = "tag:yaml.org,2002:";
function findTagObject(value, tagName, tags) {
  var _a;
  if (tagName) {
    const match = tags.filter((t) => t.tag === tagName);
    const tagObj = (_a = match.find((t) => !t.format)) != null ? _a : match[0];
    if (!tagObj)
      throw new Error(`Tag ${tagName} not found`);
    return tagObj;
  }
  return tags.find((t) => {
    var _a2;
    return ((_a2 = t.identify) == null ? void 0 : _a2.call(t, value)) && !t.format;
  });
}
function createNode(value, tagName, ctx) {
  var _a, _b, _c, _d;
  if (isDocument(value))
    value = value.contents;
  if (isNode(value))
    return value;
  if (isPair(value)) {
    const map2 = (_b = (_a = ctx.schema[MAP]).createNode) == null ? void 0 : _b.call(_a, ctx.schema, null, ctx);
    map2.items.push(value);
    return map2;
  }
  if (value instanceof String || value instanceof Number || value instanceof Boolean || typeof BigInt !== "undefined" && value instanceof BigInt) {
    value = value.valueOf();
  }
  const { aliasDuplicateObjects, onAnchor, onTagObj, schema: schema4, sourceObjects } = ctx;
  let ref = void 0;
  if (aliasDuplicateObjects && value && typeof value === "object") {
    ref = sourceObjects.get(value);
    if (ref) {
      (_c = ref.anchor) != null ? _c : ref.anchor = onAnchor(value);
      return new Alias(ref.anchor);
    } else {
      ref = { anchor: null, node: null };
      sourceObjects.set(value, ref);
    }
  }
  if (tagName == null ? void 0 : tagName.startsWith("!!"))
    tagName = defaultTagPrefix + tagName.slice(2);
  let tagObj = findTagObject(value, tagName, schema4.tags);
  if (!tagObj) {
    if (value && typeof value.toJSON === "function") {
      value = value.toJSON();
    }
    if (!value || typeof value !== "object") {
      const node2 = new Scalar(value);
      if (ref)
        ref.node = node2;
      return node2;
    }
    tagObj = value instanceof Map ? schema4[MAP] : Symbol.iterator in Object(value) ? schema4[SEQ] : schema4[MAP];
  }
  if (onTagObj) {
    onTagObj(tagObj);
    delete ctx.onTagObj;
  }
  const node = (tagObj == null ? void 0 : tagObj.createNode) ? tagObj.createNode(ctx.schema, value, ctx) : typeof ((_d = tagObj == null ? void 0 : tagObj.nodeClass) == null ? void 0 : _d.from) === "function" ? tagObj.nodeClass.from(ctx.schema, value, ctx) : new Scalar(value);
  if (tagName)
    node.tag = tagName;
  else if (!tagObj.default)
    node.tag = tagObj.tag;
  if (ref)
    ref.node = node;
  return node;
}

// node_modules/yaml/browser/dist/nodes/Collection.js
function collectionFromPath(schema4, path, value) {
  let v = value;
  for (let i = path.length - 1; i >= 0; --i) {
    const k = path[i];
    if (typeof k === "number" && Number.isInteger(k) && k >= 0) {
      const a = [];
      a[k] = v;
      v = a;
    } else {
      v = /* @__PURE__ */ new Map([[k, v]]);
    }
  }
  return createNode(v, void 0, {
    aliasDuplicateObjects: false,
    keepUndefined: false,
    onAnchor: () => {
      throw new Error("This should not happen, please report a bug.");
    },
    schema: schema4,
    sourceObjects: /* @__PURE__ */ new Map()
  });
}
var isEmptyPath = (path) => path == null || typeof path === "object" && !!path[Symbol.iterator]().next().done;
var Collection = class extends NodeBase {
  constructor(type, schema4) {
    super(type);
    Object.defineProperty(this, "schema", {
      value: schema4,
      configurable: true,
      enumerable: false,
      writable: true
    });
  }
  /**
   * Create a copy of this collection.
   *
   * @param schema - If defined, overwrites the original's schema
   */
  clone(schema4) {
    const copy = Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this));
    if (schema4)
      copy.schema = schema4;
    copy.items = copy.items.map((it) => isNode(it) || isPair(it) ? it.clone(schema4) : it);
    if (this.range)
      copy.range = this.range.slice();
    return copy;
  }
  /**
   * Adds a value to the collection. For `!!map` and `!!omap` the value must
   * be a Pair instance or a `{ key, value }` object, which may not have a key
   * that already exists in the map.
   */
  addIn(path, value) {
    if (isEmptyPath(path))
      this.add(value);
    else {
      const [key, ...rest] = path;
      const node = this.get(key, true);
      if (isCollection(node))
        node.addIn(rest, value);
      else if (node === void 0 && this.schema)
        this.set(key, collectionFromPath(this.schema, rest, value));
      else
        throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
    }
  }
  /**
   * Removes a value from the collection.
   * @returns `true` if the item was found and removed.
   */
  deleteIn(path) {
    const [key, ...rest] = path;
    if (rest.length === 0)
      return this.delete(key);
    const node = this.get(key, true);
    if (isCollection(node))
      return node.deleteIn(rest);
    else
      throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
  }
  /**
   * Returns item at `key`, or `undefined` if not found. By default unwraps
   * scalar values from their surrounding node; to disable set `keepScalar` to
   * `true` (collections are always returned intact).
   */
  getIn(path, keepScalar) {
    const [key, ...rest] = path;
    const node = this.get(key, true);
    if (rest.length === 0)
      return !keepScalar && isScalar(node) ? node.value : node;
    else
      return isCollection(node) ? node.getIn(rest, keepScalar) : void 0;
  }
  hasAllNullValues(allowScalar) {
    return this.items.every((node) => {
      if (!isPair(node))
        return false;
      const n = node.value;
      return n == null || allowScalar && isScalar(n) && n.value == null && !n.commentBefore && !n.comment && !n.tag;
    });
  }
  /**
   * Checks if the collection includes a value with the key `key`.
   */
  hasIn(path) {
    const [key, ...rest] = path;
    if (rest.length === 0)
      return this.has(key);
    const node = this.get(key, true);
    return isCollection(node) ? node.hasIn(rest) : false;
  }
  /**
   * Sets a value in this collection. For `!!set`, `value` needs to be a
   * boolean to add/remove the item from the set.
   */
  setIn(path, value) {
    const [key, ...rest] = path;
    if (rest.length === 0) {
      this.set(key, value);
    } else {
      const node = this.get(key, true);
      if (isCollection(node))
        node.setIn(rest, value);
      else if (node === void 0 && this.schema)
        this.set(key, collectionFromPath(this.schema, rest, value));
      else
        throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
    }
  }
};

// node_modules/yaml/browser/dist/stringify/stringifyComment.js
var stringifyComment = (str) => str.replace(/^(?!$)(?: $)?/gm, "#");
function indentComment(comment, indent) {
  if (/^\n+$/.test(comment))
    return comment.substring(1);
  return indent ? comment.replace(/^(?! *$)/gm, indent) : comment;
}
var lineComment = (str, indent, comment) => str.endsWith("\n") ? indentComment(comment, indent) : comment.includes("\n") ? "\n" + indentComment(comment, indent) : (str.endsWith(" ") ? "" : " ") + comment;

// node_modules/yaml/browser/dist/stringify/foldFlowLines.js
var FOLD_FLOW = "flow";
var FOLD_BLOCK = "block";
var FOLD_QUOTED = "quoted";
function foldFlowLines(text, indent, mode = "flow", { indentAtStart, lineWidth = 80, minContentWidth = 20, onFold, onOverflow } = {}) {
  if (!lineWidth || lineWidth < 0)
    return text;
  if (lineWidth < minContentWidth)
    minContentWidth = 0;
  const endStep = Math.max(1 + minContentWidth, 1 + lineWidth - indent.length);
  if (text.length <= endStep)
    return text;
  const folds = [];
  const escapedFolds = {};
  let end = lineWidth - indent.length;
  if (typeof indentAtStart === "number") {
    if (indentAtStart > lineWidth - Math.max(2, minContentWidth))
      folds.push(0);
    else
      end = lineWidth - indentAtStart;
  }
  let split = void 0;
  let prev = void 0;
  let overflow = false;
  let i = -1;
  let escStart = -1;
  let escEnd = -1;
  if (mode === FOLD_BLOCK) {
    i = consumeMoreIndentedLines(text, i, indent.length);
    if (i !== -1)
      end = i + endStep;
  }
  for (let ch; ch = text[i += 1]; ) {
    if (mode === FOLD_QUOTED && ch === "\\") {
      escStart = i;
      switch (text[i + 1]) {
        case "x":
          i += 3;
          break;
        case "u":
          i += 5;
          break;
        case "U":
          i += 9;
          break;
        default:
          i += 1;
      }
      escEnd = i;
    }
    if (ch === "\n") {
      if (mode === FOLD_BLOCK)
        i = consumeMoreIndentedLines(text, i, indent.length);
      end = i + indent.length + endStep;
      split = void 0;
    } else {
      if (ch === " " && prev && prev !== " " && prev !== "\n" && prev !== "	") {
        const next = text[i + 1];
        if (next && next !== " " && next !== "\n" && next !== "	")
          split = i;
      }
      if (i >= end) {
        if (split) {
          folds.push(split);
          end = split + endStep;
          split = void 0;
        } else if (mode === FOLD_QUOTED) {
          while (prev === " " || prev === "	") {
            prev = ch;
            ch = text[i += 1];
            overflow = true;
          }
          const j = i > escEnd + 1 ? i - 2 : escStart - 1;
          if (escapedFolds[j])
            return text;
          folds.push(j);
          escapedFolds[j] = true;
          end = j + endStep;
          split = void 0;
        } else {
          overflow = true;
        }
      }
    }
    prev = ch;
  }
  if (overflow && onOverflow)
    onOverflow();
  if (folds.length === 0)
    return text;
  if (onFold)
    onFold();
  let res = text.slice(0, folds[0]);
  for (let i2 = 0; i2 < folds.length; ++i2) {
    const fold = folds[i2];
    const end2 = folds[i2 + 1] || text.length;
    if (fold === 0)
      res = `
${indent}${text.slice(0, end2)}`;
    else {
      if (mode === FOLD_QUOTED && escapedFolds[fold])
        res += `${text[fold]}\\`;
      res += `
${indent}${text.slice(fold + 1, end2)}`;
    }
  }
  return res;
}
function consumeMoreIndentedLines(text, i, indent) {
  let end = i;
  let start = i + 1;
  let ch = text[start];
  while (ch === " " || ch === "	") {
    if (i < start + indent) {
      ch = text[++i];
    } else {
      do {
        ch = text[++i];
      } while (ch && ch !== "\n");
      end = i;
      start = i + 1;
      ch = text[start];
    }
  }
  return end;
}

// node_modules/yaml/browser/dist/stringify/stringifyString.js
var getFoldOptions = (ctx, isBlock2) => ({
  indentAtStart: isBlock2 ? ctx.indent.length : ctx.indentAtStart,
  lineWidth: ctx.options.lineWidth,
  minContentWidth: ctx.options.minContentWidth
});
var containsDocumentMarker = (str) => /^(%|---|\.\.\.)/m.test(str);
function lineLengthOverLimit(str, lineWidth, indentLength) {
  if (!lineWidth || lineWidth < 0)
    return false;
  const limit = lineWidth - indentLength;
  const strLen = str.length;
  if (strLen <= limit)
    return false;
  for (let i = 0, start = 0; i < strLen; ++i) {
    if (str[i] === "\n") {
      if (i - start > limit)
        return true;
      start = i + 1;
      if (strLen - start <= limit)
        return false;
    }
  }
  return true;
}
function doubleQuotedString(value, ctx) {
  const json = JSON.stringify(value);
  if (ctx.options.doubleQuotedAsJSON)
    return json;
  const { implicitKey } = ctx;
  const minMultiLineLength = ctx.options.doubleQuotedMinMultiLineLength;
  const indent = ctx.indent || (containsDocumentMarker(value) ? "  " : "");
  let str = "";
  let start = 0;
  for (let i = 0, ch = json[i]; ch; ch = json[++i]) {
    if (ch === " " && json[i + 1] === "\\" && json[i + 2] === "n") {
      str += json.slice(start, i) + "\\ ";
      i += 1;
      start = i;
      ch = "\\";
    }
    if (ch === "\\")
      switch (json[i + 1]) {
        case "u":
          {
            str += json.slice(start, i);
            const code = json.substr(i + 2, 4);
            switch (code) {
              case "0000":
                str += "\\0";
                break;
              case "0007":
                str += "\\a";
                break;
              case "000b":
                str += "\\v";
                break;
              case "001b":
                str += "\\e";
                break;
              case "0085":
                str += "\\N";
                break;
              case "00a0":
                str += "\\_";
                break;
              case "2028":
                str += "\\L";
                break;
              case "2029":
                str += "\\P";
                break;
              default:
                if (code.substr(0, 2) === "00")
                  str += "\\x" + code.substr(2);
                else
                  str += json.substr(i, 6);
            }
            i += 5;
            start = i + 1;
          }
          break;
        case "n":
          if (implicitKey || json[i + 2] === '"' || json.length < minMultiLineLength) {
            i += 1;
          } else {
            str += json.slice(start, i) + "\n\n";
            while (json[i + 2] === "\\" && json[i + 3] === "n" && json[i + 4] !== '"') {
              str += "\n";
              i += 2;
            }
            str += indent;
            if (json[i + 2] === " ")
              str += "\\";
            i += 1;
            start = i + 1;
          }
          break;
        default:
          i += 1;
      }
  }
  str = start ? str + json.slice(start) : json;
  return implicitKey ? str : foldFlowLines(str, indent, FOLD_QUOTED, getFoldOptions(ctx, false));
}
function singleQuotedString(value, ctx) {
  if (ctx.options.singleQuote === false || ctx.implicitKey && value.includes("\n") || /[ \t]\n|\n[ \t]/.test(value))
    return doubleQuotedString(value, ctx);
  const indent = ctx.indent || (containsDocumentMarker(value) ? "  " : "");
  const res = "'" + value.replace(/'/g, "''").replace(/\n+/g, `$&
${indent}`) + "'";
  return ctx.implicitKey ? res : foldFlowLines(res, indent, FOLD_FLOW, getFoldOptions(ctx, false));
}
function quotedString(value, ctx) {
  const { singleQuote } = ctx.options;
  let qs;
  if (singleQuote === false)
    qs = doubleQuotedString;
  else {
    const hasDouble = value.includes('"');
    const hasSingle = value.includes("'");
    if (hasDouble && !hasSingle)
      qs = singleQuotedString;
    else if (hasSingle && !hasDouble)
      qs = doubleQuotedString;
    else
      qs = singleQuote ? singleQuotedString : doubleQuotedString;
  }
  return qs(value, ctx);
}
var blockEndNewlines;
try {
  blockEndNewlines = new RegExp("(^|(?<!\n))\n+(?!\n|$)", "g");
} catch (e) {
  blockEndNewlines = /\n+(?!\n|$)/g;
}
function blockString({ comment, type, value }, ctx, onComment, onChompKeep) {
  const { blockQuote, commentString, lineWidth } = ctx.options;
  if (!blockQuote || /\n[\t ]+$/.test(value)) {
    return quotedString(value, ctx);
  }
  const indent = ctx.indent || (ctx.forceBlockIndent || containsDocumentMarker(value) ? "  " : "");
  const literal = blockQuote === "literal" ? true : blockQuote === "folded" || type === Scalar.BLOCK_FOLDED ? false : type === Scalar.BLOCK_LITERAL ? true : !lineLengthOverLimit(value, lineWidth, indent.length);
  if (!value)
    return literal ? "|\n" : ">\n";
  let chomp;
  let endStart;
  for (endStart = value.length; endStart > 0; --endStart) {
    const ch = value[endStart - 1];
    if (ch !== "\n" && ch !== "	" && ch !== " ")
      break;
  }
  let end = value.substring(endStart);
  const endNlPos = end.indexOf("\n");
  if (endNlPos === -1) {
    chomp = "-";
  } else if (value === end || endNlPos !== end.length - 1) {
    chomp = "+";
    if (onChompKeep)
      onChompKeep();
  } else {
    chomp = "";
  }
  if (end) {
    value = value.slice(0, -end.length);
    if (end[end.length - 1] === "\n")
      end = end.slice(0, -1);
    end = end.replace(blockEndNewlines, `$&${indent}`);
  }
  let startWithSpace = false;
  let startEnd;
  let startNlPos = -1;
  for (startEnd = 0; startEnd < value.length; ++startEnd) {
    const ch = value[startEnd];
    if (ch === " ")
      startWithSpace = true;
    else if (ch === "\n")
      startNlPos = startEnd;
    else
      break;
  }
  let start = value.substring(0, startNlPos < startEnd ? startNlPos + 1 : startEnd);
  if (start) {
    value = value.substring(start.length);
    start = start.replace(/\n+/g, `$&${indent}`);
  }
  const indentSize = indent ? "2" : "1";
  let header = (startWithSpace ? indentSize : "") + chomp;
  if (comment) {
    header += " " + commentString(comment.replace(/ ?[\r\n]+/g, " "));
    if (onComment)
      onComment();
  }
  if (!literal) {
    const foldedValue = value.replace(/\n+/g, "\n$&").replace(/(?:^|\n)([\t ].*)(?:([\n\t ]*)\n(?![\n\t ]))?/g, "$1$2").replace(/\n+/g, `$&${indent}`);
    let literalFallback = false;
    const foldOptions = getFoldOptions(ctx, true);
    if (blockQuote !== "folded" && type !== Scalar.BLOCK_FOLDED) {
      foldOptions.onOverflow = () => {
        literalFallback = true;
      };
    }
    const body = foldFlowLines(`${start}${foldedValue}${end}`, indent, FOLD_BLOCK, foldOptions);
    if (!literalFallback)
      return `>${header}
${indent}${body}`;
  }
  value = value.replace(/\n+/g, `$&${indent}`);
  return `|${header}
${indent}${start}${value}${end}`;
}
function plainString(item, ctx, onComment, onChompKeep) {
  const { type, value } = item;
  const { actualString, implicitKey, indent, indentStep, inFlow } = ctx;
  if (implicitKey && value.includes("\n") || inFlow && /[[\]{},]/.test(value)) {
    return quotedString(value, ctx);
  }
  if (/^[\n\t ,[\]{}#&*!|>'"%@`]|^[?-]$|^[?-][ \t]|[\n:][ \t]|[ \t]\n|[\n\t ]#|[\n\t :]$/.test(value)) {
    return implicitKey || inFlow || !value.includes("\n") ? quotedString(value, ctx) : blockString(item, ctx, onComment, onChompKeep);
  }
  if (!implicitKey && !inFlow && type !== Scalar.PLAIN && value.includes("\n")) {
    return blockString(item, ctx, onComment, onChompKeep);
  }
  if (containsDocumentMarker(value)) {
    if (indent === "") {
      ctx.forceBlockIndent = true;
      return blockString(item, ctx, onComment, onChompKeep);
    } else if (implicitKey && indent === indentStep) {
      return quotedString(value, ctx);
    }
  }
  const str = value.replace(/\n+/g, `$&
${indent}`);
  if (actualString) {
    const test = (tag) => {
      var _a;
      return tag.default && tag.tag !== "tag:yaml.org,2002:str" && ((_a = tag.test) == null ? void 0 : _a.test(str));
    };
    const { compat, tags } = ctx.doc.schema;
    if (tags.some(test) || (compat == null ? void 0 : compat.some(test)))
      return quotedString(value, ctx);
  }
  return implicitKey ? str : foldFlowLines(str, indent, FOLD_FLOW, getFoldOptions(ctx, false));
}
function stringifyString(item, ctx, onComment, onChompKeep) {
  const { implicitKey, inFlow } = ctx;
  const ss = typeof item.value === "string" ? item : Object.assign({}, item, { value: String(item.value) });
  let { type } = item;
  if (type !== Scalar.QUOTE_DOUBLE) {
    if (/[\x00-\x08\x0b-\x1f\x7f-\x9f\u{D800}-\u{DFFF}]/u.test(ss.value))
      type = Scalar.QUOTE_DOUBLE;
  }
  const _stringify = (_type) => {
    switch (_type) {
      case Scalar.BLOCK_FOLDED:
      case Scalar.BLOCK_LITERAL:
        return implicitKey || inFlow ? quotedString(ss.value, ctx) : blockString(ss, ctx, onComment, onChompKeep);
      case Scalar.QUOTE_DOUBLE:
        return doubleQuotedString(ss.value, ctx);
      case Scalar.QUOTE_SINGLE:
        return singleQuotedString(ss.value, ctx);
      case Scalar.PLAIN:
        return plainString(ss, ctx, onComment, onChompKeep);
      default:
        return null;
    }
  };
  let res = _stringify(type);
  if (res === null) {
    const { defaultKeyType, defaultStringType } = ctx.options;
    const t = implicitKey && defaultKeyType || defaultStringType;
    res = _stringify(t);
    if (res === null)
      throw new Error(`Unsupported default string type ${t}`);
  }
  return res;
}

// node_modules/yaml/browser/dist/stringify/stringify.js
function createStringifyContext(doc, options) {
  const opt = Object.assign({
    blockQuote: true,
    commentString: stringifyComment,
    defaultKeyType: null,
    defaultStringType: "PLAIN",
    directives: null,
    doubleQuotedAsJSON: false,
    doubleQuotedMinMultiLineLength: 40,
    falseStr: "false",
    flowCollectionPadding: true,
    indentSeq: true,
    lineWidth: 80,
    minContentWidth: 20,
    nullStr: "null",
    simpleKeys: false,
    singleQuote: null,
    trailingComma: false,
    trueStr: "true",
    verifyAliasOrder: true
  }, doc.schema.toStringOptions, options);
  let inFlow;
  switch (opt.collectionStyle) {
    case "block":
      inFlow = false;
      break;
    case "flow":
      inFlow = true;
      break;
    default:
      inFlow = null;
  }
  return {
    anchors: /* @__PURE__ */ new Set(),
    doc,
    flowCollectionPadding: opt.flowCollectionPadding ? " " : "",
    indent: "",
    indentStep: typeof opt.indent === "number" ? " ".repeat(opt.indent) : "  ",
    inFlow,
    options: opt
  };
}
function getTagObject(tags, item) {
  var _a, _b, _c, _d;
  if (item.tag) {
    const match = tags.filter((t) => t.tag === item.tag);
    if (match.length > 0)
      return (_a = match.find((t) => t.format === item.format)) != null ? _a : match[0];
  }
  let tagObj = void 0;
  let obj;
  if (isScalar(item)) {
    obj = item.value;
    let match = tags.filter((t) => {
      var _a2;
      return (_a2 = t.identify) == null ? void 0 : _a2.call(t, obj);
    });
    if (match.length > 1) {
      const testMatch = match.filter((t) => t.test);
      if (testMatch.length > 0)
        match = testMatch;
    }
    tagObj = (_b = match.find((t) => t.format === item.format)) != null ? _b : match.find((t) => !t.format);
  } else {
    obj = item;
    tagObj = tags.find((t) => t.nodeClass && obj instanceof t.nodeClass);
  }
  if (!tagObj) {
    const name = (_d = (_c = obj == null ? void 0 : obj.constructor) == null ? void 0 : _c.name) != null ? _d : obj === null ? "null" : typeof obj;
    throw new Error(`Tag not resolved for ${name} value`);
  }
  return tagObj;
}
function stringifyProps(node, tagObj, { anchors, doc }) {
  var _a;
  if (!doc.directives)
    return "";
  const props = [];
  const anchor = (isScalar(node) || isCollection(node)) && node.anchor;
  if (anchor && anchorIsValid(anchor)) {
    anchors.add(anchor);
    props.push(`&${anchor}`);
  }
  const tag = (_a = node.tag) != null ? _a : tagObj.default ? null : tagObj.tag;
  if (tag)
    props.push(doc.directives.tagString(tag));
  return props.join(" ");
}
function stringify(item, ctx, onComment, onChompKeep) {
  var _a, _b;
  if (isPair(item))
    return item.toString(ctx, onComment, onChompKeep);
  if (isAlias(item)) {
    if (ctx.doc.directives)
      return item.toString(ctx);
    if ((_a = ctx.resolvedAliases) == null ? void 0 : _a.has(item)) {
      throw new TypeError(`Cannot stringify circular structure without alias nodes`);
    } else {
      if (ctx.resolvedAliases)
        ctx.resolvedAliases.add(item);
      else
        ctx.resolvedAliases = /* @__PURE__ */ new Set([item]);
      item = item.resolve(ctx.doc);
    }
  }
  let tagObj = void 0;
  const node = isNode(item) ? item : ctx.doc.createNode(item, { onTagObj: (o) => tagObj = o });
  tagObj != null ? tagObj : tagObj = getTagObject(ctx.doc.schema.tags, node);
  const props = stringifyProps(node, tagObj, ctx);
  if (props.length > 0)
    ctx.indentAtStart = ((_b = ctx.indentAtStart) != null ? _b : 0) + props.length + 1;
  const str = typeof tagObj.stringify === "function" ? tagObj.stringify(node, ctx, onComment, onChompKeep) : isScalar(node) ? stringifyString(node, ctx, onComment, onChompKeep) : node.toString(ctx, onComment, onChompKeep);
  if (!props)
    return str;
  return isScalar(node) || str[0] === "{" || str[0] === "[" ? `${props} ${str}` : `${props}
${ctx.indent}${str}`;
}

// node_modules/yaml/browser/dist/stringify/stringifyPair.js
function stringifyPair({ key, value }, ctx, onComment, onChompKeep) {
  var _a, _b;
  const { allNullValues, doc, indent, indentStep, options: { commentString, indentSeq, simpleKeys } } = ctx;
  let keyComment = isNode(key) && key.comment || null;
  if (simpleKeys) {
    if (keyComment) {
      throw new Error("With simple keys, key nodes cannot have comments");
    }
    if (isCollection(key) || !isNode(key) && typeof key === "object") {
      const msg = "With simple keys, collection cannot be used as a key value";
      throw new Error(msg);
    }
  }
  let explicitKey = !simpleKeys && (!key || keyComment && value == null && !ctx.inFlow || isCollection(key) || (isScalar(key) ? key.type === Scalar.BLOCK_FOLDED || key.type === Scalar.BLOCK_LITERAL : typeof key === "object"));
  ctx = Object.assign({}, ctx, {
    allNullValues: false,
    implicitKey: !explicitKey && (simpleKeys || !allNullValues),
    indent: indent + indentStep
  });
  let keyCommentDone = false;
  let chompKeep = false;
  let str = stringify(key, ctx, () => keyCommentDone = true, () => chompKeep = true);
  if (!explicitKey && !ctx.inFlow && str.length > 1024) {
    if (simpleKeys)
      throw new Error("With simple keys, single line scalar must not span more than 1024 characters");
    explicitKey = true;
  }
  if (ctx.inFlow) {
    if (allNullValues || value == null) {
      if (keyCommentDone && onComment)
        onComment();
      return str === "" ? "?" : explicitKey ? `? ${str}` : str;
    }
  } else if (allNullValues && !simpleKeys || value == null && explicitKey) {
    str = `? ${str}`;
    if (keyComment && !keyCommentDone) {
      str += lineComment(str, ctx.indent, commentString(keyComment));
    } else if (chompKeep && onChompKeep)
      onChompKeep();
    return str;
  }
  if (keyCommentDone)
    keyComment = null;
  if (explicitKey) {
    if (keyComment)
      str += lineComment(str, ctx.indent, commentString(keyComment));
    str = `? ${str}
${indent}:`;
  } else {
    str = `${str}:`;
    if (keyComment)
      str += lineComment(str, ctx.indent, commentString(keyComment));
  }
  let vsb, vcb, valueComment;
  if (isNode(value)) {
    vsb = !!value.spaceBefore;
    vcb = value.commentBefore;
    valueComment = value.comment;
  } else {
    vsb = false;
    vcb = null;
    valueComment = null;
    if (value && typeof value === "object")
      value = doc.createNode(value);
  }
  ctx.implicitKey = false;
  if (!explicitKey && !keyComment && isScalar(value))
    ctx.indentAtStart = str.length + 1;
  chompKeep = false;
  if (!indentSeq && indentStep.length >= 2 && !ctx.inFlow && !explicitKey && isSeq(value) && !value.flow && !value.tag && !value.anchor) {
    ctx.indent = ctx.indent.substring(2);
  }
  let valueCommentDone = false;
  const valueStr = stringify(value, ctx, () => valueCommentDone = true, () => chompKeep = true);
  let ws = " ";
  if (keyComment || vsb || vcb) {
    ws = vsb ? "\n" : "";
    if (vcb) {
      const cs = commentString(vcb);
      ws += `
${indentComment(cs, ctx.indent)}`;
    }
    if (valueStr === "" && !ctx.inFlow) {
      if (ws === "\n" && valueComment)
        ws = "\n\n";
    } else {
      ws += `
${ctx.indent}`;
    }
  } else if (!explicitKey && isCollection(value)) {
    const vs0 = valueStr[0];
    const nl0 = valueStr.indexOf("\n");
    const hasNewline = nl0 !== -1;
    const flow = (_b = (_a = ctx.inFlow) != null ? _a : value.flow) != null ? _b : value.items.length === 0;
    if (hasNewline || !flow) {
      let hasPropsLine = false;
      if (hasNewline && (vs0 === "&" || vs0 === "!")) {
        let sp0 = valueStr.indexOf(" ");
        if (vs0 === "&" && sp0 !== -1 && sp0 < nl0 && valueStr[sp0 + 1] === "!") {
          sp0 = valueStr.indexOf(" ", sp0 + 1);
        }
        if (sp0 === -1 || nl0 < sp0)
          hasPropsLine = true;
      }
      if (!hasPropsLine)
        ws = `
${ctx.indent}`;
    }
  } else if (valueStr === "" || valueStr[0] === "\n") {
    ws = "";
  }
  str += ws + valueStr;
  if (ctx.inFlow) {
    if (valueCommentDone && onComment)
      onComment();
  } else if (valueComment && !valueCommentDone) {
    str += lineComment(str, ctx.indent, commentString(valueComment));
  } else if (chompKeep && onChompKeep) {
    onChompKeep();
  }
  return str;
}

// node_modules/yaml/browser/dist/log.js
function warn(logLevel, warning) {
  if (logLevel === "debug" || logLevel === "warn") {
    console.warn(warning);
  }
}

// node_modules/yaml/browser/dist/schema/yaml-1.1/merge.js
var MERGE_KEY = "<<";
var merge = {
  identify: (value) => value === MERGE_KEY || typeof value === "symbol" && value.description === MERGE_KEY,
  default: "key",
  tag: "tag:yaml.org,2002:merge",
  test: /^<<$/,
  resolve: () => Object.assign(new Scalar(Symbol(MERGE_KEY)), {
    addToJSMap: addMergeToJSMap
  }),
  stringify: () => MERGE_KEY
};
var isMergeKey = (ctx, key) => (merge.identify(key) || isScalar(key) && (!key.type || key.type === Scalar.PLAIN) && merge.identify(key.value)) && (ctx == null ? void 0 : ctx.doc.schema.tags.some((tag) => tag.tag === merge.tag && tag.default));
function addMergeToJSMap(ctx, map2, value) {
  const source = resolveAliasValue(ctx, value);
  if (isSeq(source))
    for (const it of source.items)
      mergeValue(ctx, map2, it);
  else if (Array.isArray(source))
    for (const it of source)
      mergeValue(ctx, map2, it);
  else
    mergeValue(ctx, map2, source);
}
function mergeValue(ctx, map2, value) {
  const source = resolveAliasValue(ctx, value);
  if (!isMap(source))
    throw new Error("Merge sources must be maps or map aliases");
  const srcMap = source.toJSON(null, ctx, Map);
  for (const [key, value2] of srcMap) {
    if (map2 instanceof Map) {
      if (!map2.has(key))
        map2.set(key, value2);
    } else if (map2 instanceof Set) {
      map2.add(key);
    } else if (!Object.prototype.hasOwnProperty.call(map2, key)) {
      Object.defineProperty(map2, key, {
        value: value2,
        writable: true,
        enumerable: true,
        configurable: true
      });
    }
  }
  return map2;
}
function resolveAliasValue(ctx, value) {
  return ctx && isAlias(value) ? value.resolve(ctx.doc, ctx) : value;
}

// node_modules/yaml/browser/dist/nodes/addPairToJSMap.js
function addPairToJSMap(ctx, map2, { key, value }) {
  if (isNode(key) && key.addToJSMap)
    key.addToJSMap(ctx, map2, value);
  else if (isMergeKey(ctx, key))
    addMergeToJSMap(ctx, map2, value);
  else {
    const jsKey = toJS(key, "", ctx);
    if (map2 instanceof Map) {
      map2.set(jsKey, toJS(value, jsKey, ctx));
    } else if (map2 instanceof Set) {
      map2.add(jsKey);
    } else {
      const stringKey = stringifyKey(key, jsKey, ctx);
      const jsValue = toJS(value, stringKey, ctx);
      if (stringKey in map2)
        Object.defineProperty(map2, stringKey, {
          value: jsValue,
          writable: true,
          enumerable: true,
          configurable: true
        });
      else
        map2[stringKey] = jsValue;
    }
  }
  return map2;
}
function stringifyKey(key, jsKey, ctx) {
  if (jsKey === null)
    return "";
  if (typeof jsKey !== "object")
    return String(jsKey);
  if (isNode(key) && (ctx == null ? void 0 : ctx.doc)) {
    const strCtx = createStringifyContext(ctx.doc, {});
    strCtx.anchors = /* @__PURE__ */ new Set();
    for (const node of ctx.anchors.keys())
      strCtx.anchors.add(node.anchor);
    strCtx.inFlow = true;
    strCtx.inStringifyKey = true;
    const strKey = key.toString(strCtx);
    if (!ctx.mapKeyWarned) {
      let jsonStr = JSON.stringify(strKey);
      if (jsonStr.length > 40)
        jsonStr = jsonStr.substring(0, 36) + '..."';
      warn(ctx.doc.options.logLevel, `Keys with collection values will be stringified due to JS Object restrictions: ${jsonStr}. Set mapAsMap: true to use object keys.`);
      ctx.mapKeyWarned = true;
    }
    return strKey;
  }
  return JSON.stringify(jsKey);
}

// node_modules/yaml/browser/dist/nodes/Pair.js
function createPair(key, value, ctx) {
  const k = createNode(key, void 0, ctx);
  const v = createNode(value, void 0, ctx);
  return new Pair(k, v);
}
var Pair = class _Pair {
  constructor(key, value = null) {
    Object.defineProperty(this, NODE_TYPE, { value: PAIR });
    this.key = key;
    this.value = value;
  }
  clone(schema4) {
    let { key, value } = this;
    if (isNode(key))
      key = key.clone(schema4);
    if (isNode(value))
      value = value.clone(schema4);
    return new _Pair(key, value);
  }
  toJSON(_, ctx) {
    const pair = (ctx == null ? void 0 : ctx.mapAsMap) ? /* @__PURE__ */ new Map() : {};
    return addPairToJSMap(ctx, pair, this);
  }
  toString(ctx, onComment, onChompKeep) {
    return (ctx == null ? void 0 : ctx.doc) ? stringifyPair(this, ctx, onComment, onChompKeep) : JSON.stringify(this);
  }
};

// node_modules/yaml/browser/dist/stringify/stringifyCollection.js
function stringifyCollection(collection, ctx, options) {
  var _a;
  const flow = (_a = ctx.inFlow) != null ? _a : collection.flow;
  const stringify4 = flow ? stringifyFlowCollection : stringifyBlockCollection;
  return stringify4(collection, ctx, options);
}
function stringifyBlockCollection({ comment, items }, ctx, { blockItemPrefix, flowChars, itemIndent, onChompKeep, onComment }) {
  const { indent, options: { commentString } } = ctx;
  const itemCtx = Object.assign({}, ctx, { indent: itemIndent, type: null });
  let chompKeep = false;
  const lines = [];
  for (let i = 0; i < items.length; ++i) {
    const item = items[i];
    let comment2 = null;
    if (isNode(item)) {
      if (!chompKeep && item.spaceBefore)
        lines.push("");
      addCommentBefore(ctx, lines, item.commentBefore, chompKeep);
      if (item.comment)
        comment2 = item.comment;
    } else if (isPair(item)) {
      const ik = isNode(item.key) ? item.key : null;
      if (ik) {
        if (!chompKeep && ik.spaceBefore)
          lines.push("");
        addCommentBefore(ctx, lines, ik.commentBefore, chompKeep);
      }
    }
    chompKeep = false;
    let str2 = stringify(item, itemCtx, () => comment2 = null, () => chompKeep = true);
    if (comment2)
      str2 += lineComment(str2, itemIndent, commentString(comment2));
    if (chompKeep && comment2)
      chompKeep = false;
    lines.push(blockItemPrefix + str2);
  }
  let str;
  if (lines.length === 0) {
    str = flowChars.start + flowChars.end;
  } else {
    str = lines[0];
    for (let i = 1; i < lines.length; ++i) {
      const line = lines[i];
      str += line ? `
${indent}${line}` : "\n";
    }
  }
  if (comment) {
    str += "\n" + indentComment(commentString(comment), indent);
    if (onComment)
      onComment();
  } else if (chompKeep && onChompKeep)
    onChompKeep();
  return str;
}
function stringifyFlowCollection({ items }, ctx, { flowChars, itemIndent }) {
  const { indent, indentStep, flowCollectionPadding: fcPadding, options: { commentString } } = ctx;
  itemIndent += indentStep;
  const itemCtx = Object.assign({}, ctx, {
    indent: itemIndent,
    inFlow: true,
    type: null
  });
  let reqNewline = false;
  let linesAtValue = 0;
  const lines = [];
  for (let i = 0; i < items.length; ++i) {
    const item = items[i];
    let comment = null;
    if (isNode(item)) {
      if (item.spaceBefore)
        lines.push("");
      addCommentBefore(ctx, lines, item.commentBefore, false);
      if (item.comment)
        comment = item.comment;
    } else if (isPair(item)) {
      const ik = isNode(item.key) ? item.key : null;
      if (ik) {
        if (ik.spaceBefore)
          lines.push("");
        addCommentBefore(ctx, lines, ik.commentBefore, false);
        if (ik.comment)
          reqNewline = true;
      }
      const iv = isNode(item.value) ? item.value : null;
      if (iv) {
        if (iv.comment)
          comment = iv.comment;
        if (iv.commentBefore)
          reqNewline = true;
      } else if (item.value == null && (ik == null ? void 0 : ik.comment)) {
        comment = ik.comment;
      }
    }
    if (comment)
      reqNewline = true;
    let str = stringify(item, itemCtx, () => comment = null);
    reqNewline || (reqNewline = lines.length > linesAtValue || str.includes("\n"));
    if (i < items.length - 1) {
      str += ",";
    } else if (ctx.options.trailingComma) {
      if (ctx.options.lineWidth > 0) {
        reqNewline || (reqNewline = lines.reduce((sum, line) => sum + line.length + 2, 2) + (str.length + 2) > ctx.options.lineWidth);
      }
      if (reqNewline) {
        str += ",";
      }
    }
    if (comment)
      str += lineComment(str, itemIndent, commentString(comment));
    lines.push(str);
    linesAtValue = lines.length;
  }
  const { start, end } = flowChars;
  if (lines.length === 0) {
    return start + end;
  } else {
    if (!reqNewline) {
      const len = lines.reduce((sum, line) => sum + line.length + 2, 2);
      reqNewline = ctx.options.lineWidth > 0 && len > ctx.options.lineWidth;
    }
    if (reqNewline) {
      let str = start;
      for (const line of lines)
        str += line ? `
${indentStep}${indent}${line}` : "\n";
      return `${str}
${indent}${end}`;
    } else {
      return `${start}${fcPadding}${lines.join(" ")}${fcPadding}${end}`;
    }
  }
}
function addCommentBefore({ indent, options: { commentString } }, lines, comment, chompKeep) {
  if (comment && chompKeep)
    comment = comment.replace(/^\n+/, "");
  if (comment) {
    const ic = indentComment(commentString(comment), indent);
    lines.push(ic.trimStart());
  }
}

// node_modules/yaml/browser/dist/nodes/YAMLMap.js
function findPair(items, key) {
  const k = isScalar(key) ? key.value : key;
  for (const it of items) {
    if (isPair(it)) {
      if (it.key === key || it.key === k)
        return it;
      if (isScalar(it.key) && it.key.value === k)
        return it;
    }
  }
  return void 0;
}
var YAMLMap = class extends Collection {
  static get tagName() {
    return "tag:yaml.org,2002:map";
  }
  constructor(schema4) {
    super(MAP, schema4);
    this.items = [];
  }
  /**
   * A generic collection parsing method that can be extended
   * to other node classes that inherit from YAMLMap
   */
  static from(schema4, obj, ctx) {
    const { keepUndefined, replacer } = ctx;
    const map2 = new this(schema4);
    const add = (key, value) => {
      if (typeof replacer === "function")
        value = replacer.call(obj, key, value);
      else if (Array.isArray(replacer) && !replacer.includes(key))
        return;
      if (value !== void 0 || keepUndefined)
        map2.items.push(createPair(key, value, ctx));
    };
    if (obj instanceof Map) {
      for (const [key, value] of obj)
        add(key, value);
    } else if (obj && typeof obj === "object") {
      for (const key of Object.keys(obj))
        add(key, obj[key]);
    }
    if (typeof schema4.sortMapEntries === "function") {
      map2.items.sort(schema4.sortMapEntries);
    }
    return map2;
  }
  /**
   * Adds a value to the collection.
   *
   * @param overwrite - If not set `true`, using a key that is already in the
   *   collection will throw. Otherwise, overwrites the previous value.
   */
  add(pair, overwrite) {
    var _a;
    let _pair;
    if (isPair(pair))
      _pair = pair;
    else if (!pair || typeof pair !== "object" || !("key" in pair)) {
      _pair = new Pair(pair, pair == null ? void 0 : pair.value);
    } else
      _pair = new Pair(pair.key, pair.value);
    const prev = findPair(this.items, _pair.key);
    const sortEntries = (_a = this.schema) == null ? void 0 : _a.sortMapEntries;
    if (prev) {
      if (!overwrite)
        throw new Error(`Key ${_pair.key} already set`);
      if (isScalar(prev.value) && isScalarValue(_pair.value))
        prev.value.value = _pair.value;
      else
        prev.value = _pair.value;
    } else if (sortEntries) {
      const i = this.items.findIndex((item) => sortEntries(_pair, item) < 0);
      if (i === -1)
        this.items.push(_pair);
      else
        this.items.splice(i, 0, _pair);
    } else {
      this.items.push(_pair);
    }
  }
  delete(key) {
    const it = findPair(this.items, key);
    if (!it)
      return false;
    const del = this.items.splice(this.items.indexOf(it), 1);
    return del.length > 0;
  }
  get(key, keepScalar) {
    var _a;
    const it = findPair(this.items, key);
    const node = it == null ? void 0 : it.value;
    return (_a = !keepScalar && isScalar(node) ? node.value : node) != null ? _a : void 0;
  }
  has(key) {
    return !!findPair(this.items, key);
  }
  set(key, value) {
    this.add(new Pair(key, value), true);
  }
  /**
   * @param ctx - Conversion context, originally set in Document#toJS()
   * @param {Class} Type - If set, forces the returned collection type
   * @returns Instance of Type, Map, or Object
   */
  toJSON(_, ctx, Type) {
    const map2 = Type ? new Type() : (ctx == null ? void 0 : ctx.mapAsMap) ? /* @__PURE__ */ new Map() : {};
    if (ctx == null ? void 0 : ctx.onCreate)
      ctx.onCreate(map2);
    for (const item of this.items)
      addPairToJSMap(ctx, map2, item);
    return map2;
  }
  toString(ctx, onComment, onChompKeep) {
    if (!ctx)
      return JSON.stringify(this);
    for (const item of this.items) {
      if (!isPair(item))
        throw new Error(`Map items must all be pairs; found ${JSON.stringify(item)} instead`);
    }
    if (!ctx.allNullValues && this.hasAllNullValues(false))
      ctx = Object.assign({}, ctx, { allNullValues: true });
    return stringifyCollection(this, ctx, {
      blockItemPrefix: "",
      flowChars: { start: "{", end: "}" },
      itemIndent: ctx.indent || "",
      onChompKeep,
      onComment
    });
  }
};

// node_modules/yaml/browser/dist/schema/common/map.js
var map = {
  collection: "map",
  default: true,
  nodeClass: YAMLMap,
  tag: "tag:yaml.org,2002:map",
  resolve(map2, onError) {
    if (!isMap(map2))
      onError("Expected a mapping for this tag");
    return map2;
  },
  createNode: (schema4, obj, ctx) => YAMLMap.from(schema4, obj, ctx)
};

// node_modules/yaml/browser/dist/nodes/YAMLSeq.js
var YAMLSeq = class extends Collection {
  static get tagName() {
    return "tag:yaml.org,2002:seq";
  }
  constructor(schema4) {
    super(SEQ, schema4);
    this.items = [];
  }
  add(value) {
    this.items.push(value);
  }
  /**
   * Removes a value from the collection.
   *
   * `key` must contain a representation of an integer for this to succeed.
   * It may be wrapped in a `Scalar`.
   *
   * @returns `true` if the item was found and removed.
   */
  delete(key) {
    const idx = asItemIndex(key);
    if (typeof idx !== "number")
      return false;
    const del = this.items.splice(idx, 1);
    return del.length > 0;
  }
  get(key, keepScalar) {
    const idx = asItemIndex(key);
    if (typeof idx !== "number")
      return void 0;
    const it = this.items[idx];
    return !keepScalar && isScalar(it) ? it.value : it;
  }
  /**
   * Checks if the collection includes a value with the key `key`.
   *
   * `key` must contain a representation of an integer for this to succeed.
   * It may be wrapped in a `Scalar`.
   */
  has(key) {
    const idx = asItemIndex(key);
    return typeof idx === "number" && idx < this.items.length;
  }
  /**
   * Sets a value in this collection. For `!!set`, `value` needs to be a
   * boolean to add/remove the item from the set.
   *
   * If `key` does not contain a representation of an integer, this will throw.
   * It may be wrapped in a `Scalar`.
   */
  set(key, value) {
    const idx = asItemIndex(key);
    if (typeof idx !== "number")
      throw new Error(`Expected a valid index, not ${key}.`);
    const prev = this.items[idx];
    if (isScalar(prev) && isScalarValue(value))
      prev.value = value;
    else
      this.items[idx] = value;
  }
  toJSON(_, ctx) {
    const seq2 = [];
    if (ctx == null ? void 0 : ctx.onCreate)
      ctx.onCreate(seq2);
    let i = 0;
    for (const item of this.items)
      seq2.push(toJS(item, String(i++), ctx));
    return seq2;
  }
  toString(ctx, onComment, onChompKeep) {
    if (!ctx)
      return JSON.stringify(this);
    return stringifyCollection(this, ctx, {
      blockItemPrefix: "- ",
      flowChars: { start: "[", end: "]" },
      itemIndent: (ctx.indent || "") + "  ",
      onChompKeep,
      onComment
    });
  }
  static from(schema4, obj, ctx) {
    const { replacer } = ctx;
    const seq2 = new this(schema4);
    if (obj && Symbol.iterator in Object(obj)) {
      let i = 0;
      for (let it of obj) {
        if (typeof replacer === "function") {
          const key = obj instanceof Set ? it : String(i++);
          it = replacer.call(obj, key, it);
        }
        seq2.items.push(createNode(it, void 0, ctx));
      }
    }
    return seq2;
  }
};
function asItemIndex(key) {
  let idx = isScalar(key) ? key.value : key;
  if (idx && typeof idx === "string")
    idx = Number(idx);
  return typeof idx === "number" && Number.isInteger(idx) && idx >= 0 ? idx : null;
}

// node_modules/yaml/browser/dist/schema/common/seq.js
var seq = {
  collection: "seq",
  default: true,
  nodeClass: YAMLSeq,
  tag: "tag:yaml.org,2002:seq",
  resolve(seq2, onError) {
    if (!isSeq(seq2))
      onError("Expected a sequence for this tag");
    return seq2;
  },
  createNode: (schema4, obj, ctx) => YAMLSeq.from(schema4, obj, ctx)
};

// node_modules/yaml/browser/dist/schema/common/string.js
var string = {
  identify: (value) => typeof value === "string",
  default: true,
  tag: "tag:yaml.org,2002:str",
  resolve: (str) => str,
  stringify(item, ctx, onComment, onChompKeep) {
    ctx = Object.assign({ actualString: true }, ctx);
    return stringifyString(item, ctx, onComment, onChompKeep);
  }
};

// node_modules/yaml/browser/dist/schema/common/null.js
var nullTag = {
  identify: (value) => value == null,
  createNode: () => new Scalar(null),
  default: true,
  tag: "tag:yaml.org,2002:null",
  test: /^(?:~|[Nn]ull|NULL)?$/,
  resolve: () => new Scalar(null),
  stringify: ({ source }, ctx) => typeof source === "string" && nullTag.test.test(source) ? source : ctx.options.nullStr
};

// node_modules/yaml/browser/dist/schema/core/bool.js
var boolTag = {
  identify: (value) => typeof value === "boolean",
  default: true,
  tag: "tag:yaml.org,2002:bool",
  test: /^(?:[Tt]rue|TRUE|[Ff]alse|FALSE)$/,
  resolve: (str) => new Scalar(str[0] === "t" || str[0] === "T"),
  stringify({ source, value }, ctx) {
    if (source && boolTag.test.test(source)) {
      const sv = source[0] === "t" || source[0] === "T";
      if (value === sv)
        return source;
    }
    return value ? ctx.options.trueStr : ctx.options.falseStr;
  }
};

// node_modules/yaml/browser/dist/stringify/stringifyNumber.js
function stringifyNumber({ format, minFractionDigits, tag, value }) {
  if (typeof value === "bigint")
    return String(value);
  const num = typeof value === "number" ? value : Number(value);
  if (!isFinite(num))
    return isNaN(num) ? ".nan" : num < 0 ? "-.inf" : ".inf";
  let n = Object.is(value, -0) ? "-0" : JSON.stringify(value);
  if (!format && minFractionDigits && (!tag || tag === "tag:yaml.org,2002:float") && /^-?\d/.test(n) && !n.includes("e")) {
    let i = n.indexOf(".");
    if (i < 0) {
      i = n.length;
      n += ".";
    }
    let d = minFractionDigits - (n.length - i - 1);
    while (d-- > 0)
      n += "0";
  }
  return n;
}

// node_modules/yaml/browser/dist/schema/core/float.js
var floatNaN = {
  identify: (value) => typeof value === "number",
  default: true,
  tag: "tag:yaml.org,2002:float",
  test: /^(?:[-+]?\.(?:inf|Inf|INF)|\.nan|\.NaN|\.NAN)$/,
  resolve: (str) => str.slice(-3).toLowerCase() === "nan" ? NaN : str[0] === "-" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
  stringify: stringifyNumber
};
var floatExp = {
  identify: (value) => typeof value === "number",
  default: true,
  tag: "tag:yaml.org,2002:float",
  format: "EXP",
  test: /^[-+]?(?:\.[0-9]+|[0-9]+(?:\.[0-9]*)?)[eE][-+]?[0-9]+$/,
  resolve: (str) => parseFloat(str),
  stringify(node) {
    const num = Number(node.value);
    return isFinite(num) ? num.toExponential() : stringifyNumber(node);
  }
};
var float = {
  identify: (value) => typeof value === "number",
  default: true,
  tag: "tag:yaml.org,2002:float",
  test: /^[-+]?(?:\.[0-9]+|[0-9]+\.[0-9]*)$/,
  resolve(str) {
    const node = new Scalar(parseFloat(str));
    const dot = str.indexOf(".");
    if (dot !== -1 && str[str.length - 1] === "0")
      node.minFractionDigits = str.length - dot - 1;
    return node;
  },
  stringify: stringifyNumber
};

// node_modules/yaml/browser/dist/schema/core/int.js
var intIdentify = (value) => typeof value === "bigint" || Number.isInteger(value);
var intResolve = (str, offset, radix, { intAsBigInt }) => intAsBigInt ? BigInt(str) : parseInt(str.substring(offset), radix);
function intStringify(node, radix, prefix) {
  const { value } = node;
  if (intIdentify(value) && value >= 0)
    return prefix + value.toString(radix);
  return stringifyNumber(node);
}
var intOct = {
  identify: (value) => intIdentify(value) && value >= 0,
  default: true,
  tag: "tag:yaml.org,2002:int",
  format: "OCT",
  test: /^0o[0-7]+$/,
  resolve: (str, _onError, opt) => intResolve(str, 2, 8, opt),
  stringify: (node) => intStringify(node, 8, "0o")
};
var int = {
  identify: intIdentify,
  default: true,
  tag: "tag:yaml.org,2002:int",
  test: /^[-+]?[0-9]+$/,
  resolve: (str, _onError, opt) => intResolve(str, 0, 10, opt),
  stringify: stringifyNumber
};
var intHex = {
  identify: (value) => intIdentify(value) && value >= 0,
  default: true,
  tag: "tag:yaml.org,2002:int",
  format: "HEX",
  test: /^0x[0-9a-fA-F]+$/,
  resolve: (str, _onError, opt) => intResolve(str, 2, 16, opt),
  stringify: (node) => intStringify(node, 16, "0x")
};

// node_modules/yaml/browser/dist/schema/core/schema.js
var schema = [
  map,
  seq,
  string,
  nullTag,
  boolTag,
  intOct,
  int,
  intHex,
  floatNaN,
  floatExp,
  float
];

// node_modules/yaml/browser/dist/schema/json/schema.js
function intIdentify2(value) {
  return typeof value === "bigint" || Number.isInteger(value);
}
var stringifyJSON = ({ value }) => JSON.stringify(value);
var jsonScalars = [
  {
    identify: (value) => typeof value === "string",
    default: true,
    tag: "tag:yaml.org,2002:str",
    resolve: (str) => str,
    stringify: stringifyJSON
  },
  {
    identify: (value) => value == null,
    createNode: () => new Scalar(null),
    default: true,
    tag: "tag:yaml.org,2002:null",
    test: /^null$/,
    resolve: () => null,
    stringify: stringifyJSON
  },
  {
    identify: (value) => typeof value === "boolean",
    default: true,
    tag: "tag:yaml.org,2002:bool",
    test: /^true$|^false$/,
    resolve: (str) => str === "true",
    stringify: stringifyJSON
  },
  {
    identify: intIdentify2,
    default: true,
    tag: "tag:yaml.org,2002:int",
    test: /^-?(?:0|[1-9][0-9]*)$/,
    resolve: (str, _onError, { intAsBigInt }) => intAsBigInt ? BigInt(str) : parseInt(str, 10),
    stringify: ({ value }) => intIdentify2(value) ? value.toString() : JSON.stringify(value)
  },
  {
    identify: (value) => typeof value === "number",
    default: true,
    tag: "tag:yaml.org,2002:float",
    test: /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]*)?(?:[eE][-+]?[0-9]+)?$/,
    resolve: (str) => parseFloat(str),
    stringify: stringifyJSON
  }
];
var jsonError = {
  default: true,
  tag: "",
  test: /^/,
  resolve(str, onError) {
    onError(`Unresolved plain scalar ${JSON.stringify(str)}`);
    return str;
  }
};
var schema2 = [map, seq].concat(jsonScalars, jsonError);

// node_modules/yaml/browser/dist/schema/yaml-1.1/binary.js
var binary = {
  identify: (value) => value instanceof Uint8Array,
  // Buffer inherits from Uint8Array
  default: false,
  tag: "tag:yaml.org,2002:binary",
  /**
   * Returns a Buffer in node and an Uint8Array in browsers
   *
   * To use the resulting buffer as an image, you'll want to do something like:
   *
   *   const blob = new Blob([buffer], { type: 'image/jpeg' })
   *   document.querySelector('#photo').src = URL.createObjectURL(blob)
   */
  resolve(src, onError) {
    if (typeof atob === "function") {
      const str = atob(src.replace(/[\n\r]/g, ""));
      const buffer = new Uint8Array(str.length);
      for (let i = 0; i < str.length; ++i)
        buffer[i] = str.charCodeAt(i);
      return buffer;
    } else {
      onError("This environment does not support reading binary tags; either Buffer or atob is required");
      return src;
    }
  },
  stringify({ comment, type, value }, ctx, onComment, onChompKeep) {
    if (!value)
      return "";
    const buf = value;
    let str;
    if (typeof btoa === "function") {
      let s = "";
      for (let i = 0; i < buf.length; ++i)
        s += String.fromCharCode(buf[i]);
      str = btoa(s);
    } else {
      throw new Error("This environment does not support writing binary tags; either Buffer or btoa is required");
    }
    type != null ? type : type = Scalar.BLOCK_LITERAL;
    if (type !== Scalar.QUOTE_DOUBLE) {
      const lineWidth = Math.max(ctx.options.lineWidth - ctx.indent.length, ctx.options.minContentWidth);
      const n = Math.ceil(str.length / lineWidth);
      const lines = new Array(n);
      for (let i = 0, o = 0; i < n; ++i, o += lineWidth) {
        lines[i] = str.substr(o, lineWidth);
      }
      str = lines.join(type === Scalar.BLOCK_LITERAL ? "\n" : " ");
    }
    return stringifyString({ comment, type, value: str }, ctx, onComment, onChompKeep);
  }
};

// node_modules/yaml/browser/dist/schema/yaml-1.1/pairs.js
function resolvePairs(seq2, onError) {
  var _a;
  if (isSeq(seq2)) {
    for (let i = 0; i < seq2.items.length; ++i) {
      let item = seq2.items[i];
      if (isPair(item))
        continue;
      else if (isMap(item)) {
        if (item.items.length > 1)
          onError("Each pair must have its own sequence indicator");
        const pair = item.items[0] || new Pair(new Scalar(null));
        if (item.commentBefore)
          pair.key.commentBefore = pair.key.commentBefore ? `${item.commentBefore}
${pair.key.commentBefore}` : item.commentBefore;
        if (item.comment) {
          const cn = (_a = pair.value) != null ? _a : pair.key;
          cn.comment = cn.comment ? `${item.comment}
${cn.comment}` : item.comment;
        }
        item = pair;
      }
      seq2.items[i] = isPair(item) ? item : new Pair(item);
    }
  } else
    onError("Expected a sequence for this tag");
  return seq2;
}
function createPairs(schema4, iterable, ctx) {
  const { replacer } = ctx;
  const pairs2 = new YAMLSeq(schema4);
  pairs2.tag = "tag:yaml.org,2002:pairs";
  let i = 0;
  if (iterable && Symbol.iterator in Object(iterable))
    for (let it of iterable) {
      if (typeof replacer === "function")
        it = replacer.call(iterable, String(i++), it);
      let key, value;
      if (Array.isArray(it)) {
        if (it.length === 2) {
          key = it[0];
          value = it[1];
        } else
          throw new TypeError(`Expected [key, value] tuple: ${it}`);
      } else if (it && it instanceof Object) {
        const keys = Object.keys(it);
        if (keys.length === 1) {
          key = keys[0];
          value = it[key];
        } else {
          throw new TypeError(`Expected tuple with one key, not ${keys.length} keys`);
        }
      } else {
        key = it;
      }
      pairs2.items.push(createPair(key, value, ctx));
    }
  return pairs2;
}
var pairs = {
  collection: "seq",
  default: false,
  tag: "tag:yaml.org,2002:pairs",
  resolve: resolvePairs,
  createNode: createPairs
};

// node_modules/yaml/browser/dist/schema/yaml-1.1/omap.js
var YAMLOMap = class _YAMLOMap extends YAMLSeq {
  constructor() {
    super();
    this.add = YAMLMap.prototype.add.bind(this);
    this.delete = YAMLMap.prototype.delete.bind(this);
    this.get = YAMLMap.prototype.get.bind(this);
    this.has = YAMLMap.prototype.has.bind(this);
    this.set = YAMLMap.prototype.set.bind(this);
    this.tag = _YAMLOMap.tag;
  }
  /**
   * If `ctx` is given, the return type is actually `Map<unknown, unknown>`,
   * but TypeScript won't allow widening the signature of a child method.
   */
  toJSON(_, ctx) {
    if (!ctx)
      return super.toJSON(_);
    const map2 = /* @__PURE__ */ new Map();
    if (ctx == null ? void 0 : ctx.onCreate)
      ctx.onCreate(map2);
    for (const pair of this.items) {
      let key, value;
      if (isPair(pair)) {
        key = toJS(pair.key, "", ctx);
        value = toJS(pair.value, key, ctx);
      } else {
        key = toJS(pair, "", ctx);
      }
      if (map2.has(key))
        throw new Error("Ordered maps must not include duplicate keys");
      map2.set(key, value);
    }
    return map2;
  }
  static from(schema4, iterable, ctx) {
    const pairs2 = createPairs(schema4, iterable, ctx);
    const omap2 = new this();
    omap2.items = pairs2.items;
    return omap2;
  }
};
YAMLOMap.tag = "tag:yaml.org,2002:omap";
var omap = {
  collection: "seq",
  identify: (value) => value instanceof Map,
  nodeClass: YAMLOMap,
  default: false,
  tag: "tag:yaml.org,2002:omap",
  resolve(seq2, onError) {
    const pairs2 = resolvePairs(seq2, onError);
    const seenKeys = [];
    for (const { key } of pairs2.items) {
      if (isScalar(key)) {
        if (seenKeys.includes(key.value)) {
          onError(`Ordered maps must not include duplicate keys: ${key.value}`);
        } else {
          seenKeys.push(key.value);
        }
      }
    }
    return Object.assign(new YAMLOMap(), pairs2);
  },
  createNode: (schema4, iterable, ctx) => YAMLOMap.from(schema4, iterable, ctx)
};

// node_modules/yaml/browser/dist/schema/yaml-1.1/bool.js
function boolStringify({ value, source }, ctx) {
  const boolObj = value ? trueTag : falseTag;
  if (source && boolObj.test.test(source))
    return source;
  return value ? ctx.options.trueStr : ctx.options.falseStr;
}
var trueTag = {
  identify: (value) => value === true,
  default: true,
  tag: "tag:yaml.org,2002:bool",
  test: /^(?:Y|y|[Yy]es|YES|[Tt]rue|TRUE|[Oo]n|ON)$/,
  resolve: () => new Scalar(true),
  stringify: boolStringify
};
var falseTag = {
  identify: (value) => value === false,
  default: true,
  tag: "tag:yaml.org,2002:bool",
  test: /^(?:N|n|[Nn]o|NO|[Ff]alse|FALSE|[Oo]ff|OFF)$/,
  resolve: () => new Scalar(false),
  stringify: boolStringify
};

// node_modules/yaml/browser/dist/schema/yaml-1.1/float.js
var floatNaN2 = {
  identify: (value) => typeof value === "number",
  default: true,
  tag: "tag:yaml.org,2002:float",
  test: /^(?:[-+]?\.(?:inf|Inf|INF)|\.nan|\.NaN|\.NAN)$/,
  resolve: (str) => str.slice(-3).toLowerCase() === "nan" ? NaN : str[0] === "-" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
  stringify: stringifyNumber
};
var floatExp2 = {
  identify: (value) => typeof value === "number",
  default: true,
  tag: "tag:yaml.org,2002:float",
  format: "EXP",
  test: /^[-+]?(?:[0-9][0-9_]*)?(?:\.[0-9_]*)?[eE][-+]?[0-9]+$/,
  resolve: (str) => parseFloat(str.replace(/_/g, "")),
  stringify(node) {
    const num = Number(node.value);
    return isFinite(num) ? num.toExponential() : stringifyNumber(node);
  }
};
var float2 = {
  identify: (value) => typeof value === "number",
  default: true,
  tag: "tag:yaml.org,2002:float",
  test: /^[-+]?(?:[0-9][0-9_]*)?\.[0-9_]*$/,
  resolve(str) {
    const node = new Scalar(parseFloat(str.replace(/_/g, "")));
    const dot = str.indexOf(".");
    if (dot !== -1) {
      const f = str.substring(dot + 1).replace(/_/g, "");
      if (f[f.length - 1] === "0")
        node.minFractionDigits = f.length;
    }
    return node;
  },
  stringify: stringifyNumber
};

// node_modules/yaml/browser/dist/schema/yaml-1.1/int.js
var intIdentify3 = (value) => typeof value === "bigint" || Number.isInteger(value);
function intResolve2(str, offset, radix, { intAsBigInt }) {
  const sign = str[0];
  if (sign === "-" || sign === "+")
    offset += 1;
  str = str.substring(offset).replace(/_/g, "");
  if (intAsBigInt) {
    switch (radix) {
      case 2:
        str = `0b${str}`;
        break;
      case 8:
        str = `0o${str}`;
        break;
      case 16:
        str = `0x${str}`;
        break;
    }
    const n2 = BigInt(str);
    return sign === "-" ? BigInt(-1) * n2 : n2;
  }
  const n = parseInt(str, radix);
  return sign === "-" ? -1 * n : n;
}
function intStringify2(node, radix, prefix) {
  const { value } = node;
  if (intIdentify3(value)) {
    const str = value.toString(radix);
    return value < 0 ? "-" + prefix + str.substr(1) : prefix + str;
  }
  return stringifyNumber(node);
}
var intBin = {
  identify: intIdentify3,
  default: true,
  tag: "tag:yaml.org,2002:int",
  format: "BIN",
  test: /^[-+]?0b[0-1_]+$/,
  resolve: (str, _onError, opt) => intResolve2(str, 2, 2, opt),
  stringify: (node) => intStringify2(node, 2, "0b")
};
var intOct2 = {
  identify: intIdentify3,
  default: true,
  tag: "tag:yaml.org,2002:int",
  format: "OCT",
  test: /^[-+]?0[0-7_]+$/,
  resolve: (str, _onError, opt) => intResolve2(str, 1, 8, opt),
  stringify: (node) => intStringify2(node, 8, "0")
};
var int2 = {
  identify: intIdentify3,
  default: true,
  tag: "tag:yaml.org,2002:int",
  test: /^[-+]?[0-9][0-9_]*$/,
  resolve: (str, _onError, opt) => intResolve2(str, 0, 10, opt),
  stringify: stringifyNumber
};
var intHex2 = {
  identify: intIdentify3,
  default: true,
  tag: "tag:yaml.org,2002:int",
  format: "HEX",
  test: /^[-+]?0x[0-9a-fA-F_]+$/,
  resolve: (str, _onError, opt) => intResolve2(str, 2, 16, opt),
  stringify: (node) => intStringify2(node, 16, "0x")
};

// node_modules/yaml/browser/dist/schema/yaml-1.1/set.js
var YAMLSet = class _YAMLSet extends YAMLMap {
  constructor(schema4) {
    super(schema4);
    this.tag = _YAMLSet.tag;
  }
  add(key) {
    let pair;
    if (isPair(key))
      pair = key;
    else if (key && typeof key === "object" && "key" in key && "value" in key && key.value === null)
      pair = new Pair(key.key, null);
    else
      pair = new Pair(key, null);
    const prev = findPair(this.items, pair.key);
    if (!prev)
      this.items.push(pair);
  }
  /**
   * If `keepPair` is `true`, returns the Pair matching `key`.
   * Otherwise, returns the value of that Pair's key.
   */
  get(key, keepPair) {
    const pair = findPair(this.items, key);
    return !keepPair && isPair(pair) ? isScalar(pair.key) ? pair.key.value : pair.key : pair;
  }
  set(key, value) {
    if (typeof value !== "boolean")
      throw new Error(`Expected boolean value for set(key, value) in a YAML set, not ${typeof value}`);
    const prev = findPair(this.items, key);
    if (prev && !value) {
      this.items.splice(this.items.indexOf(prev), 1);
    } else if (!prev && value) {
      this.items.push(new Pair(key));
    }
  }
  toJSON(_, ctx) {
    return super.toJSON(_, ctx, Set);
  }
  toString(ctx, onComment, onChompKeep) {
    if (!ctx)
      return JSON.stringify(this);
    if (this.hasAllNullValues(true))
      return super.toString(Object.assign({}, ctx, { allNullValues: true }), onComment, onChompKeep);
    else
      throw new Error("Set items must all have null values");
  }
  static from(schema4, iterable, ctx) {
    const { replacer } = ctx;
    const set2 = new this(schema4);
    if (iterable && Symbol.iterator in Object(iterable))
      for (let value of iterable) {
        if (typeof replacer === "function")
          value = replacer.call(iterable, value, value);
        set2.items.push(createPair(value, null, ctx));
      }
    return set2;
  }
};
YAMLSet.tag = "tag:yaml.org,2002:set";
var set = {
  collection: "map",
  identify: (value) => value instanceof Set,
  nodeClass: YAMLSet,
  default: false,
  tag: "tag:yaml.org,2002:set",
  createNode: (schema4, iterable, ctx) => YAMLSet.from(schema4, iterable, ctx),
  resolve(map2, onError) {
    if (isMap(map2)) {
      if (map2.hasAllNullValues(true))
        return Object.assign(new YAMLSet(), map2);
      else
        onError("Set items must all have null values");
    } else
      onError("Expected a mapping for this tag");
    return map2;
  }
};

// node_modules/yaml/browser/dist/schema/yaml-1.1/timestamp.js
function parseSexagesimal(str, asBigInt) {
  const sign = str[0];
  const parts = sign === "-" || sign === "+" ? str.substring(1) : str;
  const num = (n) => asBigInt ? BigInt(n) : Number(n);
  const res = parts.replace(/_/g, "").split(":").reduce((res2, p) => res2 * num(60) + num(p), num(0));
  return sign === "-" ? num(-1) * res : res;
}
function stringifySexagesimal(node) {
  let { value } = node;
  let num = (n) => n;
  if (typeof value === "bigint")
    num = (n) => BigInt(n);
  else if (isNaN(value) || !isFinite(value))
    return stringifyNumber(node);
  let sign = "";
  if (value < 0) {
    sign = "-";
    value *= num(-1);
  }
  const _60 = num(60);
  const parts = [value % _60];
  if (value < 60) {
    parts.unshift(0);
  } else {
    value = (value - parts[0]) / _60;
    parts.unshift(value % _60);
    if (value >= 60) {
      value = (value - parts[0]) / _60;
      parts.unshift(value);
    }
  }
  return sign + parts.map((n) => String(n).padStart(2, "0")).join(":").replace(/000000\d*$/, "");
}
var intTime = {
  identify: (value) => typeof value === "bigint" || Number.isInteger(value),
  default: true,
  tag: "tag:yaml.org,2002:int",
  format: "TIME",
  test: /^[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+$/,
  resolve: (str, _onError, { intAsBigInt }) => parseSexagesimal(str, intAsBigInt),
  stringify: stringifySexagesimal
};
var floatTime = {
  identify: (value) => typeof value === "number",
  default: true,
  tag: "tag:yaml.org,2002:float",
  format: "TIME",
  test: /^[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+\.[0-9_]*$/,
  resolve: (str) => parseSexagesimal(str, false),
  stringify: stringifySexagesimal
};
var timestamp = {
  identify: (value) => value instanceof Date,
  default: true,
  tag: "tag:yaml.org,2002:timestamp",
  // If the time zone is omitted, the timestamp is assumed to be specified in UTC. The time part
  // may be omitted altogether, resulting in a date format. In such a case, the time part is
  // assumed to be 00:00:00Z (start of day, UTC).
  test: RegExp("^([0-9]{4})-([0-9]{1,2})-([0-9]{1,2})(?:(?:t|T|[ \\t]+)([0-9]{1,2}):([0-9]{1,2}):([0-9]{1,2}(\\.[0-9]+)?)(?:[ \\t]*(Z|[-+][012]?[0-9](?::[0-9]{2})?))?)?$"),
  resolve(str) {
    const match = str.match(timestamp.test);
    if (!match)
      throw new Error("!!timestamp expects a date, starting with yyyy-mm-dd");
    const [, year, month, day, hour, minute, second] = match.map(Number);
    const millisec = match[7] ? Number((match[7] + "00").substr(1, 3)) : 0;
    let date = Date.UTC(year, month - 1, day, hour || 0, minute || 0, second || 0, millisec);
    const tz = match[8];
    if (tz && tz !== "Z") {
      let d = parseSexagesimal(tz, false);
      if (Math.abs(d) < 30)
        d *= 60;
      date -= 6e4 * d;
    }
    return new Date(date);
  },
  stringify: ({ value }) => {
    var _a;
    return (_a = value == null ? void 0 : value.toISOString().replace(/(T00:00:00)?\.000Z$/, "")) != null ? _a : "";
  }
};

// node_modules/yaml/browser/dist/schema/yaml-1.1/schema.js
var schema3 = [
  map,
  seq,
  string,
  nullTag,
  trueTag,
  falseTag,
  intBin,
  intOct2,
  int2,
  intHex2,
  floatNaN2,
  floatExp2,
  float2,
  binary,
  merge,
  omap,
  pairs,
  set,
  intTime,
  floatTime,
  timestamp
];

// node_modules/yaml/browser/dist/schema/tags.js
var schemas = /* @__PURE__ */ new Map([
  ["core", schema],
  ["failsafe", [map, seq, string]],
  ["json", schema2],
  ["yaml11", schema3],
  ["yaml-1.1", schema3]
]);
var tagsByName = {
  binary,
  bool: boolTag,
  float,
  floatExp,
  floatNaN,
  floatTime,
  int,
  intHex,
  intOct,
  intTime,
  map,
  merge,
  null: nullTag,
  omap,
  pairs,
  seq,
  set,
  timestamp
};
var coreKnownTags = {
  "tag:yaml.org,2002:binary": binary,
  "tag:yaml.org,2002:merge": merge,
  "tag:yaml.org,2002:omap": omap,
  "tag:yaml.org,2002:pairs": pairs,
  "tag:yaml.org,2002:set": set,
  "tag:yaml.org,2002:timestamp": timestamp
};
function getTags(customTags, schemaName, addMergeTag) {
  const schemaTags = schemas.get(schemaName);
  if (schemaTags && !customTags) {
    return addMergeTag && !schemaTags.includes(merge) ? schemaTags.concat(merge) : schemaTags.slice();
  }
  let tags = schemaTags;
  if (!tags) {
    if (Array.isArray(customTags))
      tags = [];
    else {
      const keys = Array.from(schemas.keys()).filter((key) => key !== "yaml11").map((key) => JSON.stringify(key)).join(", ");
      throw new Error(`Unknown schema "${schemaName}"; use one of ${keys} or define customTags array`);
    }
  }
  if (Array.isArray(customTags)) {
    for (const tag of customTags)
      tags = tags.concat(tag);
  } else if (typeof customTags === "function") {
    tags = customTags(tags.slice());
  }
  if (addMergeTag)
    tags = tags.concat(merge);
  return tags.reduce((tags2, tag) => {
    const tagObj = typeof tag === "string" ? tagsByName[tag] : tag;
    if (!tagObj) {
      const tagName = JSON.stringify(tag);
      const keys = Object.keys(tagsByName).map((key) => JSON.stringify(key)).join(", ");
      throw new Error(`Unknown custom tag ${tagName}; use one of ${keys}`);
    }
    if (!tags2.includes(tagObj))
      tags2.push(tagObj);
    return tags2;
  }, []);
}

// node_modules/yaml/browser/dist/schema/Schema.js
var sortMapEntriesByKey = (a, b) => a.key < b.key ? -1 : a.key > b.key ? 1 : 0;
var Schema = class _Schema {
  constructor({ compat, customTags, merge: merge2, resolveKnownTags, schema: schema4, sortMapEntries, toStringDefaults }) {
    this.compat = Array.isArray(compat) ? getTags(compat, "compat") : compat ? getTags(null, compat) : null;
    this.name = typeof schema4 === "string" && schema4 || "core";
    this.knownTags = resolveKnownTags ? coreKnownTags : {};
    this.tags = getTags(customTags, this.name, merge2);
    this.toStringOptions = toStringDefaults != null ? toStringDefaults : null;
    Object.defineProperty(this, MAP, { value: map });
    Object.defineProperty(this, SCALAR, { value: string });
    Object.defineProperty(this, SEQ, { value: seq });
    this.sortMapEntries = typeof sortMapEntries === "function" ? sortMapEntries : sortMapEntries === true ? sortMapEntriesByKey : null;
  }
  clone() {
    const copy = Object.create(_Schema.prototype, Object.getOwnPropertyDescriptors(this));
    copy.tags = this.tags.slice();
    return copy;
  }
};

// node_modules/yaml/browser/dist/stringify/stringifyDocument.js
function stringifyDocument(doc, options) {
  var _a;
  const lines = [];
  let hasDirectives = options.directives === true;
  if (options.directives !== false && doc.directives) {
    const dir = doc.directives.toString(doc);
    if (dir) {
      lines.push(dir);
      hasDirectives = true;
    } else if (doc.directives.docStart)
      hasDirectives = true;
  }
  if (hasDirectives)
    lines.push("---");
  const ctx = createStringifyContext(doc, options);
  const { commentString } = ctx.options;
  if (doc.commentBefore) {
    if (lines.length !== 1)
      lines.unshift("");
    const cs = commentString(doc.commentBefore);
    lines.unshift(indentComment(cs, ""));
  }
  let chompKeep = false;
  let contentComment = null;
  if (doc.contents) {
    if (isNode(doc.contents)) {
      if (doc.contents.spaceBefore && hasDirectives)
        lines.push("");
      if (doc.contents.commentBefore) {
        const cs = commentString(doc.contents.commentBefore);
        lines.push(indentComment(cs, ""));
      }
      ctx.forceBlockIndent = !!doc.comment;
      contentComment = doc.contents.comment;
    }
    const onChompKeep = contentComment ? void 0 : () => chompKeep = true;
    let body = stringify(doc.contents, ctx, () => contentComment = null, onChompKeep);
    if (contentComment)
      body += lineComment(body, "", commentString(contentComment));
    if ((body[0] === "|" || body[0] === ">") && lines[lines.length - 1] === "---") {
      lines[lines.length - 1] = `--- ${body}`;
    } else
      lines.push(body);
  } else {
    lines.push(stringify(doc.contents, ctx));
  }
  if ((_a = doc.directives) == null ? void 0 : _a.docEnd) {
    if (doc.comment) {
      const cs = commentString(doc.comment);
      if (cs.includes("\n")) {
        lines.push("...");
        lines.push(indentComment(cs, ""));
      } else {
        lines.push(`... ${cs}`);
      }
    } else {
      lines.push("...");
    }
  } else {
    let dc = doc.comment;
    if (dc && chompKeep)
      dc = dc.replace(/^\n+/, "");
    if (dc) {
      if ((!chompKeep || contentComment) && lines[lines.length - 1] !== "")
        lines.push("");
      lines.push(indentComment(commentString(dc), ""));
    }
  }
  return lines.join("\n") + "\n";
}

// node_modules/yaml/browser/dist/doc/Document.js
var Document = class _Document {
  constructor(value, replacer, options) {
    this.commentBefore = null;
    this.comment = null;
    this.errors = [];
    this.warnings = [];
    Object.defineProperty(this, NODE_TYPE, { value: DOC });
    let _replacer = null;
    if (typeof replacer === "function" || Array.isArray(replacer)) {
      _replacer = replacer;
    } else if (options === void 0 && replacer) {
      options = replacer;
      replacer = void 0;
    }
    const opt = Object.assign({
      intAsBigInt: false,
      keepSourceTokens: false,
      logLevel: "warn",
      prettyErrors: true,
      strict: true,
      stringKeys: false,
      uniqueKeys: true,
      version: "1.2"
    }, options);
    this.options = opt;
    let { version } = opt;
    if (options == null ? void 0 : options._directives) {
      this.directives = options._directives.atDocument();
      if (this.directives.yaml.explicit)
        version = this.directives.yaml.version;
    } else
      this.directives = new Directives({ version });
    this.setSchema(version, options);
    this.contents = value === void 0 ? null : this.createNode(value, _replacer, options);
  }
  /**
   * Create a deep copy of this Document and its contents.
   *
   * Custom Node values that inherit from `Object` still refer to their original instances.
   */
  clone() {
    const copy = Object.create(_Document.prototype, {
      [NODE_TYPE]: { value: DOC }
    });
    copy.commentBefore = this.commentBefore;
    copy.comment = this.comment;
    copy.errors = this.errors.slice();
    copy.warnings = this.warnings.slice();
    copy.options = Object.assign({}, this.options);
    if (this.directives)
      copy.directives = this.directives.clone();
    copy.schema = this.schema.clone();
    copy.contents = isNode(this.contents) ? this.contents.clone(copy.schema) : this.contents;
    if (this.range)
      copy.range = this.range.slice();
    return copy;
  }
  /** Adds a value to the document. */
  add(value) {
    if (assertCollection(this.contents))
      this.contents.add(value);
  }
  /** Adds a value to the document. */
  addIn(path, value) {
    if (assertCollection(this.contents))
      this.contents.addIn(path, value);
  }
  /**
   * Create a new `Alias` node, ensuring that the target `node` has the required anchor.
   *
   * If `node` already has an anchor, `name` is ignored.
   * Otherwise, the `node.anchor` value will be set to `name`,
   * or if an anchor with that name is already present in the document,
   * `name` will be used as a prefix for a new unique anchor.
   * If `name` is undefined, the generated anchor will use 'a' as a prefix.
   */
  createAlias(node, name) {
    if (!node.anchor) {
      const prev = anchorNames(this);
      node.anchor = // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      !name || prev.has(name) ? findNewAnchor(name || "a", prev) : name;
    }
    return new Alias(node.anchor);
  }
  createNode(value, replacer, options) {
    let _replacer = void 0;
    if (typeof replacer === "function") {
      value = replacer.call({ "": value }, "", value);
      _replacer = replacer;
    } else if (Array.isArray(replacer)) {
      const keyToStr = (v) => typeof v === "number" || v instanceof String || v instanceof Number;
      const asStr = replacer.filter(keyToStr).map(String);
      if (asStr.length > 0)
        replacer = replacer.concat(asStr);
      _replacer = replacer;
    } else if (options === void 0 && replacer) {
      options = replacer;
      replacer = void 0;
    }
    const { aliasDuplicateObjects, anchorPrefix, flow, keepUndefined, onTagObj, tag } = options != null ? options : {};
    const { onAnchor, setAnchors, sourceObjects } = createNodeAnchors(
      this,
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      anchorPrefix || "a"
    );
    const ctx = {
      aliasDuplicateObjects: aliasDuplicateObjects != null ? aliasDuplicateObjects : true,
      keepUndefined: keepUndefined != null ? keepUndefined : false,
      onAnchor,
      onTagObj,
      replacer: _replacer,
      schema: this.schema,
      sourceObjects
    };
    const node = createNode(value, tag, ctx);
    if (flow && isCollection(node))
      node.flow = true;
    setAnchors();
    return node;
  }
  /**
   * Convert a key and a value into a `Pair` using the current schema,
   * recursively wrapping all values as `Scalar` or `Collection` nodes.
   */
  createPair(key, value, options = {}) {
    const k = this.createNode(key, null, options);
    const v = this.createNode(value, null, options);
    return new Pair(k, v);
  }
  /**
   * Removes a value from the document.
   * @returns `true` if the item was found and removed.
   */
  delete(key) {
    return assertCollection(this.contents) ? this.contents.delete(key) : false;
  }
  /**
   * Removes a value from the document.
   * @returns `true` if the item was found and removed.
   */
  deleteIn(path) {
    if (isEmptyPath(path)) {
      if (this.contents == null)
        return false;
      this.contents = null;
      return true;
    }
    return assertCollection(this.contents) ? this.contents.deleteIn(path) : false;
  }
  /**
   * Returns item at `key`, or `undefined` if not found. By default unwraps
   * scalar values from their surrounding node; to disable set `keepScalar` to
   * `true` (collections are always returned intact).
   */
  get(key, keepScalar) {
    return isCollection(this.contents) ? this.contents.get(key, keepScalar) : void 0;
  }
  /**
   * Returns item at `path`, or `undefined` if not found. By default unwraps
   * scalar values from their surrounding node; to disable set `keepScalar` to
   * `true` (collections are always returned intact).
   */
  getIn(path, keepScalar) {
    if (isEmptyPath(path))
      return !keepScalar && isScalar(this.contents) ? this.contents.value : this.contents;
    return isCollection(this.contents) ? this.contents.getIn(path, keepScalar) : void 0;
  }
  /**
   * Checks if the document includes a value with the key `key`.
   */
  has(key) {
    return isCollection(this.contents) ? this.contents.has(key) : false;
  }
  /**
   * Checks if the document includes a value at `path`.
   */
  hasIn(path) {
    if (isEmptyPath(path))
      return this.contents !== void 0;
    return isCollection(this.contents) ? this.contents.hasIn(path) : false;
  }
  /**
   * Sets a value in this document. For `!!set`, `value` needs to be a
   * boolean to add/remove the item from the set.
   */
  set(key, value) {
    if (this.contents == null) {
      this.contents = collectionFromPath(this.schema, [key], value);
    } else if (assertCollection(this.contents)) {
      this.contents.set(key, value);
    }
  }
  /**
   * Sets a value in this document. For `!!set`, `value` needs to be a
   * boolean to add/remove the item from the set.
   */
  setIn(path, value) {
    if (isEmptyPath(path)) {
      this.contents = value;
    } else if (this.contents == null) {
      this.contents = collectionFromPath(this.schema, Array.from(path), value);
    } else if (assertCollection(this.contents)) {
      this.contents.setIn(path, value);
    }
  }
  /**
   * Change the YAML version and schema used by the document.
   * A `null` version disables support for directives, explicit tags, anchors, and aliases.
   * It also requires the `schema` option to be given as a `Schema` instance value.
   *
   * Overrides all previously set schema options.
   */
  setSchema(version, options = {}) {
    if (typeof version === "number")
      version = String(version);
    let opt;
    switch (version) {
      case "1.1":
        if (this.directives)
          this.directives.yaml.version = "1.1";
        else
          this.directives = new Directives({ version: "1.1" });
        opt = { resolveKnownTags: false, schema: "yaml-1.1" };
        break;
      case "1.2":
      case "next":
        if (this.directives)
          this.directives.yaml.version = version;
        else
          this.directives = new Directives({ version });
        opt = { resolveKnownTags: true, schema: "core" };
        break;
      case null:
        if (this.directives)
          delete this.directives;
        opt = null;
        break;
      default: {
        const sv = JSON.stringify(version);
        throw new Error(`Expected '1.1', '1.2' or null as first argument, but found: ${sv}`);
      }
    }
    if (options.schema instanceof Object)
      this.schema = options.schema;
    else if (opt)
      this.schema = new Schema(Object.assign(opt, options));
    else
      throw new Error(`With a null YAML version, the { schema: Schema } option is required`);
  }
  // json & jsonArg are only used from toJSON()
  toJS({ json, jsonArg, mapAsMap, maxAliasCount, onAnchor, reviver } = {}) {
    const ctx = {
      anchors: /* @__PURE__ */ new Map(),
      doc: this,
      keep: !json,
      mapAsMap: mapAsMap === true,
      mapKeyWarned: false,
      maxAliasCount: typeof maxAliasCount === "number" ? maxAliasCount : 100
    };
    const res = toJS(this.contents, jsonArg != null ? jsonArg : "", ctx);
    if (typeof onAnchor === "function")
      for (const { count, res: res2 } of ctx.anchors.values())
        onAnchor(res2, count);
    return typeof reviver === "function" ? applyReviver(reviver, { "": res }, "", res) : res;
  }
  /**
   * A JSON representation of the document `contents`.
   *
   * @param jsonArg Used by `JSON.stringify` to indicate the array index or
   *   property name.
   */
  toJSON(jsonArg, onAnchor) {
    return this.toJS({ json: true, jsonArg, mapAsMap: false, onAnchor });
  }
  /** A YAML representation of the document. */
  toString(options = {}) {
    if (this.errors.length > 0)
      throw new Error("Document with errors cannot be stringified");
    if ("indent" in options && (!Number.isInteger(options.indent) || Number(options.indent) <= 0)) {
      const s = JSON.stringify(options.indent);
      throw new Error(`"indent" option must be a positive integer, not ${s}`);
    }
    return stringifyDocument(this, options);
  }
};
function assertCollection(contents) {
  if (isCollection(contents))
    return true;
  throw new Error("Expected a YAML collection as document contents");
}

// node_modules/yaml/browser/dist/errors.js
var YAMLError = class extends Error {
  constructor(name, pos, code, message) {
    super();
    this.name = name;
    this.code = code;
    this.message = message;
    this.pos = pos;
  }
};
var YAMLParseError = class extends YAMLError {
  constructor(pos, code, message) {
    super("YAMLParseError", pos, code, message);
  }
};
var YAMLWarning = class extends YAMLError {
  constructor(pos, code, message) {
    super("YAMLWarning", pos, code, message);
  }
};
var prettifyError = (src, lc) => (error) => {
  if (error.pos[0] === -1)
    return;
  error.linePos = error.pos.map((pos) => lc.linePos(pos));
  const { line, col } = error.linePos[0];
  error.message += ` at line ${line}, column ${col}`;
  let ci = col - 1;
  let lineStr = src.substring(lc.lineStarts[line - 1], lc.lineStarts[line]).replace(/[\n\r]+$/, "");
  if (ci >= 60 && lineStr.length > 80) {
    const trimStart = Math.min(ci - 39, lineStr.length - 79);
    lineStr = "…" + lineStr.substring(trimStart);
    ci -= trimStart - 1;
  }
  if (lineStr.length > 80)
    lineStr = lineStr.substring(0, 79) + "…";
  if (line > 1 && /^ *$/.test(lineStr.substring(0, ci))) {
    let prev = src.substring(lc.lineStarts[line - 2], lc.lineStarts[line - 1]);
    if (prev.length > 80)
      prev = prev.substring(0, 79) + "…\n";
    lineStr = prev + lineStr;
  }
  if (/[^ ]/.test(lineStr)) {
    let count = 1;
    const end = error.linePos[1];
    if ((end == null ? void 0 : end.line) === line && end.col > col) {
      count = Math.max(1, Math.min(end.col - col, 80 - ci));
    }
    const pointer = " ".repeat(ci) + "^".repeat(count);
    error.message += `:

${lineStr}
${pointer}
`;
  }
};

// node_modules/yaml/browser/dist/compose/resolve-props.js
function resolveProps(tokens, { flow, indicator, next, offset, onError, parentIndent, startOnNewline }) {
  let spaceBefore = false;
  let atNewline = startOnNewline;
  let hasSpace = startOnNewline;
  let comment = "";
  let commentSep = "";
  let hasNewline = false;
  let reqSpace = false;
  let tab = null;
  let anchor = null;
  let tag = null;
  let newlineAfterProp = null;
  let comma = null;
  let found = null;
  let start = null;
  for (const token of tokens) {
    if (reqSpace) {
      if (token.type !== "space" && token.type !== "newline" && token.type !== "comma")
        onError(token.offset, "MISSING_CHAR", "Tags and anchors must be separated from the next token by white space");
      reqSpace = false;
    }
    if (tab) {
      if (atNewline && token.type !== "comment" && token.type !== "newline") {
        onError(tab, "TAB_AS_INDENT", "Tabs are not allowed as indentation");
      }
      tab = null;
    }
    switch (token.type) {
      case "space":
        if (!flow && (indicator !== "doc-start" || (next == null ? void 0 : next.type) !== "flow-collection") && token.source.includes("	")) {
          tab = token;
        }
        hasSpace = true;
        break;
      case "comment": {
        if (!hasSpace)
          onError(token, "MISSING_CHAR", "Comments must be separated from other tokens by white space characters");
        const cb = token.source.substring(1) || " ";
        if (!comment)
          comment = cb;
        else
          comment += commentSep + cb;
        commentSep = "";
        atNewline = false;
        break;
      }
      case "newline":
        if (atNewline) {
          if (comment)
            comment += token.source;
          else if (!found || indicator !== "seq-item-ind")
            spaceBefore = true;
        } else
          commentSep += token.source;
        atNewline = true;
        hasNewline = true;
        if (anchor || tag)
          newlineAfterProp = token;
        hasSpace = true;
        break;
      case "anchor":
        if (anchor)
          onError(token, "MULTIPLE_ANCHORS", "A node can have at most one anchor");
        if (token.source.endsWith(":"))
          onError(token.offset + token.source.length - 1, "BAD_ALIAS", "Anchor ending in : is ambiguous", true);
        anchor = token;
        start != null ? start : start = token.offset;
        atNewline = false;
        hasSpace = false;
        reqSpace = true;
        break;
      case "tag": {
        if (tag)
          onError(token, "MULTIPLE_TAGS", "A node can have at most one tag");
        tag = token;
        start != null ? start : start = token.offset;
        atNewline = false;
        hasSpace = false;
        reqSpace = true;
        break;
      }
      case indicator:
        if (anchor || tag)
          onError(token, "BAD_PROP_ORDER", `Anchors and tags must be after the ${token.source} indicator`);
        if (found)
          onError(token, "UNEXPECTED_TOKEN", `Unexpected ${token.source} in ${flow != null ? flow : "collection"}`);
        found = token;
        atNewline = indicator === "seq-item-ind" || indicator === "explicit-key-ind";
        hasSpace = false;
        break;
      case "comma":
        if (flow) {
          if (comma)
            onError(token, "UNEXPECTED_TOKEN", `Unexpected , in ${flow}`);
          comma = token;
          atNewline = false;
          hasSpace = false;
          break;
        }
      // else fallthrough
      default:
        onError(token, "UNEXPECTED_TOKEN", `Unexpected ${token.type} token`);
        atNewline = false;
        hasSpace = false;
    }
  }
  const last = tokens[tokens.length - 1];
  const end = last ? last.offset + last.source.length : offset;
  if (reqSpace && next && next.type !== "space" && next.type !== "newline" && next.type !== "comma" && (next.type !== "scalar" || next.source !== "")) {
    onError(next.offset, "MISSING_CHAR", "Tags and anchors must be separated from the next token by white space");
  }
  if (tab && (atNewline && tab.indent <= parentIndent || (next == null ? void 0 : next.type) === "block-map" || (next == null ? void 0 : next.type) === "block-seq"))
    onError(tab, "TAB_AS_INDENT", "Tabs are not allowed as indentation");
  return {
    comma,
    found,
    spaceBefore,
    comment,
    hasNewline,
    anchor,
    tag,
    newlineAfterProp,
    end,
    start: start != null ? start : end
  };
}

// node_modules/yaml/browser/dist/compose/util-contains-newline.js
function containsNewline(key) {
  if (!key)
    return null;
  switch (key.type) {
    case "alias":
    case "scalar":
    case "double-quoted-scalar":
    case "single-quoted-scalar":
      if (key.source.includes("\n"))
        return true;
      if (key.end) {
        for (const st of key.end)
          if (st.type === "newline")
            return true;
      }
      return false;
    case "flow-collection":
      for (const it of key.items) {
        for (const st of it.start)
          if (st.type === "newline")
            return true;
        if (it.sep) {
          for (const st of it.sep)
            if (st.type === "newline")
              return true;
        }
        if (containsNewline(it.key) || containsNewline(it.value))
          return true;
      }
      return false;
    default:
      return true;
  }
}

// node_modules/yaml/browser/dist/compose/util-flow-indent-check.js
function flowIndentCheck(indent, fc, onError) {
  if ((fc == null ? void 0 : fc.type) === "flow-collection") {
    const end = fc.end[0];
    if (end.indent === indent && (end.source === "]" || end.source === "}") && containsNewline(fc)) {
      const msg = "Flow end indicator should be more indented than parent";
      onError(end, "BAD_INDENT", msg, true);
    }
  }
}

// node_modules/yaml/browser/dist/compose/util-map-includes.js
function mapIncludes(ctx, items, search) {
  const { uniqueKeys } = ctx.options;
  if (uniqueKeys === false)
    return false;
  const isEqual = typeof uniqueKeys === "function" ? uniqueKeys : (a, b) => a === b || isScalar(a) && isScalar(b) && a.value === b.value;
  return items.some((pair) => isEqual(pair.key, search));
}

// node_modules/yaml/browser/dist/compose/resolve-block-map.js
var startColMsg = "All mapping items must start at the same column";
function resolveBlockMap({ composeNode: composeNode2, composeEmptyNode: composeEmptyNode2 }, ctx, bm, onError, tag) {
  var _a, _b;
  const NodeClass = (_a = tag == null ? void 0 : tag.nodeClass) != null ? _a : YAMLMap;
  const map2 = new NodeClass(ctx.schema);
  if (ctx.atRoot)
    ctx.atRoot = false;
  let offset = bm.offset;
  let commentEnd = null;
  for (const collItem of bm.items) {
    const { start, key, sep, value } = collItem;
    const keyProps = resolveProps(start, {
      indicator: "explicit-key-ind",
      next: key != null ? key : sep == null ? void 0 : sep[0],
      offset,
      onError,
      parentIndent: bm.indent,
      startOnNewline: true
    });
    const implicitKey = !keyProps.found;
    if (implicitKey) {
      if (key) {
        if (key.type === "block-seq")
          onError(offset, "BLOCK_AS_IMPLICIT_KEY", "A block sequence may not be used as an implicit map key");
        else if ("indent" in key && key.indent !== bm.indent)
          onError(offset, "BAD_INDENT", startColMsg);
      }
      if (!keyProps.anchor && !keyProps.tag && !sep) {
        commentEnd = keyProps.end;
        if (keyProps.comment) {
          if (map2.comment)
            map2.comment += "\n" + keyProps.comment;
          else
            map2.comment = keyProps.comment;
        }
        continue;
      }
      if (keyProps.newlineAfterProp || containsNewline(key)) {
        onError(key != null ? key : start[start.length - 1], "MULTILINE_IMPLICIT_KEY", "Implicit keys need to be on a single line");
      }
    } else if (((_b = keyProps.found) == null ? void 0 : _b.indent) !== bm.indent) {
      onError(offset, "BAD_INDENT", startColMsg);
    }
    ctx.atKey = true;
    const keyStart = keyProps.end;
    const keyNode = key ? composeNode2(ctx, key, keyProps, onError) : composeEmptyNode2(ctx, keyStart, start, null, keyProps, onError);
    if (ctx.schema.compat)
      flowIndentCheck(bm.indent, key, onError);
    ctx.atKey = false;
    if (mapIncludes(ctx, map2.items, keyNode))
      onError(keyStart, "DUPLICATE_KEY", "Map keys must be unique");
    const valueProps = resolveProps(sep != null ? sep : [], {
      indicator: "map-value-ind",
      next: value,
      offset: keyNode.range[2],
      onError,
      parentIndent: bm.indent,
      startOnNewline: !key || key.type === "block-scalar"
    });
    offset = valueProps.end;
    if (valueProps.found) {
      if (implicitKey) {
        if ((value == null ? void 0 : value.type) === "block-map" && !valueProps.hasNewline)
          onError(offset, "BLOCK_AS_IMPLICIT_KEY", "Nested mappings are not allowed in compact mappings");
        if (ctx.options.strict && keyProps.start < valueProps.found.offset - 1024)
          onError(keyNode.range, "KEY_OVER_1024_CHARS", "The : indicator must be at most 1024 chars after the start of an implicit block mapping key");
      }
      const valueNode = value ? composeNode2(ctx, value, valueProps, onError) : composeEmptyNode2(ctx, offset, sep, null, valueProps, onError);
      if (ctx.schema.compat)
        flowIndentCheck(bm.indent, value, onError);
      offset = valueNode.range[2];
      const pair = new Pair(keyNode, valueNode);
      if (ctx.options.keepSourceTokens)
        pair.srcToken = collItem;
      map2.items.push(pair);
    } else {
      if (implicitKey)
        onError(keyNode.range, "MISSING_CHAR", "Implicit map keys need to be followed by map values");
      if (valueProps.comment) {
        if (keyNode.comment)
          keyNode.comment += "\n" + valueProps.comment;
        else
          keyNode.comment = valueProps.comment;
      }
      const pair = new Pair(keyNode);
      if (ctx.options.keepSourceTokens)
        pair.srcToken = collItem;
      map2.items.push(pair);
    }
  }
  if (commentEnd && commentEnd < offset)
    onError(commentEnd, "IMPOSSIBLE", "Map comment with trailing content");
  map2.range = [bm.offset, offset, commentEnd != null ? commentEnd : offset];
  return map2;
}

// node_modules/yaml/browser/dist/compose/resolve-block-seq.js
function resolveBlockSeq({ composeNode: composeNode2, composeEmptyNode: composeEmptyNode2 }, ctx, bs, onError, tag) {
  var _a;
  const NodeClass = (_a = tag == null ? void 0 : tag.nodeClass) != null ? _a : YAMLSeq;
  const seq2 = new NodeClass(ctx.schema);
  if (ctx.atRoot)
    ctx.atRoot = false;
  if (ctx.atKey)
    ctx.atKey = false;
  let offset = bs.offset;
  let commentEnd = null;
  for (const { start, value } of bs.items) {
    const props = resolveProps(start, {
      indicator: "seq-item-ind",
      next: value,
      offset,
      onError,
      parentIndent: bs.indent,
      startOnNewline: true
    });
    if (!props.found) {
      if (props.anchor || props.tag || value) {
        if ((value == null ? void 0 : value.type) === "block-seq")
          onError(props.end, "BAD_INDENT", "All sequence items must start at the same column");
        else
          onError(offset, "MISSING_CHAR", "Sequence item without - indicator");
      } else {
        commentEnd = props.end;
        if (props.comment)
          seq2.comment = props.comment;
        continue;
      }
    }
    const node = value ? composeNode2(ctx, value, props, onError) : composeEmptyNode2(ctx, props.end, start, null, props, onError);
    if (ctx.schema.compat)
      flowIndentCheck(bs.indent, value, onError);
    offset = node.range[2];
    seq2.items.push(node);
  }
  seq2.range = [bs.offset, offset, commentEnd != null ? commentEnd : offset];
  return seq2;
}

// node_modules/yaml/browser/dist/compose/resolve-end.js
function resolveEnd(end, offset, reqSpace, onError) {
  let comment = "";
  if (end) {
    let hasSpace = false;
    let sep = "";
    for (const token of end) {
      const { source, type } = token;
      switch (type) {
        case "space":
          hasSpace = true;
          break;
        case "comment": {
          if (reqSpace && !hasSpace)
            onError(token, "MISSING_CHAR", "Comments must be separated from other tokens by white space characters");
          const cb = source.substring(1) || " ";
          if (!comment)
            comment = cb;
          else
            comment += sep + cb;
          sep = "";
          break;
        }
        case "newline":
          if (comment)
            sep += source;
          hasSpace = true;
          break;
        default:
          onError(token, "UNEXPECTED_TOKEN", `Unexpected ${type} at node end`);
      }
      offset += source.length;
    }
  }
  return { comment, offset };
}

// node_modules/yaml/browser/dist/compose/resolve-flow-collection.js
var blockMsg = "Block collections are not allowed within flow collections";
var isBlock = (token) => token && (token.type === "block-map" || token.type === "block-seq");
function resolveFlowCollection({ composeNode: composeNode2, composeEmptyNode: composeEmptyNode2 }, ctx, fc, onError, tag) {
  var _a, _b, _c;
  const isMap2 = fc.start.source === "{";
  const fcName = isMap2 ? "flow map" : "flow sequence";
  const NodeClass = (_a = tag == null ? void 0 : tag.nodeClass) != null ? _a : isMap2 ? YAMLMap : YAMLSeq;
  const coll = new NodeClass(ctx.schema);
  coll.flow = true;
  const atRoot = ctx.atRoot;
  if (atRoot)
    ctx.atRoot = false;
  if (ctx.atKey)
    ctx.atKey = false;
  let offset = fc.offset + fc.start.source.length;
  for (let i = 0; i < fc.items.length; ++i) {
    const collItem = fc.items[i];
    const { start, key, sep, value } = collItem;
    const props = resolveProps(start, {
      flow: fcName,
      indicator: "explicit-key-ind",
      next: key != null ? key : sep == null ? void 0 : sep[0],
      offset,
      onError,
      parentIndent: fc.indent,
      startOnNewline: false
    });
    if (!props.found) {
      if (!props.anchor && !props.tag && !sep && !value) {
        if (i === 0 && props.comma)
          onError(props.comma, "UNEXPECTED_TOKEN", `Unexpected , in ${fcName}`);
        else if (i < fc.items.length - 1)
          onError(props.start, "UNEXPECTED_TOKEN", `Unexpected empty item in ${fcName}`);
        if (props.comment) {
          if (coll.comment)
            coll.comment += "\n" + props.comment;
          else
            coll.comment = props.comment;
        }
        offset = props.end;
        continue;
      }
      if (!isMap2 && ctx.options.strict && containsNewline(key))
        onError(
          key,
          // checked by containsNewline()
          "MULTILINE_IMPLICIT_KEY",
          "Implicit keys of flow sequence pairs need to be on a single line"
        );
    }
    if (i === 0) {
      if (props.comma)
        onError(props.comma, "UNEXPECTED_TOKEN", `Unexpected , in ${fcName}`);
    } else {
      if (!props.comma)
        onError(props.start, "MISSING_CHAR", `Missing , between ${fcName} items`);
      if (props.comment) {
        let prevItemComment = "";
        loop: for (const st of start) {
          switch (st.type) {
            case "comma":
            case "space":
              break;
            case "comment":
              prevItemComment = st.source.substring(1);
              break loop;
            default:
              break loop;
          }
        }
        if (prevItemComment) {
          let prev = coll.items[coll.items.length - 1];
          if (isPair(prev))
            prev = (_b = prev.value) != null ? _b : prev.key;
          if (prev.comment)
            prev.comment += "\n" + prevItemComment;
          else
            prev.comment = prevItemComment;
          props.comment = props.comment.substring(prevItemComment.length + 1);
        }
      }
    }
    if (!isMap2 && !sep && !props.found) {
      const valueNode = value ? composeNode2(ctx, value, props, onError) : composeEmptyNode2(ctx, props.end, sep, null, props, onError);
      coll.items.push(valueNode);
      offset = valueNode.range[2];
      if (isBlock(value))
        onError(valueNode.range, "BLOCK_IN_FLOW", blockMsg);
    } else {
      ctx.atKey = true;
      const keyStart = props.end;
      const keyNode = key ? composeNode2(ctx, key, props, onError) : composeEmptyNode2(ctx, keyStart, start, null, props, onError);
      if (isBlock(key))
        onError(keyNode.range, "BLOCK_IN_FLOW", blockMsg);
      ctx.atKey = false;
      const valueProps = resolveProps(sep != null ? sep : [], {
        flow: fcName,
        indicator: "map-value-ind",
        next: value,
        offset: keyNode.range[2],
        onError,
        parentIndent: fc.indent,
        startOnNewline: false
      });
      if (valueProps.found) {
        if (!isMap2 && !props.found && ctx.options.strict) {
          if (sep)
            for (const st of sep) {
              if (st === valueProps.found)
                break;
              if (st.type === "newline") {
                onError(st, "MULTILINE_IMPLICIT_KEY", "Implicit keys of flow sequence pairs need to be on a single line");
                break;
              }
            }
          if (props.start < valueProps.found.offset - 1024)
            onError(valueProps.found, "KEY_OVER_1024_CHARS", "The : indicator must be at most 1024 chars after the start of an implicit flow sequence key");
        }
      } else if (value) {
        if ("source" in value && ((_c = value.source) == null ? void 0 : _c[0]) === ":")
          onError(value, "MISSING_CHAR", `Missing space after : in ${fcName}`);
        else
          onError(valueProps.start, "MISSING_CHAR", `Missing , or : between ${fcName} items`);
      }
      const valueNode = value ? composeNode2(ctx, value, valueProps, onError) : valueProps.found ? composeEmptyNode2(ctx, valueProps.end, sep, null, valueProps, onError) : null;
      if (valueNode) {
        if (isBlock(value))
          onError(valueNode.range, "BLOCK_IN_FLOW", blockMsg);
      } else if (valueProps.comment) {
        if (keyNode.comment)
          keyNode.comment += "\n" + valueProps.comment;
        else
          keyNode.comment = valueProps.comment;
      }
      const pair = new Pair(keyNode, valueNode);
      if (ctx.options.keepSourceTokens)
        pair.srcToken = collItem;
      if (isMap2) {
        const map2 = coll;
        if (mapIncludes(ctx, map2.items, keyNode))
          onError(keyStart, "DUPLICATE_KEY", "Map keys must be unique");
        map2.items.push(pair);
      } else {
        const map2 = new YAMLMap(ctx.schema);
        map2.flow = true;
        map2.items.push(pair);
        const endRange = (valueNode != null ? valueNode : keyNode).range;
        map2.range = [keyNode.range[0], endRange[1], endRange[2]];
        coll.items.push(map2);
      }
      offset = valueNode ? valueNode.range[2] : valueProps.end;
    }
  }
  const expectedEnd = isMap2 ? "}" : "]";
  const [ce, ...ee] = fc.end;
  let cePos = offset;
  if ((ce == null ? void 0 : ce.source) === expectedEnd)
    cePos = ce.offset + ce.source.length;
  else {
    const name = fcName[0].toUpperCase() + fcName.substring(1);
    const msg = atRoot ? `${name} must end with a ${expectedEnd}` : `${name} in block collection must be sufficiently indented and end with a ${expectedEnd}`;
    onError(offset, atRoot ? "MISSING_CHAR" : "BAD_INDENT", msg);
    if (ce && ce.source.length !== 1)
      ee.unshift(ce);
  }
  if (ee.length > 0) {
    const end = resolveEnd(ee, cePos, ctx.options.strict, onError);
    if (end.comment) {
      if (coll.comment)
        coll.comment += "\n" + end.comment;
      else
        coll.comment = end.comment;
    }
    coll.range = [fc.offset, cePos, end.offset];
  } else {
    coll.range = [fc.offset, cePos, cePos];
  }
  return coll;
}

// node_modules/yaml/browser/dist/compose/compose-collection.js
function resolveCollection(CN2, ctx, token, onError, tagName, tag) {
  const coll = token.type === "block-map" ? resolveBlockMap(CN2, ctx, token, onError, tag) : token.type === "block-seq" ? resolveBlockSeq(CN2, ctx, token, onError, tag) : resolveFlowCollection(CN2, ctx, token, onError, tag);
  const Coll = coll.constructor;
  if (tagName === "!" || tagName === Coll.tagName) {
    coll.tag = Coll.tagName;
    return coll;
  }
  if (tagName)
    coll.tag = tagName;
  return coll;
}
function composeCollection(CN2, ctx, token, props, onError) {
  var _a, _b, _c;
  const tagToken = props.tag;
  const tagName = !tagToken ? null : ctx.directives.tagName(tagToken.source, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg));
  if (token.type === "block-seq") {
    const { anchor, newlineAfterProp: nl } = props;
    const lastProp = anchor && tagToken ? anchor.offset > tagToken.offset ? anchor : tagToken : anchor != null ? anchor : tagToken;
    if (lastProp && (!nl || nl.offset < lastProp.offset)) {
      const message = "Missing newline after block sequence props";
      onError(lastProp, "MISSING_CHAR", message);
    }
  }
  const expType = token.type === "block-map" ? "map" : token.type === "block-seq" ? "seq" : token.start.source === "{" ? "map" : "seq";
  if (!tagToken || !tagName || tagName === "!" || tagName === YAMLMap.tagName && expType === "map" || tagName === YAMLSeq.tagName && expType === "seq") {
    return resolveCollection(CN2, ctx, token, onError, tagName);
  }
  let tag = ctx.schema.tags.find((t) => t.tag === tagName && t.collection === expType);
  if (!tag) {
    const kt = ctx.schema.knownTags[tagName];
    if ((kt == null ? void 0 : kt.collection) === expType) {
      ctx.schema.tags.push(Object.assign({}, kt, { default: false }));
      tag = kt;
    } else {
      if (kt) {
        onError(tagToken, "BAD_COLLECTION_TYPE", `${kt.tag} used for ${expType} collection, but expects ${(_a = kt.collection) != null ? _a : "scalar"}`, true);
      } else {
        onError(tagToken, "TAG_RESOLVE_FAILED", `Unresolved tag: ${tagName}`, true);
      }
      return resolveCollection(CN2, ctx, token, onError, tagName);
    }
  }
  const coll = resolveCollection(CN2, ctx, token, onError, tagName, tag);
  const res = (_c = (_b = tag.resolve) == null ? void 0 : _b.call(tag, coll, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg), ctx.options)) != null ? _c : coll;
  const node = isNode(res) ? res : new Scalar(res);
  node.range = coll.range;
  node.tag = tagName;
  if (tag == null ? void 0 : tag.format)
    node.format = tag.format;
  return node;
}

// node_modules/yaml/browser/dist/compose/resolve-block-scalar.js
function resolveBlockScalar(ctx, scalar, onError) {
  const start = scalar.offset;
  const header = parseBlockScalarHeader(scalar, ctx.options.strict, onError);
  if (!header)
    return { value: "", type: null, comment: "", range: [start, start, start] };
  const type = header.mode === ">" ? Scalar.BLOCK_FOLDED : Scalar.BLOCK_LITERAL;
  const lines = scalar.source ? splitLines(scalar.source) : [];
  let chompStart = lines.length;
  for (let i = lines.length - 1; i >= 0; --i) {
    const content = lines[i][1];
    if (content === "" || content === "\r")
      chompStart = i;
    else
      break;
  }
  if (chompStart === 0) {
    const value2 = header.chomp === "+" && lines.length > 0 ? "\n".repeat(Math.max(1, lines.length - 1)) : "";
    let end2 = start + header.length;
    if (scalar.source)
      end2 += scalar.source.length;
    return { value: value2, type, comment: header.comment, range: [start, end2, end2] };
  }
  let trimIndent = scalar.indent + header.indent;
  let offset = scalar.offset + header.length;
  let contentStart = 0;
  for (let i = 0; i < chompStart; ++i) {
    const [indent, content] = lines[i];
    if (content === "" || content === "\r") {
      if (header.indent === 0 && indent.length > trimIndent)
        trimIndent = indent.length;
    } else {
      if (indent.length < trimIndent) {
        const message = "Block scalars with more-indented leading empty lines must use an explicit indentation indicator";
        onError(offset + indent.length, "MISSING_CHAR", message);
      }
      if (header.indent === 0)
        trimIndent = indent.length;
      contentStart = i;
      if (trimIndent === 0 && !ctx.atRoot) {
        const message = "Block scalar values in collections must be indented";
        onError(offset, "BAD_INDENT", message);
      }
      break;
    }
    offset += indent.length + content.length + 1;
  }
  for (let i = lines.length - 1; i >= chompStart; --i) {
    if (lines[i][0].length > trimIndent)
      chompStart = i + 1;
  }
  let value = "";
  let sep = "";
  let prevMoreIndented = false;
  for (let i = 0; i < contentStart; ++i)
    value += lines[i][0].slice(trimIndent) + "\n";
  for (let i = contentStart; i < chompStart; ++i) {
    let [indent, content] = lines[i];
    offset += indent.length + content.length + 1;
    const crlf = content[content.length - 1] === "\r";
    if (crlf)
      content = content.slice(0, -1);
    if (content && indent.length < trimIndent) {
      const src = header.indent ? "explicit indentation indicator" : "first line";
      const message = `Block scalar lines must not be less indented than their ${src}`;
      onError(offset - content.length - (crlf ? 2 : 1), "BAD_INDENT", message);
      indent = "";
    }
    if (type === Scalar.BLOCK_LITERAL) {
      value += sep + indent.slice(trimIndent) + content;
      sep = "\n";
    } else if (indent.length > trimIndent || content[0] === "	") {
      if (sep === " ")
        sep = "\n";
      else if (!prevMoreIndented && sep === "\n")
        sep = "\n\n";
      value += sep + indent.slice(trimIndent) + content;
      sep = "\n";
      prevMoreIndented = true;
    } else if (content === "") {
      if (sep === "\n")
        value += "\n";
      else
        sep = "\n";
    } else {
      value += sep + content;
      sep = " ";
      prevMoreIndented = false;
    }
  }
  switch (header.chomp) {
    case "-":
      break;
    case "+":
      for (let i = chompStart; i < lines.length; ++i)
        value += "\n" + lines[i][0].slice(trimIndent);
      if (value[value.length - 1] !== "\n")
        value += "\n";
      break;
    default:
      value += "\n";
  }
  const end = start + header.length + scalar.source.length;
  return { value, type, comment: header.comment, range: [start, end, end] };
}
function parseBlockScalarHeader({ offset, props }, strict, onError) {
  if (props[0].type !== "block-scalar-header") {
    onError(props[0], "IMPOSSIBLE", "Block scalar header not found");
    return null;
  }
  const { source } = props[0];
  const mode = source[0];
  let indent = 0;
  let chomp = "";
  let error = -1;
  for (let i = 1; i < source.length; ++i) {
    const ch = source[i];
    if (!chomp && (ch === "-" || ch === "+"))
      chomp = ch;
    else {
      const n = Number(ch);
      if (!indent && n)
        indent = n;
      else if (error === -1)
        error = offset + i;
    }
  }
  if (error !== -1)
    onError(error, "UNEXPECTED_TOKEN", `Block scalar header includes extra characters: ${source}`);
  let hasSpace = false;
  let comment = "";
  let length = source.length;
  for (let i = 1; i < props.length; ++i) {
    const token = props[i];
    switch (token.type) {
      case "space":
        hasSpace = true;
      // fallthrough
      case "newline":
        length += token.source.length;
        break;
      case "comment":
        if (strict && !hasSpace) {
          const message = "Comments must be separated from other tokens by white space characters";
          onError(token, "MISSING_CHAR", message);
        }
        length += token.source.length;
        comment = token.source.substring(1);
        break;
      case "error":
        onError(token, "UNEXPECTED_TOKEN", token.message);
        length += token.source.length;
        break;
      /* istanbul ignore next should not happen */
      default: {
        const message = `Unexpected token in block scalar header: ${token.type}`;
        onError(token, "UNEXPECTED_TOKEN", message);
        const ts = token.source;
        if (ts && typeof ts === "string")
          length += ts.length;
      }
    }
  }
  return { mode, indent, chomp, comment, length };
}
function splitLines(source) {
  const split = source.split(/\n( *)/);
  const first = split[0];
  const m = first.match(/^( *)/);
  const line0 = (m == null ? void 0 : m[1]) ? [m[1], first.slice(m[1].length)] : ["", first];
  const lines = [line0];
  for (let i = 1; i < split.length; i += 2)
    lines.push([split[i], split[i + 1]]);
  return lines;
}

// node_modules/yaml/browser/dist/compose/resolve-flow-scalar.js
function resolveFlowScalar(scalar, strict, onError) {
  const { offset, type, source, end } = scalar;
  let _type;
  let value;
  const _onError = (rel, code, msg) => onError(offset + rel, code, msg);
  switch (type) {
    case "scalar":
      _type = Scalar.PLAIN;
      value = plainValue(source, _onError);
      break;
    case "single-quoted-scalar":
      _type = Scalar.QUOTE_SINGLE;
      value = singleQuotedValue(source, _onError);
      break;
    case "double-quoted-scalar":
      _type = Scalar.QUOTE_DOUBLE;
      value = doubleQuotedValue(source, _onError);
      break;
    /* istanbul ignore next should not happen */
    default:
      onError(scalar, "UNEXPECTED_TOKEN", `Expected a flow scalar value, but found: ${type}`);
      return {
        value: "",
        type: null,
        comment: "",
        range: [offset, offset + source.length, offset + source.length]
      };
  }
  const valueEnd = offset + source.length;
  const re = resolveEnd(end, valueEnd, strict, onError);
  return {
    value,
    type: _type,
    comment: re.comment,
    range: [offset, valueEnd, re.offset]
  };
}
function plainValue(source, onError) {
  let badChar = "";
  switch (source[0]) {
    /* istanbul ignore next should not happen */
    case "	":
      badChar = "a tab character";
      break;
    case ",":
      badChar = "flow indicator character ,";
      break;
    case "%":
      badChar = "directive indicator character %";
      break;
    case "|":
    case ">": {
      badChar = `block scalar indicator ${source[0]}`;
      break;
    }
    case "@":
    case "`": {
      badChar = `reserved character ${source[0]}`;
      break;
    }
  }
  if (badChar)
    onError(0, "BAD_SCALAR_START", `Plain value cannot start with ${badChar}`);
  return unfoldLines(source);
}
function singleQuotedValue(source, onError) {
  if (source[source.length - 1] !== "'" || source.length === 1)
    onError(source.length, "MISSING_CHAR", "Missing closing 'quote");
  return unfoldLines(source.slice(1, -1)).replace(/''/g, "'");
}
function unfoldLines(source) {
  var _a;
  const line = /(.*?)\r?\n/sy;
  let match = line.exec(source);
  if (!match)
    return source;
  let trimEnd, trimBoth;
  try {
    trimEnd = new RegExp("(?<![ 	])[ 	]+$");
    trimBoth = new RegExp("^[ 	]+|(?<![ 	])[ 	]+$", "g");
  } catch (e) {
    trimEnd = /[ \t]+$/;
    trimBoth = /^[ \t]+|[ \t]+$/g;
  }
  let res = match[1].replace(trimEnd, "");
  let sep = " ";
  let pos = line.lastIndex;
  while (match = line.exec(source)) {
    const lm = match[1].replace(trimBoth, "");
    if (lm === "") {
      if (sep === "\n")
        res += sep;
      else
        sep = "\n";
    } else {
      res += sep + lm;
      sep = " ";
    }
    pos = line.lastIndex;
  }
  const last = /[ \t]*(.*)/sy;
  last.lastIndex = pos;
  match = last.exec(source);
  return res + sep + ((_a = match == null ? void 0 : match[1]) != null ? _a : "");
}
function doubleQuotedValue(source, onError) {
  let res = "";
  for (let i = 1; i < source.length - 1; ++i) {
    const ch = source[i];
    if (ch === "\r" && source[i + 1] === "\n")
      continue;
    if (ch === "\n") {
      const { fold, offset } = foldNewline(source, i);
      res += fold;
      i = offset;
    } else if (ch === "\\") {
      let next = source[++i];
      const cc = escapeCodes[next];
      if (cc)
        res += cc;
      else if (next === "\n") {
        next = source[i + 1];
        while (next === " " || next === "	")
          next = source[++i + 1];
      } else if (next === "\r" && source[i + 1] === "\n") {
        next = source[++i + 1];
        while (next === " " || next === "	")
          next = source[++i + 1];
      } else if (next === "x" || next === "u" || next === "U") {
        const length = next === "x" ? 2 : next === "u" ? 4 : 8;
        res += parseCharCode(source, i + 1, length, onError);
        i += length;
      } else {
        const raw = source.substr(i - 1, 2);
        onError(i - 1, "BAD_DQ_ESCAPE", `Invalid escape sequence ${raw}`);
        res += raw;
      }
    } else if (ch === " " || ch === "	") {
      const wsStart = i;
      let next = source[i + 1];
      while (next === " " || next === "	")
        next = source[++i + 1];
      if (next !== "\n" && !(next === "\r" && source[i + 2] === "\n"))
        res += i > wsStart ? source.slice(wsStart, i + 1) : ch;
    } else {
      res += ch;
    }
  }
  if (source[source.length - 1] !== '"' || source.length === 1)
    onError(source.length, "MISSING_CHAR", 'Missing closing "quote');
  return res;
}
function foldNewline(source, offset) {
  let fold = "";
  let ch = source[offset + 1];
  while (ch === " " || ch === "	" || ch === "\n" || ch === "\r") {
    if (ch === "\r" && source[offset + 2] !== "\n")
      break;
    if (ch === "\n")
      fold += "\n";
    offset += 1;
    ch = source[offset + 1];
  }
  if (!fold)
    fold = " ";
  return { fold, offset };
}
var escapeCodes = {
  "0": "\0",
  // null character
  a: "\x07",
  // bell character
  b: "\b",
  // backspace
  e: "\x1B",
  // escape character
  f: "\f",
  // form feed
  n: "\n",
  // line feed
  r: "\r",
  // carriage return
  t: "	",
  // horizontal tab
  v: "\v",
  // vertical tab
  N: "",
  // Unicode next line
  _: " ",
  // Unicode non-breaking space
  L: "\u2028",
  // Unicode line separator
  P: "\u2029",
  // Unicode paragraph separator
  " ": " ",
  '"': '"',
  "/": "/",
  "\\": "\\",
  "	": "	"
};
function parseCharCode(source, offset, length, onError) {
  const cc = source.substr(offset, length);
  const ok = cc.length === length && /^[0-9a-fA-F]+$/.test(cc);
  const code = ok ? parseInt(cc, 16) : NaN;
  try {
    return String.fromCodePoint(code);
  } catch (e) {
    const raw = source.substr(offset - 2, length + 2);
    onError(offset - 2, "BAD_DQ_ESCAPE", `Invalid escape sequence ${raw}`);
    return raw;
  }
}

// node_modules/yaml/browser/dist/compose/compose-scalar.js
function composeScalar(ctx, token, tagToken, onError) {
  const { value, type, comment, range } = token.type === "block-scalar" ? resolveBlockScalar(ctx, token, onError) : resolveFlowScalar(token, ctx.options.strict, onError);
  const tagName = tagToken ? ctx.directives.tagName(tagToken.source, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg)) : null;
  let tag;
  if (ctx.options.stringKeys && ctx.atKey) {
    tag = ctx.schema[SCALAR];
  } else if (tagName)
    tag = findScalarTagByName(ctx.schema, value, tagName, tagToken, onError);
  else if (token.type === "scalar")
    tag = findScalarTagByTest(ctx, value, token, onError);
  else
    tag = ctx.schema[SCALAR];
  let scalar;
  try {
    const res = tag.resolve(value, (msg) => onError(tagToken != null ? tagToken : token, "TAG_RESOLVE_FAILED", msg), ctx.options);
    scalar = isScalar(res) ? res : new Scalar(res);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    onError(tagToken != null ? tagToken : token, "TAG_RESOLVE_FAILED", msg);
    scalar = new Scalar(value);
  }
  scalar.range = range;
  scalar.source = value;
  if (type)
    scalar.type = type;
  if (tagName)
    scalar.tag = tagName;
  if (tag.format)
    scalar.format = tag.format;
  if (comment)
    scalar.comment = comment;
  return scalar;
}
function findScalarTagByName(schema4, value, tagName, tagToken, onError) {
  var _a;
  if (tagName === "!")
    return schema4[SCALAR];
  const matchWithTest = [];
  for (const tag of schema4.tags) {
    if (!tag.collection && tag.tag === tagName) {
      if (tag.default && tag.test)
        matchWithTest.push(tag);
      else
        return tag;
    }
  }
  for (const tag of matchWithTest)
    if ((_a = tag.test) == null ? void 0 : _a.test(value))
      return tag;
  const kt = schema4.knownTags[tagName];
  if (kt && !kt.collection) {
    schema4.tags.push(Object.assign({}, kt, { default: false, test: void 0 }));
    return kt;
  }
  onError(tagToken, "TAG_RESOLVE_FAILED", `Unresolved tag: ${tagName}`, tagName !== "tag:yaml.org,2002:str");
  return schema4[SCALAR];
}
function findScalarTagByTest({ atKey, directives, schema: schema4 }, value, token, onError) {
  var _a;
  const tag = schema4.tags.find((tag2) => {
    var _a2;
    return (tag2.default === true || atKey && tag2.default === "key") && ((_a2 = tag2.test) == null ? void 0 : _a2.test(value));
  }) || schema4[SCALAR];
  if (schema4.compat) {
    const compat = (_a = schema4.compat.find((tag2) => {
      var _a2;
      return tag2.default && ((_a2 = tag2.test) == null ? void 0 : _a2.test(value));
    })) != null ? _a : schema4[SCALAR];
    if (tag.tag !== compat.tag) {
      const ts = directives.tagString(tag.tag);
      const cs = directives.tagString(compat.tag);
      const msg = `Value may be parsed as either ${ts} or ${cs}`;
      onError(token, "TAG_RESOLVE_FAILED", msg, true);
    }
  }
  return tag;
}

// node_modules/yaml/browser/dist/compose/util-empty-scalar-position.js
function emptyScalarPosition(offset, before, pos) {
  if (before) {
    pos != null ? pos : pos = before.length;
    for (let i = pos - 1; i >= 0; --i) {
      let st = before[i];
      switch (st.type) {
        case "space":
        case "comment":
        case "newline":
          offset -= st.source.length;
          continue;
      }
      st = before[++i];
      while ((st == null ? void 0 : st.type) === "space") {
        offset += st.source.length;
        st = before[++i];
      }
      break;
    }
  }
  return offset;
}

// node_modules/yaml/browser/dist/compose/compose-node.js
var CN = { composeNode, composeEmptyNode };
function composeNode(ctx, token, props, onError) {
  const atKey = ctx.atKey;
  const { spaceBefore, comment, anchor, tag } = props;
  let node;
  let isSrcToken = true;
  switch (token.type) {
    case "alias":
      node = composeAlias(ctx, token, onError);
      if (anchor || tag)
        onError(token, "ALIAS_PROPS", "An alias node must not specify any properties");
      break;
    case "scalar":
    case "single-quoted-scalar":
    case "double-quoted-scalar":
    case "block-scalar":
      node = composeScalar(ctx, token, tag, onError);
      if (anchor)
        node.anchor = anchor.source.substring(1);
      break;
    case "block-map":
    case "block-seq":
    case "flow-collection":
      try {
        node = composeCollection(CN, ctx, token, props, onError);
        if (anchor)
          node.anchor = anchor.source.substring(1);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        onError(token, "RESOURCE_EXHAUSTION", message);
      }
      break;
    default: {
      const message = token.type === "error" ? token.message : `Unsupported token (type: ${token.type})`;
      onError(token, "UNEXPECTED_TOKEN", message);
      isSrcToken = false;
    }
  }
  node != null ? node : node = composeEmptyNode(ctx, token.offset, void 0, null, props, onError);
  if (anchor && node.anchor === "")
    onError(anchor, "BAD_ALIAS", "Anchor cannot be an empty string");
  if (atKey && ctx.options.stringKeys && (!isScalar(node) || typeof node.value !== "string" || node.tag && node.tag !== "tag:yaml.org,2002:str")) {
    const msg = "With stringKeys, all keys must be strings";
    onError(tag != null ? tag : token, "NON_STRING_KEY", msg);
  }
  if (spaceBefore)
    node.spaceBefore = true;
  if (comment) {
    if (token.type === "scalar" && token.source === "")
      node.comment = comment;
    else
      node.commentBefore = comment;
  }
  if (ctx.options.keepSourceTokens && isSrcToken)
    node.srcToken = token;
  return node;
}
function composeEmptyNode(ctx, offset, before, pos, { spaceBefore, comment, anchor, tag, end }, onError) {
  const token = {
    type: "scalar",
    offset: emptyScalarPosition(offset, before, pos),
    indent: -1,
    source: ""
  };
  const node = composeScalar(ctx, token, tag, onError);
  if (anchor) {
    node.anchor = anchor.source.substring(1);
    if (node.anchor === "")
      onError(anchor, "BAD_ALIAS", "Anchor cannot be an empty string");
  }
  if (spaceBefore)
    node.spaceBefore = true;
  if (comment) {
    node.comment = comment;
    node.range[2] = end;
  }
  return node;
}
function composeAlias({ options }, { offset, source, end }, onError) {
  const alias = new Alias(source.substring(1));
  if (alias.source === "")
    onError(offset, "BAD_ALIAS", "Alias cannot be an empty string");
  if (alias.source.endsWith(":"))
    onError(offset + source.length - 1, "BAD_ALIAS", "Alias ending in : is ambiguous", true);
  const valueEnd = offset + source.length;
  const re = resolveEnd(end, valueEnd, options.strict, onError);
  alias.range = [offset, valueEnd, re.offset];
  if (re.comment)
    alias.comment = re.comment;
  return alias;
}

// node_modules/yaml/browser/dist/compose/compose-doc.js
function composeDoc(options, directives, { offset, start, value, end }, onError) {
  const opts = Object.assign({ _directives: directives }, options);
  const doc = new Document(void 0, opts);
  const ctx = {
    atKey: false,
    atRoot: true,
    directives: doc.directives,
    options: doc.options,
    schema: doc.schema
  };
  const props = resolveProps(start, {
    indicator: "doc-start",
    next: value != null ? value : end == null ? void 0 : end[0],
    offset,
    onError,
    parentIndent: 0,
    startOnNewline: true
  });
  if (props.found) {
    doc.directives.docStart = true;
    if (value && (value.type === "block-map" || value.type === "block-seq") && !props.hasNewline)
      onError(props.end, "MISSING_CHAR", "Block collection cannot start on same line with directives-end marker");
  }
  doc.contents = value ? composeNode(ctx, value, props, onError) : composeEmptyNode(ctx, props.end, start, null, props, onError);
  const contentEnd = doc.contents.range[2];
  const re = resolveEnd(end, contentEnd, false, onError);
  if (re.comment)
    doc.comment = re.comment;
  doc.range = [offset, contentEnd, re.offset];
  return doc;
}

// node_modules/yaml/browser/dist/compose/composer.js
function getErrorPos(src) {
  if (typeof src === "number")
    return [src, src + 1];
  if (Array.isArray(src))
    return src.length === 2 ? src : [src[0], src[1]];
  const { offset, source } = src;
  return [offset, offset + (typeof source === "string" ? source.length : 1)];
}
function parsePrelude(prelude) {
  var _a;
  let comment = "";
  let atComment = false;
  let afterEmptyLine = false;
  for (let i = 0; i < prelude.length; ++i) {
    const source = prelude[i];
    switch (source[0]) {
      case "#":
        comment += (comment === "" ? "" : afterEmptyLine ? "\n\n" : "\n") + (source.substring(1) || " ");
        atComment = true;
        afterEmptyLine = false;
        break;
      case "%":
        if (((_a = prelude[i + 1]) == null ? void 0 : _a[0]) !== "#")
          i += 1;
        atComment = false;
        break;
      default:
        if (!atComment)
          afterEmptyLine = true;
        atComment = false;
    }
  }
  return { comment, afterEmptyLine };
}
var Composer = class {
  constructor(options = {}) {
    this.doc = null;
    this.atDirectives = false;
    this.prelude = [];
    this.errors = [];
    this.warnings = [];
    this.onError = (source, code, message, warning) => {
      const pos = getErrorPos(source);
      if (warning)
        this.warnings.push(new YAMLWarning(pos, code, message));
      else
        this.errors.push(new YAMLParseError(pos, code, message));
    };
    this.directives = new Directives({ version: options.version || "1.2" });
    this.options = options;
  }
  decorate(doc, afterDoc) {
    const { comment, afterEmptyLine } = parsePrelude(this.prelude);
    if (comment) {
      const dc = doc.contents;
      if (afterDoc) {
        doc.comment = doc.comment ? `${doc.comment}
${comment}` : comment;
      } else if (afterEmptyLine || doc.directives.docStart || !dc) {
        doc.commentBefore = comment;
      } else if (isCollection(dc) && !dc.flow && dc.items.length > 0) {
        let it = dc.items[0];
        if (isPair(it))
          it = it.key;
        const cb = it.commentBefore;
        it.commentBefore = cb ? `${comment}
${cb}` : comment;
      } else {
        const cb = dc.commentBefore;
        dc.commentBefore = cb ? `${comment}
${cb}` : comment;
      }
    }
    if (afterDoc) {
      for (let i = 0; i < this.errors.length; ++i)
        doc.errors.push(this.errors[i]);
      for (let i = 0; i < this.warnings.length; ++i)
        doc.warnings.push(this.warnings[i]);
    } else {
      doc.errors = this.errors;
      doc.warnings = this.warnings;
    }
    this.prelude = [];
    this.errors = [];
    this.warnings = [];
  }
  /**
   * Current stream status information.
   *
   * Mostly useful at the end of input for an empty stream.
   */
  streamInfo() {
    return {
      comment: parsePrelude(this.prelude).comment,
      directives: this.directives,
      errors: this.errors,
      warnings: this.warnings
    };
  }
  /**
   * Compose tokens into documents.
   *
   * @param forceDoc - If the stream contains no document, still emit a final document including any comments and directives that would be applied to a subsequent document.
   * @param endOffset - Should be set if `forceDoc` is also set, to set the document range end and to indicate errors correctly.
   */
  *compose(tokens, forceDoc = false, endOffset = -1) {
    for (const token of tokens)
      yield* this.next(token);
    yield* this.end(forceDoc, endOffset);
  }
  /** Advance the composer by one CST token. */
  *next(token) {
    switch (token.type) {
      case "directive":
        this.directives.add(token.source, (offset, message, warning) => {
          const pos = getErrorPos(token);
          pos[0] += offset;
          this.onError(pos, "BAD_DIRECTIVE", message, warning);
        });
        this.prelude.push(token.source);
        this.atDirectives = true;
        break;
      case "document": {
        const doc = composeDoc(this.options, this.directives, token, this.onError);
        if (this.atDirectives && !doc.directives.docStart)
          this.onError(token, "MISSING_CHAR", "Missing directives-end/doc-start indicator line");
        this.decorate(doc, false);
        if (this.doc)
          yield this.doc;
        this.doc = doc;
        this.atDirectives = false;
        break;
      }
      case "byte-order-mark":
      case "space":
        break;
      case "comment":
      case "newline":
        this.prelude.push(token.source);
        break;
      case "error": {
        const msg = token.source ? `${token.message}: ${JSON.stringify(token.source)}` : token.message;
        const error = new YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", msg);
        if (this.atDirectives || !this.doc)
          this.errors.push(error);
        else
          this.doc.errors.push(error);
        break;
      }
      case "doc-end": {
        if (!this.doc) {
          const msg = "Unexpected doc-end without preceding document";
          this.errors.push(new YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", msg));
          break;
        }
        this.doc.directives.docEnd = true;
        const end = resolveEnd(token.end, token.offset + token.source.length, this.doc.options.strict, this.onError);
        this.decorate(this.doc, true);
        if (end.comment) {
          const dc = this.doc.comment;
          this.doc.comment = dc ? `${dc}
${end.comment}` : end.comment;
        }
        this.doc.range[2] = end.offset;
        break;
      }
      default:
        this.errors.push(new YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", `Unsupported token ${token.type}`));
    }
  }
  /**
   * Call at end of input to yield any remaining document.
   *
   * @param forceDoc - If the stream contains no document, still emit a final document including any comments and directives that would be applied to a subsequent document.
   * @param endOffset - Should be set if `forceDoc` is also set, to set the document range end and to indicate errors correctly.
   */
  *end(forceDoc = false, endOffset = -1) {
    if (this.doc) {
      this.decorate(this.doc, true);
      yield this.doc;
      this.doc = null;
    } else if (forceDoc) {
      const opts = Object.assign({ _directives: this.directives }, this.options);
      const doc = new Document(void 0, opts);
      if (this.atDirectives)
        this.onError(endOffset, "MISSING_CHAR", "Missing directives-end indicator line");
      doc.range = [0, endOffset, endOffset];
      this.decorate(doc, false);
      yield doc;
    }
  }
};

// node_modules/yaml/browser/dist/parse/cst-visit.js
var BREAK2 = /* @__PURE__ */ Symbol("break visit");
var SKIP2 = /* @__PURE__ */ Symbol("skip children");
var REMOVE2 = /* @__PURE__ */ Symbol("remove item");
function visit2(cst, visitor) {
  if ("type" in cst && cst.type === "document")
    cst = { start: cst.start, value: cst.value };
  _visit(Object.freeze([]), cst, visitor);
}
visit2.BREAK = BREAK2;
visit2.SKIP = SKIP2;
visit2.REMOVE = REMOVE2;
visit2.itemAtPath = (cst, path) => {
  let item = cst;
  for (const [field, index] of path) {
    const tok = item == null ? void 0 : item[field];
    if (tok && "items" in tok) {
      item = tok.items[index];
    } else
      return void 0;
  }
  return item;
};
visit2.parentCollection = (cst, path) => {
  const parent = visit2.itemAtPath(cst, path.slice(0, -1));
  const field = path[path.length - 1][0];
  const coll = parent == null ? void 0 : parent[field];
  if (coll && "items" in coll)
    return coll;
  throw new Error("Parent collection not found");
};
function _visit(path, item, visitor) {
  let ctrl = visitor(item, path);
  if (typeof ctrl === "symbol")
    return ctrl;
  for (const field of ["key", "value"]) {
    const token = item[field];
    if (token && "items" in token) {
      for (let i = 0; i < token.items.length; ++i) {
        const ci = _visit(Object.freeze(path.concat([[field, i]])), token.items[i], visitor);
        if (typeof ci === "number")
          i = ci - 1;
        else if (ci === BREAK2)
          return BREAK2;
        else if (ci === REMOVE2) {
          token.items.splice(i, 1);
          i -= 1;
        }
      }
      if (typeof ctrl === "function" && field === "key")
        ctrl = ctrl(item, path);
    }
  }
  return typeof ctrl === "function" ? ctrl(item, path) : ctrl;
}

// node_modules/yaml/browser/dist/parse/cst.js
var BOM = "\uFEFF";
var DOCUMENT = "";
var FLOW_END = "";
var SCALAR2 = "";
function tokenType(source) {
  switch (source) {
    case BOM:
      return "byte-order-mark";
    case DOCUMENT:
      return "doc-mode";
    case FLOW_END:
      return "flow-error-end";
    case SCALAR2:
      return "scalar";
    case "---":
      return "doc-start";
    case "...":
      return "doc-end";
    case "":
    case "\n":
    case "\r\n":
      return "newline";
    case "-":
      return "seq-item-ind";
    case "?":
      return "explicit-key-ind";
    case ":":
      return "map-value-ind";
    case "{":
      return "flow-map-start";
    case "}":
      return "flow-map-end";
    case "[":
      return "flow-seq-start";
    case "]":
      return "flow-seq-end";
    case ",":
      return "comma";
  }
  switch (source[0]) {
    case " ":
    case "	":
      return "space";
    case "#":
      return "comment";
    case "%":
      return "directive-line";
    case "*":
      return "alias";
    case "&":
      return "anchor";
    case "!":
      return "tag";
    case "'":
      return "single-quoted-scalar";
    case '"':
      return "double-quoted-scalar";
    case "|":
    case ">":
      return "block-scalar-header";
  }
  return null;
}

// node_modules/yaml/browser/dist/parse/lexer.js
function isEmpty(ch) {
  switch (ch) {
    case void 0:
    case " ":
    case "\n":
    case "\r":
    case "	":
      return true;
    default:
      return false;
  }
}
var hexDigits = new Set("0123456789ABCDEFabcdef");
var tagChars = new Set("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-#;/?:@&=+$_.!~*'()");
var flowIndicatorChars = new Set(",[]{}");
var invalidAnchorChars = new Set(" ,[]{}\n\r	");
var isNotAnchorChar = (ch) => !ch || invalidAnchorChars.has(ch);
var Lexer = class {
  constructor() {
    this.atEnd = false;
    this.blockScalarIndent = -1;
    this.blockScalarKeep = false;
    this.buffer = "";
    this.flowKey = false;
    this.flowLevel = 0;
    this.indentNext = 0;
    this.indentValue = 0;
    this.lineEndPos = null;
    this.next = null;
    this.pos = 0;
  }
  /**
   * Generate YAML tokens from the `source` string. If `incomplete`,
   * a part of the last line may be left as a buffer for the next call.
   *
   * @returns A generator of lexical tokens
   */
  *lex(source, incomplete = false) {
    var _a;
    if (source) {
      if (typeof source !== "string")
        throw TypeError("source is not a string");
      this.buffer = this.buffer ? this.buffer + source : source;
      this.lineEndPos = null;
    }
    this.atEnd = !incomplete;
    let next = (_a = this.next) != null ? _a : "stream";
    while (next && (incomplete || this.hasChars(1)))
      next = yield* this.parseNext(next);
  }
  atLineEnd() {
    let i = this.pos;
    let ch = this.buffer[i];
    while (ch === " " || ch === "	")
      ch = this.buffer[++i];
    if (!ch || ch === "#" || ch === "\n")
      return true;
    if (ch === "\r")
      return this.buffer[i + 1] === "\n";
    return false;
  }
  charAt(n) {
    return this.buffer[this.pos + n];
  }
  continueScalar(offset) {
    let ch = this.buffer[offset];
    if (this.indentNext > 0) {
      let indent = 0;
      while (ch === " ")
        ch = this.buffer[++indent + offset];
      if (ch === "\r") {
        const next = this.buffer[indent + offset + 1];
        if (next === "\n" || !next && !this.atEnd)
          return offset + indent + 1;
      }
      return ch === "\n" || indent >= this.indentNext || !ch && !this.atEnd ? offset + indent : -1;
    }
    if (ch === "-" || ch === ".") {
      const dt = this.buffer.substr(offset, 3);
      if ((dt === "---" || dt === "...") && isEmpty(this.buffer[offset + 3]))
        return -1;
    }
    return offset;
  }
  getLine() {
    let end = this.lineEndPos;
    if (typeof end !== "number" || end !== -1 && end < this.pos) {
      end = this.buffer.indexOf("\n", this.pos);
      this.lineEndPos = end;
    }
    if (end === -1)
      return this.atEnd ? this.buffer.substring(this.pos) : null;
    if (this.buffer[end - 1] === "\r")
      end -= 1;
    return this.buffer.substring(this.pos, end);
  }
  hasChars(n) {
    return this.pos + n <= this.buffer.length;
  }
  setNext(state) {
    this.buffer = this.buffer.substring(this.pos);
    this.pos = 0;
    this.lineEndPos = null;
    this.next = state;
    return null;
  }
  peek(n) {
    return this.buffer.substr(this.pos, n);
  }
  *parseNext(next) {
    switch (next) {
      case "stream":
        return yield* this.parseStream();
      case "line-start":
        return yield* this.parseLineStart();
      case "block-start":
        return yield* this.parseBlockStart();
      case "doc":
        return yield* this.parseDocument();
      case "flow":
        return yield* this.parseFlowCollection();
      case "quoted-scalar":
        return yield* this.parseQuotedScalar();
      case "block-scalar":
        return yield* this.parseBlockScalar();
      case "plain-scalar":
        return yield* this.parsePlainScalar();
    }
  }
  *parseStream() {
    let line = this.getLine();
    if (line === null)
      return this.setNext("stream");
    if (line[0] === BOM) {
      yield* this.pushCount(1);
      line = line.substring(1);
    }
    if (line[0] === "%") {
      let dirEnd = line.length;
      let cs = line.indexOf("#");
      while (cs !== -1) {
        const ch = line[cs - 1];
        if (ch === " " || ch === "	") {
          dirEnd = cs - 1;
          break;
        } else {
          cs = line.indexOf("#", cs + 1);
        }
      }
      while (true) {
        const ch = line[dirEnd - 1];
        if (ch === " " || ch === "	")
          dirEnd -= 1;
        else
          break;
      }
      const n = (yield* this.pushCount(dirEnd)) + (yield* this.pushSpaces(true));
      yield* this.pushCount(line.length - n);
      this.pushNewline();
      return "stream";
    }
    if (this.atLineEnd()) {
      const sp = yield* this.pushSpaces(true);
      yield* this.pushCount(line.length - sp);
      yield* this.pushNewline();
      return "stream";
    }
    yield DOCUMENT;
    return yield* this.parseLineStart();
  }
  *parseLineStart() {
    const ch = this.charAt(0);
    if (!ch && !this.atEnd)
      return this.setNext("line-start");
    if (ch === "-" || ch === ".") {
      if (!this.atEnd && !this.hasChars(4))
        return this.setNext("line-start");
      const s = this.peek(3);
      if ((s === "---" || s === "...") && isEmpty(this.charAt(3))) {
        yield* this.pushCount(3);
        this.indentValue = 0;
        this.indentNext = 0;
        return s === "---" ? "doc" : "stream";
      }
    }
    this.indentValue = yield* this.pushSpaces(false);
    if (this.indentNext > this.indentValue && !isEmpty(this.charAt(1)))
      this.indentNext = this.indentValue;
    return yield* this.parseBlockStart();
  }
  *parseBlockStart() {
    const [ch0, ch1] = this.peek(2);
    if (!ch1 && !this.atEnd)
      return this.setNext("block-start");
    if ((ch0 === "-" || ch0 === "?" || ch0 === ":") && isEmpty(ch1)) {
      const n = (yield* this.pushCount(1)) + (yield* this.pushSpaces(true));
      this.indentNext = this.indentValue + 1;
      this.indentValue += n;
      return "block-start";
    }
    return "doc";
  }
  *parseDocument() {
    yield* this.pushSpaces(true);
    const line = this.getLine();
    if (line === null)
      return this.setNext("doc");
    let n = yield* this.pushIndicators();
    switch (line[n]) {
      case "#":
        yield* this.pushCount(line.length - n);
      // fallthrough
      case void 0:
        yield* this.pushNewline();
        return yield* this.parseLineStart();
      case "{":
      case "[":
        yield* this.pushCount(1);
        this.flowKey = false;
        this.flowLevel = 1;
        return "flow";
      case "}":
      case "]":
        yield* this.pushCount(1);
        return "doc";
      case "*":
        yield* this.pushUntil(isNotAnchorChar);
        return "doc";
      case '"':
      case "'":
        return yield* this.parseQuotedScalar();
      case "|":
      case ">":
        n += yield* this.parseBlockScalarHeader();
        n += yield* this.pushSpaces(true);
        yield* this.pushCount(line.length - n);
        yield* this.pushNewline();
        return yield* this.parseBlockScalar();
      default:
        return yield* this.parsePlainScalar();
    }
  }
  *parseFlowCollection() {
    let nl, sp;
    let indent = -1;
    do {
      nl = yield* this.pushNewline();
      if (nl > 0) {
        sp = yield* this.pushSpaces(false);
        this.indentValue = indent = sp;
      } else {
        sp = 0;
      }
      sp += yield* this.pushSpaces(true);
    } while (nl + sp > 0);
    const line = this.getLine();
    if (line === null)
      return this.setNext("flow");
    if (indent !== -1 && indent < this.indentNext && line[0] !== "#" || indent === 0 && (line.startsWith("---") || line.startsWith("...")) && isEmpty(line[3])) {
      const atFlowEndMarker = indent === this.indentNext - 1 && this.flowLevel === 1 && (line[0] === "]" || line[0] === "}");
      if (!atFlowEndMarker) {
        this.flowLevel = 0;
        yield FLOW_END;
        return yield* this.parseLineStart();
      }
    }
    let n = 0;
    while (line[n] === ",") {
      n += yield* this.pushCount(1);
      n += yield* this.pushSpaces(true);
      this.flowKey = false;
    }
    n += yield* this.pushIndicators();
    switch (line[n]) {
      case void 0:
        return "flow";
      case "#":
        yield* this.pushCount(line.length - n);
        return "flow";
      case "{":
      case "[":
        yield* this.pushCount(1);
        this.flowKey = false;
        this.flowLevel += 1;
        return "flow";
      case "}":
      case "]":
        yield* this.pushCount(1);
        this.flowKey = true;
        this.flowLevel -= 1;
        return this.flowLevel ? "flow" : "doc";
      case "*":
        yield* this.pushUntil(isNotAnchorChar);
        return "flow";
      case '"':
      case "'":
        this.flowKey = true;
        return yield* this.parseQuotedScalar();
      case ":": {
        const next = this.charAt(1);
        if (this.flowKey || isEmpty(next) || next === ",") {
          this.flowKey = false;
          yield* this.pushCount(1);
          yield* this.pushSpaces(true);
          return "flow";
        }
      }
      // fallthrough
      default:
        this.flowKey = false;
        return yield* this.parsePlainScalar();
    }
  }
  *parseQuotedScalar() {
    const quote = this.charAt(0);
    let end = this.buffer.indexOf(quote, this.pos + 1);
    if (quote === "'") {
      while (end !== -1 && this.buffer[end + 1] === "'")
        end = this.buffer.indexOf("'", end + 2);
    } else {
      while (end !== -1) {
        let n = 0;
        while (this.buffer[end - 1 - n] === "\\")
          n += 1;
        if (n % 2 === 0)
          break;
        end = this.buffer.indexOf('"', end + 1);
      }
    }
    const qb = this.buffer.substring(0, end);
    let nl = qb.indexOf("\n", this.pos);
    if (nl !== -1) {
      while (nl !== -1) {
        const cs = this.continueScalar(nl + 1);
        if (cs === -1)
          break;
        nl = qb.indexOf("\n", cs);
      }
      if (nl !== -1) {
        end = nl - (qb[nl - 1] === "\r" ? 2 : 1);
      }
    }
    if (end === -1) {
      if (!this.atEnd)
        return this.setNext("quoted-scalar");
      end = this.buffer.length;
    }
    yield* this.pushToIndex(end + 1, false);
    return this.flowLevel ? "flow" : "doc";
  }
  *parseBlockScalarHeader() {
    this.blockScalarIndent = -1;
    this.blockScalarKeep = false;
    let i = this.pos;
    while (true) {
      const ch = this.buffer[++i];
      if (ch === "+")
        this.blockScalarKeep = true;
      else if (ch > "0" && ch <= "9")
        this.blockScalarIndent = Number(ch) - 1;
      else if (ch !== "-")
        break;
    }
    return yield* this.pushUntil((ch) => isEmpty(ch) || ch === "#");
  }
  *parseBlockScalar() {
    let nl = this.pos - 1;
    let indent = 0;
    let ch;
    loop: for (let i2 = this.pos; ch = this.buffer[i2]; ++i2) {
      switch (ch) {
        case " ":
          indent += 1;
          break;
        case "\n":
          nl = i2;
          indent = 0;
          break;
        case "\r": {
          const next = this.buffer[i2 + 1];
          if (!next && !this.atEnd)
            return this.setNext("block-scalar");
          if (next === "\n")
            break;
        }
        // fallthrough
        default:
          break loop;
      }
    }
    if (!ch && !this.atEnd)
      return this.setNext("block-scalar");
    if (indent >= this.indentNext) {
      if (this.blockScalarIndent === -1)
        this.indentNext = indent;
      else {
        this.indentNext = this.blockScalarIndent + (this.indentNext === 0 ? 1 : this.indentNext);
      }
      do {
        const cs = this.continueScalar(nl + 1);
        if (cs === -1)
          break;
        nl = this.buffer.indexOf("\n", cs);
      } while (nl !== -1);
      if (nl === -1) {
        if (!this.atEnd)
          return this.setNext("block-scalar");
        nl = this.buffer.length;
      }
    }
    let i = nl + 1;
    ch = this.buffer[i];
    while (ch === " ")
      ch = this.buffer[++i];
    if (ch === "	") {
      while (ch === "	" || ch === " " || ch === "\r" || ch === "\n")
        ch = this.buffer[++i];
      nl = i - 1;
    } else if (!this.blockScalarKeep) {
      do {
        let i2 = nl - 1;
        let ch2 = this.buffer[i2];
        if (ch2 === "\r")
          ch2 = this.buffer[--i2];
        const lastChar = i2;
        while (ch2 === " ")
          ch2 = this.buffer[--i2];
        if (ch2 === "\n" && i2 >= this.pos && i2 + 1 + indent > lastChar)
          nl = i2;
        else
          break;
      } while (true);
    }
    yield SCALAR2;
    yield* this.pushToIndex(nl + 1, true);
    return yield* this.parseLineStart();
  }
  *parsePlainScalar() {
    const inFlow = this.flowLevel > 0;
    let end = this.pos - 1;
    let i = this.pos - 1;
    let ch;
    while (ch = this.buffer[++i]) {
      if (ch === ":") {
        const next = this.buffer[i + 1];
        if (isEmpty(next) || inFlow && flowIndicatorChars.has(next))
          break;
        end = i;
      } else if (isEmpty(ch)) {
        let next = this.buffer[i + 1];
        if (ch === "\r") {
          if (next === "\n") {
            i += 1;
            ch = "\n";
            next = this.buffer[i + 1];
          } else
            end = i;
        }
        if (next === "#" || inFlow && flowIndicatorChars.has(next))
          break;
        if (ch === "\n") {
          const cs = this.continueScalar(i + 1);
          if (cs === -1)
            break;
          i = Math.max(i, cs - 2);
        }
      } else {
        if (inFlow && flowIndicatorChars.has(ch))
          break;
        end = i;
      }
    }
    if (!ch && !this.atEnd)
      return this.setNext("plain-scalar");
    yield SCALAR2;
    yield* this.pushToIndex(end + 1, true);
    return inFlow ? "flow" : "doc";
  }
  *pushCount(n) {
    if (n > 0) {
      yield this.buffer.substr(this.pos, n);
      this.pos += n;
      return n;
    }
    return 0;
  }
  *pushToIndex(i, allowEmpty) {
    const s = this.buffer.slice(this.pos, i);
    if (s) {
      yield s;
      this.pos += s.length;
      return s.length;
    } else if (allowEmpty)
      yield "";
    return 0;
  }
  *pushIndicators() {
    let n = 0;
    loop: while (true) {
      switch (this.charAt(0)) {
        case "!":
          n += yield* this.pushTag();
          n += yield* this.pushSpaces(true);
          continue loop;
        case "&":
          n += yield* this.pushUntil(isNotAnchorChar);
          n += yield* this.pushSpaces(true);
          continue loop;
        case "-":
        // this is an error
        case "?":
        // this is an error outside flow collections
        case ":": {
          const inFlow = this.flowLevel > 0;
          const ch1 = this.charAt(1);
          if (isEmpty(ch1) || inFlow && flowIndicatorChars.has(ch1)) {
            if (!inFlow)
              this.indentNext = this.indentValue + 1;
            else if (this.flowKey)
              this.flowKey = false;
            n += yield* this.pushCount(1);
            n += yield* this.pushSpaces(true);
            continue loop;
          }
        }
      }
      break loop;
    }
    return n;
  }
  *pushTag() {
    if (this.charAt(1) === "<") {
      let i = this.pos + 2;
      let ch = this.buffer[i];
      while (!isEmpty(ch) && ch !== ">")
        ch = this.buffer[++i];
      return yield* this.pushToIndex(ch === ">" ? i + 1 : i, false);
    } else {
      let i = this.pos + 1;
      let ch = this.buffer[i];
      while (ch) {
        if (tagChars.has(ch))
          ch = this.buffer[++i];
        else if (ch === "%" && hexDigits.has(this.buffer[i + 1]) && hexDigits.has(this.buffer[i + 2])) {
          ch = this.buffer[i += 3];
        } else
          break;
      }
      return yield* this.pushToIndex(i, false);
    }
  }
  *pushNewline() {
    const ch = this.buffer[this.pos];
    if (ch === "\n")
      return yield* this.pushCount(1);
    else if (ch === "\r" && this.charAt(1) === "\n")
      return yield* this.pushCount(2);
    else
      return 0;
  }
  *pushSpaces(allowTabs) {
    let i = this.pos - 1;
    let ch;
    do {
      ch = this.buffer[++i];
    } while (ch === " " || allowTabs && ch === "	");
    const n = i - this.pos;
    if (n > 0) {
      yield this.buffer.substr(this.pos, n);
      this.pos = i;
    }
    return n;
  }
  *pushUntil(test) {
    let i = this.pos;
    let ch = this.buffer[i];
    while (!test(ch))
      ch = this.buffer[++i];
    return yield* this.pushToIndex(i, false);
  }
};

// node_modules/yaml/browser/dist/parse/line-counter.js
var LineCounter = class {
  constructor() {
    this.lineStarts = [];
    this.addNewLine = (offset) => this.lineStarts.push(offset);
    this.linePos = (offset) => {
      let low = 0;
      let high = this.lineStarts.length;
      while (low < high) {
        const mid = low + high >> 1;
        if (this.lineStarts[mid] < offset)
          low = mid + 1;
        else
          high = mid;
      }
      if (this.lineStarts[low] === offset)
        return { line: low + 1, col: 1 };
      if (low === 0)
        return { line: 0, col: offset };
      const start = this.lineStarts[low - 1];
      return { line: low, col: offset - start + 1 };
    };
  }
};

// node_modules/yaml/browser/dist/parse/parser.js
function includesToken(list2, type) {
  for (let i = 0; i < list2.length; ++i)
    if (list2[i].type === type)
      return true;
  return false;
}
function findNonEmptyIndex(list2) {
  for (let i = 0; i < list2.length; ++i) {
    switch (list2[i].type) {
      case "space":
      case "comment":
      case "newline":
        break;
      default:
        return i;
    }
  }
  return -1;
}
function isFlowToken(token) {
  switch (token == null ? void 0 : token.type) {
    case "alias":
    case "scalar":
    case "single-quoted-scalar":
    case "double-quoted-scalar":
    case "flow-collection":
      return true;
    default:
      return false;
  }
}
function getPrevProps(parent) {
  var _a;
  switch (parent.type) {
    case "document":
      return parent.start;
    case "block-map": {
      const it = parent.items[parent.items.length - 1];
      return (_a = it.sep) != null ? _a : it.start;
    }
    case "block-seq":
      return parent.items[parent.items.length - 1].start;
    /* istanbul ignore next should not happen */
    default:
      return [];
  }
}
function getFirstKeyStartProps(prev) {
  var _a;
  if (prev.length === 0)
    return [];
  let i = prev.length;
  loop: while (--i >= 0) {
    switch (prev[i].type) {
      case "doc-start":
      case "explicit-key-ind":
      case "map-value-ind":
      case "seq-item-ind":
      case "newline":
        break loop;
    }
  }
  while (((_a = prev[++i]) == null ? void 0 : _a.type) === "space") {
  }
  return prev.splice(i, prev.length);
}
function arrayPushArray(target, source) {
  if (source.length < 1e5)
    Array.prototype.push.apply(target, source);
  else
    for (let i = 0; i < source.length; ++i)
      target.push(source[i]);
}
function fixFlowSeqItems(fc) {
  if (fc.start.type === "flow-seq-start") {
    for (const it of fc.items) {
      if (it.sep && !it.value && !includesToken(it.start, "explicit-key-ind") && !includesToken(it.sep, "map-value-ind")) {
        if (it.key)
          it.value = it.key;
        delete it.key;
        if (isFlowToken(it.value)) {
          if (it.value.end)
            arrayPushArray(it.value.end, it.sep);
          else
            it.value.end = it.sep;
        } else
          arrayPushArray(it.start, it.sep);
        delete it.sep;
      }
    }
  }
}
var Parser = class {
  /**
   * @param onNewLine - If defined, called separately with the start position of
   *   each new line (in `parse()`, including the start of input).
   */
  constructor(onNewLine) {
    this.atNewLine = true;
    this.atScalar = false;
    this.indent = 0;
    this.offset = 0;
    this.onKeyLine = false;
    this.stack = [];
    this.source = "";
    this.type = "";
    this.lexer = new Lexer();
    this.onNewLine = onNewLine;
  }
  /**
   * Parse `source` as a YAML stream.
   * If `incomplete`, a part of the last line may be left as a buffer for the next call.
   *
   * Errors are not thrown, but yielded as `{ type: 'error', message }` tokens.
   *
   * @returns A generator of tokens representing each directive, document, and other structure.
   */
  *parse(source, incomplete = false) {
    if (this.onNewLine && this.offset === 0)
      this.onNewLine(0);
    for (const lexeme of this.lexer.lex(source, incomplete))
      yield* this.next(lexeme);
    if (!incomplete)
      yield* this.end();
  }
  /**
   * Advance the parser by the `source` of one lexical token.
   */
  *next(source) {
    this.source = source;
    if (this.atScalar) {
      this.atScalar = false;
      yield* this.step();
      this.offset += source.length;
      return;
    }
    const type = tokenType(source);
    if (!type) {
      const message = `Not a YAML token: ${source}`;
      yield* this.pop({ type: "error", offset: this.offset, message, source });
      this.offset += source.length;
    } else if (type === "scalar") {
      this.atNewLine = false;
      this.atScalar = true;
      this.type = "scalar";
    } else {
      this.type = type;
      yield* this.step();
      switch (type) {
        case "newline":
          this.atNewLine = true;
          this.indent = 0;
          if (this.onNewLine)
            this.onNewLine(this.offset + source.length);
          break;
        case "space":
          if (this.atNewLine && source[0] === " ")
            this.indent += source.length;
          break;
        case "explicit-key-ind":
        case "map-value-ind":
        case "seq-item-ind":
          if (this.atNewLine)
            this.indent += source.length;
          break;
        case "doc-mode":
        case "flow-error-end":
          return;
        default:
          this.atNewLine = false;
      }
      this.offset += source.length;
    }
  }
  /** Call at end of input to push out any remaining constructions */
  *end() {
    while (this.stack.length > 0)
      yield* this.pop();
  }
  get sourceToken() {
    const st = {
      type: this.type,
      offset: this.offset,
      indent: this.indent,
      source: this.source
    };
    return st;
  }
  *step() {
    const top = this.peek(1);
    if (this.type === "doc-end" && (top == null ? void 0 : top.type) !== "doc-end") {
      while (this.stack.length > 0)
        yield* this.pop();
      this.stack.push({
        type: "doc-end",
        offset: this.offset,
        source: this.source
      });
      return;
    }
    if (!top)
      return yield* this.stream();
    switch (top.type) {
      case "document":
        return yield* this.document(top);
      case "alias":
      case "scalar":
      case "single-quoted-scalar":
      case "double-quoted-scalar":
        return yield* this.scalar(top);
      case "block-scalar":
        return yield* this.blockScalar(top);
      case "block-map":
        return yield* this.blockMap(top);
      case "block-seq":
        return yield* this.blockSequence(top);
      case "flow-collection":
        return yield* this.flowCollection(top);
      case "doc-end":
        return yield* this.documentEnd(top);
    }
    yield* this.pop();
  }
  peek(n) {
    return this.stack[this.stack.length - n];
  }
  *pop(error) {
    const token = error != null ? error : this.stack.pop();
    if (!token) {
      const message = "Tried to pop an empty stack";
      yield { type: "error", offset: this.offset, source: "", message };
    } else if (this.stack.length === 0) {
      yield token;
    } else {
      const top = this.peek(1);
      if (token.type === "block-scalar") {
        token.indent = "indent" in top ? top.indent : 0;
      } else if (token.type === "flow-collection" && top.type === "document") {
        token.indent = 0;
      }
      if (token.type === "flow-collection")
        fixFlowSeqItems(token);
      switch (top.type) {
        case "document":
          top.value = token;
          break;
        case "block-scalar":
          top.props.push(token);
          break;
        case "block-map": {
          const it = top.items[top.items.length - 1];
          if (it.value) {
            top.items.push({ start: [], key: token, sep: [] });
            this.onKeyLine = true;
            return;
          } else if (it.sep) {
            it.value = token;
          } else {
            Object.assign(it, { key: token, sep: [] });
            this.onKeyLine = !it.explicitKey;
            return;
          }
          break;
        }
        case "block-seq": {
          const it = top.items[top.items.length - 1];
          if (it.value)
            top.items.push({ start: [], value: token });
          else
            it.value = token;
          break;
        }
        case "flow-collection": {
          const it = top.items[top.items.length - 1];
          if (!it || it.value)
            top.items.push({ start: [], key: token, sep: [] });
          else if (it.sep)
            it.value = token;
          else
            Object.assign(it, { key: token, sep: [] });
          return;
        }
        /* istanbul ignore next should not happen */
        default:
          yield* this.pop();
          yield* this.pop(token);
      }
      if ((top.type === "document" || top.type === "block-map" || top.type === "block-seq") && (token.type === "block-map" || token.type === "block-seq")) {
        const last = token.items[token.items.length - 1];
        if (last && !last.sep && !last.value && last.start.length > 0 && findNonEmptyIndex(last.start) === -1 && (token.indent === 0 || last.start.every((st) => st.type !== "comment" || st.indent < token.indent))) {
          if (top.type === "document")
            top.end = last.start;
          else
            top.items.push({ start: last.start });
          token.items.splice(-1, 1);
        }
      }
    }
  }
  *stream() {
    switch (this.type) {
      case "directive-line":
        yield { type: "directive", offset: this.offset, source: this.source };
        return;
      case "byte-order-mark":
      case "space":
      case "comment":
      case "newline":
        yield this.sourceToken;
        return;
      case "doc-mode":
      case "doc-start": {
        const doc = {
          type: "document",
          offset: this.offset,
          start: []
        };
        if (this.type === "doc-start")
          doc.start.push(this.sourceToken);
        this.stack.push(doc);
        return;
      }
    }
    yield {
      type: "error",
      offset: this.offset,
      message: `Unexpected ${this.type} token in YAML stream`,
      source: this.source
    };
  }
  *document(doc) {
    if (doc.value)
      return yield* this.lineEnd(doc);
    switch (this.type) {
      case "doc-start": {
        if (findNonEmptyIndex(doc.start) !== -1) {
          yield* this.pop();
          yield* this.step();
        } else
          doc.start.push(this.sourceToken);
        return;
      }
      case "anchor":
      case "tag":
      case "space":
      case "comment":
      case "newline":
        doc.start.push(this.sourceToken);
        return;
    }
    const bv = this.startBlockValue(doc);
    if (bv)
      this.stack.push(bv);
    else {
      yield {
        type: "error",
        offset: this.offset,
        message: `Unexpected ${this.type} token in YAML document`,
        source: this.source
      };
    }
  }
  *scalar(scalar) {
    if (this.type === "map-value-ind") {
      const prev = getPrevProps(this.peek(2));
      const start = getFirstKeyStartProps(prev);
      let sep;
      if (scalar.end) {
        sep = scalar.end;
        sep.push(this.sourceToken);
        delete scalar.end;
      } else
        sep = [this.sourceToken];
      const map2 = {
        type: "block-map",
        offset: scalar.offset,
        indent: scalar.indent,
        items: [{ start, key: scalar, sep }]
      };
      this.onKeyLine = true;
      this.stack[this.stack.length - 1] = map2;
    } else
      yield* this.lineEnd(scalar);
  }
  *blockScalar(scalar) {
    switch (this.type) {
      case "space":
      case "comment":
      case "newline":
        scalar.props.push(this.sourceToken);
        return;
      case "scalar":
        scalar.source = this.source;
        this.atNewLine = true;
        this.indent = 0;
        if (this.onNewLine) {
          let nl = this.source.indexOf("\n") + 1;
          while (nl !== 0) {
            this.onNewLine(this.offset + nl);
            nl = this.source.indexOf("\n", nl) + 1;
          }
        }
        yield* this.pop();
        break;
      /* istanbul ignore next should not happen */
      default:
        yield* this.pop();
        yield* this.step();
    }
  }
  *blockMap(map2) {
    var _a;
    const it = map2.items[map2.items.length - 1];
    switch (this.type) {
      case "newline":
        this.onKeyLine = false;
        if (it.value) {
          const end = "end" in it.value ? it.value.end : void 0;
          const last = Array.isArray(end) ? end[end.length - 1] : void 0;
          if ((last == null ? void 0 : last.type) === "comment")
            end == null ? void 0 : end.push(this.sourceToken);
          else
            map2.items.push({ start: [this.sourceToken] });
        } else if (it.sep) {
          it.sep.push(this.sourceToken);
        } else {
          it.start.push(this.sourceToken);
        }
        return;
      case "space":
      case "comment":
        if (it.value) {
          map2.items.push({ start: [this.sourceToken] });
        } else if (it.sep) {
          it.sep.push(this.sourceToken);
        } else {
          if (this.atIndentedComment(it.start, map2.indent)) {
            const prev = map2.items[map2.items.length - 2];
            const end = (_a = prev == null ? void 0 : prev.value) == null ? void 0 : _a.end;
            if (Array.isArray(end)) {
              arrayPushArray(end, it.start);
              end.push(this.sourceToken);
              map2.items.pop();
              return;
            }
          }
          it.start.push(this.sourceToken);
        }
        return;
    }
    if (this.indent >= map2.indent) {
      const atMapIndent = !this.onKeyLine && this.indent === map2.indent;
      const atNextItem = atMapIndent && (it.sep || it.explicitKey) && this.type !== "seq-item-ind";
      let start = [];
      if (atNextItem && it.sep && !it.value) {
        const nl = [];
        for (let i = 0; i < it.sep.length; ++i) {
          const st = it.sep[i];
          switch (st.type) {
            case "newline":
              nl.push(i);
              break;
            case "space":
              break;
            case "comment":
              if (st.indent > map2.indent)
                nl.length = 0;
              break;
            default:
              nl.length = 0;
          }
        }
        if (nl.length >= 2)
          start = it.sep.splice(nl[1]);
      }
      switch (this.type) {
        case "anchor":
        case "tag":
          if (atNextItem || it.value) {
            start.push(this.sourceToken);
            map2.items.push({ start });
            this.onKeyLine = true;
          } else if (it.sep) {
            it.sep.push(this.sourceToken);
          } else {
            it.start.push(this.sourceToken);
          }
          return;
        case "explicit-key-ind":
          if (!it.sep && !it.explicitKey) {
            it.start.push(this.sourceToken);
            it.explicitKey = true;
          } else if (atNextItem || it.value) {
            start.push(this.sourceToken);
            map2.items.push({ start, explicitKey: true });
          } else {
            this.stack.push({
              type: "block-map",
              offset: this.offset,
              indent: this.indent,
              items: [{ start: [this.sourceToken], explicitKey: true }]
            });
          }
          this.onKeyLine = true;
          return;
        case "map-value-ind":
          if (it.explicitKey) {
            if (!it.sep) {
              if (includesToken(it.start, "newline")) {
                Object.assign(it, { key: null, sep: [this.sourceToken] });
              } else {
                const start2 = getFirstKeyStartProps(it.start);
                this.stack.push({
                  type: "block-map",
                  offset: this.offset,
                  indent: this.indent,
                  items: [{ start: start2, key: null, sep: [this.sourceToken] }]
                });
              }
            } else if (it.value) {
              map2.items.push({ start: [], key: null, sep: [this.sourceToken] });
            } else if (includesToken(it.sep, "map-value-ind")) {
              this.stack.push({
                type: "block-map",
                offset: this.offset,
                indent: this.indent,
                items: [{ start, key: null, sep: [this.sourceToken] }]
              });
            } else if (isFlowToken(it.key) && !includesToken(it.sep, "newline")) {
              const start2 = getFirstKeyStartProps(it.start);
              const key = it.key;
              const sep = it.sep;
              sep.push(this.sourceToken);
              delete it.key;
              delete it.sep;
              this.stack.push({
                type: "block-map",
                offset: this.offset,
                indent: this.indent,
                items: [{ start: start2, key, sep }]
              });
            } else if (start.length > 0) {
              it.sep = it.sep.concat(start, this.sourceToken);
            } else {
              it.sep.push(this.sourceToken);
            }
          } else {
            if (!it.sep) {
              Object.assign(it, { key: null, sep: [this.sourceToken] });
            } else if (it.value || atNextItem) {
              map2.items.push({ start, key: null, sep: [this.sourceToken] });
            } else if (includesToken(it.sep, "map-value-ind")) {
              this.stack.push({
                type: "block-map",
                offset: this.offset,
                indent: this.indent,
                items: [{ start: [], key: null, sep: [this.sourceToken] }]
              });
            } else {
              it.sep.push(this.sourceToken);
            }
          }
          this.onKeyLine = true;
          return;
        case "alias":
        case "scalar":
        case "single-quoted-scalar":
        case "double-quoted-scalar": {
          const fs = this.flowScalar(this.type);
          if (atNextItem || it.value) {
            map2.items.push({ start, key: fs, sep: [] });
            this.onKeyLine = true;
          } else if (it.sep) {
            this.stack.push(fs);
          } else {
            Object.assign(it, { key: fs, sep: [] });
            this.onKeyLine = true;
          }
          return;
        }
        default: {
          const bv = this.startBlockValue(map2);
          if (bv) {
            if (bv.type === "block-seq") {
              if (!it.explicitKey && it.sep && !includesToken(it.sep, "newline")) {
                yield* this.pop({
                  type: "error",
                  offset: this.offset,
                  message: "Unexpected block-seq-ind on same line with key",
                  source: this.source
                });
                return;
              }
            } else if (atMapIndent) {
              map2.items.push({ start });
            }
            this.stack.push(bv);
            return;
          }
        }
      }
    }
    yield* this.pop();
    yield* this.step();
  }
  *blockSequence(seq2) {
    var _a;
    const it = seq2.items[seq2.items.length - 1];
    switch (this.type) {
      case "newline":
        if (it.value) {
          const end = "end" in it.value ? it.value.end : void 0;
          const last = Array.isArray(end) ? end[end.length - 1] : void 0;
          if ((last == null ? void 0 : last.type) === "comment")
            end == null ? void 0 : end.push(this.sourceToken);
          else
            seq2.items.push({ start: [this.sourceToken] });
        } else
          it.start.push(this.sourceToken);
        return;
      case "space":
      case "comment":
        if (it.value)
          seq2.items.push({ start: [this.sourceToken] });
        else {
          if (this.atIndentedComment(it.start, seq2.indent)) {
            const prev = seq2.items[seq2.items.length - 2];
            const end = (_a = prev == null ? void 0 : prev.value) == null ? void 0 : _a.end;
            if (Array.isArray(end)) {
              arrayPushArray(end, it.start);
              end.push(this.sourceToken);
              seq2.items.pop();
              return;
            }
          }
          it.start.push(this.sourceToken);
        }
        return;
      case "anchor":
      case "tag":
        if (it.value || this.indent <= seq2.indent)
          break;
        it.start.push(this.sourceToken);
        return;
      case "seq-item-ind":
        if (this.indent !== seq2.indent)
          break;
        if (it.value || includesToken(it.start, "seq-item-ind"))
          seq2.items.push({ start: [this.sourceToken] });
        else
          it.start.push(this.sourceToken);
        return;
    }
    if (this.indent > seq2.indent) {
      const bv = this.startBlockValue(seq2);
      if (bv) {
        this.stack.push(bv);
        return;
      }
    }
    yield* this.pop();
    yield* this.step();
  }
  *flowCollection(fc) {
    const it = fc.items[fc.items.length - 1];
    if (this.type === "flow-error-end") {
      let top;
      do {
        yield* this.pop();
        top = this.peek(1);
      } while ((top == null ? void 0 : top.type) === "flow-collection");
    } else if (fc.end.length === 0) {
      switch (this.type) {
        case "comma":
        case "explicit-key-ind":
          if (!it || it.sep)
            fc.items.push({ start: [this.sourceToken] });
          else
            it.start.push(this.sourceToken);
          return;
        case "map-value-ind":
          if (!it || it.value)
            fc.items.push({ start: [], key: null, sep: [this.sourceToken] });
          else if (it.sep)
            it.sep.push(this.sourceToken);
          else
            Object.assign(it, { key: null, sep: [this.sourceToken] });
          return;
        case "space":
        case "comment":
        case "newline":
        case "anchor":
        case "tag":
          if (!it || it.value)
            fc.items.push({ start: [this.sourceToken] });
          else if (it.sep)
            it.sep.push(this.sourceToken);
          else
            it.start.push(this.sourceToken);
          return;
        case "alias":
        case "scalar":
        case "single-quoted-scalar":
        case "double-quoted-scalar": {
          const fs = this.flowScalar(this.type);
          if (!it || it.value)
            fc.items.push({ start: [], key: fs, sep: [] });
          else if (it.sep)
            this.stack.push(fs);
          else
            Object.assign(it, { key: fs, sep: [] });
          return;
        }
        case "flow-map-end":
        case "flow-seq-end":
          fc.end.push(this.sourceToken);
          return;
      }
      const bv = this.startBlockValue(fc);
      if (bv)
        this.stack.push(bv);
      else {
        yield* this.pop();
        yield* this.step();
      }
    } else {
      const parent = this.peek(2);
      if (parent.type === "block-map" && (this.type === "map-value-ind" && parent.indent === fc.indent || this.type === "newline" && !parent.items[parent.items.length - 1].sep)) {
        yield* this.pop();
        yield* this.step();
      } else if (this.type === "map-value-ind" && parent.type !== "flow-collection") {
        const prev = getPrevProps(parent);
        const start = getFirstKeyStartProps(prev);
        fixFlowSeqItems(fc);
        const sep = fc.end.splice(1, fc.end.length);
        sep.push(this.sourceToken);
        const map2 = {
          type: "block-map",
          offset: fc.offset,
          indent: fc.indent,
          items: [{ start, key: fc, sep }]
        };
        this.onKeyLine = true;
        this.stack[this.stack.length - 1] = map2;
      } else {
        yield* this.lineEnd(fc);
      }
    }
  }
  flowScalar(type) {
    if (this.onNewLine) {
      let nl = this.source.indexOf("\n") + 1;
      while (nl !== 0) {
        this.onNewLine(this.offset + nl);
        nl = this.source.indexOf("\n", nl) + 1;
      }
    }
    return {
      type,
      offset: this.offset,
      indent: this.indent,
      source: this.source
    };
  }
  startBlockValue(parent) {
    switch (this.type) {
      case "alias":
      case "scalar":
      case "single-quoted-scalar":
      case "double-quoted-scalar":
        return this.flowScalar(this.type);
      case "block-scalar-header":
        return {
          type: "block-scalar",
          offset: this.offset,
          indent: this.indent,
          props: [this.sourceToken],
          source: ""
        };
      case "flow-map-start":
      case "flow-seq-start":
        return {
          type: "flow-collection",
          offset: this.offset,
          indent: this.indent,
          start: this.sourceToken,
          items: [],
          end: []
        };
      case "seq-item-ind":
        return {
          type: "block-seq",
          offset: this.offset,
          indent: this.indent,
          items: [{ start: [this.sourceToken] }]
        };
      case "explicit-key-ind": {
        this.onKeyLine = true;
        const prev = getPrevProps(parent);
        const start = getFirstKeyStartProps(prev);
        start.push(this.sourceToken);
        return {
          type: "block-map",
          offset: this.offset,
          indent: this.indent,
          items: [{ start, explicitKey: true }]
        };
      }
      case "map-value-ind": {
        this.onKeyLine = true;
        const prev = getPrevProps(parent);
        const start = getFirstKeyStartProps(prev);
        return {
          type: "block-map",
          offset: this.offset,
          indent: this.indent,
          items: [{ start, key: null, sep: [this.sourceToken] }]
        };
      }
    }
    return null;
  }
  atIndentedComment(start, indent) {
    if (this.type !== "comment")
      return false;
    if (this.indent <= indent)
      return false;
    return start.every((st) => st.type === "newline" || st.type === "space");
  }
  *documentEnd(docEnd) {
    if (this.type !== "doc-mode") {
      if (docEnd.end)
        docEnd.end.push(this.sourceToken);
      else
        docEnd.end = [this.sourceToken];
      if (this.type === "newline")
        yield* this.pop();
    }
  }
  *lineEnd(token) {
    switch (this.type) {
      case "comma":
      case "doc-start":
      case "doc-end":
      case "flow-seq-end":
      case "flow-map-end":
      case "map-value-ind":
        yield* this.pop();
        yield* this.step();
        break;
      case "newline":
        this.onKeyLine = false;
      // fallthrough
      case "space":
      case "comment":
      default:
        if (token.end)
          token.end.push(this.sourceToken);
        else
          token.end = [this.sourceToken];
        if (this.type === "newline")
          yield* this.pop();
    }
  }
};

// node_modules/yaml/browser/dist/public-api.js
function parseOptions(options) {
  const prettyErrors = options.prettyErrors !== false;
  const lineCounter = options.lineCounter || prettyErrors && new LineCounter() || null;
  return { lineCounter, prettyErrors };
}
function parseDocument(source, options = {}) {
  const { lineCounter, prettyErrors } = parseOptions(options);
  const parser = new Parser(lineCounter == null ? void 0 : lineCounter.addNewLine);
  const composer = new Composer(options);
  let doc = null;
  for (const _doc of composer.compose(parser.parse(source), true, source.length)) {
    if (!doc)
      doc = _doc;
    else if (doc.options.logLevel !== "silent") {
      doc.errors.push(new YAMLParseError(_doc.range.slice(0, 2), "MULTIPLE_DOCS", "Source contains multiple documents; please use YAML.parseAllDocuments()"));
      break;
    }
  }
  if (prettyErrors && lineCounter) {
    doc.errors.forEach(prettifyError(source, lineCounter));
    doc.warnings.forEach(prettifyError(source, lineCounter));
  }
  return doc;
}
function stringify3(value, replacer, options) {
  var _a;
  let _replacer = null;
  if (typeof replacer === "function" || Array.isArray(replacer)) {
    _replacer = replacer;
  } else if (options === void 0 && replacer) {
    options = replacer;
  }
  if (typeof options === "string")
    options = options.length;
  if (typeof options === "number") {
    const indent = Math.round(options);
    options = indent < 1 ? void 0 : indent > 8 ? { indent: 8 } : { indent };
  }
  if (value === void 0) {
    const { keepUndefined } = (_a = options != null ? options : replacer) != null ? _a : {};
    if (!keepUndefined)
      return void 0;
  }
  if (isDocument(value) && !_replacer)
    return value.toString(options);
  return new Document(value, _replacer, options).toString(options);
}

// src/core/note-conversion.ts
function parseNote(content, label) {
  if (!content.startsWith("---\n") && !content.startsWith("---\r\n")) return { frontmatter: {}, body: content };
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) return { error: `${label} frontmatter is not closed.` };
  const document2 = parseDocument(match[1]);
  if (document2.errors.length) return { error: `${label} frontmatter is invalid.` };
  const value = document2.toJS();
  if (value !== null && (typeof value !== "object" || Array.isArray(value))) return { error: `${label} frontmatter must be a mapping.` };
  return { frontmatter: value || {}, body: content.slice(match[0].length) };
}
function isFailure(value) {
  return "error" in value;
}
function list(value) {
  return Array.isArray(value) ? value : value === void 0 || value === null || value === "" ? [] : [value];
}
function renderDate(value, date) {
  return typeof value === "string" ? value.replace(/{{date}}/g, date) : value;
}
function planNoteConversion(input) {
  if (!input.sourcePath.toLowerCase().endsWith(".md")) return { ok: false, error: "Only Markdown files can be converted." };
  const folders = input.folders.map((folder) => folder.replace(/^\/+|\/+$/g, "")).filter(Boolean);
  if (folders.length !== 3 || new Set(folders).size !== folders.length || folders.some((folder, index) => folders.some((other, otherIndex) => index !== otherIndex && other.startsWith(`${folder}/`))) || !folders.includes(input.target.folder.replace(/^\/+|\/+$/g, ""))) return { ok: false, error: "Knowledge-note folders must be configured, unique, and non-overlapping." };
  if (!input.templatePath.toLowerCase().endsWith(".md") || !input.templateContent) return { ok: false, error: "The target template is missing or unreadable." };
  const source = parseNote(input.sourceContent, "Source");
  if (isFailure(source)) return { ok: false, error: source.error };
  const template = parseNote(input.templateContent, "Template");
  if (isFailure(template)) return { ok: false, error: template.error };
  const name = input.sourcePath.slice(input.sourcePath.lastIndexOf("/") + 1);
  const destinationPath = `${input.target.folder.replace(/\/$/, "")}/${name}`;
  if (destinationPath === input.sourcePath) return { ok: false, error: "The note already has this type." };
  if (input.destinationOccupied) return { ok: false, error: "A file or folder already exists at the destination." };
  const renderedTemplate = Object.entries(template.frontmatter).reduce((values, [key, value]) => {
    values[key] = renderDate(value, input.conversionDate);
    return values;
  }, {});
  const merged = { ...renderedTemplate, ...source.frontmatter };
  for (const key of /* @__PURE__ */ new Set([...Object.keys(source.frontmatter), ...Object.keys(template.frontmatter)])) {
    if (key === "tags" || key === "aliases" || Array.isArray(source.frontmatter[key]) || Array.isArray(template.frontmatter[key])) merged[key] = [...new Set([...list(source.frontmatter[key]), ...list(template.frontmatter[key])].map((value) => String(value).trim()).filter(Boolean))];
  }
  Object.assign(merged, { type: input.target.typeValue, "状态": input.target.status, "处理日期": input.conversionDate });
  const body = source.body;
  return { ok: true, plan: { destinationPath, content: `---
${stringify3(merged).replace(/\s+$/, "")}
---
${body}` } };
}

// src/core/workbench-document-model.ts
var folderError = "Workbench document folders must be configured, unique, and non-overlapping.";
function normalizePath(path) {
  return path.replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
}
function isWithinFolder(path, folder) {
  return path === folder || path.startsWith(`${folder}/`);
}
function validateWorkbenchDocumentFolders(folders) {
  const paths = Object.values(folders).map(normalizePath);
  if (paths.some((path) => !path) || new Set(paths).size !== paths.length) return { ok: false, error: folderError };
  if (paths.some((path, index) => paths.some((other, otherIndex) => index !== otherIndex && isWithinFolder(path, other)))) {
    return { ok: false, error: folderError };
  }
  return { ok: true };
}

// src/core/workbench-document-creation.ts
function normalizePath2(path) {
  return path.replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
}
function planWorkbenchDocumentCreation(input) {
  const root = normalizePath2(input.folders[input.type]);
  const title = input.title.trim();
  if (!root || !title) return { ok: false, error: "A document title and destination folder are required." };
  const occupied = new Set(input.occupiedPaths.map(normalizePath2));
  if (input.type === "task") {
    let index2 = 1;
    for (; ; ) {
      const suffix = index2 === 1 ? "" : " " + index2;
      const documentPath = root + "/" + title + suffix + ".md";
      if (!occupied.has(documentPath)) return { ok: true, plan: { directories: [root], documentPath } };
      index2 += 1;
    }
  }
  let index = 1;
  for (; ; ) {
    const suffix = index === 1 ? "" : " " + index;
    const workspace = root + "/" + title + suffix;
    if (!occupied.has(workspace)) {
      return { ok: true, plan: {
        directories: [root, workspace, workspace + "/任务"],
        documentPath: workspace + "/项目.md"
      } };
    }
    index += 1;
  }
}

// src/core/workbench-document-templates.ts
function planWorkbenchDocumentTemplateSetup(input) {
  var _a;
  const duplicatePaths = /* @__PURE__ */ new Set();
  const seenPaths = /* @__PURE__ */ new Set();
  for (const template of input.templates) {
    if (seenPaths.has(template.path)) duplicatePaths.add(template.path);
    seenPaths.add(template.path);
  }
  const creations = [];
  const conflicts = [];
  for (const template of input.templates) {
    if (duplicatePaths.has(template.path)) {
      conflicts.push({ type: template.type, path: template.path, reason: "duplicate-path" });
      continue;
    }
    const entry = (_a = input.existingEntries[template.path]) != null ? _a : "missing";
    if (entry === "missing") creations.push(template);
    if (entry === "folder") conflicts.push({ type: template.type, path: template.path, reason: "folder" });
  }
  return { creations, conflicts };
}

// src/main.ts
var { ItemView, Menu, Modal, Notice, Plugin, PluginSettingTab, Setting, normalizePath: normalizePath3 } = require("obsidian");
var VIEW_TYPE = "focus-workbench-view";
var DEFAULT_SETTINGS = {
  language: "zh-CN",
  taskBasePath: "目标与任务/任务总表.base",
  taskFolder: "Omni Workbench/任务",
  projectFolder: "Omni Workbench/项目",
  inboxFolder: "Omni Workbench/闪念笔记",
  literatureFolder: "Omni Workbench/文献笔记",
  permanentFolder: "Omni Workbench/永久笔记",
  taskTemplatePath: "模板/任务模板.md",
  projectTemplatePath: "模板/项目模板.md",
  ...knowledgeNoteTemplateDefaults(),
  schema: {
    typeField: "type",
    typeValue: "任务",
    statusField: "任务状态",
    projectField: "所属项目",
    priorityField: "任务优先级",
    planField: "计划日期",
    doneField: "完成",
    expectedField: "预计耗时分钟",
    timerStateField: "计时状态",
    timerStartedField: "计时开始时间",
    elapsedField: "累计耗时秒",
    completedAtField: "完成日期"
  }
};
var UI_TEXT_EN = {
  "创建": "Create",
  "取消": "Cancel",
  "保存": "Save",
  "保存修改": "Save changes",
  "保存配置": "Save configuration",
  "首页": "Home",
  "任务工作台": "Tasks",
  "知识工作台": "Knowledge",
  "打开任务总表": "Open task table",
  "刷新": "Refresh",
  "今天，做重要的事。": "Do what matters today.",
  "任务指挥舱": "Task command center",
  "知识卡片笔记流程": "Card-note workflow",
  "还没有可推进的任务": "No actionable tasks yet",
  "还没有待推进的任务": "No tasks to advance yet",
  "创建一项任务后，它会自动出现在这里。": "Create a task and it will appear here automatically.",
  "未关联项目": "No project",
  "开始专注": "Start focus",
  "暂停专注": "Pause focus",
  "完成": "Complete",
  "查看": "View",
  "新建任务": "New task",
  "任务标题": "Task title",
  "记录灵感": "Capture idea",
  "一句话写下想法": "Write the idea in one sentence",
  "知识卡片流程": "Knowledge card flow",
  "灵感收集箱": "Idea inbox",
  "先快速捕捉，之后再整理成任务或知识卡片。": "Capture quickly, then organize it into a task or knowledge card.",
  "收集箱是空的。下一条灵感，先记下来。": "Your inbox is empty. Capture the next idea when it arrives.",
  "未分类": "Uncategorized",
  "左键打开 · 右键编辑": "Click to open · Right-click to edit",
  "卡片笔记知识流": "Card-note knowledge flow",
  "闪念笔记捕捉想法，文献笔记保留来源与输入，永久笔记沉淀为可复用的独立知识。": "Fleeting notes capture ideas, literature notes preserve sources, and permanent notes turn them into reusable knowledge.",
  "① 闪念笔记": "① Fleeting notes",
  "② 文献笔记": "② Literature notes",
  "③ 永久笔记": "③ Permanent notes",
  "暂无笔记": "No notes yet",
  "闪念笔记": "Fleeting notes",
  "文献笔记": "Literature notes",
  "永久笔记": "Permanent notes",
  "知识笔记": "Knowledge notes",
  "快速捕捉、尚未整理的想法。": "Quick captures that have not been organized yet.",
  "带来源、摘录与阅读线索的输入卡片。": "Source cards with excerpts and reading context.",
  "用自己的话写成、可以独立链接和复用的知识。": "Knowledge written in your own words that can be linked and reused independently.",
  "任务旁捕捉闪念，七天内补清上下文，再沉淀为永久笔记、归档为文献笔记，或明确舍弃。": "Capture ideas beside tasks, clarify them within seven days, then preserve, archive, convert, or discard them.",
  "待处理": "Pending",
  "今日到期": "Due today",
  "已逾期": "Overdue",
  "就地捕捉": "Capture in context",
  "澄清闪念": "Clarify the idea",
  "必须分流": "Decide its destination",
  "在任务旁一键建立关联闪念": "Create a linked idea beside a task",
  "一次只保留一个想法，补足来源与上下文": "Keep one idea per note and add its source and context",
  "沉淀永久 / 归档文献 / 转任务 / 舍弃": "Permanent note / Literature note / Task / Discard",
  "一个独立观点，用自己的话表达并可复用": "An independent, reusable idea in your own words",
  "保留书籍、文章或外部资料的来源语境": "Preserve the source context from books, articles, or external material",
  "想法已经形成明确行动与完成标准": "The idea now has a clear action and definition of done",
  "重复、无价值或已失去时效，不继续囤积": "Duplicate, low-value, or outdated—do not keep it",
  "过期闪念": "Overdue ideas",
  "这些闪念已经超过暂存周期，请先做去留判断": "These ideas exceeded the holding period. Decide their destination first.",
  "按最早捕捉顺序整理；第七天必须完成分流": "Review oldest first; every idea needs a destination by day seven.",
  "没有逾期闪念": "No overdue ideas",
  "本周收件箱已清空": "This week's inbox is clear",
  "很好，继续保持每周分流。": "Nice work—keep up the weekly review.",
  "记录新想法后，它会出现在这里。": "New ideas will appear here after you capture them.",
  "已逾期 · 立即判断": "Overdue · Decide now",
  "今天必须分流": "Decide today",
  "左键打开正文 · 右键编辑与分流": "Click to open · Right-click to edit and triage",
  "闪念处理周期": "Idea review cycle",
  "捕捉要快，分流要明确": "Capture quickly, decide clearly",
  "收件箱已清空，可以记录下一条想法": "The inbox is clear—capture your next idea",
  "＋ 记录闪念": "+ Capture idea",
  "知识卡片库": "Knowledge card library",
  "检索已经沉淀或仍在处理的卡片笔记。": "Search card notes that are settled or still being processed.",
  "搜索文章标题…": "Search note titles…",
  "搜索文章": "Search notes",
  "按标题筛选知识库": "Filter the knowledge base by title",
  "全部文章": "All notes",
  "暂无匹配文章。": "No matching notes.",
  "右键编辑": "Right-click to edit",
  "打开 →": "Open →",
  "‹ 上月": "‹ Previous",
  "本月": "This month",
  "下月 ›": "Next ›",
  "今天": "Today",
  "日历": "Calendar",
  "时间轴": "Timeline",
  "统计": "Statistics",
  "全部项目": "All projects",
  "全部优先级": "All priorities",
  "全部状态": "All statuses",
  "未完成": "Incomplete",
  "已完成": "Completed",
  "项目筛选": "Filter by project",
  "优先级筛选": "Filter by priority",
  "状态筛选": "Filter by status",
  "任务统计": "Task statistics",
  "统计基于当前筛选条件，不改变任务数据。": "Statistics use the current filters and do not change task data.",
  "待推进": "To advance",
  "进行中": "In progress",
  "待做": "To do",
  "暂停": "Paused",
  "任务状态分布": "Task status distribution",
  "当前筛选": "Current filters",
  "优先级分布": "Priority distribution",
  "项目进展": "Project progress",
  "今日任务": "Today's tasks",
  "任务视图": "Task views",
  "全部任务": "All tasks",
  "今日": "Today",
  "全部待办": "All open",
  "搜索任务、项目或优先级…": "Search tasks, projects, or priority…",
  "搜索任务": "Search tasks",
  "＋ 新建任务": "+ New task",
  "今天要推进什么？": "What will you advance today?",
  "创建一项任务，开始安排今天": "Create a task to start planning today",
  "这里还没有任务。": "No tasks here yet.",
  "未安排日期": "No date",
  "未设时限": "No time limit",
  "剩余时间": "Time remaining",
  "打开文档 ↗": "Open note ↗",
  "＋ 关联闪念": "+ Linked idea",
  "左键聚焦 · 右键编辑": "Click to focus · Right-click to edit",
  "编辑任务": "Edit task",
  "修改任务属性，或直接执行常用工作流。卡片本身保持简洁，不再展开操作面板。": "Edit task properties or run a common workflow. Task cards stay compact and focused.",
  "所属项目": "Project",
  "优先级": "Priority",
  "任务状态": "Task status",
  "计划日期": "Planned date",
  "预计耗时（分钟）": "Estimate (minutes)",
  "快捷操作": "Quick actions",
  "打开文档": "Open note",
  "设为焦点": "Set as focus",
  "标记完成": "Mark complete",
  "删除任务": "Delete task",
  "预计耗时请输入大于等于 0 的整数分钟数。": "Enter an estimated duration as a whole number of minutes, 0 or greater.",
  "创建任务": "Create task",
  "任务已创建": "Task created.",
  "填写任务属性并保存，任务会写入任务目录，不会离开当前工作台。": "Fill in the task properties and save. The task is written to the task folder without leaving the workbench.",
  "编辑闪念": "Edit idea",
  "闪念标题": "Idea title",
  "标签（用逗号或空格分隔）": "Tags (separate with commas or spaces)",
  "例如：写作, Unity, 设计": "Example: writing, Unity, design",
  "卡片笔记分流": "Card-note triage",
  "完善后沉淀为永久笔记，保留外部来源时归档为文献笔记；形成明确行动则转任务，无价值则舍弃。": "Turn a refined idea into a permanent note, preserve external sources as literature notes, convert clear actions into tasks, or discard low-value items.",
  "打开正文": "Open note",
  "沉淀永久": "Make permanent",
  "归档文献": "Archive source",
  "打开来源任务": "Open source task",
  "转为任务": "Convert to task",
  "舍弃": "Discard",
  "舍弃闪念": "Discard idea",
  "删除": "Delete",
  "连接现有仓库": "Connect an existing vault",
  "仅在你已有自己的目录或 frontmatter 字段时使用。填写现有位置和字段名，不会移动或修改笔记。": "Use this only if you already have custom folders or frontmatter fields. Existing notes will not be moved or modified.",
  "闪念笔记目录": "Fleeting-note folder",
  "文献笔记目录": "Literature-note folder",
  "永久笔记目录": "Permanent-note folder",
  "任务目录": "Task folder",
  "项目目录（可选）": "Project folder (optional)",
  "任务类型字段": "Task type field",
  "任务类型值": "Task type value",
  "状态字段": "Status field",
  "计划日期字段": "Planned date field",
  "所属项目字段": "Project field",
  "优先级字段": "Priority field",
  "相对 vault 的目录路径": "Folder path relative to the vault",
  "frontmatter 字段名": "Frontmatter field name",
  "界面语言": "Interface language",
  "选择 Omni Workbench 的界面语言。仓库目录、字段和值不会被改写。": "Choose the Omni Workbench interface language. Vault folders, fields, and values are not rewritten.",
  "首次使用 · 约 1 分钟": "First use · About 1 minute",
  "先搭好工作区，再开始记录": "Set up the workspace, then start capturing",
  "转换为笔记类型": "Convert to note type",
  "开始转换": "Convert",
  "推荐初始化会创建任务系统、任务模板、任务总表和三类知识文件夹。已有文件只会保留，不会覆盖或移动。": "Recommended setup creates the task system, template, task table, and three knowledge folders. Existing files are preserved.",
  "准备完成": "Ready",
  "项已就绪": "items ready",
  "推荐结构已准备好": "Recommended structure is ready",
  "自动创建推荐结构": "Create the recommended structure",
  "检查并补齐": "Check and complete",
  "一键初始化": "One-click setup",
  "初始化推荐工作区": "Set up the recommended workspace",
  "将补齐三类知识文件夹、任务与项目目录、任务模板和任务总表。已有文件不会被覆盖，是否继续？": "This will add the three knowledge folders, task and project folders, task template, and task table. Existing files will not be overwritten. Continue?",
  "开始初始化": "Start setup",
  "包括 3 个知识目录、任务、项目与每日进展目录，以及任务模板和 Obsidian Bases 任务总表；可以重复执行，已有内容不会被改写。": "Includes three knowledge folders, task, project, and daily-progress folders, plus a task template and Obsidian Bases task table. It is safe to run again.",
  "三步上手流程": "Three-step getting-started flow",
  "它们代表内容从随手记录到可复用知识的三个阶段，而不是三个主题分类。": "They represent three stages from quick capture to reusable knowledge, not three topic categories.",
  "收集": "Capture",
  "整理": "Organize",
  "沉淀": "Distill",
  "想法先进入闪念笔记": "Ideas enter fleeting notes first",
  "阅读输入放入文献笔记": "Reading input goes into literature notes",
  "自己的结论写成永久笔记": "Write your conclusions as permanent notes",
  "第 1 步：理解三个知识文件夹": "Step 1: Understand the three knowledge folders",
  "第 2 步：确认任务如何保存": "Step 2: Confirm how tasks are saved",
  "第 3 步：理解模板和任务总表": "Step 3: Understand templates and the task table",
  "先记下来": "Capture first",
  "保留来源": "Keep the source",
  "形成自己的观点": "Form your own view",
  "保存位置": "Storage location",
  "目录已存在": "Folder exists",
  "初始化时会自动创建": "Created automatically during setup",
  "项目目录": "Project folder",
  "临时想法、灵感、待整理的问题。允许不完整，重点是不丢失。": "Temporary thoughts, inspiration, and questions to organize. They may be incomplete—the goal is not to lose them.",
  "例如：尝试把周报改成项目复盘": "Example: turn the weekly report into a project retrospective",
  "书籍、文章、播客和会议中的摘录与理解，应该能回到原始来源。": "Excerpts and insights from books, articles, podcasts, and meetings that retain a path back to the source.",
  "例如：《深度工作》第 2 章摘录": "Example: notes from chapter 2 of Deep Work",
  "用自己的话写成一条独立结论，脱离原文也能理解、链接和复用。": "An independent conclusion in your own words that remains understandable, linkable, and reusable.",
  "例如：减少切换成本比延长工时更有效": "Example: reducing context switching is more effective than working longer",
  "任务目录是插件读取任务的来源；项目目录用于任务编辑器的项目选项。": "The task folder is the plugin's task source; the project folder supplies project choices in the task editor.",
  "新建任务保存在这里，插件也只从这里读取符合字段规则的任务。": "New tasks are saved here, and the plugin reads matching tasks only from this folder.",
  "此目录中的笔记会出现在任务的“所属项目”下拉菜单中。": "Notes in this folder appear in the task editor's Project menu.",
  "模板决定新任务笔记的内容；任务总表只是额外的表格视图，两者用途不同。": "The template defines new task notes; the task table is an additional table view with a different purpose.",
  "任务模板 · 决定新任务长什么样": "Task template · Defines new task notes",
  "任务总表 · 用表格浏览同一批任务": "Task table · Browse the same tasks in a table",
  "模板已找到": "Template found",
  "任务总表已找到": "Task table found",
  "等待初始化": "Waiting for setup",
  "每次在工作台点击“新建任务”时使用。插件会自动写入计划日期、创建日期和任务标题。模板不存在时仍可使用内置格式。": "Used whenever you select New task. The plugin writes the planned date, creation date, and title; a built-in format remains available if the template is missing.",
  "这是可选的 Obsidian Bases 视图，提供“全部、今日、进行中、已完成”表格。它不会决定插件读取哪些任务。": "This optional Obsidian Bases view provides All, Today, In progress, and Completed tables. It does not control which tasks the plugin reads.",
  "已有仓库或自定义字段": "Existing vault or custom fields",
  "如果你已经有自己的目录和 frontmatter 字段，再使用高级映射；全新用户可以跳过。": "Use advanced mapping if you already have custom folders and frontmatter fields. New users can skip it.",
  "映射已有任务、项目、三类知识目录与字段名称。不会移动或修改任何已有笔记。": "Map existing task, project, and knowledge folders and field names without moving or modifying notes.",
  "打开高级映射": "Open advanced mapping",
  "请选择任务目录。": "Choose a task folder.",
  "Omni Workbench 配置已保存。": "Omni Workbench configuration saved.",
  "已创建关联闪念，并写入双向链接": "Linked idea created with backlinks.",
  "闪念笔记已更新": "Idea note updated.",
  "已从闪念创建任务，并保留双向来源": "Task created from the idea with bidirectional source links.",
  "已转为文献笔记": "Converted to a literature note.",
  "已转为永久笔记": "Converted to a permanent note.",
  "闪念已移入回收站，任务关联已清理": "Idea moved to the trash and task links removed.",
  "任务已更新": "Task updated.",
  "任务已移入回收站": "Task moved to the trash.",
  "已暂停专注": "Focus paused.",
  "已开始专注": "Focus started.",
  "任务已完成": "Task completed.",
  "请输入标题。": "Enter a title.",
  "标题过长，请控制在 120 个字符以内。": "Keep the title within 120 characters.",
  '标题不能包含 \\ / : * ? " < > | 或路径片段。': 'The title cannot contain \\ / : * ? " < > | or path segments.',
  "标题不能以句点或空格结尾。": "The title cannot end with a period or space.",
  "该标题是 Windows 保留文件名。": "This title is a reserved Windows filename.",
  "任务模板路径必须以 .md 结尾。": "The task template path must end in .md.",
  "知识笔记模板路径必须以 .md 结尾。": "A knowledge-note template path must end in .md.",
  "知识笔记模板路径不能重复。": "Knowledge-note template paths must be unique.",
  "任务总表路径必须以 .base 结尾。": "The task table path must end in .base.",
  "任务模板路径当前是一个文件夹，请换一个 .md 文件路径。": "The task template path points to a folder. Choose an .md file path.",
  "知识笔记模板路径当前是一个文件夹，请换一个 .md 文件路径。": "A knowledge-note template path points to a folder. Choose an .md file path.",
  "任务总表路径当前是一个文件夹，请换一个 .base 文件路径。": "The task table path points to a folder. Choose a .base file path.",
  "推荐工作区已准备好，可以打开 Omni Workbench 开始使用。": "The recommended workspace is ready. Open Omni Workbench to get started.",
  "推荐初始化会创建任务系统、任务与知识笔记模板、任务总表和三类知识文件夹。已有文件只会保留，不会覆盖或移动。": "Recommended setup creates the task system, task and knowledge-note templates, task table, and three knowledge folders. Existing files are preserved without overwriting or moving them.",
  "包括 3 个知识目录、任务、项目与每日进展目录，以及任务与三类知识笔记模板和 Obsidian Bases 任务总表；可以重复执行，已有内容不会被改写。": "Includes three knowledge folders; task, project, and daily-progress folders; task and three knowledge-note templates; and an Obsidian Bases task table. It is safe to run again.",
  "将补齐三类知识文件夹、任务与项目目录、任务与三类知识笔记模板和任务总表。已有文件不会被覆盖，是否继续？": "This will add the three knowledge folders; task and project folders; task and three knowledge-note templates; and the task table. Existing files will not be overwritten. Continue?",
  "三类知识笔记模板 · 定义转换后的笔记格式": "Three knowledge-note templates · Define converted note formats",
  "每种知识笔记类型都有独立模板。转换时仅应用模板的 frontmatter，原笔记正文会完整保留。": "Each knowledge-note type has its own template. Conversion applies only its frontmatter and preserves the original note body.",
  "闪念笔记模板": "Fleeting-note template",
  "文献笔记模板": "Literature-note template",
  "永久笔记模板": "Permanent-note template",
  "知识模板已找到": "Knowledge-note template found",
  "项任务": "tasks",
  "已选择": "Selected",
  "全选": "Select all",
  "取消全选": "Clear all",
  "批量编辑": "Batch edit",
  "清除选择": "Clear selection",
  "批量编辑任务": "Batch edit tasks",
  "保持原样": "Keep as is",
  "应用到所选任务": "Apply to selected tasks",
  "请先勾选要编辑的任务。": "Select tasks to edit first.",
  "左键聚焦 · Ctrl/Cmd 多选 · 右键编辑": "Click to focus · Ctrl/Cmd to multi-select · Right-click to edit"
};
var UI_DYNAMIC_EN = [
  [/^编辑任务：(.+)$/, "Edit task: $1"],
  [/^编辑闪念：(.+)$/, "Edit idea: $1"],
  [/^闪念：(.+)$/, "Idea: $1"],
  [/^任务：(.+)$/, "Task: $1"],
  [/^来自任务 · (.+)$/, "From task · $1"],
  [/^捕捉于 (.+)$/, "Captured on $1"],
  [/^(\d+) 条$/, "$1 items"],
  [/^(\d+) 篇$/, "$1 notes"],
  [/^(\d+) 项$/, "$1 tasks"],
  [/^今天捕捉 · 剩 7 天$/, "Captured today · 7 days left"],
  [/^(\d+) 天前捕捉 · 剩 (\d+) 天$/, "Captured $1 days ago · $2 days left"],
  [/^7 天前捕捉 · 今天到期$/, "Captured 7 days ago · Due today"],
  [/^(\d+) 天前捕捉 · 已逾期 (\d+) 天$/, "Captured $1 days ago · $2 days overdue"],
  [/^剩余 (.+)$/, "Remaining $1"],
  [/^已专注 (.+)$/, "Focused $1"],
  [/^已完成 · (\d+) 项$/, "Completed · $1 tasks"],
  [/^\+(\d+) 项任务$/, "+$1 tasks"],
  [/^共 (\d+) 项任务 · 完成率 (\d+)%$/, "$1 tasks · $2% complete"],
  [/^(.+)：(\d+) 项$/, "$1: $2 tasks"],
  [/^当前有 (\d+) 项今日任务$/, "$1 tasks scheduled today"],
  [/^今日 (\d+) 项 · 进行中 (\d+) 项 · 已逾期 (\d+) 项$/, "Today $1 · In progress $2 · Overdue $3"],
  [/^待推进 (\d+) 项 · 进行中 (\d+) 项 · 已逾期 (\d+) 项$/, "To advance $1 · In progress $2 · Overdue $3"],
  [/^待处理闪念 (\d+) 条 · 已收录笔记 (\d+) 篇 · 在这里检索、整理并沉淀知识$/, "$1 ideas pending · $2 notes collected · Search, organize, and distill knowledge here"],
  [/^当前有 (\d+) 条闪念；优先处理超过七天的内容$/, "$1 ideas pending; prioritize those older than seven days"],
  [/^“(.+)”的计时已超过 12 小时，已自动暂停，累计时长已保留。$/, "“$1” ran for over 12 hours and was paused automatically. Elapsed time was preserved."],
  [/^“(.+)”已超过预计耗时，继续计时中。$/, "“$1” is over its estimate and is still timing."],
  [/^无法打开：(.+)$/, "Unable to open: $1"],
  [/^将“(.+)”移入 Obsidian 回收站？$/, "Move “$1” to the Obsidian trash?"],
  [/^将“(.+)”移入 Obsidian 回收站，并清理任务中的关联？$/, "Move “$1” to the Obsidian trash and remove its task links?"],
  [/^已选择 (\d+) 项任务；.*$/, "Selected $1 tasks; only the fields you change are updated."],
  [/^已选择 (\d+) 项任务$/, "Selected $1 tasks"],
  [/^已更新 (\d+) 项任务$/, "Updated $1 tasks"],
  [/^选择任务：(.+)$/, "Select task: $1"]
];
var ACTIVE_LANGUAGE = DEFAULT_SETTINGS.language;
function translateUiText(value, language = ACTIVE_LANGUAGE) {
  const text = String(value != null ? value : "");
  if (language !== "en") return text;
  if (UI_TEXT_EN[text]) return UI_TEXT_EN[text];
  for (const [pattern, replacement] of UI_DYNAMIC_EN) if (pattern.test(text)) return text.replace(pattern, replacement);
  return text;
}
function localizeElement(root, language = ACTIVE_LANGUAGE) {
  if (!root || language !== "en") return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach((node) => {
    node.nodeValue = translateUiText(node.nodeValue, language);
  });
  root.querySelectorAll("[placeholder],[aria-label],[title]").forEach((element) => {
    ["placeholder", "aria-label", "title"].forEach((name) => {
      if (element.hasAttribute(name)) element.setAttribute(name, translateUiText(element.getAttribute(name), language));
    });
  });
}
function showNotice(message) {
  return new Notice(translateUiText(message));
}
var TextPromptModal = class extends Modal {
  constructor(app, title, placeholder, submit, validate = () => "") {
    super(app);
    this.title = title;
    this.placeholder = placeholder;
    this.submit = submit;
    this.validate = validate;
  }
  onOpen() {
    const { contentEl } = this;
    this.modalEl.addClass("pvd-modal-shell");
    contentEl.addClass("pvd-modal");
    contentEl.createEl("h2", { text: this.title });
    const input = contentEl.createEl("input", { type: "text", placeholder: this.placeholder });
    const actions = contentEl.createDiv({ cls: "pvd-modal-actions" });
    const save = actions.createEl("button", { text: "创建", cls: "mod-cta" });
    const commit = async () => {
      const value = input.value.trim();
      const error = this.validate(value);
      if (error) {
        showNotice(error);
        return;
      }
      await this.submit(value);
      this.close();
    };
    save.addEventListener("click", () => void commit());
    input.addEventListener("keydown", (event) => {
      if (event.isComposing || event.keyCode === 229) return;
      if (event.key === "Enter") void commit();
    });
    localizeElement(contentEl);
    window.setTimeout(() => input.focus(), 0);
  }
};
var ConfirmModal = class extends Modal {
  constructor(app, title, message, confirmText, onConfirm) {
    super(app);
    this.title = title;
    this.message = message;
    this.confirmText = confirmText;
    this.onConfirm = onConfirm;
  }
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
    ok.addEventListener("click", async () => {
      await this.onConfirm();
      this.close();
    });
    localizeElement(contentEl);
  }
};
var TaskEditorModal = class extends Modal {
  constructor(app, file, data, projects, submit, workflow = [], options = {}) {
    super(app);
    this.file = file;
    this.data = data;
    this.projects = projects;
    this.submit = submit;
    this.workflow = workflow;
    this.options = options;
  }
  onOpen() {
    const { contentEl } = this;
    this.modalEl.addClass("pvd-modal-shell");
    contentEl.addClass("pvd-modal");
    const data = this.data;
    contentEl.createEl("h2", { text: this.options.heading || `编辑任务：${this.file.basename}` });
    if (this.options.lead) contentEl.createEl("p", { cls: "pvd-modal-lead", text: this.options.lead });
    else contentEl.createEl("p", { cls: "pvd-modal-lead", text: "修改任务属性，或直接执行常用工作流。卡片本身保持简洁，不再展开操作面板。" });
    const form = contentEl.createDiv({ cls: "pvd-task-editor" });
    const field = (label, element) => {
      const row = form.createEl("label");
      row.createSpan({ text: label });
      row.appendChild(element);
      return element;
    };
    let title = null;
    if (this.options.mode === "create") {
      title = field("任务标题", document.createElement("input"));
      title.type = "text";
      title.placeholder = "任务标题";
      title.value = String(data.title || "");
    }
    const project = field("所属项目", document.createElement("select"));
    project.createEl("option", { text: "未关联项目", value: "" });
    const options = [...new Set([...this.projects, String(data.project || "")].filter(Boolean))].sort((a, b) => a.localeCompare(b, "zh-CN"));
    options.forEach((name) => project.createEl("option", { text: name, value: name }));
    project.value = String(data.project || "");
    const priority = field("优先级", document.createElement("select"));
    ["P0", "P1", "P2"].forEach((value) => priority.createEl("option", { text: value, value }));
    priority.value = data.priority || "P2";
    const status = field("任务状态", document.createElement("select"));
    ["待做", "进行中", "暂停", "完成"].forEach((value) => status.createEl("option", { text: value, value }));
    status.value = data.status || "待做";
    const date = field("计划日期", document.createElement("input"));
    date.type = "date";
    date.value = data.plan || "";
    const estimate = field("预计耗时（分钟）", document.createElement("input"));
    estimate.type = "number";
    estimate.min = "0";
    estimate.step = "1";
    estimate.value = data.estimate || "";
    if (this.workflow.length) {
      const section = contentEl.createDiv({ cls: "pvd-modal-workflow" });
      section.createEl("strong", { text: "快捷操作" });
      const workflowActions = section.createDiv({ cls: "pvd-modal-workflow-actions" });
      this.workflow.forEach((item) => {
        const button = workflowActions.createEl("button", { text: item.label, cls: item.cls || "" });
        button.addEventListener("click", async () => {
          this.close();
          await item.run();
        });
      });
    }
    const actions = contentEl.createDiv({ cls: "pvd-modal-actions" });
    const save = actions.createEl("button", { text: this.options.submitLabel || "保存", cls: "mod-cta" });
    const commit = async () => {
      const minutes = estimate.value.trim();
      if (minutes && (!/^\d+$/.test(minutes) || Number(minutes) < 0)) {
        showNotice("预计耗时请输入大于等于 0 的整数分钟数。");
        return;
      }
      const values = { project: project.value.trim(), priority: priority.value, status: status.value, plan: date.value, estimate: minutes };
      if (title) {
        const nextTitle = title.value.trim();
        const error = this.options.validateTitle ? this.options.validateTitle(nextTitle) : "";
        if (error) {
          showNotice(error);
          return;
        }
        values.title = nextTitle;
      }
      await this.submit(values);
      this.close();
    };
    save.addEventListener("click", () => void commit());
    if (title) {
      title.addEventListener("keydown", (event) => {
        if (event.isComposing || event.keyCode === 229) return;
        if (event.key === "Enter") void commit();
      });
      window.setTimeout(() => title.focus(), 0);
    }
    localizeElement(contentEl);
  }
};
var IdeaEditorModal = class extends Modal {
  constructor(app, view, file) {
    super(app);
    this.view = view;
    this.file = file;
  }
  onOpen() {
    const { contentEl } = this;
    const view = this.view;
    const file = this.file;
    const linkedTask = view.ideaLinkedTask(file);
    this.modalEl.addClass("pvd-modal-shell");
    contentEl.addClass("pvd-modal");
    contentEl.addClass("pvd-idea-editor-modal");
    contentEl.createEl("h2", { text: `编辑闪念：${view.ideaTitle(file)}` });
    contentEl.createEl("p", { cls: "pvd-modal-lead", text: `${view.ideaTimeLabel(file)}${linkedTask ? ` · 来源任务：${linkedTask.basename}` : " · 暂无关联任务"}` });
    const form = contentEl.createDiv({ cls: "pvd-task-editor" });
    const titleRow = form.createEl("label");
    titleRow.createSpan({ text: "闪念标题" });
    const title = titleRow.createEl("input", { type: "text", value: view.ideaTitle(file) });
    const tagsRow = form.createEl("label");
    tagsRow.createSpan({ text: "标签（用逗号或空格分隔）" });
    const tags = tagsRow.createEl("input", { type: "text", value: view.ideaTags(file).join(", "), placeholder: "例如：写作, Unity, 设计" });
    const section = contentEl.createDiv({ cls: "pvd-modal-workflow" });
    section.createEl("strong", { text: "卡片笔记分流" });
    section.createEl("p", { text: "完善后沉淀为永久笔记，保留外部来源时归档为文献笔记；形成明确行动则转任务，无价值则舍弃。" });
    const workflow = section.createDiv({ cls: "pvd-modal-workflow-actions" });
    const action = (label, run, cls = "") => {
      const button = workflow.createEl("button", { text: label, cls });
      button.addEventListener("click", async () => {
        this.close();
        await run();
      });
    };
    action("打开正文", () => view.openFile(file), "mod-cta");
    action("沉淀永久", () => view.convertIdeaToNote(file, "permanent"));
    action("归档文献", () => view.convertIdeaToNote(file, "literature"));
    if (linkedTask) action("打开来源任务", () => view.openFile(linkedTask));
    else action("转为任务", () => view.convertIdeaToTask(file));
    action("舍弃", () => view.discardIdea(file), "pvd-danger");
    const actions = contentEl.createDiv({ cls: "pvd-modal-actions" });
    const cancel = actions.createEl("button", { text: "取消" });
    const save = actions.createEl("button", { text: "保存修改", cls: "mod-cta" });
    cancel.addEventListener("click", () => this.close());
    save.addEventListener("click", async () => {
      const nextTitle = title.value.trim();
      const error = view.validateNoteTitle(nextTitle);
      if (error) {
        showNotice(error);
        return;
      }
      await view.updateIdea(file, { title: nextTitle, tags: tags.value });
      this.close();
    });
    localizeElement(contentEl);
    window.setTimeout(() => title.focus(), 0);
  }
};
var BatchTaskEditorModal = class extends Modal {
  constructor(app, files, projects, submit) {
    super(app);
    this.files = files;
    this.projects = projects;
    this.submit = submit;
  }
  onOpen() {
    const { contentEl } = this;
    this.modalEl.addClass("pvd-modal-shell");
    contentEl.addClass("pvd-modal");
    contentEl.createEl("h2", { text: "批量编辑任务" });
    contentEl.createEl("p", { cls: "pvd-modal-lead", text: `已选择 ${this.files.length} 项任务；只更新你修改的字段，未修改的字段保持原样。` });
    const form = contentEl.createDiv({ cls: "pvd-task-editor" });
    const field = (label, element) => {
      const row = form.createEl("label");
      row.createSpan({ text: label });
      row.appendChild(element);
      return element;
    };
    const project = field("所属项目", document.createElement("select"));
    project.createEl("option", { text: "保持原样", value: "" });
    const options = [...new Set(this.projects.filter(Boolean))].sort((a, b) => a.localeCompare(b, "zh-CN"));
    options.forEach((name) => project.createEl("option", { text: name, value: name }));
    const priority = field("优先级", document.createElement("select"));
    priority.createEl("option", { text: "保持原样", value: "" });
    ["P0", "P1", "P2"].forEach((value) => priority.createEl("option", { text: value, value }));
    const status = field("任务状态", document.createElement("select"));
    status.createEl("option", { text: "保持原样", value: "保持" });
    ["待做", "进行中", "暂停", "完成"].forEach((value) => status.createEl("option", { text: value, value }));
    const date = field("计划日期", document.createElement("input"));
    date.type = "date";
    date.value = "";
    const actions = contentEl.createDiv({ cls: "pvd-modal-actions" });
    const cancel = actions.createEl("button", { text: "取消" });
    const save = actions.createEl("button", { text: "应用到所选任务", cls: "mod-cta" });
    cancel.addEventListener("click", () => this.close());
    save.addEventListener("click", async () => {
      const values = {
        project: project.value ? project.value.trim() : void 0,
        priority: priority.value || void 0,
        status: status.value || void 0,
        plan: date.value.trim() || void 0
      };
      await this.submit(values);
      this.close();
    });
    localizeElement(contentEl);
    window.setTimeout(() => project.focus(), 0);
  }
};
var SetupModal = class extends Modal {
  constructor(app, plugin) {
    super(app);
    this.plugin = plugin;
  }
  onOpen() {
    const { contentEl } = this;
    this.modalEl.addClass("pvd-modal-shell");
    contentEl.addClass("pvd-modal");
    contentEl.createEl("h2", { text: "连接现有仓库" });
    contentEl.createEl("p", { text: "仅在你已有自己的目录或 frontmatter 字段时使用。填写现有位置和字段名，不会移动或修改笔记。" });
    const form = contentEl.createDiv({ cls: "pvd-task-editor" });
    const settings = this.plugin.settings;
    const schema4 = Object.assign({}, DEFAULT_SETTINGS.schema, settings.schema || {});
    const fields = [
      ["闪念笔记目录", "inboxFolder", settings.inboxFolder || ""],
      ["文献笔记目录", "literatureFolder", settings.literatureFolder || ""],
      ["永久笔记目录", "permanentFolder", settings.permanentFolder || ""],
      ["任务目录", "taskFolder", settings.taskFolder || ""],
      ["项目目录（可选）", "projectFolder", settings.projectFolder || ""],
      ["任务类型字段", "typeField", schema4.typeField],
      ["任务类型值", "typeValue", schema4.typeValue],
      ["状态字段", "statusField", schema4.statusField],
      ["计划日期字段", "planField", schema4.planField],
      ["所属项目字段", "projectField", schema4.projectField],
      ["优先级字段", "priorityField", schema4.priorityField]
    ];
    const inputs = /* @__PURE__ */ new Map();
    fields.forEach(([label, key, value]) => {
      const row = form.createEl("label");
      row.createSpan({ text: label });
      const input = row.createEl("input", { type: "text", value, placeholder: key.includes("Folder") ? "相对 vault 的目录路径" : "frontmatter 字段名" });
      inputs.set(key, input);
    });
    const actions = contentEl.createDiv({ cls: "pvd-modal-actions" });
    const save = actions.createEl("button", { text: "保存配置", cls: "mod-cta" });
    save.addEventListener("click", async () => {
      const taskFolder = normalizeVaultPath(inputs.get("taskFolder").value);
      if (!taskFolder) {
        showNotice("请选择任务目录。");
        return;
      }
      const nextSchema = Object.assign({}, schema4);
      ["typeField", "typeValue", "statusField", "planField", "projectField", "priorityField"].forEach((key) => nextSchema[key] = inputs.get(key).value.trim() || schema4[key]);
      ["inboxFolder", "literatureFolder", "permanentFolder", "taskFolder", "projectFolder"].forEach((key) => this.plugin.settings[key] = normalizeVaultPath(inputs.get(key).value));
      this.plugin.settings.schema = nextSchema;
      await this.plugin.saveSettings();
      this.close();
      showNotice("Omni Workbench 配置已保存。");
    });
    localizeElement(contentEl);
  }
};
var FocusWorkbenchView = class extends ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.tab = "home";
    this.taskView = "today";
    this.taskVisualMode = "calendar";
    this.taskVisualProject = "";
    this.taskVisualPriority = "";
    this.taskVisualStatus = "all";
    this.timelineDays = 14;
    this.taskFilter = "active";
    this.completedExpanded = false;
    this.ideaOverdueCollapsed = false;
    this.ideaPendingCollapsed = false;
    this.focusPath = "";
    this.taskSearch = "";
    this.selectedTasks = /* @__PURE__ */ new Set();
    this.knowledgeFilter = "all";
    this.knowledgeSearch = "";
    this.calendarMonth = this.monthStart(/* @__PURE__ */ new Date());
  }
  getViewType() {
    return VIEW_TYPE;
  }
  getDisplayText() {
    return "Omni Workbench";
  }
  getIcon() {
    return "layout-dashboard";
  }
  async onOpen() {
    this.sourceTasks = [];
    this.overtimeNotified = /* @__PURE__ */ new Set();
    await this.reconcileStaleTimers();
    await this.render();
    this.timerId = window.setInterval(() => this.updateTimers(), 1e3);
    this.registerDomEvent(window, "keydown", (event) => this.handleShortcut(event));
    this.registerEvent(this.app.metadataCache.on("changed", (file) => this.scheduleRefreshIfWatched(file.path)));
    this.registerEvent(this.app.vault.on("create", (file) => this.scheduleRefreshIfWatched(file.path)));
    this.registerEvent(this.app.vault.on("delete", (file) => this.scheduleRefreshIfWatched(file.path)));
    this.registerEvent(this.app.vault.on("rename", (file, oldPath) => this.scheduleRefreshIfWatched(file.path, oldPath)));
  }
  async onClose() {
    if (this.timerId) window.clearInterval(this.timerId);
    if (this.refreshTimeout) window.clearTimeout(this.refreshTimeout);
  }
  isWatchedPath(path) {
    if (!path) return false;
    const cfg = this.config();
    return path === "知识库配置.md" || [cfg.task, cfg.project, cfg.inbox, cfg.permanent, cfg.literature].some((dir) => dir && (path === dir || path.startsWith(`${dir}/`)));
  }
  scheduleRefreshIfWatched(...paths) {
    if (paths.some((path) => this.isWatchedPath(path))) this.scheduleRefresh();
  }
  scheduleRefresh() {
    if (this.refreshTimeout) window.clearTimeout(this.refreshTimeout);
    this.refreshTimeout = window.setTimeout(() => {
      this.refreshTimeout = null;
      const active = document.activeElement;
      if (active && this.contentEl.contains(active) && /^(input|textarea|select)$/i.test(active.tagName)) {
        this.scheduleRefresh();
        return;
      }
      void this.render();
    }, 300);
  }
  async reconcileStaleTimers() {
    const staleMs = 12 * 3600 * 1e3;
    for (const file of this.allTaskFiles()) {
      if (this.timerState(file) !== "进行中") continue;
      const started = this.timestamp(this.taskProperty(file, "timerStartedField"));
      if (!started || Date.now() - started.getTime() <= staleMs) continue;
      await this.app.fileManager.processFrontMatter(file, (fm) => this.pauseTimerFrontmatter(fm));
      showNotice(`“${file.basename}”的计时已超过 12 小时，已自动暂停，累计时长已保留。`);
    }
  }
  config() {
    var _a;
    const file = this.app.vault.getAbstractFileByPath("知识库配置.md");
    const fm = file ? ((_a = this.app.metadataCache.getFileCache(file)) == null ? void 0 : _a.frontmatter) || {} : {};
    const path = (key, fallback) => normalizeVaultPath(fm[key] || fallback);
    const goals = path("goals_folder", "目标与任务");
    const configured = this.plugin.settings;
    return { inbox: configured.inboxFolder || path("inbox_folder", "闪念笔记"), permanent: configured.permanentFolder || path("permanent_folder", "永久笔记"), literature: configured.literatureFolder || path("literature_folder", "文献笔记"), goals, task: configured.taskFolder || path("task_folder", `${goals}/任务管理/任务`), project: configured.projectFolder || path("project_folder", `${goals}/任务管理/项目`), taskBase: configured.taskBasePath };
  }
  schema() {
    return Object.assign({}, DEFAULT_SETTINGS.schema, this.plugin.settings.schema || {});
  }
  taskProperty(file, key) {
    return this.meta(file)[this.schema()[key]];
  }
  setTaskProperty(frontmatter, key, value) {
    frontmatter[this.schema()[key]] = value;
  }
  files() {
    return this.app.vault.getMarkdownFiles();
  }
  meta(file) {
    var _a;
    return ((_a = this.app.metadataCache.getFileCache(file)) == null ? void 0 : _a.frontmatter) || {};
  }
  starts(file, dir) {
    return file.path === dir || file.path.startsWith(`${dir}/`);
  }
  useful(file) {
    return file.extension === "md" && file.basename !== "首页" && !file.name.startsWith("README");
  }
  date(value) {
    return parseDate(value);
  }
  timestamp(value) {
    return parseTimestamp(value);
  }
  today() {
    const date = /* @__PURE__ */ new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }
  monthStart(value) {
    return new Date(value.getFullYear(), value.getMonth(), 1);
  }
  daysInMonth(value) {
    return new Date(value.getFullYear(), value.getMonth() + 1, 0).getDate();
  }
  calendarDateKey(year, month, day) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  calendarMonthLabel() {
    return new Intl.DateTimeFormat(this.plugin.settings.language === "en" ? "en-US" : "zh-CN", { year: "numeric", month: "long" }).format(this.calendarMonth);
  }
  changeCalendarMonth(offset) {
    this.calendarMonth = new Date(this.calendarMonth.getFullYear(), this.calendarMonth.getMonth() + offset, 1);
    void this.render();
  }
  dateKey(value) {
    return dateKey(value || this.today());
  }
  calendarKey(value) {
    return calendarKey(value);
  }
  todayKey() {
    return this.dateKey(this.today());
  }
  sameCalendarDay(left, right = this.today()) {
    return sameCalendarDay(left, right);
  }
  isPastCalendarDay(value, reference = this.today()) {
    return isPastCalendarDay(value, reference);
  }
  taskStatus(file) {
    return String(this.taskProperty(file, "statusField") || "待做");
  }
  taskDone(file) {
    return this.taskStatus(file) === "完成" || this.taskProperty(file, "doneField") === true;
  }
  taskPlan(file) {
    return this.date(this.taskProperty(file, "planField"));
  }
  taskPlanKey(file) {
    return this.calendarKey(this.taskProperty(file, "planField"));
  }
  isTodayTask(file, todayKey = this.todayKey()) {
    return !this.taskDone(file) && this.taskPlanKey(file) === todayKey;
  }
  priority(file) {
    const value = String(this.taskProperty(file, "priorityField") || "P2");
    return ["P0", "P1", "P2"].includes(value) ? value : "P2";
  }
  timerState(file) {
    return String(this.taskProperty(file, "timerStateField") || "未开始");
  }
  expectedSeconds(file) {
    return expectedSeconds(this.taskProperty(file, "expectedField"));
  }
  elapsedSeconds(file, now = Date.now()) {
    return elapsedSeconds({ stored: this.taskProperty(file, "elapsedField"), running: this.timerState(file) === "进行中", started: this.taskProperty(file, "timerStartedField") }, now);
  }
  formatDuration(seconds) {
    return formatDuration(seconds);
  }
  timerLabel(file) {
    const expected = this.expectedSeconds(file);
    const elapsed = this.elapsedSeconds(file);
    return expected ? `剩余 ${this.formatDuration(expected - elapsed)}` : `已专注 ${this.formatDuration(elapsed)}`;
  }
  allTaskFiles() {
    const schema4 = this.schema();
    const taskFolder = this.config().task;
    return this.files().filter((file) => this.starts(file, taskFolder) && String(this.meta(file)[schema4.typeField] || "") === schema4.typeValue);
  }
  projectOptions() {
    return this.files().filter((file) => this.starts(file, this.config().project) && this.useful(file)).map((file) => file.basename).sort((a, b) => a.localeCompare(b, "zh-CN"));
  }
  tasks() {
    return this.sourceTasks || [];
  }
  async refreshTaskSource() {
    this.sourceTasks = this.allTaskFiles();
    this.sourceMode = "schema";
  }
  compareTasks(a, b) {
    var _a, _b;
    const rank = { P0: 0, P1: 1, P2: 2 };
    return rank[this.priority(a)] - rank[this.priority(b)] || (((_a = this.taskPlan(a)) == null ? void 0 : _a.getTime()) || Infinity) - (((_b = this.taskPlan(b)) == null ? void 0 : _b.getTime()) || Infinity) || a.basename.localeCompare(b.basename, "zh-CN");
  }
  focusTask(tasks) {
    const selected = tasks.find((file) => file.path === this.focusPath);
    if (selected) return selected;
    const active = tasks.filter((file) => !this.taskDone(file));
    return active.find((file) => this.timerState(file) === "进行中") || active.filter((file) => this.isTodayTask(file)).sort((a, b) => this.compareTasks(a, b))[0] || active.sort((a, b) => this.compareTasks(a, b))[0];
  }
  async setFocus(file) {
    this.focusPath = file.path;
    await this.render();
  }
  // Task labels select the shared focus; documents only open through explicit open actions.
  handleShortcut(event) {
    if (event.defaultPrevented || event.altKey) return;
    const target = event.target;
    if (target && (/(input|textarea|select)/i.test(target.tagName || "") || target.isContentEditable || typeof target.closest === "function" && target.closest(".cm-editor"))) return;
    if (target && target !== document.body && target !== document.documentElement && !this.contentEl.contains(target)) return;
    if ((!target || target === document.body || target === document.documentElement) && this.app.workspace.activeLeaf !== this.leaf) return;
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      this.tab = "tasks";
      this.taskSearch = "";
      void this.render().then(() => {
        var _a;
        return (_a = this.contentEl.querySelector(".pvd-task-search")) == null ? void 0 : _a.focus();
      });
    }
    if (event.key.toLowerCase() === "n" && !event.ctrlKey && !event.metaKey) {
      event.preventDefault();
      void this.createTask();
    }
  }
  async openFile(fileOrPath) {
    const path = typeof fileOrPath === "string" ? fileOrPath : fileOrPath == null ? void 0 : fileOrPath.path;
    const file = path ? this.app.vault.getAbstractFileByPath(path) : null;
    if (!file || file.children) {
      showNotice(`无法打开：${path || "未指定文件"}`);
      return;
    }
    await this.app.workspace.getLeaf(false).openFile(file);
  }
  button(parent, text, action, cls = "") {
    const button = parent.createEl("button", { text, cls });
    button.addEventListener("click", (event) => void action(event));
    return button;
  }
  bindContextEditor(element, file, editor, label) {
    element.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      event.stopPropagation();
      editor();
    });
    element.addEventListener("keydown", (event) => {
      if (event.key === "ContextMenu" || event.shiftKey && event.key === "F10") {
        event.preventDefault();
        editor();
      }
    });
    element.setAttribute("title", `${label} · 右键编辑`);
  }
  bindCardOpenAndEdit(element, file, editor, label) {
    element.setAttribute("role", "button");
    element.setAttribute("tabindex", "0");
    element.setAttribute("aria-label", `${label}；左键打开，右键编辑`);
    element.addEventListener("click", (event) => {
      var _a, _b;
      if ((_b = (_a = event.target).closest) == null ? void 0 : _b.call(_a, "button")) return;
      void this.openFile(file);
    });
    element.addEventListener("keydown", (event) => {
      if ((event.key === "Enter" || event.key === " ") && !event.shiftKey) {
        event.preventDefault();
        void this.openFile(file);
      }
    });
    this.bindContextEditor(element, file, editor, label);
  }
  bindTaskLabel(element, file, label) {
    this.bindContextEditor(element, file, () => this.editTask(file), label);
    element.setAttribute("title", `${label} · 左键聚焦 · 右键编辑`);
    element.setAttribute("aria-label", `${label}；左键设为聚焦任务，右键编辑`);
  }
  bindTaskFocusAndEdit(element, file, label) {
    element.setAttribute("role", "button");
    element.setAttribute("tabindex", "0");
    element.addEventListener("click", (event) => {
      var _a, _b;
      if ((_b = (_a = event.target).closest) == null ? void 0 : _b.call(_a, "button")) return;
      void this.setFocus(file);
    });
    element.addEventListener("keydown", (event) => {
      if ((event.key === "Enter" || event.key === " ") && !event.shiftKey) {
        event.preventDefault();
        void this.setFocus(file);
      }
    });
    this.bindTaskLabel(element, file, label);
  }
  isOvertime(file) {
    const expected = this.expectedSeconds(file);
    return expected > 0 && this.elapsedSeconds(file) > expected;
  }
  remainingPercent(file) {
    const expected = this.expectedSeconds(file);
    if (!expected) return null;
    return Math.max(0, Math.min(100, (expected - this.elapsedSeconds(file)) / expected * 100));
  }
  timer(parent, file) {
    return parent.createEl("strong", { cls: `pvd-timer ${this.timerState(file) === "进行中" ? "is-running" : ""} ${this.isOvertime(file) ? "is-over" : ""}`, text: this.timerLabel(file), attr: { "data-pvd-timer": file.path } });
  }
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
    this.timerTick = (this.timerTick || 0) + 1;
    if (this.timerTick % 300 === 0) void this.reconcileStaleTimers();
    this.contentEl.querySelectorAll("[data-pvd-timer]").forEach((element) => {
      const file = this.app.vault.getAbstractFileByPath(element.getAttribute("data-pvd-timer"));
      if (!file || file.children) return;
      const running = this.timerState(file) === "进行中";
      element.textContent = translateUiText(this.timerLabel(file), this.plugin.settings.language);
      element.classList.toggle("is-running", running);
      element.classList.toggle("is-over", this.isOvertime(file));
      if (!running || !this.isOvertime(file)) return;
      const key = `${file.path}:${this.taskProperty(file, "timerStartedField")}`;
      if (this.overtimeNotified && !this.overtimeNotified.has(key)) {
        this.overtimeNotified.add(key);
        showNotice(`“${file.basename}”已超过预计耗时，继续计时中。`);
      }
    });
    this.contentEl.querySelectorAll("[data-pvd-liquid]").forEach((liquid) => {
      const file = this.app.vault.getAbstractFileByPath(liquid.getAttribute("data-pvd-liquid"));
      if (!file || file.children) return;
      const percent = this.remainingPercent(file);
      const running = this.timerState(file) === "进行中";
      liquid.style.setProperty("--pvd-liquid-level", `${percent === null ? 100 : percent}%`);
      liquid.classList.toggle("is-running", running);
      liquid.classList.toggle("is-over", this.isOvertime(file));
      liquid.classList.toggle("is-unlimited", percent === null);
      liquid.setAttribute("aria-label", this.plugin.settings.language === "en" ? `Countdown: ${percent === null ? "no estimate" : `${Math.round(percent)}% remaining`}` : `倒计时液体：${percent === null ? "未设预计时长" : `剩余 ${Math.round(percent)}%`}`);
      liquid.querySelector("[data-pvd-liquid-percent]").textContent = percent === null ? "—" : `${Math.round(percent)}%`;
      liquid.querySelector("[data-pvd-liquid-caption]").textContent = translateUiText(percent === null ? "未设时限" : "剩余时间", this.plugin.settings.language);
    });
  }
  async render() {
    await this.refreshTaskSource();
    const root = this.contentEl;
    const previousTab = this.renderedTab;
    const scrollTop = previousTab === this.tab ? root.scrollTop : 0;
    const focused = document.activeElement;
    const refocus = focused && root.contains(focused) && /^(input|textarea)$/i.test(focused.tagName) && typeof focused.className === "string" && focused.className.includes("pvd-task-search") ? { start: focused.selectionStart, end: focused.selectionEnd } : null;
    root.empty();
    root.addClass("pvd-root");
    const shell = root.createDiv({ cls: "pvd-shell" });
    const header = shell.createEl("header", { cls: "pvd-header" });
    const title = header.createDiv();
    title.createEl("p", { text: "PERSONAL WORKSPACE" });
    title.createEl("h1", { text: this.tab === "home" ? "今天，做重要的事。" : this.tab === "tasks" ? "任务指挥舱" : "知识卡片笔记流程" });
    title.createSpan({ text: this.dateKey() });
    const nav = header.createDiv({ cls: "pvd-tabs" });
    this.button(nav, "首页", async () => {
      this.tab = "home";
      await this.render();
    }, this.tab === "home" ? "is-active" : "");
    this.button(nav, "任务工作台", async () => {
      this.tab = "tasks";
      await this.render();
    }, this.tab === "tasks" ? "is-active" : "");
    this.button(nav, "知识工作台", async () => {
      this.tab = "knowledge";
      await this.render();
    }, this.tab === "knowledge" ? "is-active" : "");
    this.button(nav, "打开任务总表", () => this.openFile(this.config().taskBase));
    this.button(nav, "刷新", () => this.render());
    if (this.tab === "home") await this.renderHome(shell);
    else if (this.tab === "tasks") await this.renderTasks(shell);
    else await this.renderKnowledge(shell);
    localizeElement(root, this.plugin.settings.language);
    this.renderedTab = this.tab;
    root.scrollTop = scrollTop;
    if (refocus) {
      const search = root.querySelector(".pvd-task-search");
      if (search) {
        search.focus();
        try {
          search.setSelectionRange(refocus.start, refocus.end);
        } catch (error) {
        }
      }
    }
  }
  async renderHome(shell) {
    const cfg = this.config();
    const tasks = this.tasks();
    const active = tasks.filter((file) => !this.taskDone(file));
    const focus = this.focusTask(tasks);
    const focusCard = shell.createEl("section", { cls: "pvd-focus pvd-card" });
    const copy = focusCard.createDiv();
    copy.createEl("p", { text: "MISSION CONTROL" });
    copy.createEl("h2", { text: focus ? focus.basename : "还没有可推进的任务" });
    const project = focus ? String(this.taskProperty(focus, "projectField") || "未关联项目").replace(/^\[\[|\]\]$/g, "") : "创建一项任务后，它会自动出现在这里。";
    copy.createSpan({ text: focus ? `${project} · ${this.taskStatus(focus)} · ${this.priority(focus)}` : project });
    if (focus) this.timer(copy, focus);
    if (focus) this.bindTaskFocusAndEdit(focusCard, focus, `任务：${focus.basename}`);
    const actions = focusCard.createDiv({ cls: "pvd-actions" });
    if (focus) {
      if (!this.taskDone(focus)) {
        this.button(actions, this.timerState(focus) === "进行中" ? "暂停专注" : "开始专注", () => this.toggleTimer(focus), "mod-cta");
        this.button(actions, "完成", () => this.complete(focus));
      }
      this.button(actions, "查看", () => this.openFile(focus));
    } else this.button(actions, "新建任务", () => this.createTask(), "mod-cta");
    const quick = shell.createDiv({ cls: "pvd-quick" });
    this.button(quick, "记录灵感", () => this.createIdea());
    this.button(quick, "新建任务", () => this.createTask());
    this.button(quick, "新建项目", () => this.createProject());
    this.button(quick, "知识卡片流程", async () => {
      this.tab = "knowledge";
      await this.render();
    });
    const inbox = this.pendingIdeas().sort((a, b) => this.ideaCapturedAt(a) - this.ideaCapturedAt(b)).slice(0, 5);
    const inboxCard = shell.createEl("section", { cls: "pvd-card pvd-inbox" });
    const inboxHead = inboxCard.createDiv({ cls: "pvd-section-head" });
    const inboxCopy = inboxHead.createDiv();
    inboxCopy.createEl("h2", { text: "灵感收集箱" });
    inboxCopy.createEl("p", { text: "先快速捕捉，之后再整理成任务或知识卡片。" });
    this.button(inboxHead, "记录灵感", () => this.createIdea(), "mod-cta");
    const ideas = inboxCard.createDiv({ cls: "pvd-ideas" });
    if (!inbox.length) ideas.createEl("p", { text: "收集箱是空的。下一条灵感，先记下来。" });
    inbox.forEach((file) => {
      const row = ideas.createDiv({ cls: "pvd-idea" });
      const tags = Array.isArray(this.meta(file).tags) ? this.meta(file).tags.slice(0, 2).map((tag) => `#${tag}`).join(" ") : "未分类";
      const ideaCopy = row.createDiv();
      ideaCopy.createEl("strong", { text: this.ideaTitle(file) });
      ideaCopy.createSpan({ text: `${tags} · ${this.ideaTimeLabel(file)}` });
      row.createSpan({ cls: "pvd-card-edit-hint", text: "左键打开 · 右键编辑" });
      this.bindCardOpenAndEdit(row, file, () => this.editIdea(file), `闪念：${this.ideaTitle(file)}`);
    });
    const stream = shell.createEl("section", { cls: "pvd-card pvd-stream" });
    stream.createEl("h2", { text: "卡片笔记知识流" });
    stream.createEl("p", { text: "闪念笔记捕捉想法，文献笔记保留来源与输入，永久笔记沉淀为可复用的独立知识。" });
    const lanes = stream.createDiv({ cls: "pvd-lanes" });
    [["① 闪念笔记", cfg.inbox], ["② 文献笔记", cfg.literature], ["③ 永久笔记", cfg.permanent]].forEach(([name, dir]) => {
      const lane = lanes.createDiv({ cls: "pvd-lane" });
      lane.createEl("h3", { text: name });
      const notes = this.files().filter((file) => this.starts(file, dir) && this.useful(file)).sort((a, b) => b.stat.mtime - a.stat.mtime).slice(0, 3);
      if (!notes.length) lane.createEl("span", { text: "暂无笔记" });
      notes.forEach((file) => {
        const note = this.button(lane, "", () => this.openFile(file), "pvd-note");
        note.createEl("strong", { text: file.basename });
        if (this.starts(file, cfg.inbox)) this.bindContextEditor(note, file, () => this.editIdea(file), `闪念：${this.ideaTitle(file)}`);
      });
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
  knowledgeNotes(group) {
    const files = group.key === "fleeting" ? this.pendingIdeas() : this.files().filter((file) => this.starts(file, group.dir) && this.useful(file));
    return files.sort((a, b) => b.stat.mtime - a.stat.mtime);
  }
  pendingIdeas() {
    const completed = /* @__PURE__ */ new Set(["已处理", "完成", "归档", "已转任务", "已转文献", "已转永久", "丢弃"]);
    return this.files().filter((file) => this.starts(file, this.config().inbox) && this.useful(file)).filter((file) => !completed.has(String(this.meta(file)["状态"] || this.meta(file)["处理状态"] || "收集")));
  }
  ideaCapturedAt(file) {
    const raw = this.meta(file).date || this.meta(file)["创建日期"];
    if (raw instanceof Date && !Number.isNaN(raw.getTime())) return new Date(raw.getTime());
    const match = String(raw || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    return new Date(file.stat.ctime);
  }
  ideaAgeDays(file) {
    const today = /* @__PURE__ */ new Date();
    today.setHours(0, 0, 0, 0);
    const captured = this.ideaCapturedAt(file);
    captured.setHours(0, 0, 0, 0);
    return Math.max(0, Math.floor((today.getTime() - captured.getTime()) / 864e5));
  }
  ideaTitle(file) {
    return file.basename.replace(/^\d{4}-\d{2}-\d{2}\s+/, "");
  }
  ideaTags(file) {
    const tags = this.meta(file).tags;
    return (Array.isArray(tags) ? tags : tags ? [tags] : []).map((tag) => String(tag).replace(/^#/, "")).filter(Boolean);
  }
  ideaTimeLabel(file) {
    const age = this.ideaAgeDays(file);
    if (age === 0) return "今天捕捉 · 剩 7 天";
    if (age < 7) return `${age} 天前捕捉 · 剩 ${7 - age} 天`;
    if (age === 7) return "7 天前捕捉 · 今天到期";
    return `${age} 天前捕捉 · 已逾期 ${age - 7} 天`;
  }
  renderIdeaProcessingDesk(shell) {
    const pending = this.pendingIdeas().sort((a, b) => this.ideaCapturedAt(a) - this.ideaCapturedAt(b));
    const current = pending.filter((file) => this.ideaAgeDays(file) <= 7);
    const overdue = pending.filter((file) => this.ideaAgeDays(file) > 7);
    const dueToday = pending.filter((file) => this.ideaAgeDays(file) === 7);
    const settled = this.knowledgeGroups().filter((group) => group.key !== "fleeting").reduce((total2, group) => total2 + this.knowledgeNotes(group).length, 0);
    const desk = shell.createEl("section", { cls: "pvd-card pvd-idea-desk" });
    const head = desk.createDiv({ cls: "pvd-idea-desk-head" });
    const copy = head.createDiv();
    copy.createEl("p", { text: "CARD NOTE FLOW" });
    copy.createEl("h2", { text: "知识卡片笔记流程" });
    copy.createEl("span", { text: "任务旁捕捉闪念，七天内补清上下文，再沉淀为永久笔记、归档为文献笔记，或明确舍弃。" });
    const summary = head.createDiv({ cls: "pvd-idea-summary", attr: { "aria-label": `待处理 ${pending.length} 条，今日到期 ${dueToday.length} 条，逾期 ${overdue.length} 条，已沉淀 ${settled} 篇` } });
    const total = summary.createDiv();
    total.createEl("strong", { text: String(pending.length) });
    total.createSpan({ text: "待处理" });
    const due = summary.createDiv({ cls: dueToday.length ? "is-due" : "" });
    due.createEl("strong", { text: String(dueToday.length) });
    due.createSpan({ text: "今日到期" });
    const late = summary.createDiv({ cls: overdue.length ? "is-alert" : "" });
    late.createEl("strong", { text: String(overdue.length) });
    late.createSpan({ text: "已逾期" });
    const done = summary.createDiv();
    done.createEl("strong", { text: String(settled) });
    done.createSpan({ text: "知识笔记" });
    const timeline = desk.createDiv({ cls: "pvd-idea-timeline", attr: { role: "img", "aria-label": "卡片笔记流程：从任务或想法捕捉闪念，七天内澄清，并分流为永久笔记、文献笔记、任务或舍弃" } });
    [["TASK / IDEA", "就地捕捉", "在任务旁一键建立关联闪念"], ["DAY 0–6", "澄清闪念", "一次只保留一个想法，补足来源与上下文"], ["DAY 7", "必须分流", "沉淀永久 / 归档文献 / 转任务 / 舍弃"]].forEach(([day, title, description], index) => {
      const step = timeline.createDiv({ cls: "pvd-idea-time-step" });
      step.createEl("b", { text: day });
      step.createEl("strong", { text: title });
      step.createSpan({ text: description });
      if (index < 2) timeline.createSpan({ cls: "pvd-idea-time-arrow", text: "→", attr: { "aria-hidden": "true" } });
    });
    const outcomes = desk.createDiv({ cls: "pvd-idea-outcomes" });
    [["永久笔记", "一个独立观点，用自己的话表达并可复用", "permanent"], ["文献笔记", "保留书籍、文章或外部资料的来源语境", "literature"], ["任务", "想法已经形成明确行动与完成标准", "task"], ["舍弃", "重复、无价值或已失去时效，不继续囤积", "discard"]].forEach(([name, description, kind]) => {
      const outcome = outcomes.createDiv({ cls: `pvd-idea-outcome is-${kind}` });
      outcome.createEl("strong", { text: name });
      outcome.createSpan({ text: description });
    });
    const queues = desk.createDiv({ cls: "pvd-idea-queues" });
    this.renderIdeaQueue(queues, "待处理", "按最早捕捉顺序整理；第七天必须完成分流", current, false, this.ideaPendingCollapsed, () => {
      this.ideaPendingCollapsed = !this.ideaPendingCollapsed;
      void this.render();
    });
    this.renderIdeaQueue(queues, "过期闪念", "这些闪念已经超过暂存周期，请先做去留判断", overdue, true, this.ideaOverdueCollapsed, () => {
      this.ideaOverdueCollapsed = !this.ideaOverdueCollapsed;
      void this.render();
    });
  }
  renderIdeaQueue(parent, title, description, files, overdue, collapsed, toggle) {
    const queue = parent.createEl("section", { cls: `pvd-idea-queue ${overdue ? "is-overdue" : ""} ${collapsed ? "is-collapsed" : ""}` });
    const head = queue.createDiv({ cls: "pvd-idea-queue-head", attr: { role: "button", tabindex: "0", "aria-expanded": String(!collapsed) } });
    const copy = head.createDiv();
    copy.createEl("h3", { text: title });
    copy.createEl("p", { text: description });
    const meta = head.createDiv({ cls: "pvd-idea-queue-head-meta" });
    meta.createEl("strong", { cls: "pvd-idea-queue-count", text: String(files.length), attr: { "aria-label": `${files.length} 条` } });
    const chevron = meta.createSpan({ cls: "pvd-idea-queue-chevron", attr: { "aria-hidden": "true" } });
    chevron.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';
    head.addEventListener("click", toggle);
    head.addEventListener("keydown", (event) => {
      if ((event.key === "Enter" || event.key === " ") && !event.shiftKey) {
        event.preventDefault();
        toggle();
      }
    });
    if (collapsed) return;
    const list2 = queue.createDiv({ cls: "pvd-triage-list" });
    if (!files.length) {
      const empty = list2.createDiv({ cls: "pvd-triage-empty" });
      empty.createEl("strong", { text: overdue ? "没有逾期闪念" : "本周收件箱已清空" });
      empty.createSpan({ text: overdue ? "很好，继续保持每周分流。" : "记录新想法后，它会出现在这里。" });
      return;
    }
    files.forEach((file) => this.renderIdeaTriageCard(list2, file, overdue));
  }
  renderIdeaTriageCard(parent, file, overdue) {
    const age = this.ideaAgeDays(file);
    const linkedTask = this.ideaLinkedTask(file);
    const card = parent.createEl("article", { cls: `pvd-triage-card ${overdue ? "is-overdue" : age === 7 ? "is-due" : ""}` });
    const copy = card.createDiv({ cls: "pvd-triage-copy" });
    const eyebrow = copy.createDiv({ cls: "pvd-triage-meta" });
    eyebrow.createSpan({ text: overdue ? "已逾期 · 立即判断" : age === 7 ? "今天必须分流" : "待处理" });
    eyebrow.createSpan({ text: this.ideaTimeLabel(file) });
    if (linkedTask) eyebrow.createSpan({ cls: "is-linked", text: `来自任务 · ${linkedTask.basename}` });
    copy.createEl("h4", { text: this.ideaTitle(file) });
    const tags = Array.isArray(this.meta(file).tags) ? this.meta(file).tags.slice(0, 3).map((tag) => `#${tag}`).join(" ") : "";
    copy.createEl("p", { text: tags || `捕捉于 ${this.dateKey(this.ideaCapturedAt(file))}` });
    const ageTrack = card.createDiv({ cls: "pvd-idea-age", attr: { role: "progressbar", "aria-label": "闪念处理周期", "aria-valuemin": "0", "aria-valuemax": "7", "aria-valuenow": String(Math.min(age, 7)) } });
    ageTrack.createSpan({ attr: { style: `width:${Math.min(100, Math.round(age / 7 * 100))}%` } });
    card.createSpan({ cls: "pvd-card-edit-hint", text: "左键打开正文 · 右键编辑与分流" });
    this.bindCardOpenAndEdit(card, file, () => this.editIdea(file), `闪念：${this.ideaTitle(file)}`);
  }
  ideaLinkedTask(file) {
    var _a;
    const value = this.meta(file)["关联任务"];
    const raw = Array.isArray(value) ? value[0] : value;
    const link = (_a = String(raw || "").match(/\[\[([^\]|#]+)/)) == null ? void 0 : _a[1];
    return link ? this.app.metadataCache.getFirstLinkpathDest(link, file.path) : null;
  }
  async replaceTaskIdeaLink(task, previousPath, nextPath = "") {
    if (!task) return;
    const previousLink = `[[${previousPath.replace(/\.md$/, "")}]]`;
    const nextLink = nextPath ? `[[${nextPath.replace(/\.md$/, "")}]]` : "";
    await this.app.fileManager.processFrontMatter(task, (fm) => {
      const current = Array.isArray(fm["关联闪念"]) ? fm["关联闪念"] : fm["关联闪念"] ? [fm["关联闪念"]] : [];
      const updated = current.map((value) => String(value) === previousLink ? nextLink : value).filter(Boolean);
      if (updated.length) fm["关联闪念"] = updated;
      else delete fm["关联闪念"];
    });
  }
  renderKnowledge(shell) {
    const groups = this.knowledgeGroups();
    const pending = this.pendingIdeas();
    const notes = groups.filter((group) => group.key !== "fleeting").reduce((total, group) => total + this.knowledgeNotes(group).length, 0);
    const overview = shell.createDiv({ cls: "pvd-task-overview pvd-knowledge-overview" });
    overview.createEl("span", { text: `待处理闪念 ${pending.length} 条 · 已收录笔记 ${notes} 篇 · 在这里检索、整理并沉淀知识` });
    const quickCreate = shell.createEl("section", { cls: "pvd-today-actions pvd-knowledge-actions" });
    const quickCopy = quickCreate.createDiv({ cls: "pvd-today-actions-copy" });
    quickCopy.createEl("strong", { text: "捕捉要快，分流要明确" });
    quickCopy.createSpan({ text: pending.length ? `当前有 ${pending.length} 条闪念；优先处理超过七天的内容` : "收件箱已清空，可以记录下一条想法" });
    this.button(quickCreate, "＋ 记录闪念", () => this.createIdea(), "mod-cta");
    this.renderIdeaProcessingDesk(shell);
    const libraryHead = shell.createDiv({ cls: "pvd-knowledge-library-head" });
    const libraryCopy = libraryHead.createDiv();
    libraryCopy.createEl("p", { text: "KNOWLEDGE LIBRARY" });
    libraryCopy.createEl("h2", { text: "知识卡片库" });
    libraryCopy.createSpan({ text: "检索已经沉淀或仍在处理的卡片笔记。" });
    const controls = shell.createEl("section", { cls: "pvd-card pvd-task-controls pvd-knowledge-controls" });
    const toolbar = controls.createDiv({ cls: "pvd-task-toolbar pvd-article-toolbar" });
    const search = toolbar.createEl("input", { cls: "pvd-task-search", type: "search", placeholder: "搜索文章标题…", value: this.knowledgeSearch, attr: { "aria-label": "搜索文章" } });
    search.addEventListener("input", (event) => {
      this.knowledgeSearch = event.target.value;
      this.renderArticleResults(this.articleResultsEl, groups);
    });
    toolbar.createSpan({ cls: "pvd-knowledge-search-hint", text: "按标题筛选知识库" });
    const filters = controls.createDiv({ cls: "pvd-filter pvd-article-filter" });
    [["all", "全部文章"], ...groups.map((group) => [group.key, group.name])].forEach(([key, label]) => this.button(filters, label, (event) => {
      this.knowledgeFilter = key;
      filters.querySelectorAll("button").forEach((option) => option.removeClass("is-active"));
      event.currentTarget.addClass("is-active");
      this.renderArticleResults(this.articleResultsEl, groups);
    }, this.knowledgeFilter === key ? "is-active" : ""));
    const results = shell.createDiv({ cls: "pvd-article-results pvd-knowledge-results" });
    this.articleResultsEl = results;
    this.renderArticleResults(results, groups);
  }
  renderArticleResults(parent, groups = this.knowledgeGroups()) {
    parent.empty();
    const query = this.knowledgeSearch.trim().toLocaleLowerCase();
    const visibleGroups = this.knowledgeFilter === "all" ? groups : groups.filter((group) => group.key === this.knowledgeFilter);
    visibleGroups.forEach((group) => {
      const section = parent.createEl("section", { cls: "pvd-card pvd-article-group" });
      const notes = this.knowledgeNotes(group).filter((file) => !query || file.basename.toLocaleLowerCase().includes(query));
      const head = section.createDiv({ cls: "pvd-section-head" });
      const copy = head.createDiv();
      copy.createEl("h2", { text: group.name });
      copy.createEl("p", { text: `${group.description} · ${notes.length} 篇` });
      if (!notes.length) {
        section.createEl("p", { text: "暂无匹配文章。" });
        return;
      }
      const list2 = section.createDiv({ cls: "pvd-article-list" });
      notes.slice(0, 60).forEach((file) => {
        const article = this.button(list2, "", () => this.openFile(file), "pvd-article");
        const text = article.createDiv();
        text.createEl("strong", { text: file.basename });
        text.createSpan({ text: this.dateKey(new Date(file.stat.mtime)) });
        article.createEl("span", { text: "右键转换 · 打开 →", cls: "pvd-article-open" });
        article.addEventListener("contextmenu", (event) => {
          event.preventDefault();
          event.stopPropagation();
          this.openKnowledgeContextMenu(event, file);
        });
        article.addEventListener("keydown", (event) => {
          if (event.key === "ContextMenu" || event.shiftKey && event.key === "F10") {
            event.preventDefault();
            this.openKnowledgeContextMenu(event, file);
          }
        });
      });
    });
    localizeElement(parent, this.plugin.settings.language);
  }
  renderTaskCalendar(shell, tasks) {
    const month = this.calendarMonth;
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const todayKey = this.todayKey();
    const card = shell.createEl("section", { cls: "pvd-card pvd-task-calendar" });
    const header = card.createDiv({ cls: "pvd-calendar-header" });
    const copy = header.createDiv();
    copy.createEl("p", { text: "TASK CALENDAR" });
    copy.createEl("h2", { text: this.calendarMonthLabel() });
    const controls = header.createDiv({ cls: "pvd-calendar-controls" });
    this.button(controls, "‹ 上月", () => this.changeCalendarMonth(-1));
    this.button(controls, "本月", () => {
      this.calendarMonth = this.monthStart(/* @__PURE__ */ new Date());
      void this.render();
    }, "mod-cta");
    this.button(controls, "下月 ›", () => this.changeCalendarMonth(1));
    const weekday = card.createDiv({ cls: "pvd-calendar-weekdays" });
    ["一", "二", "三", "四", "五", "六", "日"].forEach((day) => weekday.createEl("span", { text: day }));
    const grid = card.createDiv({ cls: "pvd-calendar-grid" });
    const firstOffset = (month.getDay() + 6) % 7;
    const days = this.daysInMonth(month);
    for (let index = 0; index < firstOffset; index += 1) grid.createDiv({ cls: "pvd-calendar-day is-empty", attr: { "aria-hidden": "true" } });
    for (let day = 1; day <= days; day += 1) {
      const dateKey2 = this.calendarDateKey(year, monthIndex, day);
      const dayTasks = tasks.filter((file) => this.taskPlanKey(file) === dateKey2).sort((a, b) => this.compareTasks(a, b));
      const dayEl = grid.createDiv({ cls: `pvd-calendar-day ${dateKey2 === todayKey ? "is-today" : ""} ${dayTasks.length ? "has-tasks" : ""}` });
      const label = dayEl.createDiv({ cls: "pvd-calendar-day-label" });
      label.createEl("strong", { text: String(day) });
      if (dateKey2 === todayKey) label.createSpan({ text: "今天" });
      const list2 = dayEl.createDiv({ cls: "pvd-calendar-task-list" });
      dayTasks.slice(0, 3).forEach((file) => {
        const chip = this.button(list2, file.basename, () => this.setFocus(file), `pvd-calendar-task ${this.taskDone(file) ? "is-done" : ""} ${this.priority(file).toLowerCase()}`);
        this.bindTaskLabel(chip, file, `任务：${file.basename} · ${this.taskStatus(file)}`);
      });
      if (dayTasks.length > 3) dayEl.createEl("span", { cls: "pvd-calendar-more", text: `+${dayTasks.length - 3} 项任务` });
    }
    const trailing = (7 - (firstOffset + days) % 7) % 7;
    for (let index = 0; index < trailing; index += 1) grid.createDiv({ cls: "pvd-calendar-day is-empty", attr: { "aria-hidden": "true" } });
  }
  renderFocusPanel(parent, tasks) {
    const focus = this.focusTask(tasks);
    const mission = parent.createEl("section", { cls: "pvd-card pvd-mission pvd-water-focus-v2" });
    if (!focus) {
      mission.createEl("p", { text: "CURRENT FOCUS" });
      mission.createEl("h2", { text: "还没有待推进的任务" });
      this.button(mission, "新建任务", () => this.createTask(), "mod-cta");
      return;
    }
    const missionHead = mission.createDiv({ cls: "pvd-mission-head" });
    const missionCopy = missionHead.createDiv({ cls: "pvd-mission-copy" });
    missionCopy.createEl("p", { text: "CURRENT FOCUS" });
    missionCopy.createEl("h2", { text: focus.basename });
    const missionMeta = missionCopy.createDiv({ cls: "pvd-mission-meta" });
    this.timer(missionMeta, focus);
    const project = String(this.taskProperty(focus, "projectField") || "未关联项目").replace(/^\[\[|\]\]$/g, "");
    missionMeta.createSpan({ text: `${project} · ${this.priority(focus)}` });
    this.bindTaskFocusAndEdit(mission, focus, `任务：${focus.basename}`);
    this.countdownLiquid(mission, focus);
    const track = mission.createDiv({ cls: "pvd-stage" });
    ["待做", "进行中", "暂停", "完成"].forEach((stage) => track.createEl("span", { text: stage, cls: this.taskStatus(focus) === stage ? "is-current" : this.taskDone(focus) ? "is-done" : "" }));
    if (!this.taskDone(focus)) {
      const actions = mission.createDiv({ cls: "pvd-actions" });
      this.button(actions, this.timerState(focus) === "进行中" ? "暂停专注" : "开始专注", () => this.toggleTimer(focus), "mod-cta");
      this.button(actions, "完成", () => this.complete(focus));
    }
  }
  visualTasks(tasks) {
    return tasks.filter((file) => {
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
    options.forEach(([optionValue, text]) => select.createEl("option", { value: optionValue, text }));
    select.value = value;
    select.addEventListener("change", (event) => {
      onChange(event.target.value);
      void this.render();
    });
    return select;
  }
  visualModeButton(parent, key, label) {
    const paths = {
      calendar: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
      timeline: '<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="8" cy="6" r="2"/><circle cx="15" cy="12" r="2"/><circle cx="11" cy="18" r="2"/>',
      stats: '<path d="M3 3v18h18"/><path d="M7 16v-4M12 16V7M17 16v-7"/>'
    };
    const button = parent.createEl("button", { cls: `pvd-visual-mode is-${key} ${this.taskVisualMode === key ? "is-active" : ""}`, attr: { title: label, "aria-label": label } });
    button.createSpan({ cls: "pvd-view-icon", attr: { "aria-hidden": "true" } }).innerHTML = `<svg width="16" height="16" style="display:block;width:16px;height:16px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths[key]}</svg>`;
    button.createSpan({ text: label });
    button.addEventListener("click", () => {
      this.taskVisualMode = key;
      void this.render();
    });
    return button;
  }
  renderTaskVisualControls(parent, tasks) {
    const tools = parent.createDiv({ cls: "pvd-visual-controls" });
    const modes = tools.createDiv({ cls: "pvd-visual-tabs" });
    [["calendar", "日历"], ["timeline", "时间轴"], ["stats", "统计"]].forEach(([key, label]) => this.visualModeButton(modes, key, label));
    const filters = tools.createDiv({ cls: "pvd-visual-filters" });
    const projects = [...new Set(tasks.map((file) => String(this.taskProperty(file, "projectField") || "").replace(/^\[\[|\]\]$/g, "")).filter(Boolean))].sort((a, b) => a.localeCompare(b, "zh-CN"));
    this.selectVisual(filters, this.taskVisualProject, [["", "全部项目"], ...projects.map((value) => [value, value])], (value) => {
      this.taskVisualProject = value;
    }, "项目筛选");
    this.selectVisual(filters, this.taskVisualPriority, [["", "全部优先级"], ["P0", "P0"], ["P1", "P1"], ["P2", "P2"]], (value) => {
      this.taskVisualPriority = value;
    }, "优先级筛选");
    this.selectVisual(filters, this.taskVisualStatus, [["all", "全部状态"], ["active", "未完成"], ["doing", "进行中"], ["done", "已完成"]], (value) => {
      this.taskVisualStatus = value;
    }, "状态筛选");
  }
  renderTimeline(parent, tasks) {
    const today = this.today();
    const pastDays = this.timelineDays === 7 ? 2 : this.timelineDays === 14 ? 3 : 7;
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - pastDays);
    const dates = Array.from({ length: this.timelineDays }, (_, index) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + index));
    const startKey = this.dateKey(start);
    const endKey = this.dateKey(dates[dates.length - 1]);
    const scheduled = tasks.filter((file) => {
      const key = this.taskPlanKey(file);
      return key >= startKey && key <= endKey;
    });
    const card = parent.createEl("section", { cls: "pvd-card pvd-timeline" });
    card.style.setProperty("--pvd-timeline-days", String(this.timelineDays));
    card.style.setProperty("--pvd-timeline-width", `${140 + this.timelineDays * 46}px`);
    const head = card.createDiv({ cls: "pvd-section-head" });
    const copy = head.createDiv();
    copy.createEl("h2", { text: "任务时间轴" });
    copy.createEl("p", { text: `以今天为中心查看 ${this.timelineDays} 天排期，按项目分组显示。` });
    const ranges = head.createDiv({ cls: "pvd-timeline-ranges" });
    [7, 14, 30].forEach((days) => this.button(ranges, `${days} 天`, () => {
      this.timelineDays = days;
      void this.render();
    }, this.timelineDays === days ? "is-active" : ""));
    const board = card.createDiv({ cls: "pvd-timeline-board" });
    const months = board.createDiv({ cls: "pvd-timeline-months" });
    months.createSpan({ cls: "pvd-timeline-corner", text: "项目" });
    const monthGroups = [];
    dates.forEach((date, index) => {
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      const current = monthGroups[monthGroups.length - 1];
      if (current && current.key === key) current.count += 1;
      else monthGroups.push({ key, start: index, count: 1, label: `${date.getFullYear()} 年 ${date.getMonth() + 1} 月` });
    });
    monthGroups.forEach((month) => {
      const label = months.createSpan({ text: month.label });
      label.style.gridColumn = `${month.start + 2} / span ${month.count}`;
    });
    const header = board.createDiv({ cls: "pvd-timeline-header" });
    header.createSpan({ text: "排期" });
    dates.forEach((date) => {
      const day = header.createSpan();
      day.createEl("b", { text: String(date.getDate()) });
      day.createEl("em", { text: ["日", "一", "二", "三", "四", "五", "六"][date.getDay()] });
      if (this.dateKey(date) === this.todayKey()) day.addClass("is-today");
    });
    const groups = /* @__PURE__ */ new Map();
    scheduled.forEach((file) => {
      const project = String(this.taskProperty(file, "projectField") || "未关联项目").replace(/^\[\[|\]\]$/g, "");
      if (!groups.has(project)) groups.set(project, []);
      groups.get(project).push(file);
    });
    if (!groups.size) board.createEl("p", { cls: "pvd-timeline-empty", text: "当前日期范围内没有已排期任务。" });
    groups.forEach((files, project) => {
      files.sort((a, b) => this.compareTasks(a, b));
      const lane = board.createDiv({ cls: "pvd-timeline-lane" });
      const laneRows = Math.max(files.length, 1);
      lane.style.setProperty("--pvd-lane-rows", String(laneRows));
      lane.style.minHeight = `${laneRows * 36 + 18}px`;
      const label = lane.createDiv({ cls: "pvd-timeline-project" });
      label.createEl("strong", { text: project });
      label.createSpan({ text: `${files.length} 项` });
      const track = lane.createDiv({ cls: "pvd-timeline-track" });
      dates.forEach((date, index) => {
        const cell = track.createDiv({ cls: "pvd-timeline-cell" });
        cell.style.gridColumn = String(index + 1);
      });
      const todayIndex = dates.findIndex((date) => this.dateKey(date) === this.todayKey());
      if (todayIndex >= 0) {
        const marker = track.createDiv({ cls: "pvd-timeline-today-line", attr: { "aria-hidden": "true" } });
        marker.style.gridColumn = String(todayIndex + 1);
      }
      files.forEach((file, rowIndex) => {
        const key = this.taskPlanKey(file);
        const index = dates.findIndex((date) => this.dateKey(date) === key);
        if (index < 0) return;
        const chip = this.button(track, file.basename, () => this.setFocus(file), `pvd-timeline-task ${this.priority(file).toLowerCase()} ${this.taskDone(file) ? "is-done" : ""}`);
        chip.style.gridColumn = String(index + 1);
        chip.style.gridRow = String(rowIndex + 1);
        this.bindTaskLabel(chip, file, `任务：${file.basename} · ${key} · ${this.taskStatus(file)}`);
      });
    });
    const overdue = tasks.filter((file) => !this.taskDone(file) && this.taskPlanKey(file) && this.taskPlanKey(file) < startKey);
    const unscheduled = tasks.filter((file) => !this.taskPlanKey(file));
    const foot = card.createDiv({ cls: "pvd-timeline-foot" });
    if (overdue.length) foot.createSpan({ text: `范围外逾期 ${overdue.length} 项` });
    if (unscheduled.length) foot.createSpan({ text: `未排期 ${unscheduled.length} 项` });
  }
  renderTaskStats(parent, tasks) {
    const total = tasks.length;
    const completed = tasks.filter((file) => this.taskDone(file));
    const active = tasks.filter((file) => !this.taskDone(file));
    const doing = active.filter((file) => this.taskStatus(file) === "进行中");
    const overdue = active.filter((file) => this.isPastCalendarDay(this.taskPlanKey(file), this.today()));
    const card = parent.createEl("section", { cls: "pvd-card pvd-task-stats-view" });
    card.createEl("h2", { text: "任务统计" });
    card.createEl("p", { text: "统计基于当前筛选条件，不改变任务数据。" });
    const statIcons = { active: '<path d="M5 12h14M12 5l7 7-7 7"/>', doing: '<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>', done: '<circle cx="12" cy="12" r="8"/><path d="m8.5 12 2.2 2.2 4.8-5"/>', overdue: '<path d="M12 8v5M12 17h.01"/><path d="M10.3 3.7 2.5 17.2A2 2 0 0 0 4.2 20h15.6a2 2 0 0 0 1.7-2.8L13.7 3.7a2 2 0 0 0-3.4 0Z"/>' };
    const metrics = [["active", "待推进", active.length], ["doing", "进行中", doing.length], ["done", "已完成", completed.length], ["overdue", "已逾期", overdue.length]];
    const summary = card.createDiv({ cls: "pvd-stats-grid" });
    metrics.forEach(([tone, label, count]) => {
      const item = summary.createDiv({ cls: `is-${tone}` });
      const icon = item.createSpan({ cls: "pvd-stat-icon", attr: { "aria-hidden": "true", style: "display:grid;width:28px;height:28px;overflow:hidden;place-items:center" } });
      icon.innerHTML = `<svg width="15" height="15" style="display:block;width:15px;height:15px;max-width:15px;max-height:15px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${statIcons[tone]}</svg>`;
      item.createEl("b", { text: String(count) });
      item.createSpan({ cls: "pvd-stat-label", text: label });
    });
    const chartMetrics = [["todo", "待做", active.filter((file) => this.taskStatus(file) === "待做").length], ["doing", "进行中", doing.length], ["paused", "暂停", active.filter((file) => this.taskStatus(file) === "暂停").length], ["done", "已完成", completed.length]];
    const maxMetric = Math.max(...chartMetrics.map(([, , count]) => count), 1);
    const chart = card.createDiv({ cls: "pvd-stats-chart" });
    const chartHead = chart.createDiv({ cls: "pvd-stats-chart-head" });
    const chartTitle = chartHead.createDiv();
    chartTitle.createEl("h3", { text: "任务状态分布" });
    chartTitle.createEl("p", { text: `共 ${total} 项任务 · 完成率 ${total ? Math.round(completed.length / total * 100) : 0}%` });
    chartHead.createSpan({ text: "当前筛选" });
    const plot = chart.createDiv({ cls: "pvd-chart-plot" });
    const grid = plot.createDiv({ cls: "pvd-chart-grid", attr: { "aria-hidden": "true" } });
    [100, 75, 50, 25, 0].forEach((value) => grid.createSpan({ attr: { style: `--pvd-grid:${value}%` } }));
    const bars = plot.createDiv({ cls: "pvd-chart-bars" });
    chartMetrics.forEach(([tone, label, count]) => {
      const column = bars.createDiv({ cls: `pvd-chart-column is-${tone}` });
      column.createEl("b", { text: String(count) });
      const bar = column.createDiv({ cls: "pvd-chart-bar", attr: { title: `${label}：${count} 项` } });
      bar.style.setProperty("--pvd-bar-height", `${count ? Math.max(8, Math.round(count / maxMetric * 100)) : 2}%`);
      column.createSpan({ text: label });
    });
    const analysis = card.createDiv({ cls: "pvd-stats-analysis" });
    const priority = analysis.createDiv({ cls: "pvd-stats-panel" });
    priority.createEl("h3", { text: "优先级分布" });
    ["P0", "P1", "P2"].forEach((level) => {
      const count = active.filter((file) => this.priority(file) === level).length;
      const row = priority.createDiv({ cls: "pvd-stats-row" });
      row.createSpan({ text: level });
      const bar = row.createDiv({ cls: "pvd-stats-bar" });
      bar.createSpan({ attr: { style: `width:${active.length ? Math.round(count / active.length * 100) : 0}%` } });
      row.createEl("b", { text: String(count) });
    });
    const projects = analysis.createDiv({ cls: "pvd-stats-panel" });
    projects.createEl("h3", { text: "项目进展" });
    const grouped = /* @__PURE__ */ new Map();
    tasks.forEach((file) => {
      const project = String(this.taskProperty(file, "projectField") || "未关联项目").replace(/^\[\[|\]\]$/g, "");
      if (!grouped.has(project)) grouped.set(project, []);
      grouped.get(project).push(file);
    });
    [...grouped.entries()].sort((a, b) => b[1].length - a[1].length).slice(0, 6).forEach(([project, files]) => {
      const done = files.filter((file) => this.taskDone(file)).length;
      const row = projects.createDiv({ cls: "pvd-stats-row" });
      row.createSpan({ text: project });
      const bar = row.createDiv({ cls: "pvd-stats-bar" });
      bar.createSpan({ attr: { style: `width:${files.length ? Math.round(done / files.length * 100) : 0}%` } });
      row.createEl("b", { text: `${done}/${files.length}` });
    });
  }
  async renderTasks(shell) {
    const tasks = this.tasks();
    const active = tasks.filter((file) => !this.taskDone(file));
    const today = this.today();
    const todayKey = this.calendarKey(today);
    const todayCount = active.filter((file) => this.isTodayTask(file, todayKey)).length;
    const doingCount = active.filter((file) => this.taskStatus(file) === "进行中").length;
    const overdueCount = active.filter((file) => this.isPastCalendarDay(this.taskPlanKey(file), today)).length;
    const views = shell.createDiv({ cls: "pvd-task-view-tabs" });
    [["today", "今日任务"], ["visual", "任务视图"], ["all", "全部任务"]].forEach(([key, label]) => this.button(views, label, () => {
      this.taskView = key;
      if (key === "today") this.taskFilter = "today";
      if (key === "all" && this.taskFilter === "today") this.taskFilter = "active";
      void this.render();
    }, this.taskView === key ? "is-active" : ""));
    const overview = shell.createDiv({ cls: "pvd-task-overview" });
    const overviewText = this.taskView === "today" ? `今日 ${todayCount} 项 · 进行中 ${doingCount} 项 · 已逾期 ${overdueCount} 项` : this.taskView === "visual" ? `${this.taskVisualMode === "calendar" ? this.calendarMonthLabel() : this.taskVisualMode === "timeline" ? `${this.timelineDays} 天排期` : "当前筛选"} · 已应用项目、优先级与状态筛选` : `待推进 ${active.length} 项 · 进行中 ${doingCount} 项 · 已逾期 ${overdueCount} 项`;
    overview.createEl("span", { text: overviewText });
    const workspace = shell.createDiv({ cls: `pvd-task-workspace is-${this.taskView}` });
    const main = workspace.createDiv({ cls: "pvd-task-main" });
    const sidebar = workspace.createDiv({ cls: "pvd-task-sidebar" });
    this.renderFocusPanel(sidebar, tasks);
    const filters = { today: "今日", active: "全部待办", doing: "进行中", overdue: "已逾期" };
    if (this.taskView === "visual") {
      workspace.addClass("pvd-visual-workspace-v5");
      workspace.addClass("pvd-visual-workspace-v7");
      main.addClass("pvd-visual-v5");
      main.addClass("pvd-visual-v7");
      this.renderTaskVisualControls(main, tasks);
      const visualTasks = this.visualTasks(tasks);
      if (this.taskVisualMode === "calendar") this.renderTaskCalendar(main, visualTasks);
      else if (this.taskVisualMode === "timeline") this.renderTimeline(main, visualTasks);
      else this.renderTaskStats(main, visualTasks);
      return;
    }
    if (this.taskView === "all") {
      const controls = main.createEl("section", { cls: "pvd-card pvd-task-controls" });
      const toolbar = controls.createDiv({ cls: "pvd-task-toolbar" });
      const search = toolbar.createEl("input", { cls: "pvd-task-search", type: "search", placeholder: "搜索任务、项目或优先级…", value: this.taskSearch, attr: { "aria-label": "搜索任务" } });
      search.addEventListener("input", (event) => {
        this.taskSearch = event.target.value;
        void this.renderTasksResults(this.taskResultsEl, filters, tasks, today, this.taskFilter, true, true).then(() => this.renderSelectionToolbar());
      });
      this.button(toolbar, "＋ 新建任务", () => this.createTask(), "mod-cta");
      const filterBar = controls.createDiv({ cls: "pvd-filter" });
      Object.entries(filters).forEach(([key, label]) => this.button(filterBar, label, () => {
        this.taskFilter = key;
        void this.render();
      }, this.taskFilter === key ? "is-active" : ""));
      this.createSelectionToolbar(main);
      const results = main.createDiv({ cls: "pvd-task-results" });
      this.taskResultsEl = results;
      await this.renderTasksResults(results, filters, tasks, today, this.taskFilter, true, true);
      return;
    }
    const todayActions = main.createEl("section", { cls: "pvd-today-actions" });
    const todayActionCopy = todayActions.createDiv({ cls: "pvd-today-actions-copy" });
    todayActionCopy.createEl("strong", { text: "今天要推进什么？" });
    todayActionCopy.createSpan({ text: todayCount ? `当前有 ${todayCount} 项今日任务` : "创建一项任务，开始安排今天" });
    this.button(todayActions, "＋ 新建任务", () => this.createTask(), "mod-cta");
    this.createSelectionToolbar(main);
    const todayResults = main.createDiv({ cls: "pvd-task-results pvd-today-results" });
    await this.renderTasksResults(todayResults, filters, tasks, today, "today", false, true);
  }
  matchesTaskSearch(file) {
    const query = this.taskSearch.trim().toLocaleLowerCase();
    if (!query) return true;
    const project = String(this.taskProperty(file, "projectField") || "");
    return `${file.basename} ${project} ${this.priority(file)} ${this.taskStatus(file)}`.toLocaleLowerCase().includes(query);
  }
  renderCompletedTasks(parent, tasks) {
    const completed = tasks.filter((file) => this.taskDone(file) && this.matchesTaskSearch(file)).sort((a, b) => this.calendarKey(this.taskProperty(b, "completedAtField")).localeCompare(this.calendarKey(this.taskProperty(a, "completedAtField"))) || b.stat.mtime - a.stat.mtime);
    if (!completed.length) return;
    const section = parent.createEl("section", { cls: `pvd-card pvd-completed-tasks ${this.completedExpanded ? "is-expanded" : ""}` });
    const toggle = this.button(section, `已完成 · ${completed.length} 项`, () => {
      this.completedExpanded = !this.completedExpanded;
      void this.render();
    }, "pvd-completed-toggle");
    toggle.setAttribute("aria-expanded", String(this.completedExpanded));
    if (this.completedExpanded) {
      const list2 = section.createDiv({ cls: "pvd-completed-list" });
      completed.forEach((file) => this.renderTaskCard(list2, file));
    }
  }
  createSelectionToolbar(main) {
    const selectToolbar = main.createDiv({ cls: "pvd-selection-toolbar is-hidden", attr: { "data-pvd-selection-toolbar": "" } });
    const selectCopy = selectToolbar.createDiv({ cls: "pvd-selection-copy" });
    selectCopy.createEl("strong", { text: "已选择", attr: { "data-pvd-selection-count": "0" } });
    selectCopy.createEl("span", { text: "项任务" });
    const selectActions = selectToolbar.createDiv({ cls: "pvd-selection-actions" });
    const selectAllButton = this.button(selectActions, "全选", () => this.toggleSelectAll(), "pvd-selection-all");
    selectAllButton.setAttribute("data-pvd-selection-all", "");
    const editButton = this.button(selectActions, "批量编辑", () => this.openBatchEditor(), "mod-cta pvd-selection-edit");
    editButton.setAttribute("data-pvd-selection-edit", "");
    const clearButton = this.button(selectActions, "清除选择", () => this.clearSelectionAndRender(), "pvd-selection-clear");
    clearButton.setAttribute("data-pvd-selection-clear", "");
    return selectToolbar;
  }
  async renderTasksResults(parent, filters, suppliedTasks, suppliedToday, filterKey = this.taskFilter, showCompleted = false, selectable = false) {
    const tasks = suppliedTasks || this.tasks();
    const today = suppliedToday || this.today();
    parent.empty();
    const filtered = tasks.filter((file) => {
      if (filterKey === "today") return this.isTodayTask(file, this.calendarKey(today));
      if (filterKey === "active") return !this.taskDone(file);
      if (filterKey === "doing") return !this.taskDone(file) && this.taskStatus(file) === "进行中";
      return !this.taskDone(file) && this.isPastCalendarDay(this.taskPlanKey(file), today);
    }).filter((file) => this.matchesTaskSearch(file)).sort((a, b) => this.compareTasks(a, b));
    if (selectable) this.visibleSelectableTasks = filtered;
    const board = parent.createEl("section", { cls: "pvd-card pvd-board" });
    board.createEl("h2", { text: `${filters[filterKey]} · ${filtered.length} 项` });
    if (!filtered.length) board.createEl("p", { text: "这里还没有任务。" });
    filtered.forEach((file) => this.renderTaskCard(board, file, selectable));
    if (showCompleted) this.renderCompletedTasks(parent, tasks);
    localizeElement(parent, this.plugin.settings.language);
  }
  isTaskSelected(file) {
    return this.selectedTasks.has(file.path);
  }
  toggleTaskSelection(file) {
    if (this.selectedTasks.has(file.path)) this.selectedTasks.delete(file.path);
    else this.selectedTasks.add(file.path);
  }
  clearTaskSelection() {
    this.selectedTasks.clear();
  }
  selectedTaskFiles(tasks = this.tasks()) {
    return tasks.filter((file) => this.selectedTasks.has(file.path));
  }
  selectAllVisibleTasks(tasks) {
    tasks.forEach((file) => this.selectedTasks.add(file.path));
  }
  areAllVisibleSelected() {
    const visible = this.visibleSelectableTasks || [];
    return visible.length > 0 && visible.every((file) => this.selectedTasks.has(file.path));
  }
  toggleSelectAll() {
    const visible = this.visibleSelectableTasks || [];
    if (this.areAllVisibleSelected()) visible.forEach((file) => this.selectedTasks.delete(file.path));
    else visible.forEach((file) => this.selectedTasks.add(file.path));
    void this.renderSelectionToolbar();
  }
  clearSelectionAndRender() {
    this.clearTaskSelection();
    this.syncSelectionUi();
    void this.renderSelectionToolbar();
  }
  openBatchEditor() {
    const files = this.selectedTaskFiles();
    if (!files.length) {
      showNotice("请先勾选要编辑的任务。");
      return;
    }
    new BatchTaskEditorModal(this.app, files, this.projectOptions(), (values) => this.applyBatchEdit(files, values)).open();
  }
  async applyBatchEdit(files, values) {
    let updated = 0;
    for (const file of files) {
      await this.app.fileManager.processFrontMatter(file, (next) => {
        if (values.project !== void 0) this.setTaskProperty(next, "projectField", values.project ? `[[${values.project}]]` : "");
        if (values.priority) this.setTaskProperty(next, "priorityField", values.priority);
        if (values.plan) this.setTaskProperty(next, "planField", values.plan);
      });
      if (values.status && values.status !== "保持") await this.transitionTask(file, values.status);
      updated++;
    }
    showNotice(`已更新 ${updated} 项任务`);
    this.clearTaskSelection();
    await this.render();
  }
  renderTaskCard(parent, file, selectable = false) {
    const card = parent.createDiv({ cls: `pvd-task ${this.taskDone(file) ? "is-done" : ""} ${this.focusPath === file.path ? "is-focus" : ""} ${selectable ? "has-selector" : ""} ${selectable && this.isTaskSelected(file) ? "is-selected" : ""}` });
    if (selectable) card.setAttribute("data-task-path", file.path);
    if (this.focusPath === file.path) card.setAttribute("aria-current", "true");
    const stop = (action) => async (event) => {
      event.stopPropagation();
      await action();
    };
    const main = card.createDiv();
    main.createEl("strong", { text: file.basename });
    const project = String(this.taskProperty(file, "projectField") || "未关联项目").replace(/^\[\[|\]\]$/g, "");
    main.createSpan({ text: `${project} · ${this.taskPlan(file) ? this.dateKey(this.taskPlan(file)) : "未安排日期"}` });
    this.timer(main, file);
    const side = card.createDiv({ cls: "pvd-task-card-side" });
    if (selectable) {
      const check = side.createEl("button", { cls: "pvd-task-check", attr: { type: "button", role: "checkbox", "aria-checked": String(this.isTaskSelected(file)), "aria-label": `选择任务：${file.basename}`, tabindex: "0" } });
      check.addEventListener("click", (event) => {
        event.stopPropagation();
        this.toggleTaskSelection(file);
        this.renderSelectionState(check, file);
        void this.renderSelectionToolbar();
      });
      card.addEventListener("click", (event) => {
        var _a, _b;
        if ((_b = (_a = event.target).closest) == null ? void 0 : _b.call(_a, "button")) return;
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          event.stopPropagation();
          this.toggleTaskSelection(file);
          this.renderSelectionState(check, file);
          void this.renderSelectionToolbar();
          return;
        }
        void this.setFocus(file);
      });
      card.addEventListener("keydown", (event) => {
        var _a, _b;
        if ((_b = (_a = event.target).closest) == null ? void 0 : _b.call(_a, "button")) return;
        if (event.key === "ContextMenu" || event.shiftKey && event.key === "F10") {
          event.preventDefault();
          if (this.selectedTaskFiles().length > 1) this.openBatchEditor();
          else this.editTask(file);
          return;
        }
        if ((event.ctrlKey || event.metaKey) && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          event.stopPropagation();
          this.toggleTaskSelection(file);
          this.renderSelectionState(check, file);
          void this.renderSelectionToolbar();
        } else if (!event.shiftKey && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          void this.setFocus(file);
        }
      });
      card.addEventListener("contextmenu", (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (this.selectedTaskFiles().length > 1) this.openBatchEditor();
        else this.editTask(file);
      });
      card.setAttribute("aria-label", `任务：${file.basename}；左键聚焦，Ctrl/Cmd+左键多选，右键编辑`);
    } else {
      this.bindTaskFocusAndEdit(card, file, `任务：${file.basename}`);
    }
    const badges = side.createDiv({ cls: "pvd-badges" });
    badges.createSpan({ text: this.priority(file) });
    badges.createSpan({ text: this.taskStatus(file) });
    const quick = side.createDiv({ cls: "pvd-task-card-quick" });
    const open = this.button(quick, "打开文档 ↗", stop(() => this.openFile(file)), "pvd-task-open");
    open.setAttribute("aria-label", `打开任务文档：${file.basename}`);
    open.setAttribute("title", file.path);
    const capture = this.button(quick, "＋ 关联闪念", stop(() => this.createIdeaForTask(file)), "pvd-task-idea");
    capture.setAttribute("aria-label", `为任务“${file.basename}”创建关联闪念笔记`);
    main.createSpan({ cls: "pvd-card-edit-hint", text: selectable ? "左键聚焦 · Ctrl/Cmd 多选 · 右键编辑" : "左键聚焦 · 右键编辑" });
  }
  renderSelectionState(check, file) {
    const selected = this.isTaskSelected(file);
    check.setAttribute("aria-checked", String(selected));
    check.classList.toggle("is-checked", selected);
    const card = check.closest(".pvd-task");
    if (card) card.classList.toggle("is-selected", selected);
  }
  syncSelectionUi() {
    this.contentEl.querySelectorAll(".pvd-task-check").forEach((check) => {
      const card = check.closest(".pvd-task");
      const path = card == null ? void 0 : card.getAttribute("data-task-path");
      const selected = path ? this.selectedTasks.has(path) : false;
      check.setAttribute("aria-checked", String(selected));
      check.classList.toggle("is-checked", selected);
      if (card) card.classList.toggle("is-selected", selected);
    });
  }
  async renderSelectionToolbar() {
    const toolbar = this.contentEl.querySelector("[data-pvd-selection-toolbar]");
    if (!toolbar) return;
    const files = this.selectedTaskFiles();
    const count = toolbar.querySelector("[data-pvd-selection-count]");
    const selectAll = toolbar.querySelector("[data-pvd-selection-all]");
    const editButton = toolbar.querySelector("[data-pvd-selection-edit]");
    const clear = toolbar.querySelector("[data-pvd-selection-clear]");
    if (count) count.textContent = String(files.length);
    if (selectAll) selectAll.textContent = translateUiText(this.areAllVisibleSelected() ? "取消全选" : "全选", this.plugin.settings.language);
    toolbar.classList.toggle("is-hidden", files.length === 0);
    if (editButton) editButton.disabled = files.length === 0;
    if (clear) clear.disabled = files.length === 0;
    this.syncSelectionUi();
  }
  async ensureFolder(dir) {
    let current = "";
    for (const part of dir.split("/").filter(Boolean)) {
      current = current ? `${current}/${part}` : part;
      if (!this.app.vault.getAbstractFileByPath(current)) await this.app.vault.createFolder(current);
    }
  }
  validateNoteTitle(title) {
    if (!title) return "请输入标题。";
    if (title.length > 120) return "标题过长，请控制在 120 个字符以内。";
    if (/[\\/:*?"<>|]/.test(title) || /(^|\/)\.\.?(\/|$)/.test(title)) return '标题不能包含 \\ / : * ? " < > | 或路径片段。';
    if (/[. ]$/.test(title)) return "标题不能以句点或空格结尾。";
    if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i.test(title)) return "该标题是 Windows 保留文件名。";
    return "";
  }
  uniquePath(dir, title) {
    const date = this.dateKey();
    let path = `${dir}/${date} ${title}.md`;
    let index = 2;
    while (this.app.vault.getAbstractFileByPath(path)) path = `${dir}/${date} ${title} ${index++}.md`;
    return path;
  }
  uniqueIdeaRenamePath(file, title) {
    var _a;
    const dir = file.path.includes("/") ? file.path.slice(0, file.path.lastIndexOf("/")) : "";
    const date = ((_a = file.basename.match(/^\d{4}-\d{2}-\d{2}/)) == null ? void 0 : _a[0]) || this.dateKey(this.ideaCapturedAt(file));
    const base = `${date} ${title}`;
    let path = `${dir ? `${dir}/` : ""}${base}.md`;
    let index = 2;
    while (this.app.vault.getAbstractFileByPath(path) && path !== file.path) path = `${dir ? `${dir}/` : ""}${base} ${index++}.md`;
    return path;
  }
  uniqueTaskPath(dir, title) {
    let path = `${dir}/${title}.md`;
    let index = 2;
    while (this.app.vault.getAbstractFileByPath(path)) path = `${dir}/${title} ${index++}.md`;
    return path;
  }
  uniqueMovePath(dir, file) {
    let path = `${dir}/${file.name}`;
    let index = 2;
    while (this.app.vault.getAbstractFileByPath(path) && path !== file.path) path = `${dir}/${file.basename} ${index++}.${file.extension}`;
    return path;
  }
  async createIdeaForTask(task) {
    const dir = this.config().inbox;
    const taskLink = `[[${task.path.replace(/\.md$/, "")}]]`;
    await this.ensureFolder(dir);
    const title = `${task.basename} · 闪念`;
    const idea = await this.app.vault.create(this.uniquePath(dir, title), `---
type: 闪念笔记
状态: 收集
date: ${this.dateKey()}
关联任务: ${taskLink}
---

# ${title}

关联任务：${taskLink}

`);
    await this.app.fileManager.processFrontMatter(task, (fm) => {
      const ideaLink = `[[${idea.path.replace(/\.md$/, "")}]]`;
      const existing = Array.isArray(fm["关联闪念"]) ? fm["关联闪念"] : fm["关联闪念"] ? [fm["关联闪念"]] : [];
      if (!existing.includes(ideaLink)) fm["关联闪念"] = [...existing, ideaLink];
    });
    showNotice("已创建关联闪念，并写入双向链接");
    await this.openFile(idea);
    await this.render();
  }
  editIdea(file) {
    new IdeaEditorModal(this.app, this, file).open();
  }
  async updateIdea(file, values) {
    const previousPath = file.path;
    const linkedTask = this.ideaLinkedTask(file);
    const title = values.title.trim();
    const tags = [...new Set(String(values.tags || "").split(/[,，\s]+/).map((tag) => tag.trim().replace(/^#/, "")).filter(Boolean))];
    await this.app.fileManager.processFrontMatter(file, (fm) => {
      if (tags.length) fm.tags = tags;
      else delete fm.tags;
    });
    const content = await this.app.vault.cachedRead(file);
    const nextContent = /^# .+$/m.test(content) ? content.replace(/^# .+$/m, `# ${title}`) : `${content.trimEnd()}

# ${title}
`;
    if (nextContent !== content) await this.app.vault.modify(file, nextContent);
    const nextPath = this.uniqueIdeaRenamePath(file, title);
    if (nextPath !== file.path) await this.app.fileManager.renameFile(file, nextPath);
    if (linkedTask && nextPath !== previousPath) await this.replaceTaskIdeaLink(linkedTask, previousPath, nextPath);
    showNotice("闪念笔记已更新");
    await this.render();
  }
  async createIdea() {
    new TextPromptModal(this.app, "记录灵感", "一句话写下想法", async (title) => {
      const dir = this.config().inbox;
      await this.ensureFolder(dir);
      const file = await this.app.vault.create(this.uniquePath(dir, title), `---
type: 闪念笔记
状态: 收集
date: ${this.dateKey()}
---

# ${title}

`);
      await this.openFile(file);
      await this.render();
    }, (title) => this.validateNoteTitle(title)).open();
  }
  async convertIdeaToTask(file) {
    const dir = this.config().task;
    const title = this.ideaTitle(file);
    await this.ensureFolder(dir);
    const task = await this.app.vault.create(this.uniqueTaskPath(dir, title), await this.newTaskContent(title));
    await this.app.fileManager.processFrontMatter(task, (fm) => {
      fm["来源闪念"] = `[[${file.path.replace(/\.md$/, "")}]]`;
    });
    await this.app.fileManager.processFrontMatter(file, (fm) => {
      fm["状态"] = "已转任务";
      fm["处理日期"] = this.dateKey();
      fm["关联任务"] = `[[${task.path.replace(/\.md$/, "")}]]`;
    });
    showNotice("已从闪念创建任务，并保留双向来源");
    await this.render();
    await this.openFile(task);
  }
  async convertNoteToType(file, kind) {
    const linkedTask = this.ideaLinkedTask(file);
    const previousPath = file.path;
    const target = knowledgeNoteTemplateDefinitions.find((template) => template.type === kind);
    if (!target) {
      showNotice("不支持的知识笔记类型。");
      return;
    }
    const folderByType = { fleeting: this.config().inbox, literature: this.config().literature, permanent: this.config().permanent };
    const templateFile = this.app.vault.getAbstractFileByPath(this.plugin.settings[target.pathKey] || target.defaultPath);
    if (!templateFile || templateFile.children) {
      showNotice("目标笔记模板缺失或无法读取。");
      return;
    }
    let sourceContent;
    let templateContent;
    try {
      sourceContent = await this.app.vault.cachedRead(file);
      templateContent = await this.app.vault.cachedRead(templateFile);
    } catch (_) {
      showNotice("无法读取源笔记或目标模板。");
      return;
    }
    const folders = [this.config().inbox, this.config().literature, this.config().permanent];
    const targetFolder = folderByType[kind].replace(/\/$/, "");
    const destinationPath = `${targetFolder}/${file.name}`;
    const result = planNoteConversion({ sourcePath: file.path, sourceContent, templatePath: templateFile.path, templateContent, target: { type: target.type, folder: targetFolder, typeValue: target.typeValue, status: target.workflowStatus }, folders, conversionDate: this.dateKey(), destinationOccupied: Boolean(this.app.vault.getAbstractFileByPath(destinationPath) && destinationPath !== file.path) });
    if (!result.ok) {
      showNotice(result.error);
      return;
    }
    await this.ensureFolder(targetFolder);
    try {
      await this.app.vault.modify(file, result.plan.content);
      await this.app.fileManager.renameFile(file, result.plan.destinationPath);
    } catch (error) {
      try {
        await this.app.vault.modify(file, sourceContent);
      } catch (_) {
      }
      showNotice("转换失败，已尝试恢复原笔记。");
      return;
    }
    if (linkedTask && result.plan.destinationPath !== previousPath) await this.replaceTaskIdeaLink(linkedTask, previousPath, result.plan.destinationPath);
    showNotice(`已转为${target.title}：${result.plan.destinationPath}`);
    await this.render();
  }
  knowledgeNoteType(file) {
    const folders = { fleeting: this.config().inbox, literature: this.config().literature, permanent: this.config().permanent };
    for (const [type, folder] of Object.entries(folders)) if (file.path.startsWith(`${folder.replace(/\/$/, "")}/`)) return type;
    return { "闪念笔记": "fleeting", "文献笔记": "literature", "永久笔记": "permanent" }[this.meta(file).type] || null;
  }
  confirmKnowledgeConversion(file, target) {
    const folder = { fleeting: this.config().inbox, literature: this.config().literature, permanent: this.config().permanent }[target.type] || "";
    const destination = `${folder.replace(/\/$/, "")}/${file.name}`;
    new ConfirmModal(this.app, "转换为笔记类型", `将“${file.path}”转换为${target.title}并移动到“${destination}”？`, "开始转换", () => this.convertNoteToType(file, target.type)).open();
  }
  openKnowledgeContextMenu(event, file) {
    const menu = new Menu();
    const current = this.knowledgeNoteType(file);
    if (current === "fleeting") menu.addItem((item) => item.setTitle(translateUiText("编辑闪念", this.plugin.settings.language)).setIcon("pencil").onClick(() => this.editIdea(file)));
    menu.addItem((item) => {
      item.setTitle(translateUiText("转换为笔记类型", this.plugin.settings.language)).setIcon("shuffle");
      const submenu = item.setSubmenu();
      knowledgeNoteTemplateDefinitions.filter((target) => target.type !== current).forEach((target) => submenu.addItem((targetItem) => targetItem.setTitle(translateUiText(target.title, this.plugin.settings.language)).onClick(() => this.confirmKnowledgeConversion(file, target))));
    });
    if (event instanceof MouseEvent) menu.showAtMouseEvent(event);
    else menu.showAtPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  }
  async convertIdeaToNote(file, kind) {
    return this.convertNoteToType(file, kind);
  }
  discardIdea(file) {
    new ConfirmModal(this.app, "舍弃闪念", `将“${this.ideaTitle(file)}”移入 Obsidian 回收站，并清理任务中的关联？`, "舍弃", async () => {
      const linkedTask = this.ideaLinkedTask(file);
      await this.replaceTaskIdeaLink(linkedTask, file.path);
      await this.app.fileManager.trashFile(file);
      showNotice("闪念已移入回收站，任务关联已清理");
      await this.render();
    }).open();
  }
  async createTask() {
    const defaults = { project: "", priority: "P2", status: "待做", plan: this.dateKey(), estimate: "" };
    new TaskEditorModal(this.app, { basename: "新任务" }, defaults, this.projectOptions(), async (values) => {
      const config = this.config();
      const result = planWorkbenchDocumentCreation({ type: "task", title: values.title, folders: { task: config.task, project: config.project, fleeting: config.inbox, literature: config.literature, permanent: config.permanent }, occupiedPaths: this.app.vault.getAllLoadedFiles().map((entry) => entry.path) });
      if (!result.ok) {
        showNotice(result.error);
        return;
      }
      for (const directory of result.plan.directories) await this.ensureFolder(directory);
      const file = await this.app.vault.create(result.plan.documentPath, await this.newTaskContent(values.title));
      await this.app.fileManager.processFrontMatter(file, (next) => {
        this.setTaskProperty(next, "projectField", values.project ? `[[${values.project}]]` : "");
        this.setTaskProperty(next, "priorityField", values.priority);
        this.setTaskProperty(next, "planField", values.plan);
        this.setTaskProperty(next, "expectedField", values.estimate ? Number(values.estimate) : "");
      });
      if (values.status !== "待做") await this.transitionTask(file, values.status);
      showNotice("任务已创建");
      await this.render();
    }, [], { mode: "create", heading: "新建任务", lead: "填写任务属性并保存，任务会写入任务目录，不会离开当前工作台。", submitLabel: "创建任务", validateTitle: (title) => this.validateNoteTitle(title) }).open();
  }
  async createProject() {
    new TextPromptModal(this.app, "新建项目", "为项目工作区命名", async (title) => {
      const config = this.config();
      const result = planWorkbenchDocumentCreation({ type: "project", title, folders: { task: config.task, project: config.project, fleeting: config.inbox, literature: config.literature, permanent: config.permanent }, occupiedPaths: this.app.vault.getAllLoadedFiles().map((entry) => entry.path) });
      if (!result.ok) {
        showNotice(result.error);
        return;
      }
      for (const directory of result.plan.directories) await this.ensureFolder(directory);
      const template = this.app.vault.getAbstractFileByPath(this.plugin.settings.projectTemplatePath);
      const source = template && !template.children ? await this.app.vault.cachedRead(template) : starterProjectTemplate();
      const file = await this.app.vault.create(result.plan.documentPath, source.replace(/^# 新项目$/m, "# " + title));
      showNotice("项目工作区已创建");
      await this.openFile(file);
      await this.render();
    }, (title) => this.validateNoteTitle(title)).open();
  }
  async newTaskContent(title) {
    const schema4 = this.schema();
    const templatePath = this.plugin.settings.taskTemplatePath;
    const template = templatePath ? this.app.vault.getAbstractFileByPath(templatePath) : null;
    if (template && !template.children) {
      let content = await this.app.vault.cachedRead(template);
      content = setFrontmatterField(content, schema4.planField, this.dateKey());
      content = setFrontmatterField(content, "创建日期", this.dateKey());
      return /^# .+$/m.test(content) ? content.replace(/^# .+$/m, () => `# ${title}`) : `${content.trimEnd()}

# ${title}
`;
    }
    return `---
${schema4.typeField}: ${schema4.typeValue}
${schema4.projectField}: ""
${schema4.statusField}: 待做
${schema4.priorityField}: P2
${schema4.planField}: ${this.dateKey()}
${schema4.timerStateField}: 未开始
${schema4.timerStartedField}:
${schema4.elapsedField}: 0
${schema4.doneField}: false
---

# ${title}

## 完成标准

- [ ]
`;
  }
  async editTask(file) {
    const fm = this.meta(file);
    const project = String(this.taskProperty(file, "projectField") || "").replace(/^\[\[|\]\]$/g, "");
    const workflow = [{ label: "打开文档", run: () => this.openFile(file) }];
    if (!this.taskDone(file)) {
      workflow.push({ label: this.timerState(file) === "进行中" ? "暂停专注" : "开始专注", cls: "mod-cta", run: () => this.toggleTimer(file) });
      if (this.focusPath !== file.path) workflow.push({ label: "设为焦点", run: () => this.setFocus(file) });
      workflow.push({ label: "标记完成", run: () => this.complete(file) });
    }
    workflow.push({ label: "＋ 关联闪念", run: () => this.createIdeaForTask(file) });
    workflow.push({ label: "删除任务", cls: "pvd-danger", run: () => this.deleteTask(file) });
    new TaskEditorModal(this.app, file, { project, priority: this.priority(file), status: this.taskStatus(file), plan: this.taskPlan(file) ? this.dateKey(this.taskPlan(file)) : "", estimate: this.taskProperty(file, "expectedField") || "" }, this.projectOptions(), async (values) => {
      await this.transitionTask(file, values.status);
      await this.app.fileManager.processFrontMatter(file, (next) => {
        this.setTaskProperty(next, "projectField", values.project ? `[[${values.project}]]` : "");
        this.setTaskProperty(next, "priorityField", values.priority);
        this.setTaskProperty(next, "planField", values.plan);
        this.setTaskProperty(next, "expectedField", values.estimate ? Number(values.estimate) : "");
      });
      showNotice("任务已更新");
      await this.render();
    }, workflow).open();
  }
  async deleteTask(file) {
    new ConfirmModal(this.app, "删除任务", `将“${file.basename}”移入 Obsidian 回收站？`, "删除", async () => {
      await this.app.fileManager.trashFile(file);
      showNotice("任务已移入回收站");
      await this.render();
    }).open();
  }
  pauseTimerFrontmatter(fm) {
    const started = this.timestamp(fm[this.schema().timerStartedField]);
    if (fm[this.schema().timerStateField] === "进行中" && started) this.setTaskProperty(fm, "elapsedField", Math.max(0, Number(fm[this.schema().elapsedField]) || 0) + Math.max(0, Math.floor((Date.now() - started.getTime()) / 1e3)));
    this.setTaskProperty(fm, "timerStateField", "暂停");
    this.setTaskProperty(fm, "timerStartedField", "");
  }
  async transitionTask(file, targetStatus) {
    if (targetStatus === "进行中") {
      const other = this.allTaskFiles().find((task) => task.path !== file.path && this.timerState(task) === "进行中");
      if (other) await this.app.fileManager.processFrontMatter(other, (fm) => {
        this.pauseTimerFrontmatter(fm);
        this.setTaskProperty(fm, "statusField", "暂停");
      });
      await this.app.fileManager.processFrontMatter(file, (fm) => {
        if (fm[this.schema().timerStateField] !== "进行中") {
          this.setTaskProperty(fm, "timerStateField", "进行中");
          this.setTaskProperty(fm, "timerStartedField", (/* @__PURE__ */ new Date()).toISOString());
        }
        this.setTaskProperty(fm, "statusField", "进行中");
        this.setTaskProperty(fm, "doneField", false);
        this.setTaskProperty(fm, "completedAtField", "");
      });
      return;
    }
    await this.app.fileManager.processFrontMatter(file, (fm) => {
      if (fm[this.schema().timerStateField] === "进行中") this.pauseTimerFrontmatter(fm);
      this.setTaskProperty(fm, "statusField", targetStatus);
      if (targetStatus === "完成") {
        this.setTaskProperty(fm, "doneField", true);
        this.setTaskProperty(fm, "completedAtField", fm[this.schema().completedAtField] || this.dateKey());
        this.setTaskProperty(fm, "timerStateField", "完成");
        this.setTaskProperty(fm, "timerStartedField", "");
      } else {
        this.setTaskProperty(fm, "doneField", false);
        this.setTaskProperty(fm, "completedAtField", "");
        if (targetStatus === "暂停") this.setTaskProperty(fm, "timerStateField", "暂停");
        if (targetStatus === "待做") this.setTaskProperty(fm, "timerStateField", "未开始");
      }
    });
  }
  async toggleTimer(file) {
    this.focusPath = file.path;
    const running = this.timerState(file) === "进行中";
    await this.transitionTask(file, running ? "暂停" : "进行中");
    showNotice(running ? "已暂停专注" : "已开始专注");
    await this.render();
  }
  async complete(file) {
    await this.transitionTask(file, "完成");
    showNotice("任务已完成");
    await this.render();
  }
};
function unifiedTaskBase() {
  return `filters:
  and:
    - note.type == "任务"
properties:
  file.name:
    displayName: 任务名
  所属项目:
    displayName: 所属项目
  任务状态:
    displayName: 状态
  任务优先级:
    displayName: 优先级
  计划日期:
    displayName: 计划日期
  预计耗时分钟:
    displayName: 预计分钟
  完成:
    displayName: 完成
  完成日期:
    displayName: 完成日期
views:
  - type: table
    name: 全部任务
    order:
      - file.name
      - 所属项目
      - 任务状态
      - 任务优先级
      - 计划日期
      - 预计耗时分钟
      - 完成
  - type: table
    name: 今日
    filters:
      and:
        - 计划日期 == today()
        - 任务状态 != "完成"
    order:
      - file.name
      - 所属项目
      - 任务优先级
  - type: table
    name: 进行中
    filters:
      and:
        - 任务状态 == "进行中"
    order:
      - file.name
      - 所属项目
      - 计划日期
  - type: table
    name: 已完成
    filters:
      and:
        - 任务状态 == "完成"
    order:
      - file.name
      - 所属项目
      - 完成日期
`;
}
function starterTaskTemplate(schema4) {
  return `---
${schema4.typeField}: ${schema4.typeValue}
${schema4.projectField}: ""
${schema4.statusField}: 待做
${schema4.priorityField}: P2
${schema4.planField}:
${schema4.expectedField}:
${schema4.timerStateField}: 未开始
${schema4.timerStartedField}:
${schema4.elapsedField}: 0
${schema4.doneField}: false
${schema4.completedAtField}:
创建日期:
---

# 新任务

## 完成标准

- [ ]
`;
}
function starterProjectTemplate() {
  return "---\ntype: 项目\n状态: 进行中\n创建日期: \n---\n\n# 新项目\n\n## 目标\n\n\n## 完成标准\n\n- [ ] \n";
}
function knowledgeNoteTemplates(settings) {
  return configuredKnowledgeNoteTemplates(settings);
}
function workbenchDocumentTemplates(settings) {
  return [
    { type: "task", path: settings.taskTemplatePath, content: starterTaskTemplate(Object.assign({}, DEFAULT_SETTINGS.schema, settings.schema || {})) },
    { type: "project", path: settings.projectTemplatePath, content: starterProjectTemplate() },
    ...knowledgeNoteTemplates(settings)
  ];
}
function normalizeVaultPath(value) {
  return normalizePath3(String(value || "").trim()).replace(/\/$/, "");
}
async function ensureVaultFolder(vault, folder) {
  let current = "";
  for (const part of folder.split("/").filter(Boolean)) {
    current = current ? `${current}/${part}` : part;
    if (!vault.getAbstractFileByPath(current)) await vault.createFolder(current);
  }
}
var FocusWorkbenchSettingTab = class extends PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.addClass("pvd-settings-guide");
    const settings = this.plugin.settings;
    const languageSetting = new Setting(containerEl).setName("界面语言").setDesc("选择 Omni Workbench 的界面语言。仓库目录、字段和值不会被改写。").addDropdown((dropdown) => dropdown.addOption("zh-CN", "简体中文").addOption("en", "English").setValue(settings.language || DEFAULT_SETTINGS.language).onChange(async (language) => {
      settings.language = language;
      ACTIVE_LANGUAGE = language;
      await this.plugin.saveSettings();
      await this.plugin.refreshUi();
      this.display();
    }));
    languageSetting.settingEl.addClass("pvd-language-setting");
    const defaults = {
      inboxFolder: "Omni Workbench/闪念笔记",
      literatureFolder: "Omni Workbench/文献笔记",
      permanentFolder: "Omni Workbench/永久笔记",
      taskFolder: "Omni Workbench/任务",
      projectFolder: "Omni Workbench/项目",
      taskTemplatePath: "模板/任务模板.md",
      projectTemplatePath: "模板/项目模板.md",
      ...knowledgeNoteTemplateDefaults(),
      taskBasePath: "目标与任务/任务总表.base"
    };
    const value = (key) => settings[key] || defaults[key];
    const entry = (path) => path ? this.app.vault.getAbstractFileByPath(path) : null;
    const folderExists = (path) => {
      var _a;
      return Boolean((_a = entry(path)) == null ? void 0 : _a.children);
    };
    const fileExists = (path) => Boolean(entry(path) && !entry(path).children);
    const saveDocumentFolder = async (key, next) => {
      const path = normalizeVaultPath(next);
      const candidate = {
        task: key === "taskFolder" ? path : value("taskFolder"),
        project: key === "projectFolder" ? path : value("projectFolder"),
        fleeting: key === "inboxFolder" ? path : value("inboxFolder"),
        literature: key === "literatureFolder" ? path : value("literatureFolder"),
        permanent: key === "permanentFolder" ? path : value("permanentFolder")
      };
      const validation = validateWorkbenchDocumentFolders(candidate);
      if (!validation.ok) {
        showNotice(validation.error);
        return;
      }
      settings[key] = path;
      await this.plugin.saveSettings();
    };
    const folderReady = ["inboxFolder", "literatureFolder", "permanentFolder", "taskFolder", "projectFolder"].every((key) => folderExists(value(key))) && folderExists("目标与任务/任务管理/每日进展");
    const templatePathKeys = { task: "taskTemplatePath", project: "projectTemplatePath", fleeting: "fleetingNoteTemplatePath", literature: "literatureNoteTemplatePath", permanent: "permanentNoteTemplatePath" };
    const taskTemplateReady = fileExists(value("taskTemplatePath"));
    const documentTemplatesReady = workbenchDocumentTemplates(settings).every((template) => fileExists(value(templatePathKeys[template.type])));
    const templateReady = documentTemplatesReady;
    const baseReady = fileExists(value("taskBasePath"));
    const readyCount = [folderReady, templateReady, baseReady].filter(Boolean).length;
    const hero = containerEl.createDiv({ cls: "pvd-onboarding-hero" });
    const heroCopy = hero.createDiv({ cls: "pvd-onboarding-hero-copy" });
    heroCopy.createEl("p", { cls: "pvd-onboarding-kicker", text: "首次使用 · 约 1 分钟" });
    heroCopy.createEl("strong", { cls: "pvd-onboarding-title", text: "先搭好工作区，再开始记录" });
    heroCopy.createEl("p", { text: "推荐初始化会创建五类文档目录、五类模板、任务总表和每日进展目录。已有文件只会保留，不会覆盖或移动。" });
    const progress = hero.createDiv({ cls: "pvd-onboarding-progress", attr: { role: "status", "aria-label": `初始化进度：完成 ${readyCount}/3` } });
    progress.createEl("strong", { text: `${readyCount}/3` });
    progress.createSpan({ text: readyCount === 3 ? "准备完成" : "项已就绪" });
    new Setting(hero).setName(readyCount === 3 ? "推荐结构已准备好" : "自动创建推荐结构").setDesc("包括五类文档目录、五类模板、每日进展目录和 Obsidian Bases 任务总表；可以重复执行，已有内容不会被改写。").addButton((button) => button.setButtonText(readyCount === 3 ? "检查并补齐" : "一键初始化").setCta().onClick(() => new ConfirmModal(this.app, "初始化推荐工作区", "将补齐五类文档目录、五类模板和任务总表。已有文件不会被覆盖，是否继续？", "开始初始化", async () => {
      var _a;
      Object.entries(defaults).forEach(([key, path]) => {
        if (!settings[key]) settings[key] = path;
      });
      if (workbenchDocumentTemplates(settings).some((template) => !template.path.endsWith(".md"))) {
        showNotice("文档模板路径必须以 .md 结尾。");
        return;
      }
      if (!settings.taskBasePath.endsWith(".base")) {
        showNotice("任务总表路径必须以 .base 结尾。");
        return;
      }
      const documentFolders = { task: settings.taskFolder, project: settings.projectFolder, fleeting: settings.inboxFolder, literature: settings.literatureFolder, permanent: settings.permanentFolder };
      const folderValidation = validateWorkbenchDocumentFolders(documentFolders);
      if (!folderValidation.ok) {
        showNotice(folderValidation.error);
        return;
      }
      const templates = workbenchDocumentTemplates(settings);
      const templateSetup = planWorkbenchDocumentTemplateSetup({
        templates,
        existingEntries: Object.fromEntries(templates.map((template) => {
          const existing = this.app.vault.getAbstractFileByPath(template.path);
          return [template.path, existing ? existing.children ? "folder" : "file" : "missing"];
        }))
      });
      if (templateSetup.conflicts.length) {
        showNotice(templateSetup.conflicts.some((conflict) => conflict.reason === "duplicate-path") ? "文档模板路径不能重复。" : "文档模板路径当前是一个文件夹，请换一个 .md 文件路径。");
        return;
      }
      const folders = [settings.inboxFolder, settings.literatureFolder, settings.permanentFolder, settings.taskFolder, settings.projectFolder, "目标与任务/任务管理/每日进展"];
      for (const folder of folders) await ensureVaultFolder(this.app.vault, folder);
      for (const template of templateSetup.creations) {
        await ensureVaultFolder(this.app.vault, template.path.split("/").slice(0, -1).join("/"));
        await this.app.vault.create(template.path, template.content);
      }
      const basePath = settings.taskBasePath;
      await ensureVaultFolder(this.app.vault, basePath.split("/").slice(0, -1).join("/"));
      if ((_a = this.app.vault.getAbstractFileByPath(basePath)) == null ? void 0 : _a.children) {
        showNotice("任务总表路径当前是一个文件夹，请换一个 .base 文件路径。");
        return;
      }
      if (!this.app.vault.getAbstractFileByPath(basePath)) await this.app.vault.create(basePath, unifiedTaskBase());
      await this.plugin.saveSettings();
      this.display();
      showNotice("推荐工作区已准备好，可以打开 Omni Workbench 开始使用。");
    }).open()));
    const map2 = containerEl.createDiv({ cls: "pvd-onboarding-map", attr: { "aria-label": "三步上手流程" } });
    [
      ["1", "收集", "想法先进入闪念笔记"],
      ["2", "整理", "阅读输入放入文献笔记"],
      ["3", "沉淀", "自己的结论写成永久笔记"]
    ].forEach(([number, title, description]) => {
      const item = map2.createDiv({ cls: "pvd-onboarding-map-item" });
      item.createEl("b", { text: number });
      const copy = item.createDiv();
      copy.createEl("strong", { text: title });
      copy.createSpan({ text: description });
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
      head.createEl("strong", { text: name });
      head.createSpan({ text: stage });
      card.createEl("p", { text: description });
      card.createEl("small", { text: example });
      new Setting(card).setName("保存位置").setDesc(folderExists(value(key)) ? "目录已存在" : "初始化时会自动创建").addText((text) => text.setValue(value(key)).setPlaceholder(defaults[key]).onChange((next) => saveDocumentFolder(key, next)));
    });
    new Setting(containerEl).setName("第 2 步：确认任务和项目如何保存").setDesc("任务与项目各有自己的默认目录；五个文档目录必须互不重叠。").setHeading();
    const taskSection = containerEl.createDiv({ cls: "pvd-settings-section" });
    new Setting(taskSection).setName("任务目录").setDesc("新建任务保存在这里，插件也只从这里读取符合字段规则的任务。").addText((text) => text.setValue(value("taskFolder")).setPlaceholder(defaults.taskFolder).onChange((next) => saveDocumentFolder("taskFolder", next)));
    new Setting(taskSection).setName("项目目录").setDesc("每个项目工作区会在这里创建项目文档与其子任务目录。").addText((text) => text.setValue(value("projectFolder")).setPlaceholder(defaults.projectFolder).onChange((next) => saveDocumentFolder("projectFolder", next)));
    new Setting(containerEl).setName("第 3 步：理解模板和任务总表").setDesc("模板决定新任务笔记的内容；任务总表只是额外的表格视图，两者用途不同。").setHeading();
    const assets = containerEl.createDiv({ cls: "pvd-settings-assets" });
    const templateCard = assets.createDiv({ cls: "pvd-settings-asset-card" });
    templateCard.createEl("strong", { text: "任务与项目模板 · 定义执行文档格式" });
    templateCard.createEl("p", { text: "每种执行文档都有独立模板。初始化只会创建缺失模板，绝不会覆盖你已有的内容。" });
    new Setting(templateCard).setName(taskTemplateReady ? "模板已找到" : "等待初始化").setDesc(value("taskTemplatePath")).addText((text) => text.setValue(value("taskTemplatePath")).setPlaceholder(defaults.taskTemplatePath).onChange(async (next) => {
      settings.taskTemplatePath = normalizeVaultPath(next);
      await this.plugin.saveSettings();
    }));
    new Setting(templateCard).setName(fileExists(value("projectTemplatePath")) ? "模板已找到" : "等待初始化").setDesc(value("projectTemplatePath")).addText((text) => text.setValue(value("projectTemplatePath")).setPlaceholder(defaults.projectTemplatePath).onChange(async (next) => {
      settings.projectTemplatePath = normalizeVaultPath(next);
      await this.plugin.saveSettings();
    }));
    const knowledgeTemplateCard = assets.createDiv({ cls: "pvd-settings-asset-card" });
    knowledgeTemplateCard.createEl("strong", { text: "三类知识笔记模板 · 定义转换后的笔记格式" });
    knowledgeTemplateCard.createEl("p", { text: "每种知识笔记类型都有独立模板。转换时仅应用模板的 frontmatter，原笔记正文会完整保留。" });
    knowledgeNoteTemplateDefinitions.forEach((template) => {
      new Setting(knowledgeTemplateCard).setName(fileExists(value(template.pathKey)) ? "知识模板已找到" : "等待初始化").setDesc(template.label).addText((text) => text.setValue(value(template.pathKey)).setPlaceholder(defaults[template.pathKey]).onChange(async (next) => {
        settings[template.pathKey] = normalizeVaultPath(next);
        await this.plugin.saveSettings();
      }));
    });
    const baseCard = assets.createDiv({ cls: "pvd-settings-asset-card" });
    baseCard.createEl("strong", { text: "任务总表 · 用表格浏览同一批任务" });
    baseCard.createEl("p", { text: "这是可选的 Obsidian Bases 视图，提供“全部、今日、进行中、已完成”表格。它不会决定插件读取哪些任务。" });
    new Setting(baseCard).setName(baseReady ? "任务总表已找到" : "等待初始化").setDesc(value("taskBasePath")).addText((text) => text.setValue(value("taskBasePath")).setPlaceholder(defaults.taskBasePath).onChange(async (next) => {
      settings.taskBasePath = normalizeVaultPath(next);
      await this.plugin.saveSettings();
    }));
    new Setting(containerEl).setName("已有仓库或自定义字段").setDesc("如果你已经有自己的目录和 frontmatter 字段，再使用高级映射；全新用户可以跳过。").setHeading();
    new Setting(containerEl).setName("连接现有仓库").setDesc("映射已有任务、项目、三类知识目录与字段名称。不会移动或修改任何已有笔记。").addButton((button) => button.setButtonText("打开高级映射").onClick(() => new SetupModal(this.app, this.plugin).open()));
    localizeElement(containerEl, settings.language);
  }
};
var VISUAL_RUNTIME_STYLE_ID = "pvd-visual-runtime-v7";
var VISUAL_RUNTIME_CSS = `
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
    var _a;
    await this.loadSettings();
    ACTIVE_LANGUAGE = this.settings.language;
    (_a = document.getElementById(VISUAL_RUNTIME_STYLE_ID)) == null ? void 0 : _a.remove();
    const visualStyle = document.createElement("style");
    visualStyle.id = VISUAL_RUNTIME_STYLE_ID;
    visualStyle.textContent = VISUAL_RUNTIME_CSS;
    document.head.appendChild(visualStyle);
    this.register(() => visualStyle.remove());
    this.registerView(VIEW_TYPE, (leaf) => new FocusWorkbenchView(leaf, this));
    this.addSettingTab(new FocusWorkbenchSettingTab(this.app, this));
    this.ribbonIconEl = this.addRibbonIcon("layout-dashboard", this.settings.language === "en" ? "Open Omni Workbench" : "打开 Omni Workbench", () => this.activateView());
    this.addCommand({ id: "open-focus-workbench", name: "Open Omni Workbench", callback: () => this.activateView() });
    this.registerEvent(this.app.workspace.on("file-menu", (menu, file) => this.addKnowledgeConversionMenu(menu, file)));
  }
  knowledgeNoteType(file) {
    var _a, _b;
    const folders = { fleeting: this.settings.inboxFolder, literature: this.settings.literatureFolder, permanent: this.settings.permanentFolder };
    for (const [type2, folder] of Object.entries(folders)) if (folder && (file.path === folder || file.path.startsWith(`${folder.replace(/\/$/, "")}/`))) return type2;
    const type = (_b = (_a = this.app.metadataCache.getFileCache(file)) == null ? void 0 : _a.frontmatter) == null ? void 0 : _b.type;
    return { "闪念笔记": "fleeting", "文献笔记": "literature", "永久笔记": "permanent" }[type] || null;
  }
  addKnowledgeConversionMenu(menu, file) {
    if (!file || file.extension !== "md") return;
    const current = this.knowledgeNoteType(file);
    const targets = knowledgeNoteTemplateDefinitions.filter((target) => target.type !== current);
    if (!targets.length) return;
    menu.addItem((item) => {
      item.setTitle(translateUiText("转换为笔记类型", this.settings.language)).setIcon("shuffle");
      const submenu = item.setSubmenu();
      targets.forEach((target) => submenu.addItem((targetItem) => targetItem.setTitle(translateUiText(target.title, this.settings.language)).onClick(() => this.confirmNativeConversion(file, target))));
    });
  }
  async confirmNativeConversion(file, target) {
    const folder = { fleeting: this.settings.inboxFolder, literature: this.settings.literatureFolder, permanent: this.settings.permanentFolder }[target.type] || "";
    const destination = `${folder.replace(/\/$/, "")}/${file.name}`;
    new ConfirmModal(this.app, "转换为笔记类型", `将“${file.path}”转换为${target.title}并移动到“${destination}”？`, "开始转换", async () => {
      var _a, _b;
      await this.activateView();
      const view = (_a = this.app.workspace.getLeavesOfType(VIEW_TYPE)[0]) == null ? void 0 : _a.view;
      await ((_b = view == null ? void 0 : view.convertNoteToType) == null ? void 0 : _b.call(view, file, target.type));
    }).open();
  }
  async loadSettings() {
    const saved = await this.loadData() || {};
    this.settings = Object.assign({}, DEFAULT_SETTINGS, saved, { schema: Object.assign({}, DEFAULT_SETTINGS.schema, saved.schema || {}) });
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
  async refreshUi() {
    if (this.ribbonIconEl) this.ribbonIconEl.setAttribute("aria-label", this.settings.language === "en" ? "Open Omni Workbench" : "打开 Omni Workbench");
    await Promise.all(this.app.workspace.getLeavesOfType(VIEW_TYPE).map((leaf) => {
      var _a, _b;
      return (_b = (_a = leaf.view) == null ? void 0 : _a.render) == null ? void 0 : _b.call(_a);
    }));
  }
  async activateView() {
    const { workspace } = this.app;
    let leaf = workspace.getLeavesOfType(VIEW_TYPE)[0];
    if (!leaf) {
      leaf = workspace.getLeaf("tab");
      await leaf.setViewState({ type: VIEW_TYPE, active: true, state: {} });
    }
    await workspace.revealLeaf(leaf);
  }
  onunload() {
    var _a;
    (_a = document.getElementById(VISUAL_RUNTIME_STYLE_ID)) == null ? void 0 : _a.remove();
    this.app.workspace.detachLeavesOfType(VIEW_TYPE);
  }
};
