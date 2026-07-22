# Suppressions in the public packages

`packages/ui`, `packages/api`, `packages/server` and `packages/utils` ship to
consumers outside this repo. AGENTS.md §4 holds them to a single rule: **every
finding gets fixed — never baselined, never scoped off, never inline-disabled.**

This page is how that rule is checked, and what to do when you think you have
found the exception it allows.

## Why a gate was needed at all

Only one mechanism was ever really enforced.

Each of those packages gitignores its `eslint-suppressions.json`. CI checks out
no file, so there is nothing to suppress _with_ — the guarantee is structural,
not a check that has to run. That is why it has never failed.

Nothing covered the rest. A `// NOSONAR`, an `@ts-expect-error`, an
`oxlint-disable-next-line`, a fallow baseline key, a `biome.jsonc` override, or a
rule lowered in the package's own lint config were all just text nobody counted.
When #308 first counted them, `packages/ui` held **17 inline directives and 6
Biome rules turned off against its own files** — while §4 said, in as many words,
that it held none.

Most of those are defensible. That was never the problem. The problem was that
nothing distinguished a reviewed exception from one added last Tuesday, and a
rule nobody can comply with gets ignored wholesale.

## What is checked

`vp run suppressions:verify` (`scripts/verify-suppressions.mjs`, a CI step in
`check-safe.yml`) scans the public packages for:

| Mechanism      | Detected as                                                 |
| -------------- | ----------------------------------------------------------- |
| ESLint         | `eslint-disable`, `eslint-disable-next-line`                |
| Oxlint         | `oxlint-disable`, `oxlint-disable-next-line`                |
| Biome — inline | `biome-ignore`, `biome-ignore-all`                          |
| Biome — config | a rule set to `"off"` in a `biome.jsonc` override           |
| Sonar          | `NOSONAR`                                                   |
| TypeScript     | `@ts-expect-error`, `@ts-ignore`, `@ts-nocheck`             |
| fallow         | a baseline key naming a file in a public package            |
| Package config | a rule level below `error` in the package's own lint config |

That last row covers `eslint.config.mjs` and `vite.config.ts` — where Oxlint is
configured — and it is the least visible mechanism of all after a Biome
override: nothing in the affected source says a rule was lowered; the whole
package simply stops reporting it. The convention it asserts is already the
practice. Three of the four packages carry a local `rules` block, and every one
sets `error` with options, commented _"rather than turning the rule off … so it
still FAILS the gate"_. Passing a rule an option keeps it live; lowering its
level does not.

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
how broad it looks. No syntactic reading works: `**/logger.util.ts` and
`**/*.mjs` have the same shape, and one of them is a `packages/ui` exemption
wearing a generic costume.

- **targeted** → the `approved` list. Every file the glob matches is inside a
  public package, so the rule is off _because of_ that package. Highest bar:
  argue why the engine is wrong about this specific code.
- **repo-wide** → the `acknowledged` list. The glob also matches files outside
  them (`**/*.test.ts`, `**/*.mjs`), so it is a whole-category decision a public
  package merely falls inside, governed by
  [ADR-035 §7](../cqms/decisions/ADR-035-biome-third-linter.md). Listed, not
  justified per-package.

**Both lists are enforced.** The first version of this gate reported the
repo-wide ones and gated only the targeted ones, which left a real hole: a _new_
override broad enough to match a public package **and** anything else needed no
entry and passed silently. Requiring both closes it, without filing thirteen
repo-wide decisions under "`packages/ui` exemptions" — which would misattribute
them and bury the six that genuinely are about the package.

### Classification follows the tree, and that is deliberate

A glob's scope is derived, so it can change with no edit to `biome.jsonc` or to
the register. Every way it can change trips a check rather than going quiet:

- The glob starts matching something outside the packages → it moves to the
  `acknowledged` lane → its `approved` entry now matches nothing → **stale**.
- The `packages/ui` file it named is renamed or deleted → zero matches → its
  entry matches nothing → **stale**.

In both cases the build fails and a human has to look. The gate cannot silently
narrow its own coverage, which is the failure this whole thing exists to prevent.

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

Read the finding first. The gate names the lane, the file, the rule and the
count, and in almost every case the fix is in the code, not in this file. Reach
for a register entry only after the three questions above have all been answered
"no" — and expect to defend it in review.

Two failures mean something other than "you added a suppression":

- **stale** — you removed one, or a glob's resolution changed under it. Delete
  the entry; that is the register catching up, not an obstacle.
- **unapproved in `acknowledged`** — you widened a repo-wide Biome rule so it now
  reaches a public package. Decide whether that is what you meant, then list it.

## Known limits

Stated so nobody mistakes this for more than it is:

- **The shared lint configs are out of scope.** A rule turned off in
  `@repo/vite-configs`' shared eslint config affects all 17 workspaces and is a
  repo-wide decision reviewed there. Only a public package's _own_ config is
  scanned.
- **tsconfig strictness is not checked here.** Weakening `strict` or
  `noUncheckedIndexedAccess` silences findings just as effectively, but those
  files are generated by `@repo/ts-configs` and belong to that generator. All
  four are strict today; nothing yet fails if one stops being.
- **Only the file extensions the scanner walks** (`.ts`, `.tsx`, `.mjs`, `.cjs`,
  `.js`, `.jsx`) are read for inline directives.
