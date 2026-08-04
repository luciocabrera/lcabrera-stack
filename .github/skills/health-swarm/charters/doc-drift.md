# Scout charter — DOC DRIFT

ADRs and docs contradicted by current code.

A wrong doc-drift claim is itself doc drift, and a confidently-wrong "fix" is
worse than the drift it replaces.

## Tools, and what they do not cover

Run `vp run docs:verify`, `vp run adr:verify`, `vp run commands:verify`,
`vp run scripts:verify`.

**These passing is not evidence the docs are correct.** They check paths, links,
ADR numbering and command resolution — never whether prose matches behaviour.
Your value is in that gap. State explicitly which findings a gate could have
caught and did not.

Known gap: `IGNORED_DOCS` in `scripts/verify-docs-paths.mjs` matches the bare
fragment `/decisions/` by substring, exempting every ADR in all three homes from
the documented-path gate. That is #515 Finding 0, still open.

## Targets

- ADRs contradicted by code; superseded ADRs still cited as current.
- `packages/ui/src/INVENTORY.md` and `PATTERNS.md` versus what exists.
- `ARCHITECTURE.md` Props tables versus actual props.
- `docs/cqms/STATUS.md`, a living built-vs-spec doc.
- `AGENTS.md` itself.
- Any hardcoded count — those rot by construction and nothing checks them.

## Method

Quote **both sides** with `file:line` — the doc line and the code that
contradicts it. A finding without both is not a finding.

Then decide which side is wrong. If you cannot tell, that is **JUDGMENT** — say
so. The doc may describe intended design the code has not reached; you may be
reading the wrong code path; or the decision may never have been made.

When a documented rule is contradicted **at scale**, the rule is usually what is
wrong — but changing it is a decision, not a doc fix.

Read `known-traps.md` on why a dated record naming deleted code is correct, and
on the `AGENTS.md`/`CLAUDE.md` symlink.

## Prior findings

Handled: four ADR cross-refs re-based after the tier split. The probe that
sorted 4 real from 23 correct-by-design is in `evidence-standard.md` §1 — reuse
it.

Still open (#515): the `/decisions/` gate exemption (Finding 0, JUDGMENT); the
`packages/ui/.gitignore` comment; `docs/README.md`'s "two namespaces" versus
"three homes" plus a hardcoded count; `scan-ingestion/ARCHITECTURE.md`'s deleted
flow; `PATTERNS.md` examples that cannot compile; UI `INVENTORY.md` listing
absent artifacts; CQMS `STATUS.md` self-contradiction; `Form/ARCHITECTURE.md`
citing a deleted field type; and two UNCLEAR ones — `eslint-local-rules-shared`
being in neither documented scope, and three `PATTERNS.md` rules violated at
scale.
