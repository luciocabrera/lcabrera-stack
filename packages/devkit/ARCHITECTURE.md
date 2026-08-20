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

**A file's mode travels with its content.** A git hook that is not executable is
not a hook: git skips it without a word, which is the same clean run as a hook
that passed. So `readFilesUnder` reads the bit and every entry carries it,
including a refused one — nothing downstream has to know which group a path came
from, and a hook is executable because the file this package ships is, not
because of where it lands. The bit is set _after_ the write rather than passed to
it, because `writeFileSync`'s mode applies only when it creates the file: an
update over a file that had lost the bit would otherwise keep it lost for ever.

**The closure gate measures the plan, and every profile.** The content it reads is
the plan's, not the copy on disk: they are the same file wherever this repository
materialises a group, and only the plan exists for a group it does not — the
scaffolding seeds, which this repository holds its own versions of and must never
overwrite. Reading from disk there would measure the repository's file and report
the seed as checked. Running it per profile catches the mistake profiles make
possible: a file in the small profile pointing at one only the wider profile
places resolves for a consumer who took everything and dangles for the one who
did not, so it can only be seen by checking the smaller set on its own.

**A seed refers to its own directory relatively, so the layout is never
interpolated.** There is no `{{paths.*}}` placeholder and none is needed: the
register's README ships _into_ the register, so it links `tasks/_TEMPLATE.md`;
the close-claim workflow inspects the whole tree rather than the register
directory, because the step before it is the only thing that touched the
checkout. A second substitution namespace would need its own failure semantics —
every path key has a default, so it could never be `unresolved` the way a command
is — for a need no seed actually has.

## Assets

`assets/<group>/…` where the group name is the `paths` key that places it, so
adding a group is a data change rather than a code change. `root` is the group
that lands at the repository root; its base is `.`, normalised away in
`targetPathFor` so one file cannot become two paths — the manifest key, the
acceptance key and closure's containment check are all string comparisons.

A profile is a list of those groups, and the split is by who reads the result:
`agent` is what an agent reads, `full` adds what CI and git run. A group named by
a profile with no `paths` entry is dropped from the plan without a word, which is
why a test asserts every grouped name is placed.
