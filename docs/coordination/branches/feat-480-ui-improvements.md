---
branch: feat/480-ui-improvements
base: main
target: main
integrator: agent:claude
status: active
updated: 2026-08-01
---

## What

Two agents are fixing presentation-layer defects that land on the same rendered
surface — the enterprise-orders Form inside a Modal. The layout work (scroll
ownership, gutters, footer chrome) and the field/select work (VirtualSelect
placement, numeric alignment, currency adornment) are separately authored but
visually interdependent: reviewing either in isolation means judging a screen
that is still half-fixed, and isolating them would mean cross-merging unfinished
layout changes. One branch, one review, one issue (#480).

Both agents work in the **same clone**, so the branch is shared by construction —
`git checkout` moves `HEAD` for everyone in it.

## Within-branch protocol

- Each participant owns a distinct `area` (see their task file). Coordinate before
  touching a file outside yours.
- **Pull/rebase before every push; push small and often.** A shared branch only
  works if everyone stays close to its head.
- The **integrator** owns rebasing onto `base` and the final merge to `target`.
- `packages/ui/src/components/Form/ARCHITECTURE.md` is the one file both agents
  edit (different sections). Whoever commits second should `git add -p` or
  re-read it first rather than assuming their copy is whole.

## Sub-area map

- `agent:claude` → `packages/ui/src/components/Modal/**`,
  `packages/ui/src/components/Form/{FormBody,FormFields,FormFooter}/**`,
  `apps/react-router/src/routes/enterprise-orders/OrderFormModal/**` —
  modal/form layout: pinned footer, single scroll owner, gutter reservation,
  the `bodyStylex` consumer override.
- `agent:second` → `packages/ui/src/components/VirtualSelect/**`,
  `packages/ui/src/components/Form/fields/**`,
  `packages/ui/src/components/AppDotted/**` — dropdown placement, numeric field
  alignment, currency adornment, dotted-surface tweak.
