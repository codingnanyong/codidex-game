---
description: Delegate a task to Codex and integrate its result into the current Claude conversation.
argument-hint: [--write] <task for Codex>
allowed-tools: Bash
---

Hand the supplied task to the `codex` CLI, then report the result in the current
Claude conversation. Include all context because Codex cannot see that
conversation. Use a read-only sandbox for review and `workspace-write` only
when explicitly requested. Never bypass the sandbox. Inspect any resulting diff.

## Task

$ARGUMENTS

Run review-only work with:

```bash
codex exec -c sandbox_mode="read-only" -c approval_policy="never" "<prompt>"
```

Only when the task starts with `--write`, use:

```bash
codex exec -c sandbox_mode="workspace-write" -c approval_policy="never" "<prompt>"
```

Never use `--dangerously-bypass-approvals-and-sandbox`. After a write task,
inspect `git status --short` and the diff before reporting the result.
