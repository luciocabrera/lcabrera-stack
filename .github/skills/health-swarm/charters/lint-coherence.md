# Scout charter — LINT COHERENCE

Rules where Biome, ESLint, Oxlint and Sonar disagree, or silently no-op.

## The governing sentence

**A rule that is not loaded reports exactly the same clean pass as code that is
correct.**

So for every "this silently no-ops" claim, your probe must separate three
alternatives: (a) the rule is not loaded, (b) it is loaded but its finding is
masked or outranked by a category severity, (c) it is loaded and the code is
simply correct. If your probe cannot separate all three, it is not evidence.
`evidence-standard.md` §1 has the worked failure.

Planting a deliberate violation is required here. Do it under `.tmp/`
(gitignored) or a scratch dir, never by modifying a real source file, and leave
the tree clean — verify with `git status --short` and report it.

## The engines

- **Oxlint** — `vp lint .`, configured once in the root `vite.config.ts`.
- **ESLint custom-rules pass** — `vp run -r lint:eslint:check` (the `-r` is
  required from the root). Not covered by `vp check`. Owns `perfectionist`
  import ordering, the react/stylex sets, `local-rules`.
- **Biome** — `vp run lint:biome:check`, root-only and repo-wide. Not covered by
  `vp check`. `biome.jsonc` `overrides` scope the react domain.
- **Sonar** — `vp run sonar:report` / `sonar:verify`. `--since` is mandatory
  when polling, or you analyse a stale run.
- **React Doctor** — `vp run react-doctor:verify`, root-only.

Meta-gates that exist for exactly this charter — run them:
`vp run lint:plugins:verify`, `vp run lint:eslint:verify`,
`vp run suppressions:verify`, `vp run configs:verify`.

## Remedies that are wrong

Read `known-traps.md`: agreeing overlap between engines is fine and must not be
"tidied" away; only conflicting arbitration is banned. Never propose suppressing
or disabling a rule.

Enabling or disabling a plugin is a **decision**, not a chore — see #325 and
#326, which own the `jsx-a11y` and `vitest` questions.

## Prior findings

Handled: the `react` family was configured but never probed —
`lint:plugins:verify` now reports how many of the configured families it proved
live, and fails when one is added with neither a probe nor a written exemption. The dead root configs are
gated by `configs:verify`. `.claude/README.md`'s autofix description is
corrected.

Still open (#517): `biome.jsonc`'s workspace partition is open and ungated —
`packages/api` is in neither list, while the equivalent Oxlint structure _is_
gated, and the comment asserting the partition is closed also hardcodes a count.

Probed, not evidence: whether Oxlint's `import` plugin is decorative. Four
probes drew only `typescript(TS…)` codes, which cannot separate "no import rule
is in an enabled category" from "the probes violated the wrong rules" — which is
why the gate documents `import` as unprobeable.
