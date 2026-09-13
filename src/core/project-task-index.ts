export interface ProjectTaskAssignmentInput {
  sourcePath: string;
  taskRoot: string;
  projectWorkspace?: string;
  occupiedPaths: readonly string[];
}

export type ProjectTaskAssignmentResult = { ok: true; destinationPath: string } | { ok: false; error: string };

export interface ChildTaskIndexItem {
  title: string;
  path: string;
  status: string;
  priority: string;
}

function normalize(path: string): string { return path.replace(/\\/g, "/").replace(/^\/+|\/+$/g, ""); }

export function planProjectTaskAssignment(input: ProjectTaskAssignmentInput): ProjectTaskAssignmentResult {
  const source = normalize(input.sourcePath);
  const root = normalize(input.taskRoot);
  const targetDirectory = input.projectWorkspace ? normalize(input.projectWorkspace) + "/任务" : root;
  const name = source.slice(source.lastIndexOf("/") + 1);
  if (!root || !name.endsWith(".md")) return { ok: false, error: "An independent task root and Markdown task are required." };
  const occupied = new Set(input.occupiedPaths.map(normalize).filter(path => path !== source));
  let index = 1;
  for (;;) {
    const suffix = index === 1 ? "" : " " + index;
    const base = name.slice(0, -3);
    const destinationPath = targetDirectory + "/" + base + suffix + ".md";
    if (!occupied.has(destinationPath)) return { ok: true, destinationPath };
    index += 1;
  }
}

export function renderChildTaskIndex(content: string, tasks: readonly ChildTaskIndexItem[]): string {
  const rows = tasks.map(task => "- [ ] [[" + task.path.replace(/\.md$/, "") + "|" + task.title + "]] · " + task.status + " · " + task.priority);
  const region = "<!-- omni:child-tasks:start -->\n## 子任务\n\n" + (rows.length ? rows.join("\n") : "_暂无子任务_") + "\n<!-- omni:child-tasks:end -->";
  const pattern = /<!-- omni:child-tasks:start -->[\s\S]*?<!-- omni:child-tasks:end -->/;
  return pattern.test(content) ? content.replace(pattern, region) : content.replace(/\s*$/, "") + "\n\n" + region + "\n";
}
