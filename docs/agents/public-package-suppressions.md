# Suppressions in the public packages

`packages/ui`, `packages/api`, `packages/server` and `packages/utils` ship to
consumers outside this repo. AGENTS.md §4 holds them to a single rule: **every
finding gets fixed — never baselined, never scoped off, never inline-disabled.**

This page is how that rule is checked, and what to do when you think you have
found the exception it allows.

## Why a gate was needed at all

The rule was real for exactly one of the six ways to silence a finding.

Each of those packages gitignores its `eslint-suppressions.json`. CI checks out
no file, so there is nothing to suppress _with_ — the guarantee is structural,
not a check that has to run. That is why it has never failed.

Nothing covered the other five. A `// NOSONAR`, an `@ts-expect-error`, an
`oxlint-disable-next-line`, a fallow baseline key, or a `biome.jsonc` override
were all just text nobody counted. When #308 first counted them, `packages/ui`
held **17 inline directives and 6 Biome rules turned off against its own files**
— while §4 said, in as many words, that it held none.

Most of those are defensible. That was never the problem. The problem was that
nothing distinguished a reviewed exception from one added last Tuesday, and a
rule nobody can comply with gets ignored wholesale.

## What is checked

`vp run suppressions:verify` (`scripts/verify-suppressions.mjs`, a CI step in
`check-safe.yml`) scans the public packages for:

| Mechanism      | Detected as                                       |
| -------------- | ------------------------------------------------- |
| ESLint         | `eslint-disable`, `eslint-disable-next-line`      |
| Oxlint         | `oxlint-disable`, `oxlint-disable-next-line`      |
| Biome — inline | `biome-ignore`, `biome-ignore-all`                |
| Biome — config | a rule set to `"off"` in a `biome.jsonc` override |
| Sonar          | `NOSONAR`                                         |
| TypeScript     | `@ts-expect-error`, `@ts-ignore`, `@ts-nocheck`   |
| fallow         | a baseline key naming a file in a public package  |

Each finding is diffed against `public-package-suppressions.json`. The gate
fails on four conditions:

- **unapproved** — a suppression with no register entry. The main gate.
- **grew** — more occurrences of an approved key than were agreed.
- **stale** — a register entry matching nothing in the tree.
- **undocumented** — an entry with no real reason or no reference.

`stale` is the half that keeps this from becoming the baselines it replaces. An
approval that outlives the code it justified silently pre-authorises whatever
next occupies that key, and nothing would ever say so.

`vp run suppressions:list` prints everything found, approved or not.

## Targeted vs repo-wide

A Biome override is classified by **what its glob actually resolves to**, not by
how broad it looks:

- **targeted** — every matched file is inside a public package, so the rule is
  off _because of_ that package. Gated here. `**/logger.util.ts` reads like a
  category pattern but resolves to one `packages/ui` file, so it is targeted.
- **repo-wide** — the glob also matches files outside them (`**/*.test.ts`,
  `**/*.mjs`). That is a whole-category policy a public package merely falls
  inside; it belongs to [ADR-035 §7](../cqms/decisions/ADR-035-biome-third-linter.md)
  and is reported but not gated. Registering those would misattribute a repo
  decision to `packages/ui` and bury the entries that genuinely are about it.

The boundary is honest rather than airtight: a glob broad enough to catch a
public package _and_ something else escapes this gate. That is a repo-wide
config change visible in `biome.jsonc`, not a quiet per-package exemption.

## Adding an exception

Adding an entry is not paperwork for a decision already made — **it is the
decision**, and it needs a reviewer who agrees.

Before you write one, the finding must fail all three of these:

1. **Can the code change?** Restructure, rename, reorder, extract. This is the
   answer far more often than it feels like at the time.
2. **Can the rule be taught?** A rule option keeps the rule live everywhere else
   — `noLabelWithoutControl`'s `inputComponents` is the worked example. Prefer an
   option over an exemption every time.
3. **Is the engine actually wrong about this code?** Not "inconvenient here" —
   wrong. A window splitter has no native HTML element; StyleX's allowlist
   predates CSS anchor positioning. Those are engine limits. "This test is
   easier that way" is not.

Only then add an entry:

```json
{
  "key": "inline packages/ui/src/…/Thing.tsx some-rule",
  "count": 1,
  "status": "permanent",
  "reason": "Why the engine is wrong about this specific code, and why no fix exists in our control.",
  "ref": "an ADR path, or an issue number"
}
```

Get the `key` from `vp run suppressions:list` rather than composing it by hand.
A reason under 20 characters, or a missing `ref`, fails the gate — a suppression
nobody explained cannot have been evaluated.

### permanent vs provisional

- **permanent** — the engine is wrong and no fix exists in our control. Expected
  to outlive us.
- **provisional** — accepted for now, not endorsed. Must carry a `review` issue.

`provisional` exists to be emptied. It is not a second baseline, and a
provisional entry that sits untouched for a release is a bug report about this
process. The five open today are tracked in **#311**.

## If the gate fails on your branch

Read the finding first. The gate reports the file, the rule and the count, and
in almost every case the fix is in the code, not in this file. Reach for a
register entry only after the three questions above have all been answered
"no" — and expect to defend it in review.
