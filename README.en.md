<!-- markdownlint-disable MD033 MD041 -->
<p align="center">
  <img src="packages/game-assets/files/icons/codigdex-main-icon.png" width="120" alt="Codigdex game icon">
</p>

<h1 align="center">Codigdex</h1>

<p align="center">A pixel-art learning game where you defeat bug monsters and complete your own coding dex</p>
<p align="center"><a href="README.md">한국어</a> · <b>English</b></p>
<!-- markdownlint-enable MD033 MD041 -->

[![CI](https://github.com/codingnanyong/codigdex/actions/workflows/ci.yml/badge.svg)](https://github.com/codingnanyong/codigdex/actions/workflows/ci.yml)
[![PR policy](https://github.com/codingnanyong/codigdex/actions/workflows/pr-policy.yml/badge.svg)](https://github.com/codingnanyong/codigdex/actions/workflows/pr-policy.yml)
[![Claude Code Review](https://github.com/codingnanyong/codigdex/actions/workflows/claude-review.yml/badge.svg)](https://github.com/codingnanyong/codigdex/actions/workflows/claude-review.yml)
[![Live demo](https://img.shields.io/badge/demo-codigdex.vercel.app-black?logo=vercel&logoColor=white)](https://codigdex.vercel.app)
[![License](https://img.shields.io/github/license/codingnanyong/codigdex)](LICENSE)

## What is Codigdex?

In **Codeville**, a pixel village on a server cloud, the concepts hidden in code roam around as bug monsters. Step in as a junior developer on your very first adventure, face the monsters, prove you really understand each concept, and fill your own dex: **Codigdex**.

Instead of reading and moving on, you learn to code by catching concepts one at a time.

![A junior developer holding a field guide, with bug monster regions](packages/game-assets/files/wallpapers/codigdex-field-guide-wallpaper-v3.png)

## How to play

1. **Take a request** — a guide NPC tells you which bug monster has appeared in the area.
2. **Question battle** — attack by answering the coding questions the monster throws at you. Every right answer weakens it.
3. **Register it** — get 60% or more right to capture the monster and keep its card in your dex. Failing costs nothing, and a retry brings new questions.
4. **Move on** — each capture brings a stronger monster, and finishing a chapter opens a new region.

## Your adventure

```text
Tutorial · Loop Forest
  → CH.01 Git · Field of Records
  → CH.02 Linux · Shell Cave
  → Tier 1 promotion: Web Frontend · Backend · DevOps · Data Engineer · Data Analyst
  → Tier 2 promotion: hybrid careers that bridge two fields
  → Tier 3 promotion: master careers
```

First learn Git and Linux, the skills every developer needs, then pick a career and explore that career's own map. Each career has a senior NPC to guide you, and higher careers like Fullstack Engineer or ML Developer stay hidden behind `???`, waiting for you to walk both paths that lead to them.

![Player characters and guide NPCs from junior to tier 3](packages/game-assets/files/characters/career-path/career-character-guide-v2.png)

## Things to collect

- **Monster dex** — from the Loop Bug to the Git Sprout and the Kernel Guardian. Every technology has monsters that evolve from Lv.1 to Lv.5. Monsters you have not discovered yet stay as `???`.
- **Career dex** — collect 16 career emblems, from junior developer to tier 3 master careers. The day you first promoted and the day you mastered each career are recorded.

![Career emblems from junior to tier 3](packages/game-assets/files/career-emblems/career-emblem-archive-v1.png)

## Playable now

- Collect 11 monsters across the tutorial, Git and Linux chapters
- Promote into one of 5 tier 1 careers and explore its map
- Monster dex and career dex
- Switch between Korean and English in settings

The specialist chapters for each career (HTML/CSS, Docker, SQL and more) already have their maps and monsters, and their battles are opening one by one. Your progress is saved in the browser automatically.

👉 **[Play now at codigdex.vercel.app](https://codigdex.vercel.app)**

## Run locally

Built with Next.js, Phaser and TypeScript.

```bash
npm install
npm run dev --workspace @codigdex/web
```

Open [http://localhost:3001](http://localhost:3001) in your browser. Run the tests with `npm run test`.

## Agent workspace

Two agents work this repository — Claude and Codex — and they share one configuration tree. Eight folders at the repository root are the **only** source of truth for agent config:

| Folder | Holds |
| --- | --- |
| `agents/` | Subagent definitions |
| `commands/` | Slash commands |
| `hooks/` | Hook scripts |
| `output-styles/` | Output styles |
| `plugins/` | Plugin registry |
| `rules/` | Short always-on rules |
| `skills/` | Skills (one `SKILL.md` per folder) |
| `templates/` | Document templates |

Every entry inside those folders starts with `shared-` (both agents), `claude-` (Claude only), or `codex-` (Codex only).

`npm run setup:agents` (also wired as `postinstall`, so `npm install` alone runs it) creates **directory links** — symlinks on POSIX, junctions on Windows — under `.claude/`, `.codex/`, and `.agents/` pointing from each tool's expected location to the matching root folder. All of those link paths are git-ignored, so the root folders remain the only source of truth. Never edit or commit files through a link path; change the root folder instead.

`.claude/settings.json` is the **only** tracked Claude-specific safety config (permission denials plus the protected-path hook and status-line registrations). `CLAUDE.md` merely imports `@AGENTS.md`, so rules belong in [AGENTS.md](AGENTS.md).

After changing any of this, run `npm run check:agents` to verify the links, required files, prefixes, and hook behavior — CI runs the same command. At handoff, write the report using [templates/shared-handoff.md](templates/shared-handoff.md). Full rules live under "Agent workspace layout" in [AGENTS.md](AGENTS.md).

## Docs

- [Game Design Document](docs/eng/GAME_DESIGN.md) — game rules, screens, visual guide
- [Career Path Design](docs/eng/CAREER_PATH_DESIGN.md) — curriculum, promotion requirements, save format
- [Git workflow](docs/eng/GIT_WORKFLOW.md) — branch strategy, PR and issue automation
- [Monorepo architecture](docs/eng/MONOREPO_ARCHITECTURE.md) — web/mobile apps and shared package boundaries
- [Account linking and cloud saves](docs/eng/ACCOUNT_LINKING_AND_CLOUD_SAVE.md) — Google, GitHub, and Apple identities plus cross-platform save ownership
- [Contributing](CONTRIBUTING.md) · [Project and PR policy](AGENTS.md)

## Contributing

This project is built and reviewed by one person, so outside pull requests are not accepted. If you spot a bug or an incorrect explanation, please let me know with an Issue. See the [contributing guide](CONTRIBUTING.md) for details.

## License

[MIT](LICENSE) © codingnanyong
