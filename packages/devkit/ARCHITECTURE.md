# `@repo/devkit` — architecture

Two capabilities that share nothing but a CLI: **measuring** whether a directory
can travel, and **moving** it into a consumer's tree.

## Modules

| Module                              | Responsibility                                                                                                |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `closure-extract.mjs`               | Pull references out of a file: markdown links, prose and command-line paths, shell commands, module imports.  |
| `closure.mjs`                       | Decide whether each reference escapes the directory being shipped. Pure.                                      |
| `closure-report.mjs`                | Walk a directory, run the analysis, render it.                                                                |
| `config.mjs`                        | Resolve `devkit.config.json`, map an asset onto its destination, and answer both questions about a key. Pure. |
| `frontmatter.mjs`                   | Read a shipped file's `requires:` declaration — the config keys it cannot run without. Pure.                  |
| `manifest.mjs`                      | Hash files, and decide what happens to each on the next run. Pure.                                            |
| `sync.mjs`                          | Turn assets plus a manifest into a plan, then apply it.                                                       |
| `command-materialise.mjs`           | The plan `sync` and `doctor` share.                                                                           |
| `command-closure.mjs`, `devkit.mjs` | The commands, and the dispatcher.                                                                             |

## Two decisions worth not undoing

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

## Assets

`assets/<group>/…` where the group name is the `paths` key that places it, so
adding a group is a data change rather than a code change.
