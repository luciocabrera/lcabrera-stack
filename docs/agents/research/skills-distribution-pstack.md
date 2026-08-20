# pstack — skill/plugin distribution research

Research target: `pstack`, a plugin inside the `poteto/plugins` GitHub repository (a
personal/author copy of what the plugin's own manifest names as the canonical
`cursor/plugins` repo — see §7). Cloned shallow (`--depth 1`) to
`scratchpad/plugins` and read directly from disk; web sources used only to fill
gaps a shallow clone cannot answer (install-time behavior, update propagation,
and a real-world port to another agent).

## 1. What is `pstack`?

`pstack` is a **Cursor plugin** authored by Lauren Tan (`@poteto`, React core
team, ex-Meta/Netflix, now at Cursor). Its `.cursor-plugin/plugin.json`
description:

> "if you want to go fast, go deep first. pstack helps you write less, but
> higher quality code. rigorous agent workflows you can parallelize with
> confidence."

It is not a single skill but a **three-layer system** documented in its
`README.md` and in `skills/poteto-mode/SKILL.md`:

- **Top: a router skill** (`poteto-mode`, invoked as `/poteto-mode`) that reads
  the user's request, matches it to one of sixteen bundled **playbooks**
  (bug fix, feature, refactoring, perf issue, prototype, visual parity,
  multi-phase plan, session pickup, pause safely, authoring-a-skill, eval,
  autonomous run, investigation, runtime forensics, trace forensics,
  opening-a-pr — `ls pstack/skills/poteto-mode/playbooks/*.md`), and copies
  that playbook's steps into its todo list verbatim.
- **Middle: named workflow skills** invoked either directly (`/how`, `/why`,
  `/architect`, `/arena`, `/interrogate`, `/reflect`, `/tdd`,
  `/typescript-best-practices`, `/unslop`, `/show-me-your-work`,
  `/figure-it-out`, `/automate-me`, `/setup-pstack`) or as steps a playbook
  fires into.
- **Bottom: twenty single-rule "principle" skills** (`principle-*`, e.g.
  `principle-laziness-protocol`, `principle-fix-root-causes`,
  `principle-boundary-discipline`), each a short leaf `SKILL.md`. `poteto-mode`
  inlines a Principles index that names when each applies and requires the
  agent to read the index at the start of every multi-step task and cite which
  principle drove which real decision.

It also ships one **subagent definition**, `agents/poteto-agent.md`, so a
parent agent can spawn a delegate that runs poteto's full style
(`subagent_type: "poteto-agent"`) instead of a generic subagent — the README is
explicit that substituting a generic subagent "skips that read and drifts."

## 2. Repository & package structure

The repo (`poteto/plugins`, mirroring `cursor/plugins`) is a **multi-plugin
marketplace monorepo** — thirteen sibling plugin directories at the repo root
(`pstack`, `cursor-team-kit`, `thermos`, `create-plugin`, `orchestrate`,
`agent-compatibility`, `cli-for-agent`, `pr-review-canvas`, `docs-canvas`,
`cursor-sdk`, `continual-learning`, `ralph-loop`, `teaching`), each a
self-contained plugin with its own manifest. The root `README.md` states the
convention directly:

> "This is a multi-plugin marketplace repository. The root
> `.cursor-plugin/marketplace.json` lists all plugins, and each plugin has its
> own manifest."

```
plugins/
├── .cursor-plugin/marketplace.json   # registry: name + source dir + description per plugin
├── schemas/                          # JSON Schema for both manifest kinds
├── scripts/validate-plugins.mjs      # CI: schema-validates marketplace.json + every plugin.json
├── .github/workflows/validate-plugins.yml
└── pstack/
    ├── .cursor-plugin/plugin.json    # per-plugin manifest
    ├── README.md
    ├── LICENSE
    ├── agents/poteto-agent.md
    └── skills/<skill-name>/SKILL.md  # one dir per skill, optional references/ and playbooks/ subdirs
```

**Manifest formats**, confirmed from `schemas/plugin.schema.json` and the two
manifests read directly:

- **`.cursor-plugin/marketplace.json`** (repo root, one per marketplace repo) —
  `name`, `owner {name, email}`, `metadata.description`, and a `plugins[]`
  array of `{name, source, description}`. `source` is a relative path to the
  plugin's directory.
- **`.cursor-plugin/plugin.json`** (one per plugin) — `name` (kebab-case,
  pattern-enforced), `displayName`, `description`, `version` (semver string,
  informational — see §4), `author {name, email?}`, `publisher`, `homepage`,
  `repository`, `license`, `logo`, `keywords`, `category`, `tags`, and then the
  **component pointers**: `commands`, `agents`, `skills`, `rules` (each a
  glob/path or array of them), `hooks` (path or inline object), `mcpServers`
  (path, inline object, or array). pstack's own manifest sets only
  `"skills": "./skills/"` and `"agents": "./agents/"` — everything under those
  paths is discovered by the `skills/<name>/SKILL.md` / `agents/*.md`
  convention; no `rules`, `commands`, `hooks`, or `mcpServers` blocks are
  present.
- **`skills/<name>/SKILL.md`** — YAML frontmatter (`name`, `description`,
  optional `disable-model-invocation: true`) plus a Markdown body. This is the
  same shape Claude Code skills use. `poteto-mode`'s frontmatter, verbatim:

  ```
  ---
  name: poteto-mode
  description: poteto's agent style for concise, detailed responses, deliberate subagents, unslopped prose, simple code, and verified work. Use for poteto, /poteto-mode, or requests to work in this style.
  disable-model-invocation: true
  ---
  ```

  A skill folder can carry a `references/` subfolder (prompts, rubrics,
  templates the skill body points at rather than inlines) and, for
  `poteto-mode` specifically, a `playbooks/` subfolder — one Markdown file per
  playbook, referenced by relative path from the skill body rather than
  pasted in.

- CI enforcement (`/scripts/validate-plugins.mjs`, run by
  `/.github/workflows/validate-plugins.yml` on any PR touching
  `.cursor-plugin/marketplace.json`, `**/plugin.json`, or `schemas/**`) is
  **schema + cross-reference validation only**: both manifests parse against
  their JSON Schemas, every `marketplace.json` `source` directory and its
  `plugin.json` must exist, and `plugin.json.name` must equal the
  `marketplace.json` entry's `name`. There is no build step, no bundling, no
  package output — the repository _is_ the distributed artifact.

## 3. Installation & distribution mechanism

There is **no npm package, no CLI installer script, and no `package.json`**
anywhere under `pstack/` (the only `package.json` in the whole monorepo
belongs to an unrelated helper script inside the `orchestrate` plugin). The
entire distribution surface is **Cursor's own native plugin system**, reading
plain files out of a git-hosted marketplace repo.

pstack's own `README.md` gives the install command:

```bash
/add-plugin pstack
```

`/add-plugin` is a Cursor IDE built-in slash command, not anything pstack
implements. Per Cursor's own docs (`cursor.com/docs/plugins`), the general
flow is: open **Customize** in the sidebar → find the plugin → **Install** →
choose a **project or user scope**. Cursor's docs do not disclose the exact
on-disk materialization mechanism, but `create-plugin`'s
`skills/create-plugin-scaffold/SKILL.md` (a sibling plugin in the same repo,
for authoring new plugins) is explicit about the **local-testing** path, which
is the only concrete filesystem location documented anywhere in the repo:

> "By default, create the plugin inside the user's local plugin directory:
> `~/.cursor/plugins/local/<plugin-name>/` ... This path makes the plugin
> immediately available to Cursor without any install step."

So content is materialized onto disk (copied or synced into a
`~/.cursor/plugins/...` tree, scoped per-user or per-project), not resolved
live from a remote reference at prompt time the way an npm dependency would
be. That answers the parent question directly: **it is copied**, the same
broad shape as `@lcabrera/devkit`'s `init`/`sync`, just performed by the IDE's
own built-in command instead of an npm-published CLI.

Team/enterprise marketplaces get one more mechanism Cursor's docs do mention
by name — an auto-refresh toggle:

> "Turn on **Enable Auto Refresh** to update plugins automatically whenever
> changes are pushed to the branch the marketplace tracks." (or **Refresh**
> manually)

Notably this describes the _marketplace listing_ staying current with
upstream, not what happens to an _already-installed_ copy's files — Cursor's
docs do not state whether that refresh re-materializes an already-installed
plugin's files automatically or only updates what a fresh `/add-plugin`
install would pull. This is a real gap in what could be established from
documentation alone.

## 4. Versioning & update path

`plugin.json.version` is a bare semver string (pstack is currently `0.9.0`)
with **no changelog file** — `pstack/` has no `CHANGELOG.md` (unlike the
sibling `create-plugin` plugin, which does ship one), so a version bump has no
attached record of what changed. There is no changeset tool, no registry, and
no evidence of any tagged-release or npm-publish workflow gating a version
bump — CI (`validate-plugins.yml`) only schema-validates on manifest-touching
PRs; it does not check that `version` was bumped or that a change is
described anywhere.

There is **no checksum manifest, no drift-detection, and no
locally-modified/new-upstream classification** anywhere in the repo or in
Cursor's documented plugin behavior — nothing analogous to
`@lcabrera/devkit`'s `.devkit-manifest.json` per-file SHA-256 tracking exists.
The closest thing to an "update path" a consumer has is re-running
`/add-plugin` (or relying on a team marketplace's auto-refresh, §3), which — as
far as any consulted source states — behaves as a fresh materialization rather
than a merge; nothing in the docs or the repo describes what happens to a
consumer's local edits to a previously-installed plugin file on re-install.
This is the single largest asymmetry with the vite-react-compiler design under
consideration: ADR-081's checksum-manifest tri-state (unchanged / locally
modified / new-upstream) has no counterpart here at all.

## 5. Configuration mechanism

The only per-consumer configuration surface found anywhere in `pstack` is
`/setup-pstack` (`skills/setup-pstack/SKILL.md`), and it is narrow and
**user-global, not per-repo**: it detects which LLMs the current session can
reach and writes one file, `~/.cursor/rules/pstack-models.mdc`, an
`alwaysApply: true` Cursor rule mapping abstract roles (code, judgment,
"how" explorer/explainer/critics, arena runners, architect runners,
interrogate reviewers, etc.) to concrete model slugs, e.g.:

```
feature, refactoring: composer-2.5-fast
bug-fix, perf-issue: gpt-5.5-high-fast
judgment and prose: claude-opus-4-8-thinking-xhigh
```

Every workflow skill reads this file and "falls back to the skill defaults
when a line is absent, so this is an override layer, not a requirement" (per
the skill's own description). That is the entirety of the configuration
mechanism — there is **no equivalent of `devkit.config.json`**: no
workspace/repo roster, no command map, no GitHub owner/repo field, no
per-repo active-gates list. Repo-specific data that vite-react-compiler's
devkit design threads through a shared config file is instead either hardcoded
generically (e.g. every playbook's closing PR-link format is the literal
template string `https://github.com/<owner>/<repo>/pull/<number>`, left for
the agent to fill in from whatever it can observe at runtime — presumably
`git remote`) or simply not modeled at all. Nothing in pstack injects
repo-specific facts into its prose the way `devkit.config.json` is described
as doing.

## 6. Multi-agent/tool compatibility

pstack is **not agent-agnostic** — it is deeply coupled to Cursor's specific
agent runtime, despite being plain Markdown files a human or another tool
could technically open and read. Concrete couplings found in the skill bodies:

- Cursor-specific tool names used directly in skill instructions:
  `AskQuestion` (Cursor's structured-choice tool — not Claude Code's
  `AskUserQuestion`), the `Task` tool with `subagent_type: generalPurpose`
  (Cursor's spelling, camelCase — Claude Code's Agent tool uses
  `"general-purpose"`, kebab-case), and Cursor's own background-execution and
  readonly-agent-mode semantics ("agent mode (readonly strips MCP)").
- Cursor-specific model slugs baked into defaults throughout every skill:
  `composer-2.5-fast` (Cursor's own Composer model), `gpt-5.5-high-fast`,
  `claude-opus-4-8-thinking-xhigh`.
- Dependencies on **other Cursor built-ins that pstack does not bundle**:
  `/loop` (Cursor's long-running-agent command), `create-skill` (Cursor's
  built-in skill-authoring flow, leaned on by both `automate-me` and the
  `authoring-a-skill` playbook), `babysit` (Cursor's built-in PR-monitoring
  skill). pstack's README names this explicitly under "not shipped here":
  `/deslop`, `control-cli`, `control-ui` ship in the sibling `cursor-team-kit`
  plugin instead, and `/babysit`/`/create-skill` "are cursor built-ins" with
  no bundled fallback at all.
- `/setup-pstack` writes to `~/.cursor/rules/*.mdc`, a Cursor-specific rule
  file format and location.

The strongest outside evidence that this coupling is real and not just
incidental naming: a third party built
**`michael-denyer/pstack-claude`**, explicitly billed as a "Claude Code port
of poteto's pstack ... Rigorous agent workflows with Cursor primitives
translated to their Claude Code equivalents." Its README documents a
systematic substitution table (Cursor's `Task`/`subagent_type: generalPurpose`
→ Claude Code's `Agent`/`"general-purpose"`; `AskQuestion` → `AskUserQuestion`;
`composer-2.5-fast` → `claude-sonnet-4-6`; the built-in `/loop` → a bundled
`loop` skill; Cursor's `/create-skill` → a bundled
`plugin-dev:skill-development` skill) and states it had to **bundle seven
replacement skills** pulled from `cursor-team-kit` (`deslop`,
`thermo-nuclear-code-quality-review`, `make-pr-easy-to-review`, `fix-ci`,
`fix-merge-conflicts`, `get-pr-comments`, `what-did-i-get-done`) because
Claude lacks Cursor's closed-source equivalents. It also flags a real
capability loss: pstack's `arena`/`interrogate`/`how` skills deliberately
fan out across **different model vendors** (Claude, GPT, Cursor's Composer)
for adversarial diversity; ported to single-vendor Claude Code, "the four-way
split collapses to four Claude variants." Tellingly, that port distributes
itself as **its own Claude Code plugin marketplace**
(`/plugin marketplace add michael-denyer/pstack-claude`) — i.e. Claude Code
has its own native, separate plugin-marketplace mechanism, and the port uses
that rather than anything pstack itself provides — plus a manual
`ln -s "$PWD/$s" ~/.agents/skills/"$(basename "$s")"` symlink path for Codex
and "Prime Agent." In short: the underlying _prose_ (principles, playbooks)
is portable by hand; the _mechanism_ (tool calls, model slugs, built-in
skill dependencies, config file location) is not, and porting it required a
parallel, separately-maintained repository with its own translation layer.

## 7. Notable design choices

- **The repo the plugin.json points at is not the repo it was cloned from.**
  `pstack/.cursor-plugin/plugin.json` sets
  `"repository": "https://github.com/cursor/plugins"` and
  `"homepage": ".../cursor/plugins/tree/main/pstack"`, while this research
  cloned `github.com/poteto/plugins`
  per the task brief. Both repos exist and (at the commit cloned,
  `74dd2291e8e37b12fd6dc49b2acbd655c6bdaf12`) appear to carry identical
  content — `poteto/plugins` reads as Lauren Tan's personal copy/fork of what
  her own manifest names as the canonical `cursor/plugins` org repo (search
  results independently confirm `cursor/plugins` is the live, publicly
  documented marketplace at `cursor.com/marketplace`). A consumer following
  the manifest's own `repository` field and a consumer following the task's
  given URL land on two different git remotes for what claims to be the same
  package — exactly the kind of drift a canonical-source rule (this repo's
  own `@lcabrera/*` vs `@repo/*` scoping discipline) is meant to prevent.
- **Discovery is convention-over-configuration, one level less explicit than
  devkit's approach.** pstack's `plugin.json` just says `"skills": "./skills/"`
  and lets the `<name>/SKILL.md` folder convention do the rest — there is no
  per-skill manifest entry, checksum, or explicit file list anywhere. This is
  simpler to author but gives the tri-state manifest classification devkit
  wants (unchanged / locally-modified / new-upstream) nothing to hang off:
  without a recorded per-file identity at install time, there is structurally
  no way to tell "the consumer edited this" from "upstream changed this" on a
  later sync — the concern ADR-081's checksum manifest exists specifically to
  solve is simply unaddressed here.
  Cursor's docs are silent on it, and pstack invents nothing of its own to
  cover the gap.
- **A router skill with an inlined index, not a directory listing.**
  `poteto-mode`'s Principles section inlines a one-line summary of all twenty
  `principle-*` skills directly in its own `SKILL.md` (with a mandatory
  "read this before any multi-step task" instruction) rather than leaving the
  agent to discover them by globbing `skills/principle-*`. This trades a
  duplicate-source-of-truth risk (the index can drift from the leaf skills)
  for a guarantee that a text-only agent with no directory-search capability
  still sees the full menu — relevant given pstack explicitly targets an IDE
  agent, not necessarily one with free filesystem globbing.
- **The gate/skill line is not drawn here the way ADR-081 draws it.**
  vite-react-compiler's split is explicit: materialize path-discovered prose
  (`devkit`), but resolve invoked, code-dependent gates from `node_modules`
  (`repo-standards`), because a gate has real logic and versioned semantics a
  copy-paste can't safely carry. pstack has no equivalent "gate" package at
  all — even its most code-like component, `create-plugin`'s CI validator
  (`/scripts/validate-plugins.mjs`), lives as a **plain script committed to
  the marketplace repo itself**, run via `npm install --no-save ajv
ajv-formats` in the consuming repo's own CI, not resolved from a published,
  versioned package. If pstack ever needed a real stateful gate (its
  `show-me-your-work` skill, for instance, writes a TSV decision log via a
  bundled `pstack/skills/show-me-your-work/scripts/log.sh` rather than any installed binary), it would face
  exactly the tension ADR-081 was written to resolve, and nothing in the repo
  suggests it has been.
- **`automate-me` is a live counterpart to devkit's "profile" idea, done as a
  generative flow instead of a static selection.** Rather than choosing a
  fixed `--profile` at install time, `/automate-me` mines the user's own
  recent Cursor transcripts, asks structured follow-up questions, and
  _drafts a brand-new skill_ (`<handle>-mode/SKILL.md`) encoding that
  specific user's working style on top of pstack — landed via its own PR,
  in a worktree, never committed straight to main. It is explicitly
  positioned as personalization layered over a shared base ("you keep pstack
  as the base and end up with your own routing skill alongside
  `poteto-mode`"), which is a materially different customization model than
  picking one of a fixed set of profiles.

## Sources

- `git clone --depth 1 https://github.com/poteto/plugins.git` — commit
  `74dd2291e8e37b12fd6dc49b2acbd655c6bdaf12` (Sat Jun 6 20:56:05 2026 -0700),
  read directly from disk:
  - `README.md` (repo root)
  - `.cursor-plugin/marketplace.json`
  - `schemas/plugin.schema.json`
  - `/scripts/validate-plugins.mjs`
  - `/.github/workflows/validate-plugins.yml`
  - `.gitignore`
  - `pstack/README.md`
  - `pstack/.cursor-plugin/plugin.json`
  - `pstack/agents/poteto-agent.md`
  - `pstack/skills/poteto-mode/SKILL.md`
  - `pstack/skills/architect/SKILL.md`
  - `pstack/skills/automate-me/SKILL.md`
  - `pstack/skills/setup-pstack/SKILL.md`
  - `pstack/skills/principle-encode-lessons-in-structure/SKILL.md`
  - full `pstack/` and repo-root directory listings (`find`, `ls -la`)
  - `create-plugin/skills/create-plugin-scaffold/SKILL.md`
  - `create-plugin/skills/review-plugin-submission/SKILL.md`
- WebSearch: `Cursor plugins "/add-plugin" marketplace.json install
~/.cursor/plugins`
- WebSearch: `poteto pstack cursor plugin Lauren Tan`
- WebFetch: `https://cursor.com/docs/plugins` (install/scope/auto-refresh
  behavior)
- WebFetch: `https://github.com/michael-denyer/pstack-claude` (third-party
  Claude Code port — primitive-substitution table, bundled-skill list,
  installation method, multi-model-diversity tradeoff)
