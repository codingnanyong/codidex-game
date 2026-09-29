---
name: claude-collaboration
description: Delegate Codigdex documentation or an explicitly requested independent review to Claude Code, then verify and integrate its result.
---

# Claude Collaboration

Read `AGENTS.md` before delegating and preserve its Owner/Reviewer protocol.
Claude cannot see the current Codex conversation, so include all necessary
context in the prompt.

- For read-only review, use `claude --print --permission-mode dontAsk` and only
  the read/search tools needed. Require file-and-line evidence and prohibit edits.
- For a user-authorized Claude-owned documentation task, use
  `--permission-mode acceptEdits`, name the exact permitted files, and prohibit
  application-code changes, commits, pushes, and publication.
- If Claude produces no output within a practical window, terminate it and retry
  once with a narrower prompt. Report an unavailable review and continue local
  verification rather than blocking indefinitely.

Record `git status --short` before delegation. Never let Claude and Codex write
the same files concurrently. Inspect Claude's diff and run appropriate checks
before returning one consolidated answer.
