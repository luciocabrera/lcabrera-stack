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

Closed gap, worth knowing because it shapes what is left to find: ADRs used to
be exempted from the documented-path gate wholesale by an `IGNORED_DOCS`
substring. They are now filtered per **token** — a path an ADR _names_ stays
exempt (it is a dated record: the ADR documenting a package rename necessarily
names the path it renamed away from, and that stays true after the path is
gone), while a relative link it asks you to _follow_ is enforced. So a dead ADR
link is now a gate failure rather than something for a scout to find.

## Targets

- ADRs contradicted by code; superseded ADRs still cited as current.
- `packages/ui/src/INVENTORY.md` and `PATTERNS.md` versus what exists.
- `ARCHITECTURE.md` Props tables versus actual props.
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

Handled: the ADR cross-refs re-based after the tier split, and the gate change
above that stops the next move doing it again. The probe that sorted the real
breakage from the correct-by-design historical paths is in
`evidence-standard.md` §1 — reuse it. Also corrected: the
`packages/ui/.gitignore` comment, `docs/README.md`'s "two namespaces" versus
"three homes" plus a hardcoded count, `PATTERNS.md` examples that could not
compile, UI `INVENTORY.md`'s absent artifacts, and `Form/ARCHITECTURE.md`
citing a field type whose code was deleted.

Still open (#515), needing a decision rather than an edit: three `PATTERNS.md`
rules are violated at scale, which usually means the rule is what is wrong.

The scope finding from the same sweep — a package in neither documented scope —
shows what "needs a decision" buys you. The answer was not a doc edit: the
package was genuinely publishable, so it became `@lcabrera/eslint-plugin` and the
naming rule it appeared to break turned out to be describing it correctly all
along.
