import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const root = process.cwd();
const requiredFiles = ["README.md", "LICENSE", "main.js", "manifest.json"];

await Promise.all(requiredFiles.map((file) => access(resolve(root, file))));

const manifest = JSON.parse(await readFile(resolve(root, "manifest.json"), "utf8"));
const errors = [];

if (!/^[a-z]+(?:-[a-z]+)*$/.test(manifest.id ?? "")) errors.push("manifest.id must contain lowercase letters and hyphens only.");
if (manifest.id.includes("obsidian")) errors.push("manifest.id must not contain 'obsidian'.");
if (manifest.id.endsWith("plugin")) errors.push("manifest.id must not end with 'plugin'.");
if (!/^\d+\.\d+\.\d+$/.test(manifest.version ?? "")) errors.push("manifest.version must use x.y.z SemVer.");
for (const key of ["name", "version", "minAppVersion", "description", "author", "isDesktopOnly"]) {
  if (manifest[key] === undefined || manifest[key] === "") errors.push(`manifest.${key} is required.`);
}
if (typeof manifest.isDesktopOnly !== "boolean") errors.push("manifest.isDesktopOnly must be a boolean.");

if (errors.length) throw new Error(`Release validation failed:\n- ${errors.join("\n- ")}`);

await execFileAsync(process.execPath, ["--check", resolve(root, "main.js")]);
console.log(`Release checks passed for ${manifest.id}@${manifest.version}.`);
