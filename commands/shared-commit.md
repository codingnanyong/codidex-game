---
description: Validate and commit only the files owned by the current task.
allowed-tools: Read, Grep, Glob, Bash
---

Read `AGENTS.md`, inspect `git status` and the full diff, and select only files
belonging to the current task. Never use `git add .`. Run focused validation,
stage explicit paths, create one concise conventional commit, and show the final
status. Never push, open a PR, or amend an existing commit.
