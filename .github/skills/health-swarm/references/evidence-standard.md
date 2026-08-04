# The evidence standard

Every scout is held to this. It is Non-Negotiable Rule 14 of `AGENTS.md`, plus
the two ways this repo has actually got it wrong.

## 1. A probe must discriminate

Before writing any finding, ask: **what else would produce this same
observation?** If anything would, the probe is not evidence — change the probe.

A green run is not evidence on its own. **A rule that is not loaded reports
exactly the same clean pass as code that is correct.**

**Worked failure (lint).** Someone concluded per-workspace Oxlint configs were
ignored, from a probe using `no-debugger`. That is a `correctness` rule, and a
category severity outranks an individual rule entry — so "the config is ignored"
and "the category masked my rule" produce identical output. The probe could not
separate them, so it proved nothing. A rule _outside_ the category showed the
config applies fine.

**Worked success from the last sweep**, for contrast. Two claims, two probes
that could each have come out the other way:

- `.oxfmtrc.json` is unread → it declares `sortPackageJson: false` while the
  live config declares `true`, so the two make **opposite predictions for one
  input**. Formatting a `package.json` reordered its keys. Exactly one
  explanation survives.
- Four ADR links are broken by a _move_, while 23 other unresolvable references
  are correct-by-design historical paths → a move-broken link **still resolves
  relative to the ADR's old home**; a historical path resolves nowhere. That
  single test sorted 27 candidates into 4 and 23.

## 2. Repro steps carry their preconditions

State the tree/config state the steps assume, and say so explicitly if your own
change alters it.

**Worked failure (docs).** An issue whose steps depended on the root lint config
having no `plugins` entry — while the same PR added one. Everyone who followed
the steps afterwards got the opposite result and reasonably concluded the issue
was false.

Two habits follow: re-run a repro after your own fix lands, and when someone
reports that a claim does not reproduce, look for the confound before either
defending or retracting it — both are conclusions and each needs its own
evidence.

## 3. Read the tool's own documentation first

Vite+'s docs are local at `node_modules/vite-plus/docs`, and likewise for every
other dependency. Experiments are for what the docs do **not** answer.

A whole multi-probe detour was once spent rediscovering behaviour stated plainly
in Vite+'s `guide/monorepo.md`: lint config belongs at the root, per-package
`vite.config.ts` is for Vite/Vitest/framework config.

## 4. Never propose a changing number in a doc or comment

Counts, totals and measurements are true the day they are written and wrong soon
after, and nothing checks them. Name the command that produces the number
instead.

Measurements belong in the **issue or the PR** — dated, immutable, and not
something a later reader mistakes for current fact. **Finding an existing
changing-number-in-a-doc is itself a finding.**

## 5. A negative result is a real result

"I measured three hypotheses and none were real" is a scout doing its job. The
last sweep's most valuable deps finding was _the lockfile is honest under a
clean install_.

Report what you probed and what it showed. Never manufacture findings to fill a
quota, and never file an unmeasured hypothesis as JUDGMENT to get it onto the
board.

## Classification

- **MECHANICAL** — the fix is fully determined by the finding. No design choice,
  no behaviour change, no public-API change, and no second reasonable
  resolution. An existing gate can verify it.
- **JUDGMENT** — needs a design decision, changes behaviour or a public surface,
  needs an ADR, or has more than one reasonable resolution.

**Any change to the public surface of `@lcabrera/ui`, `@lcabrera/api`,
`@lcabrera/server` or `@lcabrera/utils` is JUDGMENT by definition.** They publish
to npm on a version bump, and an npm version is permanent.

Be strict. Do not inflate the MECHANICAL count — a wrong "mechanical" fix is
worse than an unfixed finding, because it lands without a decision.
