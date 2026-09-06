---
paths: ['**/*.mjs', '**/*.cjs', '**/scripts/**/*.js']
---

# Build & Tooling Script Standards

Covers the repo's `.mjs` / `.cjs` (and `scripts/**/*.js`) — the verify gates,
report generators, seeders, and skill runners under `scripts/`,
`.github/skills/*/scripts/`, `apps/*/scripts/` and
`packages/repo-standards/scripts/`. Both shared eslint configs globally ignore a
`scripts/` directory, which is why a workspace's tooling scripts belong there
rather than in its `src/`: the eslint custom-rules pass is aimed at library and
application source, and these four analysers are what govern the rest. These files run under Node,
outside the app bundle, so the TypeScript rules (`type` vs `interface`, `readonly`,
no-`any`) don't apply — but **structure, purity, size, and the enforcement below
do.** They are real code and rot the same way. The exemplar to copy is
`packages/repo-standards/scripts/verify-commands-doc.mjs`.

## Structure & size

- **A short JSDoc header explaining _why_ the script exists** — the problem it
  guards against, its usage line(s), and its exit codes. Not "what the code
  does" — _why it is here_. Every verify/report script has one. **Keep it to a
  handful of lines**: the investigation that produced the script, and any
  measurement, belong in the PR or issue, not at the top of the file. Never put a
  changing number in it (see the comment rules in AGENTS.md §7). Link the doc
  that owns the detail rather than restating it.
  (Mind block-comment content: a literal `*` followed by `/` closes the comment —
  write globs as prose, e.g. "TS/TSX files", not `**/*.ts`.)
- **Small, single-responsibility functions.** The same purity/decomposition bar
  as the rest of the repo; don't stack a 200-line procedure in `main`.
- **Extract cohesive helpers into a sibling module once a script grows** — the
  `.mjs` analogue of the one-util-per-file rule. `scripts/lib/` is the pattern:
  shared logic imported by the CLI shells beside it, not copy-pasted (fallow
  flags the dupes when it isn't).
- **Hard ceiling: 350 code lines** (non-blank, non-comment) per file — aim well
  under. Over it, split. Enforced by `vp run scripts:verify`; inherited offenders
  are grandfathered in `scripts/script-size-baseline.json` and may not grow.

## Purity & effects

- A script _is_ an effect entry point (fs, `child_process`, `process.exit`), but
  keep the **effects at the edges and the computation pure**: parse/measure/decide
  in pure functions, then do the I/O in a thin shell. This is what makes a gate's
  logic reviewable — see how `verify-commands-doc.mjs` separates "read the
  inventory" from "check the claims" from "print and exit".
- **Functional array ops** (`map`/`filter`/`flatMap`/`reduce`); no needless
  mutation; `for…of` only for genuine imperative I/O loops.

## Node conventions

- **`node:`-prefix every builtin** (`node:fs`, `node:path`, `node:child_process`).
- **Never shell out to `jq` from a local script — it is not installed here.** A
  local script that pipes through it fails on a developer machine while passing in
  CI, where the runner image has it. Parse JSON in node instead. Two things that
  are **not** this rule: `gh --jq` (gh embeds its own JSON filter, no system binary
  involved) and `.github/workflows/**`, which only ever runs on a runner.
- **Match the module system to the extension** — `.mjs`/`import`, `.cjs`/`require`.
- **Top-level `try/catch`, and set `process.exitCode` — never `process.exit()`
  mid-stream** (it truncates output). A verify script **lists every discrepancy,
  not just the first**, then exits non-zero.

## What enforces this

The eslint fan-out is per-workspace and **root `scripts/` is not a workspace**, so
these files lean on the repo-wide passes plus one dedicated gate:

| Layer                       | Covers                                                             |
| --------------------------- | ------------------------------------------------------------------ |
| **Oxlint** (`vp lint`)      | correctness, repo-wide — includes `scripts/` and skill scripts     |
| **Biome** (root)            | correctness / react-domain, repo-wide                              |
| **fallow** (`fallow audit`) | per-function complexity, CRAP, dead exports, dupes — new-only gate |
| **`scripts:verify`**        | per-file size ceiling, repo-wide, baselined                        |
| **`scripts:exits:verify`**  | `process.exit()` calls, repo-wide, parsed not grepped              |

fallow's `maxUnitSize`/complexity limits apply to root `scripts/` but are
**relaxed for `packages/eslint-local-rules/**`** in
`.fallowrc.json` (deliberately — procedural CLI/AST-walker code). The size gate
has no such carve-out: it covers every `.mjs`/`.cjs`, skills included.

Rule 11 applies here too: never silence a finding — fix the code. `packages/ui`
scripts are held to the same never-baseline bar as the rest of that package.

## Config files

`*.config.mjs`, `eslint.config.mjs`, and `vite.config.ts` fragments export a
config object and need no "why" header or `main`. Everything else applies: keep
them small, functional, and `node:`-clean.
