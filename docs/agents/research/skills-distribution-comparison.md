# Skill/plugin distribution — comparison and gap analysis

Synthesizes the three prior research write-ups against this repo's own accepted
design (ADR-081: `@lcabrera/devkit` + `@lcabrera/repo-standards`) to inform
issues #797–#801, the epic (#716) that implements the ADR. Written from the
three research docs, ADR-081, `packages/devkit/CLASSIFICATION.md`, the issue
bodies, and a direct read of `packages/devkit/` and `packages/repo-standards/`
as they stand today (2026-08-20): both packages exist and are `private: true`;
`devkit sync`/`doctor`/`closure` are implemented with a six-state manifest
(richer than the ADR's three-state description — see §Gap analysis); most of
the gate families named in #798 have already been extracted into
`packages/repo-standards/scripts/`; no CI wiring for `devkit doctor --check`
exists yet (#801); `devkit init` and npm publication do not exist yet (#800).
The comparison below is therefore partly against a moving target — implementation
state is called out explicitly wherever it changes the verdict.

> **Status as of 2026-08-20, added in review.** The body below is a dated record
> and is kept as written — it was accurate against ADR-081 as it stood when the
> research ran (`54df8c2d`, #795). It was then acted on while PR #833 was still
> open, so **read §Gap analysis and §Opportunities against this table, not as
> open work.** Each row names a merged PR you can open to check it.
>
> | Item                                                                              | Where it landed                                                                                                                                                                                        |
> | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
> | **Gap 1 / Opportunity 1** — no recorded verdict on the editor-native plugin route | **Closed** by [#839](https://github.com/luciocabrera/vite-react-compiler/pull/839): ADR-081 gained option 5, deferring rather than declining it, on the Copilot/Gemini reasoning this doc predicted.   |
> | **Gap 2 / Opportunity 2** — no hard/soft split for parameterised skills           | **Closed** by [#840](https://github.com/luciocabrera/vite-react-compiler/pull/840): a `requires:` frontmatter key declares the config a file cannot run without, and `sync` refuses to write it unmet. |
> | **Gap 3 / Opportunity 3** — the peer check fires only at sync time                | **Closed** by [#845](https://github.com/luciocabrera/vite-react-compiler/pull/845): a `peer:` range is resolved once per run, so `sync` and `doctor` cannot disagree about what is installed.          |
> | **Opportunity 4** — reject transcript-mined personalisation for now               | **Closed** by [#839](https://github.com/luciocabrera/vite-react-compiler/pull/839): recorded under ADR-081 §Alternatives considered, with the `devkit`-subcommand-not-a-package framing.               |
> | **Opportunity 5** — reject bundling prose and runtime into one unit               | **Closed** by [#839](https://github.com/luciocabrera/vite-react-compiler/pull/839): recorded under ADR-081 §Alternatives considered, on the `0.0.0`-forever argument this doc supplied.                |
> | **Opportunity 6** — leave the scan-report-bound skills where they are             | Unchanged, and still the standing position.                                                                                                                                                            |
>
> Of §Open questions, **Q2** ("should the hard/soft split become a schema field")
> was answered by #840 in the affirmative — it became declared frontmatter, not
> prose. Q1 and Q3 stand as written. Q4 (is perpetual drift-reporting the right
> steady state) is the subject of `doctor --accept`, in flight under #797.

## Comparison table

| Dimension                                      | vite-react-compiler (devkit + repo-standards)                                                                                                                                                                                                                                                                                                                                                                           | pstack (Cursor plugin)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | orchestrate (Cursor plugin)                                                                                                                                                                                                                                                                                                                                                                                       | mattpocock/skills                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Distribution mechanism**                     | Split by package: `devkit` **materialises** (copies) skills/rules/agent-defs into the consumer tree; `repo-standards` is **resolved from node_modules** and invoked as bins. Two mechanisms, one per package, by design.                                                                                                                                                                                                | **Subscribe-managed-plugin** — Cursor's native `/add-plugin` reads a git-hosted marketplace repo and materialises files onto disk (`~/.cursor/plugins/...`), but the materialisation is Cursor's own, undocumented mechanism, not pstack's.                                                                                                                                                                                                                                                                          | Same **subscribe-managed-plugin** mechanism as pstack (Cursor marketplace/`/add-plugin`), but the CLI code ships _inside_ the same plugin directory rather than being split out — everything, prose and code, travels and installs as one unit.                                                                                                                                                                   | Dual, and deliberately mutually exclusive: Route A is **subscribe-managed-plugin** (Claude Code's native plugin marketplace, read-only, resolved from a plugin cache); Route B (`skills.sh`) is a **copy-tool** — a third-party CLI that materialises editable files into the consumer's project.                                                                                                                                                                                                                                                                                                                                                        |
| **Versioning & update path**                   | `repo-standards`: ordinary semver, resolved as a normal npm dependency; `devkit`: package version stamped into `.devkit-manifest.json`, checked against a declared peer range at sync time (per ADR-081 Consequences), so `sync` refuses to materialise a skill whose peer is out of range.                                                                                                                             | Bare `version` string in `plugin.json`, no changelog, no changeset tooling. CI only schema-validates manifests, never checks a version bump happened. Update = re-running `/add-plugin` or a team marketplace's auto-refresh; docs never state whether that is a merge or a fresh overwrite.                                                                                                                                                                                                                         | Bare `version` string, no changelog required (one sibling plugin has one, `orchestrate` doesn't), no version-bump CI check. Update = whole-plugin marketplace refresh (webhook, ≤ every 10 min, or manual), i.e. whole-directory replacement, not incremental.                                                                                                                                                    | Changesets (same tool family as this repo), with `/scripts/sync-plugin-version.mjs --check` keeping `plugin.json`'s version in lockstep with `package.json`'s because "Claude uses the plugin `version` to decide when installed users see an update." Route A's update is a **pinned-SHA pull** through Anthropic's official marketplace catalog — verified by the maintainer to lag `main` by two commits at time of writing. Route B is an explicit re-copy (`npx skills update`).                                                                                                                                                                    |
| **Drift / local-edit detection**               | First-party, in-repo: SHA-256 per materialised file in `.devkit-manifest.json`, classified into six states on every `sync` (`added`/`restored`/`updated`/`current`/`modified`/`conflict`) — a local edit is **kept and reported**, never silently overwritten; `conflict` even detects an unrelated file already occupying the target path. `devkit doctor --check` is meant to gate CI on drift (not yet wired, #801). | **None.** No manifest, no per-file identity recorded at install, nothing in Cursor's docs addressing local-edit survival. A re-materialisation is, as far as any source states, whole-file replacement.                                                                                                                                                                                                                                                                                                              | **None.** Cursor's docs are silent on what happens to a local edit on marketplace refresh; the honest read (per the research) is "at risk of silent overwrite."                                                                                                                                                                                                                                                   | **None as a first-party mechanism.** Route A is read-only by construction, so there is nothing to drift. Route B delegates the question entirely to the third-party `skills.sh` CLI (unverified whether it hash-compares). The maintainer explicitly **declined** to build a verify/diff mode (`.out-of-scope/setup-skill-verify-mode.md`), betting that conversational reconciliation ("ask the LLM to check my setup against the templates") is cheaper than a deterministic checker.                                                                                                                                                                  |
| **Per-consumer configuration mechanism**       | `devkit.config.json` — one schema-shaped JSON file, `paths` + `commands` blocks, `{{commands.*}}` placeholder substitution; a file whose placeholders can't all be answered is **not written** rather than materialised with a dangling token.                                                                                                                                                                          | None repo-scoped. The only per-consumer surface is `/setup-pstack`, which writes one **user-global** file (`~/.cursor/rules/pstack-models.mdc`) mapping abstract roles to model slugs — an override layer, not a requirement, and not per-repo.                                                                                                                                                                                                                                                                      | No static config file. Secrets are plain env vars; repo facts (Slack channel, base branch, repo URL) are captured into a **runtime-generated** `plan.json` the first time a root planner runs, not hand-authored ahead of time.                                                                                                                                                                                   | A **conversational wizard** (`setup-matt-pocock-skills`, user-invoked, `disable-model-invocation: true`) explores the repo, asks only what branches, and writes the answer as scattered prose files (`/docs/agents/issue-tracker.md`, `domain.md`, `triage-labels.md`, plus a block in `CLAUDE.md`/`AGENTS.md`) — no schema, no validator, human-readable prose rather than structured data.                                                                                                                                                                                                                                                             |
| **Multi-agent / tool portability**             | Materialised output is plain Markdown/JSON at conventional paths (`.github/skills`, `.claude/rules`) — the same convention this repo already uses so Copilot/Gemini can read files directly (`.claude/skills` symlinks to `.github/skills`); `repo-standards` bins are plain Node CLIs, agent-agnostic by construction.                                                                                                 | **Not portable.** Deeply Cursor-coupled: Cursor-specific tool names (`AskQuestion`, `Task`/`subagent_type: generalPurpose`), Cursor model slugs baked into defaults, undeclared dependencies on Cursor built-ins (`/loop`, `create-skill`, `/babysit`). A third party had to build and maintain a **separate, parallel repo** (`pstack-claude`) with a systematic primitive-substitution table to reach Claude Code, and lost real capability (multi-vendor model diversity collapsed to single-vendor) in the port. | **Not portable beyond the prose layer.** The orchestration substrate is the Cursor cloud-agent SDK (`@cursor/sdk`) — no Claude Code, Copilot, or Gemini equivalent exists. `SKILL.md`'s frontmatter shape is plausibly portable; the moment a planner needs to _act_, it's Cursor-only.                                                                                                                           | **First-class, explicit design axis.** `SKILL.md` is harness-neutral by convention; a sibling `agents/openai.yaml` per skill carries Codex-specific UI/policy metadata so `SKILL.md` never needs harness-specific fields; a repo-wide writing rule mandates harness-neutral phrasing in cross-skill dispatch (no leading `/`, no Claude-Code-specific tool names) and CHANGELOG entries show this being actively maintained, not just declared once. Reaches Claude Code natively; Codex is metadata-ready but its own plugin is deferred (ADR-0002), so it arrives through the third-party `skills.sh` like the other nine in that ten-harness catalog. |
| **Model-invoked vs. user-invoked distinction** | Not drawn as an explicit, documented axis anywhere in ADR-081 or `CLASSIFICATION.md`; this repo's own skill index (root `AGENTS.md`) implies the split informally ("Finishing any code change? Run `quality-gate-workflow`" vs. "`/epic <n>`") but doesn't name or enforce it.                                                                                                                                          | Present per-skill via the same Claude-style `disable-model-invocation: true` frontmatter, but not elevated to a documented, repo-wide taxonomy or rule.                                                                                                                                                                                                                                                                                                                                                              | Present (same frontmatter key on the one `orchestrate` skill) but there's only one skill, so it isn't a taxonomy question here.                                                                                                                                                                                                                                                                                   | **First-class and enforced**, across two harnesses at once: `disable-model-invocation` (Claude) kept in lockstep with `policy.allow_implicit_invocation: false` (Codex, sibling YAML) by an explicit rule ("a skill is user-invoked in both harnesses or neither"); a written rule governs cross-invocation ("user-invoked may call model-invoked, never another user-invoked"); CHANGELOG shows deliberate promotions between the two categories over time, with stated reasoning.                                                                                                                                                                      |
| **Dependency declaration between skills**      | `devkit closure` — a mechanical instrument that resolves every markdown link and shelled command per skill directory and reports what escapes it; a shipped file may reference only an in-package file, a declared peer's bin, or a config key. Used to produce `CLASSIFICATION.md`'s verdicts; not yet CI-gated (#801).                                                                                                | Prose-only. `poteto-mode` inlines a duplicate index of its 20 `principle-*` skills (drift risk against the leaf skills, traded for guaranteed discoverability); a plugin-to-plugin dependency (`cursor-team-kit`) is stated only in README prose, with no manifest field for it.                                                                                                                                                                                                                                     | Prose-only and **structurally undeclared**: `orchestrate` requires `cursor-sdk`'s content in three places via prose hyperlink, but `plugin.schema.json` has **no `dependencies`/`requires` field at all** — installing `orchestrate` alone pulls nothing of `cursor-sdk` automatically, and nothing but a human reading the prose catches a consumer who skips it.                                                | A deliberate, documented **hard-dependency vs. soft-dependency** taxonomy (ADR-0001), not a manifest field: hard-dependency skills (`to-tickets`, `to-spec`, `triage`) carry an explicit "run `/setup-matt-pocock-skills` if not configured" prose pointer because they produce _wrong_ output without the mapping; soft-dependency skills (`diagnose`, `tdd`) deliberately carry no such pointer and degrade gracefully, to stay token-light.                                                                                                                                                                                                           |
| **Packaging unit (prose vs. prose+code)**      | Split **by design**, and it is the entire reason for the two-package shape: `devkit` ships prose + seed templates only (materialised, no runtime logic executes from inside the consumer's copy); `repo-standards` ships code only (bins), resolved, never copied. Option 4 in ADR-081 ("one package that both materialises and exposes bins") was explicitly considered and rejected on semver-conflation grounds.     | Prose + one small subagent-definition file. The one CI-adjacent script (`validate-plugins.mjs`) lives at the **marketplace-repo** level, not per-plugin, and is run via an ad hoc `npm install --no-save ajv ajv-formats` in the consuming repo's own CI — no split discipline between prose and code at all.                                                                                                                                                                                                        | **Bundled as one unit, deliberately.** A full `bun`/TypeScript project (CLI, 28 test files, zod-derived JSON schemas, Slack adapter) ships inside the same directory as the `SKILL.md` and prompt templates. `orchestrate/skills/orchestrate/scripts/package.json` is `private: true`, `version: "0.0.0"`, never published — correctness rides entirely on "whichever copy of the plugin directory is installed." | Overwhelmingly prose (35 `SKILL.md` files + reference docs); minor scaffolding code (`sync-plugin-version.mjs`, `link-skills.sh`, `list-skills.sh`). **Nothing analogous to `repo-standards` exists** — there is no versioned, resolved gate runtime in this project at all.                                                                                                                                                                                                                                                                                                                                                                             |

## Gap analysis

Where ADR-081 is genuinely thinner than what the three projects do — and, per
the brief, where it is already stronger, stated honestly rather than manufactured:

**Real gaps**

1. **No documented reasoning for rejecting the editor-native plugin route.**
   Three of the four projects compared here — pstack, orchestrate, and
   mattpocock/skills' Route A — distribute primarily through their host
   editor's own native plugin/marketplace mechanism (Cursor's `/add-plugin`,
   Claude Code's plugin marketplace). ADR-081's "Options considered" section
   lists four alternatives (template repo, git submodule, one-package-resolved,
   one-package-both) and never mentions this one, even though it is the single
   most common answer among the researched precedents to the exact discovery
   problem devkit is solving. There is a strong candidate reason — this repo's
   own stated requirement that Copilot and Gemini, which have no skill
   mechanism at all, must be able to read the materialised files directly,
   which a Claude-Code-specific plugin cache cannot satisfy as the _primary_
   path — but ADR-081 never states it. `packages/devkit/CLASSIFICATION.md`,
   which ADR-081 governs, is what sets the bar ADR-081 fails here: "a later
   reader must be able to tell 'considered and kept back' from 'not looked
   at'". Right now a reader cannot tell the two apart for this specific
   alternative.

2. **No hard-dependency/soft-dependency classification for parameterised
   skills.** mattpocock/skills' ADR-0001 draws a line CLASSIFICATION.md does
   not: which config keys are _load-bearing_ (skill output is wrong, not just
   generic, without them) versus which are cosmetic. Every devkit
   "parameterise" verdict is currently treated uniformly — `sync`'s
   all-or-nothing rule ("a file whose placeholders cannot all be answered is
   not written") is a coarser instrument than mattpocock's per-skill
   graceful-degradation split, and CLASSIFICATION.md's reasons don't record
   which escapes are hard requirements versus soft references the way
   mattpocock's per-skill setup-pointer convention does.

3. **A residual skew risk the ADR names but only partially closes.** ADR-081's
   own Consequences section states: "A consumer can upgrade `repo-standards`
   without re-running `sync`." The only guard is a **sync-time** peer-range
   check (`sync` refuses to materialise a skill against an out-of-range peer),
   which protects a fresh sync but does nothing for a consumer who bumps
   `repo-standards` afterward and never re-syncs — there is no runtime,
   bin-side check. This is the exact failure orchestrate sidesteps by bundling
   code and prose into one unit (at the cost, which orchestrate's own research
   records, of never getting real `node_modules` resolution or an independent
   version for the code half) — a real, citable trade-off ADR-081 accepted
   without a closing mechanism, not an oversight to silently drop.

**Not gaps — already covered as well as or better than the precedents**

- **Drift detection.** Devkit's six-state, SHA-256 manifest (`added`,
  `restored`, `updated`, `current`, `modified`, `conflict`) is materially more
  rigorous than anything in pstack or orchestrate (neither has any concept of
  it) and is a different, more deterministic bet than mattpocock/skills'
  explicitly-declined verify mode. It is also the only one of the four that
  detects an _unrelated_ file already occupying a target path (`conflict`) —
  none of the three research docs describe an equivalent.
- **Dependency resolution between skills.** `devkit closure` is a mechanical
  instrument (resolves links and shelled commands, reports escapes) where all
  three comparators rely on prose alone — orchestrate's `cursor-sdk` coupling
  is caught by nothing but a human reading a hyperlink, and pstack's
  `poteto-mode` index is a hand-maintained duplicate that can silently drift
  from the skills it lists.
- **Update-latency exposure.** Because devkit consumers pull directly from the
  npm registry rather than through an intermediary catalog, there is no
  analogue to mattpocock/skills' verified pinned-SHA lag (the official
  marketplace catalog sat two commits behind `main` at the time its maintainer
  checked) or Cursor's undocumented team-marketplace refresh cadence. This
  isn't devkit doing something extra — it's a class of problem the mechanism
  doesn't have.
- **Curated-subset selection.** mattpocock/skills' ADR-0002 records a genuine
  engineering trap: Codex's plugin manifest accepts only a single path string,
  so a bucketed repo (promoted vs. `misc`/`in-progress`/`deprecated`) could not
  name two folders while excluding three, and a symlink-based workaround failed
  because Codex's installer copies the plugin tree and **drops symlinks on
  copy**. Devkit's `--profile` mechanism does its own file walk rather than
  going through any third-party plugin-manifest schema, and its manifest
  records real file hashes (meaningless for a symlink), so it is structurally
  unlikely to hit either trap — worth naming as a place the design is already
  ahead, not merely untested against it.

## Opportunities

Two standing constraints, per the task brief, apply to every item below: (a)
this repo's owner considers there to be too many packages already, so any
opportunity implying a **third** npm name must be flagged as such and weighed
against folding into `devkit` or `repo-standards` instead; (b) nothing
CQMS-specific (the `@repo/scan-report`-dependent "blocked" skill group) may be
smuggled into a "generic" recommendation — the scan skills stay `@repo/*` and
private until a real second consumer asks, per ADR-081's own stated restraint,
and that restraint should hold here too.

1. **Add the missing ADR-081 alternative (Gap 1) — no new package.** Document,
   in ADR-081's "Options considered" (or a short addendum), why a Claude
   Code-native plugin manifest was not chosen as the primary mechanism —
   almost certainly the Copilot/Gemini path-discovery requirement. This is a
   documentation fix, not a build. A **follow-on, optional** idea — shipping an
   _additional_ `.claude-plugin/plugin.json` alongside devkit's existing
   materialised output, giving Claude Code users a zero-edit read-only route on
   top of the default materialise-and-track one — would not need a third
   package (it could ship from inside `devkit` itself, or even from this
   repo's own tree) but should wait for a real request: ADR-081 already
   modeled the right discipline for this exact situation when it declined to
   publish `@lcabrera/scan-report` ahead of a second consumer, and the same
   reasoning applies here.

2. **Adopt mattpocock's hard/soft-dependency split into `CLASSIFICATION.md`
   (Gap 2) — no new package.** For each "parameterise" verdict, record whether
   its config-key escapes are load-bearing or cosmetic, and for the
   load-bearing ones, require the skill's own prose to carry an explicit
   "config missing → run `devkit doctor`" pointer, mirroring mattpocock's
   per-skill setup pointer. This is a `CLASSIFICATION.md` and skill-content
   change inside the existing `devkit` package — exactly the kind of capability
   need that should fold into an existing package rather than motivate a new
   one.

3. **Close the sync-time-only peer check (Gap 3) by extending `devkit doctor`
   — no new package.** Since `doctor` already resolves `repo-standards` as a
   declared peer to check ranges at sync time, extend the same check to run at
   `doctor` time too (shell each installed `repo-standards` bin for its own
   version and cross-check against the range the materialised skills declare),
   rather than only gating at the one moment `sync` runs. This closes the skew
   window ADR-081's Consequences section already names as a residual risk,
   using machinery the two packages already have.

4. **Explicitly reject pstack's `automate-me` personalization-skill idea for
   now, with a reason on record.** `automate-me` mines a user's own transcripts
   and drafts a bespoke routing skill layered over the shared base — a live
   counterpart to devkit's `--profile` flag, done generatively rather than by
   fixed selection. Nothing in the current adoption plan (#800's single second
   consumer, the car-sales API scaffold) asks for this, and building it now
   would be speculative scope on an epic whose stated acceptance criteria are
   already large. Reject explicitly rather than silently never getting to it;
   if a future consumer wants personalization beyond `agent`/`full`, it is a
   `devkit` subcommand, not a new package.

5. **Reject orchestrate's bundle-everything-into-one-unit shape, with the
   reason already on record.** ADR-081's Option 4 already rejected this for
   devkit/repo-standards on semver-conflation grounds, and orchestrate's own
   research shows the cost of that choice in practice: its CLI never gets real
   `node_modules` resolution, stays permanently at `version: "0.0.0"`, and
   correctness rides entirely on "whichever copy of the plugin directory
   happens to be installed." Worth stating in the ADR (or a note near it)
   as a considered-and-correctly-rejected precedent now that a concrete example
   of the failure mode exists, rather than leaving the rejection as an abstract
   semver argument.

6. **Do not fold the CQMS-shaped scan skills into either package under cover
   of these opportunities.** None of the above imply moving `linter-checker`,
   `fallow-code-checker`, `code-smell-checker`, `code-smell-zen`,
   `code-smell-shared`, or `app-graph` out of "blocked." That decision is
   already correctly deferred in ADR-081 to a real second consumer asking for
   scans, and stays deferred here.

## Open questions

1. **Does the SHA-256 checksum manifest earn its complexity, or is it
   over-engineering relative to mattpocock's bet?** Devkit's manifest mechanism
   is real, maintained code (`closure.mjs`, `manifest.mjs`, `sync.mjs`, and
   their tests — roughly a dozen files) built and run before a single external
   consumer exists. mattpocock/skills explicitly declined to build the
   equivalent, judging that a prompt-driven skill re-reading its own templates
   conversationally is cheaper to maintain than a deterministic diff tool, for
   content that is prose anyway. Devkit's content includes non-prose seeds too
   (workflow YAML, hook scripts) where a hash diff plausibly earns its keep in
   a way pure prose might not — but the research doesn't settle whether that
   distinction is enough to justify the heavier mechanism for the skill/rule
   half specifically. A human should decide whether to keep the manifest
   uniform across all materialised content or split it the way the content
   itself already splits (code-shaped seeds vs. prose skills).

2. **Should the hard/soft-dependency split (Opportunity 2) become a schema
   field, or stay prose-only like mattpocock's own ADR-0001?** mattpocock never
   formalised it as manifest data — it lives only as a documented convention
   plus a per-skill prose pointer. Devkit already has more machine-checkable
   structure than mattpocock/skills does (the closure gate, the manifest); it's
   not obvious whether load-bearing-vs-cosmetic config keys should get the same
   treatment or stay judgment calls recorded in `CLASSIFICATION.md`'s prose.

3. **Is the two-package split durable as #798/#799 finish moving more material
   over?** #799 puts git hook seeds under `devkit` (materialised, because git
   discovers hooks by path) while the checks those hooks run live in
   `repo-standards` (resolved). That mirrors orchestrate's own
   `bun install`-on-first-use pattern in spirit (code that installs itself once
   landed) but the research doesn't answer whether a hook-seed-calls-a-resolved-bin
   split is the right shape long-term, versus, say, `repo-standards` owning its
   own hook installation (Husky-style) the way orchestrate's CLI owns its own
   `bun install` step.

4. **Is `devkit doctor` reporting the same divergence on every run indefinitely
   the right steady state?** ADR-081 states this directly as a consequence
   ("`doctor` will report divergence forever... That is the design, not a
   defect to suppress") without weighing whether a perpetually-yellow status is
   a healthy signal a consumer will keep reading, or alert fatigue that gets
   ignored the same way a long-standing warning usually does. None of the three
   researched projects have an equivalent steady-state signal to compare
   against — pstack and orchestrate have no drift detection at all, and
   mattpocock's routes either can't drift (Route A) or delegate the question
   entirely (Route B) — so there's no precedent to check this against either
   way.

## Sources

- `docs/agents/research/skills-distribution-pstack.md`
- `docs/agents/research/skills-distribution-orchestrate.md`
- `docs/agents/research/skills-distribution-mattpocock-skills.md`
- `docs/decisions/ADR-081-ship-the-repo-setup-as-two-packages.md`
- `packages/devkit/CLASSIFICATION.md`, `packages/devkit/README.md`
- GitHub issues #716, #797, #798, #799, #800, #801 (`gh issue view`)
- Direct listing of `packages/devkit/` and `packages/repo-standards/` (current
  implementation state, 2026-08-20) — to distinguish what ADR-081 decided from
  what #797–#801 have built so far.
