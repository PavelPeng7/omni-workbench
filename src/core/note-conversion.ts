import { parseDocument, stringify } from "yaml";
import type { KnowledgeNoteType } from "./knowledge-templates";

export interface ConversionTarget { type: KnowledgeNoteType; folder: string; typeValue: string; status: string; }
export interface NoteConversionInput { sourcePath: string; sourceContent: string; templatePath: string; templateContent: string; target: ConversionTarget; folders: readonly string[]; conversionDate: string; destinationOccupied: boolean; }
export interface NoteConversionPlan { destinationPath: string; content: string; }
export type NoteConversionResult = { ok: true; plan: NoteConversionPlan } | { ok: false; error: string };

interface ParsedNote { frontmatter: Record<string, unknown>; body: string; }
interface ParseFailure { error: string; }

function parseNote(content: string, label: string): ParsedNote | ParseFailure {
  if (!content.startsWith("---\n") && !content.startsWith("---\r\n")) return { frontmatter: {}, body: content };
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) return { error: `${label} frontmatter is not closed.` };
  const document = parseDocument(match[1]);
  if (document.errors.length) return { error: `${label} frontmatter is invalid.` };
  const value: unknown = document.toJS() as unknown;
  if (value !== null && (typeof value !== "object" || Array.isArray(value))) return { error: `${label} frontmatter must be a mapping.` };
  return { frontmatter: (value || {}) as Record<string, unknown>, body: content.slice(match[0].length) };
}

function isFailure(value: ParsedNote | ParseFailure): value is ParseFailure { return "error" in value; }
function list(value: unknown): unknown[] { return Array.isArray(value) ? value : value === undefined || value === null || value === "" ? [] : [value]; }
function renderDate(value: unknown, date: string): unknown { return typeof value === "string" ? value.replace(/{{date}}/g, date) : value; }

export function planNoteConversion(input: NoteConversionInput): NoteConversionResult {
  if (!input.sourcePath.toLowerCase().endsWith(".md")) return { ok: false, error: "Only Markdown files can be converted." };
  const folders = input.folders.map(folder => folder.replace(/^\/+|\/+$/g, "")).filter(Boolean);
  if (folders.length !== 3 || new Set(folders).size !== folders.length || folders.some((folder, index) => folders.some((other, otherIndex) => index !== otherIndex && other.startsWith(`${folder}/`))) || !folders.includes(input.target.folder.replace(/^\/+|\/+$/g, ""))) return { ok: false, error: "Knowledge-note folders must be configured, unique, and non-overlapping." };
  if (!input.templatePath.toLowerCase().endsWith(".md") || !input.templateContent) return { ok: false, error: "The target template is missing or unreadable." };
  const source = parseNote(input.sourceContent, "Source"); if (isFailure(source)) return { ok: false, error: source.error };
  const template = parseNote(input.templateContent, "Template"); if (isFailure(template)) return { ok: false, error: template.error };
  const name = input.sourcePath.slice(input.sourcePath.lastIndexOf("/") + 1);
  const destinationPath = `${input.target.folder.replace(/\/$/, "")}/${name}`;
  if (destinationPath === input.sourcePath) return { ok: false, error: "The note already has this type." };
  if (input.destinationOccupied) return { ok: false, error: "A file or folder already exists at the destination." };
  const renderedTemplate = Object.entries(template.frontmatter).reduce((values, [key, value]) => {
    values[key] = renderDate(value, input.conversionDate);
    return values;
  }, {} as Record<string, unknown>);
  const merged: Record<string, unknown> = { ...renderedTemplate, ...source.frontmatter };
  for (const key of new Set([...Object.keys(source.frontmatter), ...Object.keys(template.frontmatter)])) {
    if (key === "tags" || key === "aliases" || Array.isArray(source.frontmatter[key]) || Array.isArray(template.frontmatter[key])) merged[key] = [...new Set([...list(source.frontmatter[key]), ...list(template.frontmatter[key])].map(value => String(value).trim()).filter(Boolean))];
  }
  Object.assign(merged, { type: input.target.typeValue, "状态": input.target.status, "处理日期": input.conversionDate });
  const body = source.body;
  return { ok: true, plan: { destinationPath, content: `---\n${stringify(merged).replace(/\s+$/, "")}\n---\n${body}` } };
}
