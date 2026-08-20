# orchestrate — skill/plugin distribution research

Target: `orchestrate`, one plugin inside `poteto/plugins` (a fork/mirror of
the official `cursor/plugins` marketplace repo — see caveat in §7). Cloned
shallow (`--depth 1`) to `/tmp/.../scratchpad/plugins`; all findings below
are read from real files in that clone unless marked `[web]`.

## 1. What is `orchestrate`?

It is a **Cursor plugin** (not a Claude Code plugin) whose one-liner, from
both the root marketplace listing and `orchestrate/.cursor-plugin/plugin.json`,
is:

> "Fan a large task out across parallel Cursor cloud agents via the Cursor
> SDK: planners publish tasks, workers hand off back up, and a script
> reconciles the tree from disk and git."

This is exactly the multi-agent-coordination category the background
context flagged — it is a genuine parallel to vite-react-compiler's own
epic/refactor-verified orchestration, but built for **Cursor's cloud-agent
product** rather than local subagents. Core shape, from
`skills/orchestrate/SKILL.md` and `references/*.md`:

- A **dispatcher** (one-shot, runs in a local IDE session) takes a user's
  `/orchestrate <goal>` and kicks off a **root planner** as a Cursor cloud
  agent.
- **Planners** (root or sub) never write code — they only author a
  `plan.json` task graph and read `handoffs/*.md`. "If a planner feels the
  urge to code, it publishes a task for a worker instead."
- **Workers** are isolated, full cloud agents (hours of runtime) that do one
  concrete task, commit to their own branch, push, and end with a single
  structured **handoff** message. They cannot talk to siblings.
- **Verifiers** are the same shape as workers but produce a verdict
  (`live-ui-verified | unit-test-verified | type-check-only |
verifier-blocked | verifier-failed`) against one target task's acceptance
  criteria — closely analogous to vite-react-compiler's
  `refactor-verified` builder/verifier split, down to "verifier sees only
  the target's acceptance criteria," though orchestrate's verifier does see
  the worker's own branch/diff, not just the criteria blind.
- **Subplanners** are recursive planners for one slice of a parent's scope,
  aggregating children's handoffs into one handoff upward.
- Git + a local `state.json`/`plan.json`/`handoffs/*.md` on disk are the
  **substrate of truth** — "Git and disk are the substrate." Slack is
  optional, human-visible mirroring only, explicitly "not task state."

A real, runnable **TypeScript CLI** (`orchestrate/skills/orchestrate/scripts/cli.ts`, run under `bun`) drives
the loop: `kickoff`, `run`, `spawn`, `respawn`, `kill`, `kill-tree`, `tail`,
`comment`, `andon`, `tree`, `list`, `status`, `crawl`, `prompt`. This is not
prose-only guidance; it is real code with a `package.json`, `bun.lock`,
`biome.json`, `tsconfig.json`, and 28 files under
`scripts/__tests__/*.test.ts` (`find . -name '*.test.ts' | wc -l`).

## 2. Repository & package structure

Top level of `poteto/plugins` (mirrors `cursor/plugins`):

```
plugins/
├── .cursor-plugin/marketplace.json      # lists every plugin: {name, source, description}
├── schemas/plugin.schema.json           # JSON Schema for a plugin's own manifest
├── schemas/marketplace.schema.json      # JSON Schema for the marketplace manifest
├── scripts/validate-plugins.mjs         # ajv-validates every plugin.json + the marketplace.json
├── .github/workflows/validate-plugins.yml  # CI: runs validate-plugins.mjs on PRs touching manifests/schemas
├── orchestrate/                         # one plugin = one top-level directory
├── pstack/, thermos/, create-plugin/, cursor-sdk/, ...  # 12 siblings (13 dirs hold .cursor-plugin)
└── README.md
```

Root README states the convention explicitly: "This is a multi-plugin
marketplace repository. The root `.cursor-plugin/marketplace.json` lists all
plugins, and each plugin has its own manifest." Each plugin directory is
self-contained: `.cursor-plugin/plugin.json`, `README.md`, `LICENSE`, and
component folders (`skills/`, `rules/`, `agents/`, `commands/`, `hooks/`,
`mcp.json`).

Inside `orchestrate/`:

```
orchestrate/
├── .cursor-plugin/plugin.json           # name, version 1.1.0, skills: "./skills/"
├── README.md                            # setup-only; defers to SKILL.md
├── LICENSE
├── assets/avatar.png
└── skills/orchestrate/
    ├── SKILL.md                         # 47 lines: principles, node types, role dispatch
    ├── prompts/*.md                     # 9 files — literal prompt templates spawned agents receive
    ├── references/*.md                  # 4 files — dispatcher.md, planner.md, spawning.md, handoffs.md
    ├── schemas/plan.schema.json, state.schema.json   # generated from scripts/schemas.ts (zod)
    └── scripts/                         # a full, separately-versioned bun/TS project
        ├── package.json  ("@cursor-skill/orchestrate", private:true, version:0.0.0)
        ├── bun.lock, tsconfig.json, biome.json
        ├── cli.ts → cli/{index,task,inspect,comments,andon,forensics,util}.ts
        ├── core/{agent-manager,andon,branches,comment-retry-queue,failure-handoff,handoff,loop,prompts,redact-body}.ts
        ├── adapters/{index,types}.ts + adapters/slack/{client,index}.ts
        ├── models.ts, measurements.ts, schemas.ts, errors.ts
        ├── tools/{generate-json-schemas,nudge-root,probe-models}.ts
        └── __tests__/  (28 *.test.ts, incl. a Slack Web API mock)
```

**Manifest formats.** Two JSON Schemas govern the repo
(`schemas/plugin.schema.json`, `schemas/marketplace.schema.json`), both
`draft-07`. `plugin.schema.json` requires only `name`; everything else
(`version`, `author`, `skills`, `rules`, `agents`, `commands`, `hooks`,
`mcpServers`, ...) is optional, with component fields accepting either an
explicit glob/path or being left to Cursor's "automatic folder-based
discovery" `[web]`. `orchestrate`'s own `plugin.json` sets only
`skills: "./skills/"` explicitly — no `rules`/`agents`/`commands` since it
has none. There is **no `dependencies` field anywhere in the schema** — see
§7 for why that matters.

`plan.schema.json` and `state.schema.json` (the actual runtime data
contract, not the plugin manifest) are **generated artifacts**: `bun run
generate-schemas` in `scripts/` runs `tools/generate-json-schemas.ts`, which
derives them from `zod` schemas in `orchestrate/skills/orchestrate/scripts/schemas.ts` via
`zod-to-json-schema`. `references/planner.md` explicitly instructs
regenerating them "after plan or state shape changes" — the zod source is
canonical, the checked-in JSON is derived, same shape as
vite-react-compiler's own "tsconfigs are generated, never hand-edit"
convention.

## 3. Installation & distribution mechanism

This is the most load-bearing difference from vite-react-compiler's model,
and it runs deeper than "npm vs. copy."

**There is no npm package at all.** `orchestrate/skills/orchestrate/scripts/package.json` is
`"@cursor-skill/orchestrate"`, `"private": true`, `"version": "0.0.0"` — it
is never published to a registry. The entire plugin (prose skill +
TypeScript CLI source + its own lockfile) ships as **one git directory**,
distributed the way Cursor distributes any plugin:

- **Marketplace, one-click**: `cursor.com/marketplace` or the in-editor
  `/add-plugin` (also `/plugin` inside `cursor-agent`) lets a user browse
  and install `[web]`. Installing happens at **user scope** (account-wide,
  synced on Cursor's backend, available in every session automatically) or
  **project scope** (limited to one project) `[web, forum.cursor.com]`.
  Cursor's own docs do not specify the on-disk mechanics of a marketplace
  install (copy vs. cache vs. symlink) — that implementation detail is
  undocumented publicly.
- **Local development / manual**, per `create-plugin`'s own scaffold skill
  (`create-plugin/skills/create-plugin-scaffold/SKILL.md`): plugins are
  saved to `~/.cursor/plugins/local/<plugin-name>/`, "immediately available
  to Cursor without any install step." Cursor's docs additionally describe
  symlinking a plugin repo into that same `~/.cursor/plugins/local/`
  directory for faster iteration `[web]`. Both are **global, user-home**
  locations — nothing is written into the consumer's project git tree by
  this path.
- **No non-interactive install command exists today.** A Cursor forum
  thread (Aug 2026) confirms there is "no separate non-interactive command
  like `cursor-agent plugin install <plugin-id>`" — install is
  interactive-only, via `/plugin` inside `cursor-agent` or through the
  IDE/Dashboard UI `[web]`. This directly blocks any CI-scriptable
  "provision this repo's agent tooling from a clean checkout" flow, which is
  precisely what `devkit init` is designed to do.

**Once installed, the CLI is not npm-resolved either.** `orchestrate`'s own
README says: "The scripts live outside the host repo's package manager
workspace on purpose," and both `README.md` and `references/dispatcher.md`
instruct `cd skills/orchestrate/scripts && bun install` as a one-time setup
step, run **inside wherever the plugin directory physically landed**
(global `~/.cursor/plugins/...` or a project-scoped copy). So the "gate"-like
runtime code (the CLI that reconciles state) is real, tested, dependency-declaring
TypeScript — but it is resolved by installing its own isolated `bun`
project in place, not by `node_modules` resolution against a versioned
registry package the way `@lcabrera/repo-standards` is.

**Net shape**: everything — prompts, schemas, and runtime code alike —
travels together as one plugin directory and is installed as a unit at
**global (user) or per-project scope by Cursor's own product**, not by a
package manager the plugin ships. There is no equivalent of "prose is
copied, code is `npm install`ed" — orchestrate does not split that way at
all; instead it splits distribution by _where the plugin directory lands_
(global vs. project) while every plugin, code included, is bundled inside
the same git-versioned unit.

## 4. Versioning & update path

- `plugin.json` carries a bare `version` field (`orchestrate` is at
  `"1.1.0"`); `plugin.schema.json` requires no particular semver behavior —
  it's just a string.
- The plugin monorepo has **no root-level changesets/lockstep release
  process** visible in the clone — no `CHANGELOG.md` in `orchestrate/`
  itself (sibling plugin `create-plugin/` does have one, so the convention
  is per-plugin, optional, not enforced by CI). `validate-plugins.yml`
  (CI) only runs `ajv` schema validation on `plugin.json`/`marketplace.json`
  files touched by a PR — it checks manifest _shape_, not version bumps,
  changelog presence, or drift.
- **Update mechanism for an installed plugin is "reinstall the marketplace
  entry," not incremental sync.** Cursor's team-marketplace docs describe
  auto-refresh via GitHub webhooks (at most once per 10 minutes) or a manual
  refresh button, and note the caveat that "for marketplaces where plugins
  were added individually, Auto Refresh only updates existing plugins"
  `[web]` — i.e. it's whole-plugin replacement keyed off the marketplace
  source, not a per-file merge.
- **There is no checksum/drift-detection manifest anywhere in this repo** —
  nothing resembling `.devkit-manifest.json`. Cursor's own docs, per the
  WebFetch above, do not address "what happens to local edits on update" at
  all; the question appears genuinely unanswered by the product. Given
  installs are either a whole-directory marketplace refresh or a manual
  local copy/symlink, the honest read is: a local edit to an installed
  plugin file is **at risk of silent overwrite** on the next marketplace
  refresh, with no classification (unchanged / locally-modified /
  new-upstream) offered anywhere in the tooling. This is the sharpest
  contrast with `@lcabrera/devkit`'s explicit manifest — three-way as ADR-081
  describes it, six states as implemented; see
  [the comparison](./skills-distribution-comparison.md).
- One thing orchestrate _does_ version deliberately at the artifact level:
  `plan.schema.json`/`state.schema.json` are regenerated from the zod
  source and are meant to be regenerated per plugin-version bump — but
  that's an internal-to-the-plugin generation step, unrelated to how a
  _consumer_ takes an update.

## 5. Configuration mechanism

Two distinct layers exist, neither of which matches `devkit.config.json`
closely:

1. **Cursor's own plugin `variables` mechanism** (documented at
   `cursor.com/docs/reference/plugins`, not used by `orchestrate` itself):
   a plugin manifest can declare a JSON-Schema-typed `variables` block (e.g.
   an `API_TOKEN` schema); consuming code references `${VAR}` placeholders
   (for example inside an `mcp.json` server definition); actual values are
   set per-team through the Cursor **dashboard** ("Plugins → Configure"),
   explicitly _not_ committed to the repo — "the plugin only defines the
   schema; it does not include the secret values themselves" `[web]`. This
   is the closest Cursor analogue to a per-consumer config file, but it's
   UI/dashboard-driven secret injection, not a repo-committed JSON like
   `devkit.config.json` carrying workspace rosters or command maps.
2. **`orchestrate`'s actual configuration is plain environment variables** —
   `CURSOR_API_KEY`, `SLACK_BOT_TOKEN`, `SLACK_CHANNEL_ID` — read directly
   by the CLI, with no `variables` schema declared in its own `plugin.json`
   at all. Repo-specific data that _does_ need to travel (Slack channel,
   base branch, repo URL, dispatcher name) is not put in a static config
   file either — it's written into the **runtime `plan.json`** the first
   time a root planner runs (`plan.slackChannel`, `plan.baseBranch`,
   `plan.repoUrl`, `plan.dispatcher.firstName`), and inherited down the
   subplanner tree from there. So orchestrate's "per-run configuration" is
   generated and stored as _state_ in the workspace directory
   (`.orchestrate/<rootSlug>/plan.json`), not as a static, hand-authored,
   version-controlled root config file a human edits ahead of time the way
   `devkit.config.json` is.

There is no equivalent anywhere of injecting repo-specific facts (a
workspace roster, a command map, a GitHub owner/repo pair) into otherwise
generic prose at _install_ time. Genericity in the prompts/references comes
instead from planners being told to derive that data themselves (e.g. "the
CLI auto-detects the repo from `git config --get remote.origin.url`" per
`references/dispatcher.md`) rather than from a config file being read and
templated in.

## 6. Multi-agent/tool compatibility

**This is a Cursor-specific plugin, not agent-agnostic.** Every mechanism is
built directly on Cursor's product surface:

- Distribution is through **Cursor's own Plugins/Marketplace feature**
  (`cursor.com/marketplace`, `/add-plugin`, `/plugin` in `cursor-agent`) —
  there is no generic "any agent that reads files" path documented.
- The orchestration substrate is the **Cursor cloud-agent SDK**
  (`@cursor/sdk` in `orchestrate/skills/orchestrate/scripts/package.json`) — `Agent.create`,
  `Agent.getRun`, `Run.git.branches`, cloud-agent VMs. Workers/subplanners/verifiers
  are literally Cursor cloud agents, spawned and polled through that SDK.
  None of this has a Claude Code, Copilot, or Gemini equivalent — it is not
  portable the way a plain-markdown skill file is.
- `SKILL.md` frontmatter (`name`, `description`,
  `disable-model-invocation: true`) _does_ look like the generic
  Anthropic-style skill convention (matching what vite-react-compiler's own
  `.github/skills/*/SKILL.md` uses), and the plugin schema's `skills` field
  is explicitly listed as usable by "Agent & Cursor Plugins" per the docs
  fetch — so the **prose/skill layer alone** is plausibly portable to
  another SKILL.md-reading agent. But the moment a planner or dispatcher
  needs to actually _do_ anything (`bun cli.ts kickoff ...`), it is
  Cursor-cloud-agent-only: no other agent has `CURSOR_API_KEY`,
  `@cursor/sdk`, or cloud-agent VMs to spawn against.
- Sibling plugin `cursor-sdk` is called out as "**Required reading**" from
  three separate files (`SKILL.md`, `references/planner.md`,
  `references/spawning.md`) for auth, spawning mechanics, and error
  taxonomy — reinforcing that `orchestrate` is one piece of a
  Cursor-specific plugin family, not a standalone portable unit.

## 7. Notable design choices worth flagging

- **Undeclared inter-plugin dependency.** `orchestrate` requires the
  `cursor-sdk` plugin's skill content ("Read that first," "Don't reimplement
  what that skill already documents") in three places, but
  `plugin.schema.json` has **no `dependencies`/`requires` field at all** —
  the coupling is asserted only in prose, as a hyperlink to
  `github.com/cursor/plugins/tree/main/cursor-sdk`. A consumer who installs
  only `orchestrate` (the marketplace lists every plugin independently, one
  row each) gets no automatic pull of `cursor-sdk`, and no manifest-level
  signal that one is needed. This is exactly the class of problem
  vite-react-compiler's own `@lcabrera/*` public-package boundary rules
  exist to catch mechanically (ADR-038) — here it's caught by nothing but a
  human reading the prose.
- **No update-safety net for local edits.** As covered in §4, there is no
  drift-detection manifest of any kind; a marketplace "refresh" is
  effectively whole-directory replacement. Anyone who hand-edits an
  installed plugin file (e.g. tweaks a prompt template) has no tooling
  telling them that edit is about to be silently clobbered on next
  refresh — the exact failure mode `devkit`'s checksum manifest
  (unchanged / locally-modified / new-upstream) is explicitly designed to
  prevent.
- **No scriptable install.** Confirmed via the Cursor forum: no
  non-interactive `cursor-agent plugin install <id>`. Every install path
  (marketplace UI, `/add-plugin`, `/plugin` in `cursor-agent`, manual copy
  to `~/.cursor/plugins/local/`) is either interactive or a manual
  filesystem operation. There is nothing resembling `devkit init` as a
  single CI-safe provisioning command for a fresh checkout.
- **The "gate"-equivalent code ships as unpublished source, not a
  registry package.** `orchestrate/skills/orchestrate/scripts/package.json` is `private: true`,
  `version: "0.0.0"` — deliberately never published to npm. Correctness
  and updates for the CLI ride entirely on "whichever copy of the plugin
  directory you have installed," which is the same global/project
  install path as the prose. There is no analogue to
  `@lcabrera/repo-standards` being resolved from `node_modules` and
  versioned independently by semver — orchestrate never separates "the part
  that must be copied to a known path" from "the part that should be a real
  resolvable dependency." Everything is copied.
- **State is disk+git, not a database or API.** `plan.json`/`state.json`/
  `handoffs/*.md` living in `.orchestrate/<rootSlug>/` and (optionally)
  synced to git via `syncStateToGit` is a deliberate low-tech choice for
  the same reason vite-react-compiler prefers files over hidden state:
  "A script with a JSON state file keeps its footing" against long-running
  agent drift. Worth noting as convergent design even though the domain
  (cloud-agent fleet coordination) differs from vite-react-compiler's
  epic/refactor-verified orchestration.
- **Generated JSON Schemas from a zod source of truth** —
  `plan.schema.json`/`state.schema.json` are checked in but generated via
  `bun run generate-schemas`, with an explicit "regenerate after shape
  changes" instruction. Structurally identical in spirit to
  vite-react-compiler's own generated-tsconfig rule ("tsconfigs are
  generated — never hand-edit them").
- **Provenance caveat**: the clone is `poteto/plugins`, but
  `orchestrate/.cursor-plugin/plugin.json` itself declares
  `"repository": "https://github.com/cursor/plugins"` and
  `"homepage": "https://github.com/cursor/plugins/tree/main/orchestrate"`.
  `poteto` (GitHub handle for Lauren Tan, credited as `pstack`'s author in
  the same `marketplace.json`) appears to be a personal fork/mirror of the
  official `cursor/plugins` marketplace repo rather than a separate
  project — the shallow clone's single visible commit
  (`74dd229 "pstack: sync README..."`) is consistent with a fork that has
  its own commits layered on top of upstream. Findings above describe the
  plugin content itself, which is identical regardless of which remote it
  was read from; this note exists only so the fork/upstream naming
  discrepancy isn't mistaken for an inconsistency in the plugin's own
  design.

## Sources

- Git clone (shallow, `--depth 1`, already present in scratchpad at task
  start; HEAD `74dd2291e8e37b12fd6dc49b2acbd655c6bdaf12`) of
  `https://github.com/poteto/plugins.git`. Files read directly:
  - `/README.md`, `/.cursor-plugin/marketplace.json`,
    `/schemas/plugin.schema.json`, `/schemas/marketplace.schema.json`,
    `/scripts/validate-plugins.mjs`,
    `/.github/workflows/validate-plugins.yml`
  - `orchestrate/.cursor-plugin/plugin.json`, `orchestrate/README.md`,
    `orchestrate/.gitignore`
  - `orchestrate/skills/orchestrate/SKILL.md`
  - `orchestrate/skills/orchestrate/references/dispatcher.md`,
    `references/planner.md`, `references/spawning.md`,
    `references/handoffs.md`
  - `orchestrate/skills/orchestrate/schemas/plan.schema.json`,
    `schemas/state.schema.json`
  - `orchestrate/skills/orchestrate/scripts/package.json`,
    `orchestrate/skills/orchestrate/scripts/tsconfig.json`, `orchestrate/skills/orchestrate/scripts/cli.ts`, `orchestrate/skills/orchestrate/scripts/cli/index.ts`
  - Directory listing (`find`) of the entire `orchestrate/` tree to confirm
    structure (`prompts/, references/, schemas/, scripts/core, scripts/cli,
scripts/adapters, scripts/__tests__, scripts/tools`)
  - `create-plugin/skills/create-plugin-scaffold/SKILL.md`,
    `create-plugin/rules/plugin-quality-gates.mdc` (for Cursor's own
    prescribed install-location convention)
- WebSearch: "Cursor plugins marketplace install .cursor-plugin/plugin.json
  documentation"; "Cursor \"cursor plugins\" install marketplace CLI 2026"
- WebFetch: `https://cursor.com/docs/plugins`,
  `https://cursor.com/docs/reference/plugins`,
  `https://cursor.com/blog/marketplace`,
  `https://forum.cursor.com/t/unable-to-find-a-cli-command-to-install-a-cursor-plugin-after-adding-its-marketplace-repository/166016`
