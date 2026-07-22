import { cp, mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const dist = resolve(root, "dist");
const releaseFiles = ["main.js", "manifest.json", "styles.css"];

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await Promise.all(releaseFiles.map((file) => cp(resolve(root, file), resolve(dist, file))));

console.log(`Prepared ${releaseFiles.length} release assets in dist/.`);
