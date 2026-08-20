# `@repo/devkit` — architecture

Two capabilities that share nothing but a CLI: **measuring** whether a directory
can travel, and **moving** it into a consumer's tree.

## Modules

| Module                              | Responsibility                                                                                                    |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `closure-extract.mjs`               | Pull references out of a file: markdown links, prose and command-line paths, shell commands, module imports.      |
| `closure.mjs`                       | Decide whether each reference escapes the directory being shipped. Pure.                                          |
| `closure-report.mjs`                | Walk a directory, run the analysis, render it.                                                                    |
| `config.mjs`                        | Resolve `devkit.config.json`, map an asset onto its destination, and answer both questions about a key. Pure.     |
| `frontmatter.mjs`                   | Read a shipped file's `requires:` and `peer:` declarations, however they are spelled. Pure.                       |
| `peer.mjs`                          | Resolve an installed peer's version, and decide whether it answers a declared range. Pure but for the resolution. |
| `manifest.mjs`                      | Hash files, and decide what happens to each on the next run. Pure.                                                |
| `accepted.mjs`                      | The record of which local edits the consumer said they meant, and what may go into it. Pure.                      |
| `sync.mjs`                          | Turn assets plus a manifest into a plan, layer acceptance over it, then apply it.                                 |
| `command-materialise.mjs`           | The plan `sync` and `doctor` share.                                                                               |
| `command-closure.mjs`, `devkit.mjs` | The commands, and the dispatcher.                                                                                 |

## Decisions worth not undoing

**Planning is pure and separate from writing**, so `doctor` predicts exactly what
`sync` would do. A doctor computing its answer by a different route than the
command it describes is worse than no doctor, because it is believed.

**The existence check is injected, not performed.** A path written in prose
carries no convention saying what it is relative to: `packages/devkit/CLASSIFICATION.md` means the
repository root while `references/advanced.md` two lines later means the file's
own directory. Only which one is actually present separates them, so the caller
supplies that check and a token matching neither reading is left unreported
rather than guessed at. Guessing produced false positives indistinguishable from
real findings — a skill's own reference file reported as an escape.

**Containment is judged against the package, not the directory.** A shipped file
may point at anything the package also ships, wherever it lands. The alternative
— every directory self-sufficient — forces a shared contract document to be
copied into each skill that reads it, and then they drift.

**A declared requirement is checked by two different questions, on purpose.**
`sync` asks `hasConfigKey` — does _this_ consumer have that key, so should this
file be written into _their_ tree. `closure` asks `allowedConfigKeys` — is the
key even part of what `devkit.config.json` is for, so could _any_ consumer have
it. A key that resolves here and sits outside the config's key space passes the
first and fails the second, which is the case worth catching: it works in the
repository that wrote it and travels nowhere.

**An unsatisfiable declaration is one state, not two.** A missing config key and
an unanswered peer range have the same outcome — nothing written, nothing
recorded — so both are `unmet`, and only the _wording_ of the report differs.
Two states would be two ways for `sync` and `doctor` to say the same thing, and
the second one is where they drift apart.

**A peer's version is resolved once per plan, in `buildPlan`.** Both commands
read that one plan, so neither can see a version the other did not; resolving
per asset would also make a peer named by twenty files cost twenty lookups.
Resolution is from _this package's_ manifest, not the consumer's cwd, because a
peer is satisfied by the tree that installed the kit.

**Absence is not an error.** The gate runtime is an optional peer — a consumer
who wants the prose and none of the gates simply has not installed it — so
`installedPeerVersion` answers `undefined` rather than throwing, and the range
decision takes the version as an argument. That is what keeps the deciding half
pure and testable with nothing on disk. Ranges are evaluated by `semver`: a
hand-rolled comparator inside a compatibility gate fails silently in exactly the
way the gate exists to prevent.

**An acknowledged edit is keyed to the file's hash, and lives in its own file.**
Keying it to the path alone would be a permanent opt-out: every later edit to
that file silently unreported, which is the failure the manifest exists to catch.
Keying it to the on-disk hash costs nothing to maintain — a further edit
invalidates the entry by itself — and is why re-surfacing needs no command.
It is `.devkit-accepted.json` rather than a field in `.devkit-manifest.json`
because `sync` rewrites the manifest on every run through a reduce that knows
only about `files`, so a field beside it is one unrelated change to manifest
writing away from being dropped without a word.

**Acceptance is layered over the classification, not folded into it.**
`classifyMaterialisation` stays a function of three hashes, so the acceptance
record cannot change what `modified` means and a consumer who has acknowledged
nothing gets exactly the plan they got before — the same separation
`manifestAfter` already keeps from `planSync`. The relabelling happens in
`buildPlan`, which is what stops `sync` and `doctor` disagreeing about which
files are quiet — the same place, and for the same reason, a peer's version is
resolved once.

## Assets

`assets/<group>/…` where the group name is the `paths` key that places it, so
adding a group is a data change rather than a code change.
