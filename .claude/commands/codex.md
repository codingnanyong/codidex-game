---
description: Delegate a task to Codex and bring its result back into this conversation
argument-hint: [--write] <task for Codex>
allowed-tools: Bash
---

Hand the task below to Codex, then report back here. Codex owns design work in this
repo (see `AGENTS.md`), so this is the normal path for anything art- or layout-related,
and for a second opinion from a different model on implementation choices.

## Task

$ARGUMENTS

## How to run it

Invoke the `codex` binary on PATH non-interactively. Approvals cannot be answered
from here, so `approval_policy` must be `never` and the sandbox has to be set
explicitly:

- Default — analysis, review, a second opinion (Codex cannot touch the tree):
  ```bash
  codex exec -c sandbox_mode="read-only" -c approval_policy="never" "<prompt>"
  ```
- Only when the task starts with `--write` — Codex may edit the working tree:
  ```bash
  codex exec -c sandbox_mode="workspace-write" -c approval_policy="never" "<prompt>"
  ```

If `codex` is not on PATH, use the copy bundled with the ChatGPT VS Code extension
in its place:

```bash
CODEX="$(ls -d "$HOME"/.vscode/extensions/openai.chatgpt-*/bin/windows-x86_64/codex.exe 2>/dev/null | tail -1)"
"$CODEX" exec -c sandbox_mode="read-only" -c approval_policy="never" "<prompt>"
```

Codex may print a "Reading additional input" notice. It is harmless, and redirecting
stdin does not suppress it reliably.

Never pass `--dangerously-bypass-approvals-and-sandbox`. It disables the sandbox
entirely, and nothing routed through this command needs that.

## Reporting back

Codex runs in its own context and sees none of this conversation, so put everything it
needs into the prompt — the files in play, the constraint, what "done" looks like.

Afterwards, tell the user:

- what Codex concluded or changed, in your own words rather than pasted transcript
- which files it touched, if it ran with `workspace-write` (`git status --short`)
- where you disagree with it, when you do — a second model's answer is input, not a verdict

If Codex edited the tree, review the diff before saying the task is done.
