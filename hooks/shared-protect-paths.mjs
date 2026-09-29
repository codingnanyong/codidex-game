import { basename, isAbsolute, resolve, relative, sep } from "node:path";
import { pathToFileURL } from "node:url";

const editableEnvironmentTemplates = new Set([
  ".env.example",
  ".env.sample",
  ".env.template",
]);

function isProtectedEnvironmentFile(fileName) {
  return (
    !editableEnvironmentTemplates.has(fileName) &&
    (fileName === ".env" || fileName.startsWith(".env."))
  );
}

function commandProtectionReason(command) {
  const normalized = command.replaceAll("\\", "/");
  const mutatesFiles =
    /(?:^|[;&|]\s*)(?:cp|del|install|mkdir|move|mv|rm|rmdir|touch|truncate)\b/i.test(
      normalized,
    ) ||
    /(?:^|[;&|]\s*)(?:perl|sed)\b[^;&|]*(?:-i|-pi)\b/i.test(normalized) ||
    /(?:^|\s)(?:>{1,2}|tee\b)/i.test(normalized);

  if (mutatesFiles && normalized.includes("web/public/assets")) {
    return "web/public/assets is generated; edit packages/game-assets/files instead.";
  }

  const environmentPaths = [
    ...normalized.matchAll(
      /(?:^|[\s/"'=(:])(?<file>\.env(?:\.[A-Za-z0-9_-]+)?)(?=$|[\s/"';&|)])/g,
    ),
  ].map((match) => match.groups.file);
  if (environmentPaths.some((file) => isProtectedEnvironmentFile(file))) {
    return "Environment files may contain machine-local secrets and must not be accessed by an agent.";
  }
  return null;
}

export function protectionReason(
  event,
  projectDirectory = process.env.CLAUDE_PROJECT_DIR ?? process.cwd(),
) {
  if (event?.tool_name === "Bash" && event?.tool_input?.command) {
    return commandProtectionReason(event.tool_input.command);
  }

  const candidate =
    event?.tool_input?.file_path ?? event?.tool_input?.notebook_path ?? "";
  if (!candidate) return null;

  const root = resolve(projectDirectory);
  const eventDirectory = resolve(event?.cwd ?? root);
  const target = isAbsolute(candidate)
    ? resolve(candidate)
    : resolve(eventDirectory, candidate);
  const repoPath = relative(root, target).split(sep).join("/");
  const fileName = basename(target);
  const isEnvironmentFile = isProtectedEnvironmentFile(fileName);
  const isGeneratedAsset =
    repoPath === "web/public/assets" ||
    repoPath.startsWith("web/public/assets/");

  if (!isEnvironmentFile && !isGeneratedAsset) return null;
  return isEnvironmentFile
    ? "Environment files may contain machine-local secrets and must not be accessed by an agent."
    : "web/public/assets is generated; edit packages/game-assets/files instead.";
}

async function main() {
  let input = "";
  for await (const chunk of process.stdin) input += chunk;

  let event;
  try {
    event = JSON.parse(input);
  } catch {
    return;
  }

  const reason = protectionReason(event);
  if (!reason) return;
  process.stderr.write(`${reason}\n`);
  process.exitCode = 2;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
