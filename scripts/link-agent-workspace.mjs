import {
  existsSync,
  lstatSync,
  mkdirSync,
  realpathSync,
  symlinkSync,
} from "node:fs";
import { dirname, relative, resolve } from "node:path";

const checkOnly = process.argv.includes("--check");
const adapters = [
  [".claude/agents", "agents"],
  [".claude/commands", "commands"],
  [".claude/output-styles", "output-styles"],
  [".claude/rules", "rules"],
  [".claude/skills", "skills"],
  [".codex/agents", "agents"],
  [".codex/skills", "skills"],
  [".agents/skills", "skills"],
];

const failures = [];

for (const [adapterPath, canonicalPath] of adapters) {
  const adapter = resolve(adapterPath);
  const canonical = resolve(canonicalPath);

  if (!existsSync(adapter)) {
    if (checkOnly) {
      failures.push(`${adapterPath} is missing; run npm run setup:agents`);
      continue;
    }
    mkdirSync(dirname(adapter), { recursive: true });
    symlinkSync(
      process.platform === "win32"
        ? canonical
        : relative(dirname(adapter), canonical),
      adapter,
      process.platform === "win32" ? "junction" : "dir",
    );
  }

  try {
    if (!lstatSync(adapter).isSymbolicLink()) {
      failures.push(`${adapterPath} must be a directory link, not a copied tree`);
    } else if (realpathSync(adapter) !== realpathSync(canonical)) {
      failures.push(`${adapterPath} must point to ${canonicalPath}`);
    }
  } catch (error) {
    failures.push(`${adapterPath} is invalid: ${error.message}`);
  }
}

if (failures.length > 0) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log(
    checkOnly
      ? "Agent workspace links are valid."
      : "Agent workspace links are ready.",
  );
}
