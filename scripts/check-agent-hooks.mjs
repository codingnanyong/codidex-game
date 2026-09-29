import assert from "node:assert/strict";
import { resolve } from "node:path";
import { protectionReason } from "../hooks/shared-protect-paths.mjs";

const projectDirectory = process.cwd();

assert.match(
  protectionReason(
    { tool_name: "Write", tool_input: { file_path: ".env.local" } },
    projectDirectory,
  ),
  /Environment files/,
);
assert.match(
  protectionReason(
    {
      cwd: resolveForTest("web"),
      tool_name: "Write",
      tool_input: { file_path: "../.env.local" },
    },
    projectDirectory,
  ),
  /Environment files/,
);
assert.equal(
  protectionReason(
    { tool_name: "Write", tool_input: { file_path: ".env.example" } },
    projectDirectory,
  ),
  null,
);
assert.match(
  protectionReason(
    {
      cwd: resolveForTest("web"),
      tool_name: "Write",
      tool_input: { file_path: "public/assets/test.png" },
    },
    projectDirectory,
  ),
  /generated/,
);
assert.match(
  protectionReason(
    {
      tool_name: "Write",
      tool_input: { file_path: "web/public/assets" },
    },
    projectDirectory,
  ),
  /generated/,
);
assert.match(
  protectionReason(
    {
      tool_name: "Bash",
      tool_input: { command: "cp source.png web/public/assets/test.png" },
    },
    projectDirectory,
  ),
  /generated/,
);
assert.equal(
  protectionReason(
    {
      tool_name: "Bash",
      tool_input: { command: "ls web/public/assets" },
    },
    projectDirectory,
  ),
  null,
);
assert.equal(
  protectionReason(
    {
      tool_name: "Bash",
      tool_input: { command: 'grep -r "process.env.NODE_ENV" web/' },
    },
    projectDirectory,
  ),
  null,
);
assert.equal(
  protectionReason(
    {
      tool_name: "Write",
      tool_input: { file_path: "packages/game-assets/files/test.png" },
    },
    projectDirectory,
  ),
  null,
);

console.log("Agent hook policy checks passed.");

function resolveForTest(path) {
  return resolve(projectDirectory, path);
}
