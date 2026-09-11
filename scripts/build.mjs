import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { build } from "esbuild";

const root = process.cwd();
const dist = resolve(root, "dist");
const bundlePath = resolve(root, "main.js");
const releaseFiles = ["main.js", "manifest.json", "styles.css"];

await build({
  entryPoints: [resolve(root, "src/main.ts")],
  outfile: bundlePath,
  bundle: true,
  external: ["obsidian"],
  format: "cjs",
  platform: "browser",
  target: "es2018",
  charset: "utf8",
  minify: false,
  sourcemap: false,
  logLevel: "info",
});

// esbuild expands escaped template strings; trim only line-end padding so the
// generated artifact remains friendly to diff and whitespace checks.
const bundle = await readFile(bundlePath, "utf8");
await writeFile(bundlePath, bundle.replace(/[ \t]+$/gm, ""), "utf8");

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await Promise.all(releaseFiles.map((file) => cp(resolve(root, file), resolve(dist, file))));

console.log(`Prepared ${releaseFiles.length} release assets in dist/.`);
