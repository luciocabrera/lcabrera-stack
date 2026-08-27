---
id: my-requirement-slug
lines:
  - application
persona: application-developer
state: unmet
packages:
  - ui
requires: []
issues: []
evidence:
  - type: code
    ref: packages/ui/src/public-api.ts
---

<!--
Copy this file to `<id>.md` (id must equal the filename slug) and fill it in.
Adding a requirement changes exactly one file — there is no index to update, in
this directory or above it. The rules below are stated in full in
../README.md; this comment is the short form, and README.md wins if they differ.

Frontmatter:
  id        kebab-case, equal to the filename slug, unique in this directory
  lines     one or more of: application | toolchain   (see ../VISION.md)
  persona   application-developer | repository-maintainer | data-user — exactly ONE.
            A requirement may be owed by both lines; it is still written in one
            voice, so pick the persona it fails hardest for.
  state     met | unmet. DECLARED, not derived, and flipped in the same commit as
            the change that makes it true. There is no third value: a percentage,
            a score or an "as of" date is a measurement, and a measurement in a
            tracked file is wrong from the next commit onward. A requirement
            declaring `met` carries at least one `command` pointer that CI runs
            AND that could fail — break the property on purpose and watch the
            pointer fail before you write `met`.
  packages  workspace DIRECTORY names — ui, server, node-runtime, repo-standards —
            not npm package names. The roster comes from pnpm-workspace.yaml.
  requires  ids of requirements this one leans on. A cycle is a malformed register.
  issues    backlog items that move it, by number. Empty when nothing is outstanding.
  evidence  typed pointers to where the answer lives — NOT a proof that it is met.
            type: code | test | command | doc
            ref:  a repo-relative path, or a `vp run …` command for type: command

Body: an H1 title, `## Statement`, `## Acceptance`. `## Notes` is optional.
  Statement   the requirement in the persona's vocabulary. Survives a redesign.
  Acceptance  conditions that are decidable, each naming what decides it. These
              are rewritten when the design moves. No checkboxes — `state` is the
              one declaration, and a box beside it is a second one that drifts.
-->

# One line: what the persona can do, not how it is built

## Statement

Two to four sentences in the persona's own vocabulary. Say what they are trying
to do and what they get. Avoid package names here where the persona would not
use one; the acceptance criteria below are where names belong.

## Acceptance

- A condition someone else can decide without asking the author, naming the
  command, the export or the path that decides it.
- Another one. Keep them few and keep them sharp: a criterion nobody can settle
  is the thing that makes a register unusable.

## Notes

Optional. What a reader needs that neither section above can carry — a
constraint, a trap, or why the obvious-looking route is not the one. Delete the
heading if there is nothing to say.
