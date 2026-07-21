# Claude Code Configuration

This document describes every layer of the AI config for this project — what each file does, how the pieces interact, and where to go when something needs changing.

---

## Directory Layout

```text
.claude/
├── README.md               ← this file
├── settings.json           ← committed: hooks + team-shared permission allow-list
├── settings.local.json     ← personal permission approvals (not committed)
├── rules/                  ← path-specific rules, loaded only when editing matching files
│   ├── typescript.md       ← paths: **/*.ts, **/*.tsx
│   ├── react-components.md ← paths: **/*.tsx, **/*.jsx, **/*.stylex.ts
│   ├── testing.md          ← paths: **/*.test.*, **/*.spec.*
│   ├── routes-data.md      ← paths: **/routes/**, **/services/**, **/*.api.ts, …
│   └── scripts.md          ← paths: **/*.mjs, **/*.cjs, **/scripts/**/*.js
├── skills → ../.github/skills   ← symlink (canonical source is .github/skills/)
└── agents/
    ├── quality-gate.md
    ├── architecture-guard.md
    └── fallow-scan.md

.github/
├── ARCHITECTURE.md
├── copilot-instructions.md → ../AGENTS.md   (Copilot alias)
└── skills/                 ← canonical skill sources (10 skills + code-smell-shared docs)

AGENTS.md   ← single source of truth for universal agent instructions
CLAUDE.md → AGENTS.md   (symlink — Claude Code reads this)
GEMINI.md → AGENTS.md   (symlink — Gemini reads this)
```

---

## Components

### AGENTS.md / CLAUDE.md

`AGENTS.md` is the single source of truth for **universal, always-loaded** project instructions: overview, toolchain, non-negotiable rules, skill index, rules index, and documentation workflow. `CLAUDE.md`, `GEMINI.md`, and `.github/copilot-instructions.md` are symlinks to it.

**Edit `AGENTS.md` directly.** Never edit `CLAUDE.md` (it's a symlink).

Detailed per-file-type conventions intentionally do **not** live here — they live in `.claude/rules/` (below) to keep the always-loaded context small.

---

### Path-Specific Rules — `.claude/rules/`

Each rule file has a `paths:` frontmatter with glob patterns. Claude Code loads a rule **only when editing files that match its globs** — TypeScript rules don't load while editing docs, React rules don't load while working in `apps/api-server`, etc.

| Rule file             | Loads when editing                              | Owns                                                                         |
| --------------------- | ----------------------------------------------- | ---------------------------------------------------------------------------- |
| `typescript.md`       | any `.ts` / `.tsx`                              | strict TS rules, naming conventions, file suffixes, FP/immutability, imports |
| `react-components.md` | any `.tsx` / `.jsx` / `.stylex.ts`              | component bundle pattern, props naming, React 19 rules, StyleX-only styling  |
| `testing.md`          | any `.test.*` / `.spec.*`                       | Vitest/Testing Library conventions, `vp run test`, coverage target           |
| `routes-data.md`      | routes, services, `.api.ts`, RR config, entries | loader/action data flow, store-pattern rule, error handling, Zod             |
| `scripts.md`          | any `.mjs` / `.cjs` / `scripts/**/*.js`         | JSDoc "why" header, small pure functions, `node:` builtins, 350-line ceiling |

**Non-Claude agents** (Copilot, Gemini) don't auto-load these — AGENTS.md §2 tells them to read the matching rule file before editing covered files.

**Adding a rule:** create `.claude/rules/<topic>.md` with `paths: ['glob', …]` frontmatter, then add a row to the table in AGENTS.md §2 and here.

---

### Skills — `.github/skills/`

Skills are on-demand task workflows. `.claude/skills` is a **symlink** to `.github/skills/`, so both paths refer to the same files — edit either, there is one physical copy.

Auto-invocation is driven by the `description` field (Claude matches it against user intent) and, where present, the `paths` frontmatter (skill surfaces when editing matching files). `user-invocable: true` skills can also be triggered explicitly with `/skill-name`.

| Skill                         | Purpose                                                    | Auto-invokes via                                  |
| ----------------------------- | ---------------------------------------------------------- | ------------------------------------------------- |
| `react-19`                    | React 19 patterns, hooks, compiler rules                   | description + `paths: **/*.tsx, **/*.jsx`         |
| `react-router-framework-mode` | Loaders, actions, forms, navigation                        | description + `paths: **/routes/**, routes.ts, …` |
| `store-pattern`               | Split-context external store architecture                  | description + `paths: **/contexts/**`             |
| `quality-gate-workflow`       | **Canonical** post-change validation sequence              | description (after finishing a code change)       |
| `codebase-explorer`           | Phased investigation; owns `.tmp/exploration/` scratchpads | description (understand/trace/investigate)        |
| `code-smell-checker`          | Maintainability audits (runs in forked context)            | description                                       |
| `code-smell-zen`              | Diff-based smell review (runs in forked context)           | description                                       |
| `fallow-code-checker`         | Fallow static hygiene scan (runs in forked context)        | description                                       |
| `linter-checker`              | Deterministic oxlint + eslint report (forked context)      | description                                       |
| `commit-and-pr`               | Commit message + PR body that pass the enforced standard   | description (before committing / opening a PR)    |

**Skill anatomy:**

```text
skill-name/
├── SKILL.md          ← loaded into context; frontmatter + overview + procedure
├── references/       ← deep-dive docs read on demand (not always loaded)
└── scripts/          ← executable shell scripts invoked from SKILL.md
```

**Frontmatter contract** (enforced by `scripts/validate-skills.cjs`): `name` (must match folder) and `description` (must contain trigger phrases — it drives auto-invocation) are required. Optional: `argument-hint`, `user-invocable`, `allowed-tools`, `paths` (globs for file-scoped auto-invoke), `context: fork` (isolates verbose output in a sub-agent — used by the three scan/report skills).

---

### Agents — `.claude/agents/`

Agents are sub-agents spawned explicitly by Claude (or by you) for isolated, heavy, or parallelisable work. They start with no conversation context — their markdown file is their full system prompt. Filenames must match the `name:` frontmatter field (`<name>.md`).

| Agent                | Purpose                                                                      | Tools             | When to use                                 |
| -------------------- | ---------------------------------------------------------------------------- | ----------------- | ------------------------------------------- |
| `quality-gate`       | Runs fmt→lint→check→test, returns pass/fail table                            | Bash, Read        | Mid-session validation or structured report |
| `architecture-guard` | Reads INVENTORY.md, ARCHITECTURE.md, PATTERNS.md, ADRs — returns reuse brief | Read, Glob, Grep  | Before implementing anything new            |
| `fallow-scan`        | Runs full fallow pipeline in background, saves JSON + report                 | Bash, Read, Write | Before large refactors or after big merges  |

**Unlike skills**, agents do not auto-invoke. Claude spawns them when it recognises the right moment, or when you ask.

---

### Hooks — `.claude/settings.json`

Hooks are shell commands the harness runs automatically on lifecycle events. They live in the **committed** `.claude/settings.json` (the standard location — not a separate hooks file) so the whole team shares them.

| Event                                                   | Command                                                                                                                                                                                                           | Purpose                                                                                                                                                                           |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PreToolUse` (`Read\|Bash\|Grep\|Glob\|Write\|Edit\|…`) | `node scripts/claude-secrets-guard.mjs`                                                                                                                                                                           | **Security guard** — denies reading a `.env`/secret file (Read/Bash/Grep/Glob) and writing a credential (Write/Edit); `.env.example`/`.sample`/`.template` are the only exception |
| `PostToolUse` (`Write\|Edit\|MultiEdit`)                | `node scripts/claude-autofix.mjs`                                                                                                                                                                                 | Per-file autofix after each Write/Edit — Oxlint `--fix` → Biome `--write` → Oxfmt (the "fast trio"); non-blocking                                                                 |
| `Stop`                                                  | `test -n "$(git status --porcelain)" \|\| exit 0; vp fmt . && vp lint . --fix && vp check --fix && { git diff --name-only HEAD; git ls-files --others --exclude-standard; } \| node scripts/run-changed.mjs test` | Repo-wide autofix + tsgolint when Claude finishes, then tests for the **affected workspaces only**. Skips instantly on a clean tree                                               |

The `PreToolUse` **secrets guard** ([`scripts/claude-secrets-guard.mjs`](../scripts/claude-secrets-guard.mjs)) runs _before_ a tool executes and emits a `permissionDecision: "deny"` when a call would read a secret file (`.env`, `*.pem/.key/.p12`, `id_rsa`, `.npmrc`, `credentials`…) or write a credential (provider-format tokens + high-entropy assignments). It reuses the ADR-020 secret-file taxonomy (`packages/agent-runner/src/isSecretFilePath.util.ts`) so the CLI and the agent-runner SDK guard agree; the pure core is `scripts/lib/secrets-guard.mjs`, self-verified by `node scripts/claude-secrets-guard.mjs --selftest`. False positives are handled by `.example` files, placeholder values, and inline `gitleaks:allow` markers.

The `PostToolUse` fixer ([`scripts/claude-autofix.mjs`](../scripts/claude-autofix.mjs)) reads the tool payload from stdin and runs only the Rust-fast linters on the single file just touched. The per-workspace **ESLint pass is deliberately excluded** — it cold-starts a Node process per file — so it stays in the `Stop` hook and the pre-push gate, mirroring the pre-commit `staged` config in root `vite.config.ts`. The hook always exits 0: unfixable findings are left to the quality gate, never blocking the edit.

The `Stop` hook is **repo-wide and untracked-aware**, which it previously was not. It used to `cd apps/react-router` and test `git diff --quiet HEAD -- .`, so a session that touched only `packages/**`, `scripts/**` or `apps/admin_system` ran no gate at all, and a session that only _created_ files looked clean to `git diff` and also ran nothing. It now checks `git status --porcelain` (which sees untracked files), runs the fast repo-wide fixers, and pipes the changed paths through `scripts/run-changed.mjs`, so tests run for the affected workspaces and their dependents rather than one hard-coded app. A clean tree exits immediately.

**Adding a hook:** edit the `hooks` block in `.claude/settings.json`. For automated behaviours ("always run X after Y"), hooks are the right mechanism — not memory or preferences.

---

### Permissions — `.claude/settings.json` + `.claude/settings.local.json`

Two layers:

- **`settings.json` (committed)** — team-shared allow-list: the `vp` toolchain, quality-gate commands, skill scripts. Anything every contributor will run repeatedly and trusts unconditionally.
- **`settings.local.json` (not committed — ignored via global gitignore)** — personal one-off approvals accumulated during your own sessions. Keep it small; when an entry proves generally useful, promote it to `settings.json`.

Entries use glob-style patterns: `Bash(cd apps/react-router && vp lint*)` approves any `vp lint` invocation prefixed with that `cd`.

---

## How the Layers Interact

```text
You ask Claude to do something
        │
        ▼
Path-specific rules load for the files being edited (.claude/rules/)
Skills auto-invoke when intent matches description or paths
        │
        ▼
Claude works — reads files, edits code
        │
        ├─ After each Write/Edit → PostToolUse hook autofixes that one file
        │       (Oxlint --fix, Biome --write, Oxfmt)
        │
        ├─ Needs heavy/isolated work? → spawns an Agent
        │       (or a skill with context: fork runs in its own sub-agent)
        │
        ▼
Claude stops responding
        │
        ▼
Stop hook fires — if apps/react-router changed, runs the quality gate
```

There is no `SessionStart` hook. The three above — `PreToolUse`, `PostToolUse`, `Stop` — are the complete set defined in `.claude/settings.json`.

---

## Quick Reference

| I want to…                                               | Go to…                                                                           |
| -------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Change universal project instructions                    | `AGENTS.md`                                                                      |
| Change a file-type convention (TS, components, tests)    | `.claude/rules/<topic>.md`                                                       |
| Add a new skill                                          | `.github/skills/<skill-name>/SKILL.md` (then `node scripts/validate-skills.cjs`) |
| Add or change an automated behaviour (on stop, on start) | `hooks` block in `.claude/settings.json`                                         |
| Pre-approve a Bash command for the team                  | `.claude/settings.json` → `permissions.allow`                                    |
| Pre-approve a Bash command just for me                   | `.claude/settings.local.json` → `permissions.allow`                              |
| Add a background/isolated agent                          | `.claude/agents/<name>.md`                                                       |
| Understand the Table store architecture                  | `.github/skills/store-pattern/SKILL.md`                                          |
