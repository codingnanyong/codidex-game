import { execFileSync } from "node:child_process";

let input = "";
for await (const chunk of process.stdin) input += chunk;

let status = {};
try {
  status = JSON.parse(input);
} catch {
  // Session metadata may not be available yet.
}

let branch = "no-git";
try {
  branch = execFileSync("git", ["branch", "--show-current"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim() || "detached";
} catch {
  // Keep the fallback when git is unavailable.
}

const model =
  status?.model?.display_name ?? status?.model?.id ?? status?.model ?? "Claude";
const used = status?.context_window?.used_percentage;
const context = Number.isFinite(used) ? ` | context ${Math.round(used)}%` : "";
process.stdout.write(`Codigdex | ${branch} | ${model}${context}`);
