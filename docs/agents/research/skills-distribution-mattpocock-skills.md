# mattpocock/skills — skill distribution research

Research target: [github.com/mattpocock/skills](https://github.com/mattpocock/skills), a repository of AI-agent
skills maintained by Matt Pocock (aihero.dev), cloned shallow at commit `885e2ca4d842d139e9aef4e48d366c63cb1b8013`
(2026-08-19). This document exists to inform ADR-081 in `vite-react-compiler` (the `@lcabrera/devkit` /
`@lcabrera/repo-standards` split) — the framing dimensions below (materialize-vs-resolve, config, versioning,
multi-agent compatibility) are chosen because they map onto that decision, not because they're the only
interesting things about this repo.

## 1. What is this repo?

It is a personal, curated collection of **Claude Code Skills** (and, secondarily, Codex-compatible skills),
published under the tagline "Skills For Real Engineers" — explicitly positioned against agentic frameworks that
"own the process" (the README names GSD, BMAD, and Spec-Kit as the contrast: they "take away your control and
make bugs in the process hard to resolve"). It is not a framework or a runtime; it is prose plus a small amount
of shell/YAML/JS scaffolding, distributed as either a Claude Code plugin or a set of copyable files.

Scope, from `.claude-plugin/plugin.json`'s `skills` array at the researched commit: 24 promoted skills split into
two buckets — `engineering/` (18 skills: daily code work — spec/ticket flows, TDD, code review, domain
modeling, bug diagnosis, merge-conflict resolution, an interactive setup wizard generator) and `productivity/`
(6 skills: non-code workflow tools — "grilling" interviews, handoff documents, teaching, questionnaires). The
repo also carries three **non-promoted** buckets that exist on disk but ship in neither the plugin nor the
`skills.sh` catalog: `misc/` (4 skills, "kept around but rarely used"), `in-progress/` (6 skills, "beta: public
on purpose, feedback wanted, not shipped in the plugin"), and `deprecated/` (0 skills at this commit, just a
README). Total `SKILL.md` files in the tree: 35 (`find skills -name SKILL.md | wc -l`).

Audience: individual engineers and small teams using Claude Code or Codex (the README explicitly frames Codex
and "other agents" as first-class, not an afterthought) who want opinionated engineering discipline (grilling for
alignment, TDD, deep-module design, domain-language sharpening via `CONTEXT.md`) layered onto whatever agent
they're already running. The project has ~60,000 newsletter subscribers per the README's own framing, and is
commercially connected to Matt Pocock's aihero.dev course/newsletter business — the plugin's `homepage` field
points at `https://www.aihero.dev/s/skills-newsletter`, and every skill's human-facing docs page
(`docs/<bucket>/<name>.md`) is republished at `https://aihero.dev/skills-<name>`.

## 2. Repository & package structure

### Bucket layout

```
skills/
  engineering/    <- promoted
  productivity/   <- promoted
  misc/           <- not promoted
  in-progress/    <- not promoted (beta)
  deprecated/     <- not promoted (retired)
```

`AGENTS.md` (identical to `CLAUDE.md`, see below) states the rule in one place: "Every skill in `engineering/`
or `productivity/` (the **promoted** buckets) must have a reference in the top-level `README.md` and an entry in
`.claude-plugin/plugin.json`'s `skills` array... Skills in `misc/`, `in-progress/`, and `deprecated/` must not
appear in either." Each bucket also carries its own `README.md` listing its skills.

### Per-skill directory

Every skill is a directory named after the skill, containing at minimum a `SKILL.md`, and — as of the
"add Codex metadata" change (`CHANGELOG.md` v1.2.0, PR #551) — an `agents/openai.yaml` sibling. A skill may also
carry auxiliary reference files it owns directly (no shared cross-skill "commons" directory). Examples pulled
from the clone:

- `skills/engineering/tdd/`: `SKILL.md`, `agents/openai.yaml`, `mocking.md`, `tests.md` (reference docs the
  skill's own steps point into).
- `skills/engineering/setup-matt-pocock-skills/`: `SKILL.md`, `agents/openai.yaml`, plus five **seed templates**
  it writes into a consumer repo: `domain.md`, `issue-tracker-github.md`, `issue-tracker-gitlab.md`,
  `issue-tracker-local.md`, `triage-labels.md`.
- `skills/engineering/code-review/`: just `SKILL.md` + `agents/openai.yaml` — no extra files, everything inline.

### `SKILL.md` shape

Standard Claude Code skill frontmatter — `name`, `description`, and (for user-invoked skills only)
`disable-model-invocation: true`. Two verbatim examples:

```yaml
# skills/engineering/code-review/SKILL.md (model-invoked)
---
name: code-review
description:
  'Review the changes since a fixed point (commit, branch, tag, or merge-base) along two axes:
  Standards (...) and Spec (...). Runs both reviews in parallel sub-agents and reports them side by side.
  Use when the user wants to review a branch, a PR, work-in-progress changes, or asks to "review since X".'
---
```

```yaml
# skills/engineering/setup-matt-pocock-skills/SKILL.md (user-invoked)
---
name: setup-matt-pocock-skills
description:
  'Configure this repo for the engineering skills: set up its issue tracker, triage label
  vocabulary, and domain doc layout. Run once before first use of the other engineering skills.'
disable-model-invocation: true
---
```

`.agents/invocation.md` documents the description-writing convention as policy, not just a pattern: a
model-invoked skill's `description` stays **model-facing** with rich trigger phrasing ("Use when the user
wants..., mentions..., asks for...") to drive auto-invocation; a user-invoked skill's `description` is stripped
to a **human-facing** one-liner (no trigger list) because a human browsing slash-commands, not a
relevance-matching model, is the only reader.

### The `agents/openai.yaml` companion

Every skill carries one, for Codex's UI and invocation-policy metadata:

```yaml
# skills/engineering/tdd/agents/openai.yaml (model-invoked)
interface:
  display_name: 'TDD'
  short_description: 'Test-driven red-green-refactor'
```

```yaml
# skills/engineering/to-tickets/agents/openai.yaml (user-invoked)
interface:
  display_name: 'To Tickets'
  short_description: 'Split a plan into tracer-bullet tickets'
policy:
  allow_implicit_invocation: false
```

`policy.allow_implicit_invocation: false` is Codex's analog of Claude's `disable-model-invocation: true`, and
`.agents/invocation.md` requires the two stay in lockstep: "a skill is user-invoked in both harnesses or
neither." This is the repo's mechanism for one skill, one set of instructions, working correctly across two
different harnesses' invocation-policy vocabularies — see §6.

### Root-level governance files

- `CLAUDE.md` / `AGENTS.md`: identical content — `AGENTS.md` is a **symlink** to `CLAUDE.md` (added in the same
  v1.2.0 PR that added the Codex metadata, "so Codex reads the same repo instructions"). It states the bucket
  rules, the promoted-buckets-need-README-and-plugin-entry invariant, the docs-page trigger, the invocation-mode
  frontmatter rule, and a hard "no em-dashes anywhere in this repo's prose" style rule.
- `CONTEXT.md`: the repo's own domain glossary (Issue tracker / Issue / Decision ticket / Triage role), written
  using its own `domain-modeling` skill's discipline — the repo eats its own dog food.
- `.agents/adr/`: two ADRs (`0001-explicit-setup-pointer-only-for-hard-dependencies.md`,
  `0002-ship-as-a-claude-code-plugin.md`) recording distribution and config-dependency decisions — detailed in
  §3 and §5.
- `.agents/invocation.md`, `.agents/install-block.md`, `.agents/writing-docs.md`: cross-cutting policy documents
  (invocation-mode rules, the single canonical install-command wording, the docs-page template).
- `.out-of-scope/`: three short "we will not build this" documents (niche issue-tracker backends, a
  question-count cap for grilling sessions, a verify-mode for the setup skill), each with a "Prior requests"
  section citing the GitHub issue number that asked and was declined. This is a scope-fence mechanism, not a
  distribution mechanism, but it's a notable documentation pattern.
- `docs/engineering/*.md`, `docs/productivity/*.md`: one human-facing page per promoted skill, mirroring the
  bucket tree, republished on aihero.dev. `.agents/writing-docs.md` is an unusually detailed style guide for
  these — fixed section frame (`What it does` / `When to reach for it` / `Where it fits`), an explicit rule that
  the page "carries no install commands" because the hosting site (ai-hero) renders an install widget above the
  body from the skill's identity, so a hand-written copy would drift from it (and did, per the same doc:
  "those blocks are now deleted rather than corrected, because the site renders the install commands itself").

## 3. Installation & distribution mechanism

The README states this as the headline design decision: **"Two ways in, two philosophies."** Both are documented
in `.agents/install-block.md`, which the repo treats as the single canonical source for install wording —
"`README.md`, `.changeset/*`, and every page under `docs/` must say **this** and nothing else. Change it here
first, then propagate."

### Route A — Claude Code plugin (managed, read-only, resolved by reference)

```bash
claude plugins install mattpocock-skills
```

or, in-session, `/plugin install mattpocock-skills`. This is Claude Code's **native plugin/marketplace
mechanism** (confirmed current as of 2026-08-20 via `code.claude.com/docs/en/discover-plugins` and
`code.claude.com/docs/en/plugins`). The repo ships:

- `.claude-plugin/plugin.json`: the plugin manifest — `name`, `version` (kept in sync with `package.json`'s
  version by `/scripts/sync-plugin-version.mjs`, run in the `version` npm script right after `changeset
version`), `description`, `author`, `homepage`, `repository`, `license`, `keywords`, and a `skills` array
  listing the 24 promoted skill paths **explicitly, one by one** (`./skills/engineering/tdd`,
  `./skills/productivity/grill-me`, etc.) — not a directory glob.
- `.claude-plugin/marketplace.json`: makes the repo its own single-plugin marketplace (fallback path,
  `/plugin marketplace add mattpocock/skills` then `/plugin install mattpocock-skills@mattpocock`) — explicitly
  **not** the documented route; kept only for installing an unreleased commit or a fork.

Critically, `mattpocock-skills` is listed in **Anthropic's official marketplace**
(`anthropics/claude-plugins-official`, "which every Claude Code install has by default" — confirmed live via
web search: Claude Code registers that marketplace automatically on first interactive launch). So a user runs
one command with **nothing to add first**, and updates are pulled automatically because Anthropic's official
marketplaces default to auto-update. ADR-0002's "Update, 2026-08-05" note is worth quoting for how the
maintainer verified this rather than assuming it (their own Non-Negotiable-Rule-14-shaped instinct):

> "The listing's `source` is `{"source": "url", "url": "https://github.com/mattpocock/skills.git", "sha": …}`:
> the **sha is pinned**, so a release reaches installed users when that pin moves, not the moment we tag. At the
> time of writing the pin sits two commits behind `main`, which is why it lists 22 skills rather than the 24 in
> `plugin.json`."

So even the "managed, always current" route is a **pinned-SHA pull-based update**, not truly live: a merge to
`main` does not instantly change what an installed user has; a separate (apparently automated, unspecified-cadence)
pin bump in the official marketplace catalog does. Nothing in this content is materialized into the consumer's
own repo files — it's resolved by Claude Code from the plugin cache at whatever path its plugin system uses, and
namespaced (`/mattpocock-skills:tdd`, per Claude Code's plugin docs — plugin skills are always
namespace-prefixed to avoid collisions between plugins).

### Route B — `skills.sh` (copy-based, editable, multi-harness)

```bash
npx skills@latest add mattpocock/skills
```

`skills.sh` is a **separate, third-party tool** — not built by Matt Pocock. Per its own site (fetched
2026-08-20), it's "Made with care by Vercel," open source at `github.com/vercel-labs/skills`, and supports
installing skills into Claude Code, Cursor, Codex, GitHub Copilot, Windsurf, Gemini, Cline, AMP, Antigravity, and
OpenClaw — i.e. it's a generic skill-distribution CLI that mattpocock/skills is one catalog entry in, not a
bespoke script this repo wrote. Its interactive flow (confirmed via the README and secondary sources): pick which
skills to take from the catalog, pick which agent harness(es) to install into, then it **writes ordinary files
into the consumer's project tree** — "editable skill files into your project, so you can hack on them and make
them your own. Nothing updates behind your back."

The README's own framing of the split: "The Claude Code plugin installs the whole set as a managed, read-only
bundle that updates when I ship, so you subscribe rather than fork. skills.sh copies editable skill files into
your project, so you can hack on them and make them your own. Pick one: installing both leaves you with every
skill twice." This is stated as a hard constraint, not a suggestion — the two mechanisms are mutually exclusive
by design, and the repo explicitly does not try to reconcile or dedupe them.

### A third, undocumented route — `/scripts/link-skills.sh`

Not part of the public install story at all; it's a maintainer-only dev tool, explicitly marked as such in its
own header comment: _"This is a dev-only script, intended for use by maintainers of this repo. It is not a
supported installer. Modifications to it, or requests for modifications, will not be approved."_ It symlinks
every `SKILL.md`'s parent directory into `~/.claude/skills/` and `~/.agents/skills/` directly from a git clone,
so that `git pull` keeps a maintainer's local install current without any install command at all. Notably this
is the one place where **symlinks** are used for skill distribution — and ADR-0002 records that this exact
technique fails for Codex's plugin path specifically because "Codex copies the plugin tree into its cache and
**drops symlinks**, so the skills arrive empty," which is part of why a native Codex plugin was deferred (§7).

## 4. Versioning & update path

- **Package versioning**: [Changesets](https://github.com/changesets/changesets) (`.changeset/*.md` +
  `@changesets/cli`, `@changesets/changelog-github`), the same tool family `vite-react-compiler` uses. Every
  substantive PR carries a changeset; `npm run version` runs `changeset version && node
scripts/sync-plugin-version.mjs`, and `CHANGELOG.md` is generated (v1.2.3 at the researched commit — three
  patch entries, each linked to its PR and commit SHA, in the Changesets-standard format).
- **`/scripts/sync-plugin-version.mjs`**: a small guard whose whole job is keeping `plugin.json`'s `version` in
  sync with `package.json`'s, because "Claude uses the plugin `version` to decide when installed users see an
  update" (ADR-0002). It has a `--check` mode (non-mutating, exits 1 on drift) as well as a write mode — the
  repo's CI presumably runs `--check`, though no workflow file was inspected to confirm this.
- **Route A (plugin) update path**: entirely implicit and pull-based, not push-based — see the pinned-SHA
  mechanic quoted in §3. There is **no drift-detection or "locally modified" concept for plugin installs at
  all**, because the plugin route deliberately gives the consumer no editable local copy to drift from — it's
  read-only by construction. The only "detection" is Claude Code showing whatever the marketplace catalog's
  pinned SHA currently resolves to.
- **Route B (`skills.sh`) update path**: `npx skills update` (whole-set) or `npx skills@latest update <name>`
  (single-skill), per `.agents/install-block.md`. This is a **re-copy**, not a diff/merge: the README's "for
  tinkerers" section says plainly "Nothing updates behind your back; pull my latest changes when you want them
  with `npx skills update`." Whether `skills.sh` internally does any content-hash comparison to warn about local
  edits before overwriting is a fact about Vercel's `skills` CLI, not this repo, and was not confirmed by primary
  source in this research (the vercel-labs/skills source was not cloned) — treat as unverified. What _is_
  verified from mattpocock/skills' own docs is that this repo makes **no promise whatsoever** of a
  locally-modified/unchanged/new-upstream classification on its own end; any such behavior, if it exists, lives
  entirely in the third-party installer, outside this repo's control or documentation.

This is the single sharpest contrast with `@lcabrera/devkit`'s design: devkit's own manifest
(`.devkit-manifest.json`, per-file SHA-256, three-way classification on re-sync) is a first-party, in-repo
mechanism this project owns end to end. mattpocock/skills instead **delegates** that whole problem to whichever
route the consumer picked — either "no drift possible, because nothing is copied" (plugin) or "drift is the
consumer's to manage, and the tool that copied it is somebody else's product" (skills.sh). Neither route
attempts devkit's middle ground of "materialize into the consumer repo, but track and reconcile changes on
re-sync."

## 5. Configuration mechanism

There **is** a per-consumer configuration mechanism, functionally close to `devkit.config.json` in intent but
structurally very different in form: prompt-driven prose files instead of one schema-validated JSON file.

The user-invoked `setup-matt-pocock-skills` skill (`disable-model-invocation: true`, explicitly meant to run
"once per repo" before the other engineering skills) is a **conversational wizard**, not a deterministic script —
its own `SKILL.md` says so directly: "This is a prompt-driven skill, not a deterministic script. Explore,
present what you found, confirm with the user, then write." It:

1. **Explores** the target repo (git remote, existing `AGENTS.md`/`CLAUDE.md`, `CONTEXT.md`, `/docs/adr/`,
   `.scratch/`, whether the `triage` skill is even installed, monorepo signals) to infer sensible defaults rather
   than asking blind.
2. **Asks**, section by section, only what genuinely branches: which issue tracker (GitHub / GitLab / local
   markdown / freeform "other"), whether to keep the five canonical triage-label strings or map onto existing
   ones, and single- vs multi-context domain-doc layout (skipped outright if there's no monorepo signal).
3. **Writes** the result as: an `## Agent skills` block appended/updated in whichever of `CLAUDE.md`/`AGENTS.md`
   already exists in the consumer repo (never creates a second one if one already exists — "Never create
   `AGENTS.md` when `CLAUDE.md` already exists"), plus separate prose files under `/docs/agents/`:
   `/docs/agents/issue-tracker.md`, `/docs/agents/domain.md`, and (only if `triage` is installed)
   `/docs/agents/triage-labels.md`. These are seeded from templates that live _inside_ the setup skill's own
   directory (`issue-tracker-github.md`, `issue-tracker-gitlab.md`, `issue-tracker-local.md`,
   `triage-labels.md`, `domain.md`), then hand-edited into the specific repo's answers.

Downstream skills reference this config only as **prose pointers**, never as a machine-parsed schema. E.g.
`code-review/SKILL.md`: _"The issue tracker should have been provided to you. If `docs/agents/issue-tracker.md`
is missing, tell the user to run `/setup-matt-pocock-skills`."_ This is deliberate and load-bearing design, spelled
out in `.agents/adr/0001-explicit-setup-pointer-only-for-hard-dependencies.md`: skills split into
**hard-dependency** (`to-tickets`, `to-spec`, `triage` — they "have to publish to a specific issue tracker or
apply a specific label string," so without the mapping "output is wrong, not just fuzzy," and each carries an
explicit "run `/setup-matt-pocock-skills` if not" one-liner) versus **soft-dependency** (`diagnose`, `tdd`,
`improve-codebase-architecture` — they only reference "the project's domain glossary" and "ADRs in the area
you're touching" in vague prose, and degrade gracefully with no setup at all). The ADR states the reasoning
explicitly: "The split keeps soft-dependency skills token-light and avoids cargo-culting the setup pointer into
places where it isn't load-bearing."

Two structural differences from `devkit.config.json` worth flagging for the ADR-081 comparison:

- **No schema, no validator.** There is no JSON Schema, no `devkit doctor`-equivalent, and — per
  `.out-of-scope/setup-skill-verify-mode.md` — the maintainer has **explicitly declined** to build one: _"A
  second skill (or a `--verify` flag) for checking whether `docs/agents/*.md` artifacts still match the
  seed-template schema would duplicate work the existing setup skill already handles in conversation... run
  `/setup-matt-pocock-skills` and tell it to verify your current setup"_ — i.e. the fix for "config might have
  drifted" is "ask the LLM to re-read and reconcile it conversationally," not a deterministic checksum/diff pass.
  This is a genuinely different bet than devkit's SHA-256 manifest: it trades determinism for zero additional
  surface area, on the theory that the skill doing the config-writing can also do the config-checking, in
  natural language, on demand.
- **Config is scattered prose, not one file.** `devkit.config.json` is one JSON file both packages read.
  mattpocock/skills spreads the equivalent data across up to four files (`/docs/agents/issue-tracker.md`,
  `/docs/agents/domain.md`, `/docs/agents/triage-labels.md`, plus the `## Agent skills` block inside
  `CLAUDE.md`/`AGENTS.md` itself), each human-readable and human-editable prose rather than structured data
  meant for a parser. That fits the project's premise (skills are read and interpreted by an LLM anyway, so
  structured data buys little) but forecloses anything wanting to _programmatically_ read "which issue tracker
  is this repo using" — there's no such consumer in this repo's design.

## 6. Multi-agent/tool compatibility

Deliberately **not** Claude-Code-only, and this is treated as a first-class design axis rather than an
afterthought — the README's install section literally has a "Codex, and other agents" tab alongside the "Claude
Code" tab, and `.agents/invocation.md` exists specifically to reconcile the two harnesses' differing
invocation-control vocabularies (`disable-model-invocation` for Claude, `policy.allow_implicit_invocation` in a
companion YAML for Codex).

The underlying bet: every skill's substance is a `SKILL.md` markdown file with YAML frontmatter, which **any**
agent that reads files from a known path can consume — this is the general "Agent Skills" convention (the same
`SKILL.md` shape Claude Code, Codex, and `skills.sh`'s ten-harness catalog all recognize), not a Claude-specific
format. What differs per-harness is only: (a) how each harness is told a skill is user-invoked-only
(frontmatter key vs. a sibling YAML's policy block), and (b) how each harness's _native distribution_ mechanism
selects a subset of a bucketed repo — which is exactly where the two ecosystems diverge in this repo's design
(§7).

Concretely:

- **Claude Code**: native plugin/marketplace mechanism, `skills` array of explicit paths in `plugin.json`.
  Skill content lives inline in `SKILL.md` frontmatter (`disable-model-invocation`).
- **Codex**: no native plugin _for this repo_ (deferred, see ADR-0002) — reached only through `skills.sh`'s
  generic copy mechanism today. Per-skill Codex UI/policy metadata lives in the sibling `agents/openai.yaml`,
  never inside `SKILL.md` itself, so `SKILL.md` stays harness-neutral prose plus Claude-specific frontmatter that
  Codex presumably just ignores.
- **Everything else** (Cursor, Windsurf, Gemini, Cline, AMP, Antigravity, OpenClaw, GitHub Copilot): reached only
  via `skills.sh`, which this repo did not build and does not control — it's a generic multi-harness catalog
  installer maintained by Vercel that happens to index this repo as one of its entries.

One more harness-neutrality detail worth flagging because it's an explicit, repo-wide writing rule:
`.agents/invocation.md`'s convention for a skill invoking another skill is _"Call the Skill tool with
`"grilling"`"_ — spelling the skill name **without** a leading `/`, deliberately: _"Dropping the leading `/`
also keeps this harness-neutral rather than less: a skill name on its own carries no assumption about which
harness's trigger syntax it belongs to."_ Likewise CHANGELOG's v1.2.2 entry records dropping Claude-Code-specific
tool/agent-type names from cross-skill dispatch instructions in `code-review`, `codebase-design`, and
`improve-codebase-architecture` "so the step is followable on Codex and other harnesses" — i.e. harness-neutral
phrasing is actively maintained, not just an initial design intent that then rotted.

## 7. Notable design choices

- **The plugin-vs-copy split is philosophical, not just technical, and the repo says so out loud.** "Subscribe
  vs. fork" is presented as the actual product decision, with the tradeoff stated plainly to the user rather than
  papered over: a plugin user gets zero editability and automatic (if SHA-pinned) updates; a `skills.sh` user
  gets full editability and manual updates that are really full re-copies. `vite-react-compiler`'s split is a
  different axis entirely (_discovery mechanism_ — path vs. name — rather than _ownership philosophy_), but the
  same "pick one, don't blend" instinct shows up in both: this repo says "installing both leaves you with every
  skill twice," and ADR-081 similarly keeps materialized-skill-content and resolved-gate-code in fully separate
  packages rather than one package straddling both.

- **A curated subset of a bucketed repo cannot be expressed by every plugin manifest format, and this genuinely
  blocked a whole platform.** ADR-0002 is a real, dated engineering postmortem: Claude's `plugin.json` accepts an
  explicit array of skill paths (clean), but Codex's manifest accepts only a **single path string**, so there is
  no way to name two promoted bucket folders (`engineering/` + `productivity/`) while excluding three others
  (`misc/`, `in-progress/`, `deprecated/`) from one path. The two escape hatches they actually tried and rejected
  are worth remembering as a general trap: (1) restructuring the repo so `skills/` held only promoted content —
  rejected as too large a blast radius; (2) a flat directory of **symlinks** into the buckets — rejected because
  "Codex copies the plugin tree into its cache and drops symlinks, so the skills arrive empty" on install. That
  second failure mode (symlink-based curation silently producing empty directories under a _copying_ installer)
  is a sharp, concrete trap worth flagging for any distribution design that considers symlinks as a curation
  shortcut — it works for `/scripts/link-skills.sh`'s live-repo case (nothing ever copies those symlinks
  elsewhere) and fails the moment something else materializes a snapshot of the tree.

- **"Official marketplace" acceptance is itself a second, external distribution layer with its own update
  cadence, and the maintainer verified rather than assumed this.** ADR-0002's "Update, 2026-08-05" section is a
  small model of Non-Negotiable-Rule-14-style claim verification: rather than asserting "the plugin auto-updates,"
  it ran `claude plugins install`, read the actual `source.sha` in the live listing, and reported the observed
  lag ("the pin sits two commits behind main"). The practical implication for anyone comparing to devkit: a
  third-party catalog's pinned SHA is an update-latency variable **outside the source repo's own control** —
  something devkit's own materialize-and-checksum model doesn't have, since devkit consumers pull directly from
  the npm-published package, not through an intermediary catalog with its own sync schedule.

- **The setup/config skill explicitly refuses to grow a verify mode**, on record, as a scope decision rather than
  an oversight (`.out-of-scope/setup-skill-verify-mode.md`). The stated reasoning is that a prompt-driven skill
  can already do "check my current setup against the current templates and report drift" through ordinary
  conversation, so a dedicated deterministic checker would be "duplicate work" and "a second skill drifting from
  the first as templates evolve." This is close to the opposite bet from devkit's SHA-256 manifest + `devkit
doctor`: mattpocock/skills bets that natural-language reconciliation, invoked on demand, is cheaper to maintain
  than a deterministic diff tool would be, for artifacts that are prose anyway. Whether that bet holds depends on
  how much the consumer trusts an LLM's self-report of drift versus a hash comparison — a real, arguable
  tradeoff, not obviously wrong.

- **Model-invoked vs. user-invoked is a first-class, repo-wide axis with real teeth**, not a loose convention.
  The rule ("a user-invoked skill may invoke model-invoked skills, but never another user-invoked one") is
  enforced structurally by each harness's own invocation-blocking mechanism, and CHANGELOG entries show the
  distinction being actively curated over time — e.g. v1.2.0 promoting `to-questionnaire` out of `in-progress/`
  explicitly as **user-invoked**, and a later v1.2.3-era change making `wizard` **model-invoked** specifically so
  the agent can reach for it mid-task "the moment it hits a step only a human can perform, instead of dumping
  numbered instructions into the chat" — with the explicit non-goal stated alongside it: "don't invoke it for
  steps the agent can perform itself." This is a genuinely useful taxonomy question `vite-react-compiler`'s own
  skills (`.github/skills/*`) don't currently seem to draw as an explicit line — the closer analog in this
  repo's language is user-invoked ≈ a skill someone types deliberately (`commit-and-pr`, `epic`) vs. model-invoked
  ≈ one the agent should reach for unprompted when the task shape matches (`store-pattern`,
  `quality-gate-workflow`).

- **The "why" lives in ADRs and a `CHANGELOG.md` with real narrative substance, not just terse Changesets
  one-liners.** Multiple `CHANGELOG.md` entries run several paragraphs, explaining _why_ a change was made (e.g.
  the `wizard` promotion entry above), which is unusual for a changelog and closer to a PR-description style —
  worth noting since `vite-react-compiler`'s own convention (Non-Negotiable Rule 14 / "Verifying a claim") pushes
  narrative into the PR/issue rather than the changelog; this repo instead pushes a good amount of it _into_ the
  changelog itself, apparently on the theory that the changelog is what an installed-plugin user actually reads
  (they have no PR history to consult), while `vite-react-compiler`'s changelog readers can always trace back to
  the PR.

- **Overall philosophy/tone** (useful reference material independent of the distribution question): the README
  frames the project around three named failure modes — misalignment (fixed by "grilling" interview sessions
  before building), agent verbosity from missing shared vocabulary (fixed by a `CONTEXT.md` domain glossary,
  "the single coolest technique in this repo" per the README's own words), and low-quality code from weak
  feedback loops (fixed by red-green-refactor TDD and a disciplined bug-diagnosis loop) — plus a fourth,
  architecture entropy, addressed by a periodic "survey, not a rescue" architecture-improvement skill explicitly
  scoped **not** to promise it can "untangle the mud" on an old codebase by itself. The stated engineering
  lineage is explicit and recurring: Pragmatic Programmer, Domain-Driven Design, Extreme Programming Explained,
  and A Philosophy of Software Design are each quoted directly to ground a specific skill's rationale. Skills are
  described as intentionally "small, easy to adapt, and composable... Hack around with them. Make them your own,"
  which is consistent with the copy-based (`skills.sh`) route being positioned as the primary hacking surface and
  the plugin route as the "just give me the defaults" surface.

## Sources

- Repository: `https://github.com/mattpocock/skills`, shallow-cloned (`--depth 1`) at commit
  `885e2ca4d842d139e9aef4e48d366c63cb1b8013` (2026-08-19T14:09:18+01:00). Files read directly from the clone:
  - `README.md`
  - `CLAUDE.md` / `AGENTS.md` (the latter a symlink to the former)
  - `CONTEXT.md`
  - `CHANGELOG.md` (head, versions 1.2.3 / 1.2.2 / 1.2.0)
  - `package.json`
  - `.claude-plugin/plugin.json`
  - `.claude-plugin/marketplace.json`
  - `.agents/adr/0001-explicit-setup-pointer-only-for-hard-dependencies.md`
  - `.agents/adr/0002-ship-as-a-claude-code-plugin.md`
  - `.agents/invocation.md`
  - `.agents/install-block.md`
  - `.agents/writing-docs.md`
  - `.out-of-scope/mainstream-issue-trackers-only.md`
  - `.out-of-scope/question-limits.md`
  - `.out-of-scope/setup-skill-verify-mode.md`
  - `/scripts/link-skills.sh`
  - `/scripts/list-skills.sh`
  - `/scripts/sync-plugin-version.mjs`
  - `skills/engineering/README.md`
  - `skills/engineering/setup-matt-pocock-skills/SKILL.md` (full)
  - `skills/engineering/tdd/` directory listing + `agents/openai.yaml`
  - `skills/engineering/to-tickets/agents/openai.yaml`
  - `skills/engineering/code-review/SKILL.md` (frontmatter + opening) and directory listing
  - `skills/productivity/grilling/SKILL.md` (opening)
  - `docs/` directory listing (full tree of 24 published docs pages)
  - top-level directory tree (`skills/{engineering,productivity,misc,in-progress,deprecated}`)
- Web sources (fetched/searched 2026-08-20):
  - [code.claude.com/docs/en/plugins](https://code.claude.com/docs/en/plugins) — Claude Code plugin manifest
    schema, `skills/` directory convention, namespacing, official-marketplace registration behavior.
  - [code.claude.com/docs/en/discover-plugins](https://code.claude.com/docs/en/discover-plugins) — official
    marketplace auto-registration and auto-update defaults (via web search summary).
  - [skills.sh — mattpocock/skills catalog page](https://www.skills.sh/mattpocock/skills) — confirms `skills.sh`
    is a Vercel-maintained, multi-harness (Claude Code/Cursor/Codex/Copilot/Windsurf/Gemini/Cline/AMP/Antigravity/
    OpenClaw) generic skill installer, open source at `github.com/vercel-labs/skills`, not built by this repo's
    maintainer.
  - Web search: "skills.sh npx skills add mattpocock agent skills installer" — corroborating summaries of the
    `skills.sh` interactive install flow (pick skills, pick agents, copies editable files).
  - Web search: "Claude Code official plugin marketplace claude-plugins-official anthropics" — corroborating that
    `claude-plugins-official` is registered automatically on first interactive Claude Code launch, confirming
    ADR-0002's claim.
