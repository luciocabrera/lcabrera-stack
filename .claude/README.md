# Claude Code Configuration

This document describes every layer of the AI config for this project — what each file does, how the pieces interact, and where to go when something needs changing.

---

## Directory Layout

```text
.claude/
├── README.md               ← this file
├── settings.local.json     ← permissions allow-list (not committed)
├── hooks/
│   └── hooks.json          ← automatic commands on session events
├── skills → ../.github/skills   ← symlink (canonical source is .github/skills/)
└── agents/
    ├── quality-gate.agent.md
    ├── architecture-guard.agent.md
    └── fallow-scan.agent.md

.github/
├── ARCHITECTURE.md
├── copilot-instructions.md → ../AGENTS.md   (Copilot alias)
└── skills/
    ├── code-smell-checker/
    ├── code-smell-shared/
    ├── code-smell-zen/
    ├── config-audit/
    ├── fallow-code-checker/
    ├── quality-gate-workflow/
    ├── react-19/
    ├── react-router-framework-mode/
    └── store-pattern/

AGENTS.md   ← single source of truth for all agent instructions
CLAUDE.md → AGENTS.md   (symlink — Claude Code reads this)
```

---

## Components

### AGENTS.md / CLAUDE.md

`AGENTS.md` is the single source of truth for project instructions. `CLAUDE.md` is a symlink to it so Claude Code picks it up automatically. `.github/copilot-instructions.md` is a separate symlink for GitHub Copilot — it points to the same file.

**Edit `AGENTS.md` directly.** Never edit `CLAUDE.md` (it's a symlink).

Contents: project overview, source structure, toolchain commands, TypeScript standards, component standards, styling rules, data layer patterns, state management rules, import conventions, testing, security, and documentation workflow.

---

### Skills — `.github/skills/`

Skills are reusable instruction sets that Claude loads on demand. `.claude/skills` is a symlink to `.github/skills/`, so both paths refer to the same files.

| Skill                         | Purpose                                           | Auto-invokes when…                               |
| ----------------------------- | ------------------------------------------------- | ------------------------------------------------ |
| `react-19`                    | React 19 patterns, hooks, compiler rules          | Editing `.tsx`/`.jsx` files                      |
| `react-router-framework-mode` | Loaders, actions, forms, navigation               | Working with routes or React Router APIs         |
| `store-pattern`               | Split-context external store architecture         | Touching any context, store, selector, or action |
| `quality-gate-workflow`       | Post-change validation steps                      | After finishing a code change                    |
| `code-smell-checker`          | Maintainability audits and tech-debt triage       | Running a baseline smell audit                   |
| `code-smell-zen`              | Diff-based smell review vs target branch          | Reviewing a PR or branch diff                    |
| `fallow-code-checker`         | Full fallow static hygiene scan                   | Running dead-code or unused-export analysis      |
| `config-audit`                | Runs claudelint, triages against known exceptions | After modifying AGENTS.md or any skill           |

**Skill anatomy:**

```text
skill-name/
├── SKILL.md          ← loaded into context; overview + procedure
├── references/       ← deep-dive docs read on demand (not always loaded)
│   └── advanced.md
└── scripts/          ← executable shell scripts invoked from SKILL.md
    └── collect-diff.sh
```

**Auto-invoke**: skills with `auto_invoke` frontmatter are loaded automatically when conditions match. User-invocable skills can also be triggered with `/skill-name`.

---

### Agents — `.claude/agents/`

Agents are sub-agents spawned explicitly by Claude (or by you) for isolated, heavy, or parallelisable work. They start with no conversation context — their `.agent.md` file is their full system prompt.

| Agent                | Purpose                                                                      | Tools             | When to use                                 |
| -------------------- | ---------------------------------------------------------------------------- | ----------------- | ------------------------------------------- |
| `quality-gate`       | Runs fmt→lint→check→test, returns pass/fail table                            | Bash, Read        | Mid-session validation or structured report |
| `architecture-guard` | Reads INVENTORY.md, ARCHITECTURE.md, PATTERNS.md, ADRs — returns reuse brief | Read, Glob, Grep  | Before implementing anything new            |
| `fallow-scan`        | Runs full fallow pipeline in background, saves JSON + report                 | Bash, Read, Write | Before large refactors or after big merges  |

**Unlike skills**, agents do not auto-invoke. Claude spawns them when it recognises the right moment, or when you ask.

**Agent anatomy:**

```yaml
---
name: agent-name
description: When to use this agent (guides selection)
model: sonnet | haiku | opus
color: purple | blue | orange | green
tools:
  - Bash
  - Read
---
System prompt / instructions for the agent...
```

---

### Hooks — `.claude/hooks/hooks.json`

Hooks are shell commands the harness runs automatically on lifecycle events. They run outside Claude's context — Claude cannot see or act on their output directly.

| Event          | Command                                                                    | Purpose                                                          |
| -------------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `SessionStart` | `npx claudelint check-all --format json`                                   | Audits AI config health at the top of every session              |
| `Stop`         | `cd apps/react-router && vp lint . --fix && vp check --fix && vp run test` | Runs the full quality gate every time Claude finishes a response |

**Adding a hook:** edit `.claude/hooks/hooks.json`. For automated behaviours ("always run X after Y"), hooks are the right mechanism — not memory or preferences.

---

### Permissions — `.claude/settings.local.json`

The allow-list of Bash commands that are pre-approved and will not prompt for confirmation. Commands not on this list require explicit user approval each time.

**This file is not committed to git** (it's local-only). If you set up this project on a new machine, you'll need to re-approve commands as they come up or copy this file.

Entries use glob-style patterns: `Bash(cd apps/react-router && vp lint*)` approves any `vp lint` invocation prefixed with that `cd`.

**When to add a new entry:** when a new script, agent, or skill introduces a Bash command that Claude will run repeatedly and you trust it unconditionally.

---

## How the Layers Interact

```text
You ask Claude to do something
        │
        ▼
Skills auto-invoke if auto_invoke matches
        │  (skill loaded into context — Claude reads it before acting)
        ▼
Claude works — reads files, edits code
        │
        ├─ Needs heavy/isolated work? → spawns an Agent
        │       Agent runs with its own tools + system prompt
        │       Returns a structured result to Claude
        │
        ▼
Claude stops responding
        │
        ▼
Stop hook fires automatically
        └─ cd apps/react-router && vp lint . --fix && vp check --fix && vp run test
```

**SessionStart hook** fires once when the conversation begins, independently of the above flow.

---

## Quick Reference

| I want to…                                              | Go to…                                              |
| ------------------------------------------------------- | --------------------------------------------------- |
| Change project instructions for Claude                  | `AGENTS.md`                                         |
| Add a new skill                                         | `.github/skills/new-skill/SKILL.md`                 |
| Add or change an automated behaviour (on save, on stop) | `.claude/hooks/hooks.json`                          |
| Pre-approve a Bash command                              | `.claude/settings.local.json` → `permissions.allow` |
| Add a background/isolated agent                         | `.claude/agents/new-agent.agent.md`                 |
| See what claudelint thinks of the config                | Run `/config-audit`                                 |
| Understand the Table store architecture                 | `.github/skills/store-pattern/SKILL.md`             |
