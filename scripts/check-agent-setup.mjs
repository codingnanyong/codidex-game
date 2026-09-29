import { existsSync, readFileSync, readdirSync } from "node:fs";

const requiredFiles = [
  ".gitignore",
  ".mcp.json",
  "AGENTS.md",
  "CLAUDE.md",
  "agents/shared-code-reviewer.md",
  "agents/shared-debugger.md",
  "agents/shared-security-auditor.md",
  "commands/claude-delegate-codex.md",
  "commands/shared-commit.md",
  "commands/shared-review.md",
  "hooks/claude-statusline.mjs",
  "hooks/shared-protect-paths.mjs",
  "output-styles/shared-terse.md",
  "plugins/shared-registry.json",
  "rules/shared-generated-assets.md",
  "scripts/check-agent-hooks.mjs",
  "scripts/link-agent-workspace.mjs",
  "skills/claude-collaboration/SKILL.md",
  "skills/shared-change-review/SKILL.md",
  "templates/shared-handoff.md",
  ".claude/settings.json",
];
const prefixedRoots = [
  "agents",
  "commands",
  "hooks",
  "output-styles",
  "plugins",
  "rules",
  "skills",
  "templates",
];
const validPrefixes = ["shared-", "claude-", "codex-"];
const failures = [];

for (const directory of prefixedRoots) {
  let entries;
  try {
    entries = readdirSync(directory, { withFileTypes: true });
  } catch {
    failures.push(`missing agent directory: ${directory}`);
    continue;
  }

  for (const entry of entries) {
    if (
      entry.name !== "README.md" &&
      !validPrefixes.some((prefix) => entry.name.startsWith(prefix))
    ) {
      failures.push(
        `${directory}/${entry.name} must start with shared-, claude-, or codex-`,
      );
    }
  }
}

for (const file of requiredFiles) {
  if (!existsSync(file)) failures.push(`missing required agent file: ${file}`);
}

const settings = readJson(".claude/settings.json");
const mcp = readJson(".mcp.json");
const pluginRegistry = readJson("plugins/shared-registry.json");

if (settings) {
  const preToolUse = settings.hooks?.PreToolUse ?? [];
  const protectedPathHook = preToolUse.find((entry) =>
    entry.hooks?.some((hook) =>
      hook.command?.includes("$CLAUDE_PROJECT_DIR/hooks/shared-protect-paths.mjs"),
    ),
  );
  if (!protectedPathHook) {
    failures.push("Claude settings must register the project-root protection hook");
  } else if (!protectedPathHook.matcher?.includes("Bash")) {
    failures.push("Claude protection hook must inspect Bash writes");
  }

  if (
    !settings.statusLine?.command?.includes(
      "$CLAUDE_PROJECT_DIR/hooks/claude-statusline.mjs",
    )
  ) {
    failures.push("Claude settings must register the project-root status line");
  }
}

if (mcp && typeof mcp.mcpServers !== "object") {
  failures.push(".mcp.json must contain an mcpServers object");
}
if (pluginRegistry && !Array.isArray(pluginRegistry.plugins)) {
  failures.push("plugins/shared-registry.json must contain a plugins array");
}

const frontmatterRequirements = [
  ...requiredFrontmatter("agents", ["name", "description", "tools"]),
  ...requiredFrontmatter("commands", ["description"]),
  ...requiredFrontmatter("output-styles", ["name", "description"]),
];
for (const [file, fields] of frontmatterRequirements) {
  const content = readText(file);
  if (!content) continue;
  const frontmatter = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!frontmatter) {
    failures.push(`${file} must have YAML frontmatter`);
    continue;
  }
  for (const field of fields) {
    if (!new RegExp(`^${field}:\\s*.+$`, "m").test(frontmatter[1])) {
      failures.push(`${file} frontmatter must define ${field}`);
    }
  }
}

const textChecks = [
  ["CLAUDE.md", "@AGENTS.md", "CLAUDE.md must import AGENTS.md"],
  [".gitignore", ".agents/", "Generated .agents adapters must stay untracked"],
  [".gitignore", ".codex/skills/", "Generated Codex skill adapter must stay untracked"],
  [".gitignore", ".claude/skills/", "Generated Claude skill adapter must stay untracked"],
  [".gitignore", "CLAUDE.local.md", "Claude local instructions must stay untracked"],
  [
    ".github/workflows/ci.yml",
    "npm run check:agents",
    "CI must run the agent setup check",
  ],
];
for (const [file, expected, message] of textChecks) {
  const content = readText(file);
  if (content && !content.includes(expected)) failures.push(message);
}

if (failures.length > 0) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log("Agent setup is wired correctly.");
}

function readText(file) {
  try {
    return readFileSync(file, "utf8");
  } catch {
    return "";
  }
}

function readJson(file) {
  const content = readText(file);
  if (!content) return null;
  try {
    return JSON.parse(content);
  } catch (error) {
    failures.push(`${file} is invalid JSON: ${error.message}`);
    return null;
  }
}

function requiredFrontmatter(directory, fields) {
  try {
    return readdirSync(directory, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
      .map((entry) => [`${directory}/${entry.name}`, fields]);
  } catch {
    return [];
  }
}
