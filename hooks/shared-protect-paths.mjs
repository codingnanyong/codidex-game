import { basename, resolve, relative, sep } from "node:path";
import { pathToFileURL } from "node:url";

export function protectionReason(event, workingDirectory = process.cwd()) {
  const candidate =
    event?.tool_input?.file_path ?? event?.tool_input?.notebook_path ?? "";
  if (!candidate) return null;

  const root = resolve(workingDirectory);
  const target = resolve(root, candidate);
  const repoPath = relative(root, target).split(sep).join("/");
  const fileName = basename(target);
  const isEnvironmentFile =
    fileName === ".env" || fileName.startsWith(".env.");
  const isGeneratedAsset =
    repoPath === "web/public/assets" ||
    repoPath.startsWith("web/public/assets/");

  if (!isEnvironmentFile && !isGeneratedAsset) return null;
  return isEnvironmentFile
    ? "Environment files contain machine-local secrets and must not be edited by an agent."
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
