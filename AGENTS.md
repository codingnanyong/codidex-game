# Project Rules

## Project purpose

Codigdex Game is a pixel-art educational game that teaches programming/coding concepts. The core game mechanic is Pokédex-style collection: players defeat bug monsters, pass a short capture quiz to prove they understood the concept, and register a graded (bronze/silver/gold) card in their personal "Codigdex". Built with Next.js + Phaser.js, targeting deployment on Vercel.

## Agent division of labor

Two agents work this repo — Claude and Codex. Ownership is decided by **change intent**, not by file path, and every task runs under the Owner/Reviewer protocol below. Both agents read this file, so treat these rules as binding unless the user says otherwise in the moment.

### Per-task Owner / Reviewer protocol

- **One writer per task.** The task **Owner** is the only agent that edits files for that task. The other agent is a **read-only Reviewer**: it may read, run checks, and raise findings, but must not edit the owner's files.
- **Announce the owner at task start.** Before the first edit, state `Owner: <Claude|Codex>` and the scope in one line. If the user named an owner, that wins; otherwise the agent picking the task up claims it and says so.
- **Mandatory owners override any claim.** A task whose intent is design goes to Codex; a task whose intent is documentation goes to Claude — regardless of who picked it up. Anything else is claimable by either agent.
- **The owner finishes end to end** rather than leaving a half-built path for the other agent to discover.
- **Handover is explicit.** To move ownership mid-task, write the handoff report first (see **Editing constraints**), then hand the writer role over in one line. The two agents never both hold the writer role on the same task.

### Ownership by change intent

- **New visual design is Codex's call.** Sprite and UI art, pixel-art direction, and visual layout — anything that establishes or changes how the game looks — is decided by Codex. Claude does not redo design work.
- **Implementing an already-approved visual spec belongs to the feature owner.** If the design already exists — an approved mockup, an existing asset, a layout Codex already specified — the feature owner writes the code that realizes it as part of completing functionality. Deviating from that spec, or needing art that does not exist yet, turns the change back into a design decision: stop, note it at handoff, and leave it to Codex.
- **Documentation is Claude's call.** Everything under `docs/` (both `docs/eng` and `docs/kor`), plus `README*.md`, `AGENTS.md`, `CLAUDE.md`, and the policy/prose files `CONTRIBUTING.md`, `SECURITY.md`, and `CODE_OF_CONDUCT.md`. Codex should not rewrite these; flag the needed change at handoff instead.
- **Feature implementation** — game logic, shared packages, app code, tests — goes to whoever owns the task under the protocol above.
- Keep `docs/eng` and `docs/kor` in sync: a change to one needs the matching change to the other.

### Assets

- **Source art lives in `packages/game-assets/files/`** and belongs to Codex, along with every generated visual asset: sprite sheets, evolution guides, emblem archives, wallpapers, and the asset-key manifest emitted by `npm run generate --workspace @codigdex/game-assets`.
- **`web/public/assets/` is a generated mirror, not a source of truth.** `web/scripts/sync-assets.mjs` copies `packages/game-assets/files/` into it before `dev` and `build`, and the directory is git-ignored. Never edit, add, or delete anything there directly — the next sync overwrites it. Change the source under `packages/game-assets/files/` and regenerate.

### Operational files

- **`.github/` (workflows, issue/PR templates, scripts) and tool config** — root and workspace `package.json` scripts, `tsconfig`, lint/test config, and `.claude/` command definitions — are owned by the **active feature owner** for the task that needs them, and reviewed by the other agent before the task is called done.

Because ownership moves from task to task, the handoff report under **Editing constraints** is what makes the next agent's start cheap. Name the files you touched, the assets you generated, and anything you deliberately left undone — especially work that falls in the other agent's lane.

## PR & issue policy

Every PR into `develop` is gated by CI (`.github/workflows/pr-policy.yml`) that requires a mirrored Linear/GitHub issue pair. The normal path is automated — do not do the old manual dance of pre-creating a Linear issue, then a GitHub issue, then baking the id into the branch name; that's exactly the flow that used to get skipped or done out of order:

1. Create a branch named `feat/<slug>` (no id prefix needed) and push it to `origin`.
2. `.github/workflows/prepare-feature-pr.yml` finds or creates a Linear issue in team `COD` (project set by the `LINEAR_PROJECT_SLUG`/`LINEAR_PROJECT_NAME` repo variables — see the setup checklist in `docs/eng/GIT_WORKFLOW.md`), finds or creates the matching GitHub mirror issue, and opens a Draft PR into `develop` with both closing references already filled in.
3. `.github/workflows/pr-policy.yml` only validates the branch flow and issue pair on every PR event — it never creates or edits anything.
4. `main` only accepts PRs from `develop`. If this project cuts versioned releases, uncomment `validate-release` in `pr-policy.yml` and adapt it (see `codingnanyong/busan-competition-2026` for a working example); otherwise leave `main` PRs release-gate-free.

Automation uses the `LINEAR_API_KEY` and `GH_PAT` repo secrets. `GH_PAT` must be a fine-grained PAT (not the default `GITHUB_TOKEN`) with Contents:read and Issues/Pull requests:write — edits made with `GITHUB_TOKEN` don't retrigger workflow runs (GitHub's anti-recursion rule), so `pr-policy.yml` would never re-check a PR the automation just fixed up. Provisioning is keyed by `repository:branch`, so rerunning `Prepare feature PR` (or pushing again) after a partial failure reuses whatever Linear/GitHub records already exist instead of duplicating them. A branch named `feat/cod-<n>-<slug>` reuses that existing Linear issue if it belongs to the configured team/project.

**Manual fallback** (if `GH_PAT`/`LINEAR_API_KEY` are missing or expired): create the Linear issue yourself, create an open GitHub issue whose title starts with the same `COD-<n>`, then open the PR with both `Closes COD-<n>` and `Closes #<n>` in the body. Don't create a second issue pair for a branch the automation already provisioned.

On merge into `develop`, CI auto-closes the mirrored GitHub issue; Linear's native GitHub integration then auto-transitions the Linear issue to Done. No manual status update needed after merge.

## Editing constraints

- Do not publish, upload, create a pull request, merge branches, or message external services without explicit user authorization (opening a PR as part of the normal Linear/GitHub flow above is fine; merging and any external-facing action still needs a go-ahead).
- Keep unrelated user changes intact.
- At handoff, report the changed files, any generated assets, and remaining review items.

<!-- Add project-specific sections here: coding style, test commands, domain
vocabulary, content voice, image/asset rules, etc. -->
