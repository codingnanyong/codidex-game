import { readFileSync, readdirSync } from "node:fs";

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
  "skills/claude-collaboration/SKILL.md",
  "skills/shared-change-review/SKILL.md",
  "templates/shared-handoff.md",
  ".claude/settings.json",
];

const failures = [];
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

for (const directory of prefixedRoots) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
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
  try {
    readFileSync(file, "utf8");
  } catch {
    failures.push(`missing required agent file: ${file}`);
  }
}

const checks = [
  ["CLAUDE.md", "@AGENTS.md", "CLAUDE.md must import the shared AGENTS.md rules"],
  [
    ".claude/settings.json",
    "hooks/shared-protect-paths.mjs",
    "Claude settings must register the protected-path hook",
  ],
  [
    ".claude/settings.json",
    "hooks/claude-statusline.mjs",
    "Claude settings must register the project status line",
  ],
  [
    ".gitignore",
    ".claude/settings.local.json",
    "Claude's machine-local settings must stay untracked",
  ],
  [
    ".gitignore",
    ".claude/worktrees/",
    "Claude's local worktrees must stay untracked",
  ],
  [
    ".gitignore",
    ".codex/*.local.*",
    "Codex's machine-local overrides must stay untracked",
  ],
  [
    ".gitignore",
    "CLAUDE.local.md",
    "Claude's project-local instructions must stay untracked",
  ],
];

for (const [file, expected, message] of checks) {
  try {
    if (!readFileSync(file, "utf8").includes(expected)) {
      failures.push(message);
    }
  } catch {
    // Missing files are already reported above.
  }
}

if (failures.length > 0) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log("Agent setup is wired correctly.");
}
