---
name: claude-collaboration
description: "Delegate Codigdex documentation or an explicitly requested independent review to the installed Claude Code CLI, then verify and integrate its result. Use for this repository's Claude-owned documentation lane and Codex-Claude cross-review workflow; do not use for ordinary Codex-only implementation."
---

# Claude Collaboration

Read the repository `AGENTS.md` before delegating. Preserve its Owner/Reviewer protocol and the user's authorization boundaries.

Use the installed `claude` CLI from the repository root. Give Claude all context it needs because it cannot see the current Codex conversation.

- For an independent read-only review, use `claude --print --permission-mode dontAsk` with only the read/search tools needed. Require evidence with file paths and line numbers, and state that no files may be changed.
- For a user-authorized documentation subtask owned by Claude, use `claude --print --permission-mode acceptEdits --allowedTools "Read,Edit,Write,Grep,Glob"`. Name the exact permitted files and prohibit application-code changes, commits, pushes, and external publication.
- If the sandbox blocks Claude's network connection, retry through the normal escalation flow rather than weakening Claude's permission mode.
- Do not let an unresponsive Claude process block the user's conversation indefinitely. If it produces no output within a practical review window, terminate it, retry once with a narrower prompt and tool set, then report the unavailable review explicitly and continue Codex's own verification.

Record `git status --short` before delegation. Never let Claude and Codex write the same files concurrently. After Claude finishes, inspect its diff, run checks appropriate to the changed files, and compare the final status with the baseline.

Return one consolidated answer to the user. Distinguish Claude's findings from Codex's judgment when they differ, and list every changed file at handoff.
