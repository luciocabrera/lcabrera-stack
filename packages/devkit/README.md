# @lcabrera/devkit

Materialises this repository's agent setup — skills, path rules, subagent
definitions, and the workflows, hooks, templates and registers that make them run
— into a consumer repository, and reports what has diverged.

Published from
[`lcabrera-stack`](https://github.com/luciocabrera/lcabrera-stack),
which is also its first consumer
([ADR-081](../../docs/decisions/ADR-081-ship-the-repo-setup-as-two-packages.md)).

**It has no `build` script, and that is not an omission.** The publishing
contract in [`packages/CLAUDE.md`](../CLAUDE.md) has every package whose sources
are TypeScript build, because a `.ts` file inside `node_modules` cannot be loaded
at all. This package's sources are `.mjs` — already loadable — so there is
nothing to compile and `exports` can point straight at what ships. Adding a build
step would put a `dist` between the bin and the assets it reads for no gain.
Verify what a consumer receives by packing and reading the tarball, not by
reading the manifest; `files` carries a negated pattern that only pnpm honours.

## Why a command rather than an import

This material is discovered by **path**: an agent reads the skills directory,
and agents without a skill mechanism read the files directly. A package sitting
in `node_modules` puts nothing where any of them look, so the files have to be
copied into the consumer's tree — and a copy with no record of what it wrote
cannot ever take an upstream fix without destroying local work.

The record is what makes it distribution rather than copy-paste. Every
materialised file is hashed into `.devkit-manifest.json`, and each subsequent
run classifies it:

| State                | What happens                                                                   |
| -------------------- | ------------------------------------------------------------------------------ |
| `added` / `restored` | written — the consumer does not have it                                        |
| `updated`            | written — untouched locally, and the package has moved on                      |
| `current`            | nothing written; adopted into the record                                       |
| `modified`           | **left alone** — edited locally, and reported on every run                     |
| `acknowledged`       | **left alone** — an edit you said you meant; reported only under `--verbose`   |
| `conflict`           | **left alone** — an unmanaged file already occupies that path; acknowledgeable |
| `unresolved`         | **refused** — a `{{commands.*}}` placeholder has no answer                     |
| `unmet`              | **refused** — a `requires:` key is unset, or a `peer:` range is unanswered     |

A local edit is a supported state, not a defect. It survives every sync, which
is what stops a consumer forking the kit to change one line.

The two refusals are never written **and never recorded**. Recording one would
make the next run read the file's absence as a deletion the consumer chose,
which is the one way a refused file could quietly stop being reported.

## What counts as self-contained

`devkit closure` asks what a directory needs that it does not contain, and the
unit it answers against is the **package**, not the directory. A skill pointing
at a contract document, or at a sibling skill that ships alongside it, is fine —
both arrive. Judging containment per directory instead would push every shared
reference toward being copied into each directory that needs it, which is the
duplication this whole mechanism exists to remove.

A command reached through `{{commands.*}}` counts as answered too — the tools
your `commands` block invokes are added to the baseline for the run. Otherwise
parameterising a command, the very thing that makes a file portable, would make
the closure gate fail.

It reports four kinds of escape, because they fail differently for a consumer: a
**link** is a file they will not have, a **command** is a tool their shell may
not resolve, an **import** is a module their install will not provide, and a
**requires** is a config key outside what `devkit.config.json` is for — so no
consumer could set it, however reliably it resolves in the repository that wrote
the file.

Run it against **materialised** output, never against `assets/`. A shipped file's
links are written for where the file lands, so resolving them from the asset tree
produces confident nonsense.

## Installing

```bash
npm install --save-dev @lcabrera/devkit @lcabrera/repo-standards
```

`@lcabrera/repo-standards` is optional and worth having: it carries the gate
binaries the seeded workflows and hooks invoke. Without it the prose still
materialises, and `init` writes no task pointing at a binary you do not have.

To install an unreleased change, or to see what a consumer actually receives,
install the packed tarballs instead:

```bash
pnpm pack --pack-destination /tmp/kit   # in each package directory
npm install --save-dev /tmp/kit/*.tgz   # in the consumer
```

`pnpm`, not `npm` — pnpm rewrites `workspace:*` and `catalog:` specifiers to real
ranges at pack time, and an `npm pack` tarball carries the literal strings, which
resolve for nobody.

## Setting up a repository

```bash
devkit init [--profile <name>] [--force] [--upgrade]
```

`init` is `sync` plus the wiring a repository does not have yet: it writes
`devkit.config.json` with a command map inferred from your lockfile, adds the
gate tasks whose binaries are actually installed, and then materialises the
selected profile.

It **refuses** rather than proceeding when the repository is already set up — a
config or a manifest already present means `sync` is the command you want, and it
is the one that knows to leave your edits alone. Nothing overrides the check that
this is a git repository, since the manifest is a tracked file and the hooks are
only ever run by git.

Two flags get past that refusal, and they are not interchangeable:

|                                   | `--upgrade`        | `--force`       |
| --------------------------------- | ------------------ | --------------- |
| A command you corrected           | kept, and reported | **re-inferred** |
| A config key a newer version adds | added              | added           |
| Another package's block           | kept               | kept            |
| Your `ci` block, edited           | kept, and reported | rewritten       |

**`--upgrade` is the one you want after upgrading this package.** A new version
can infer config an older one did not — that is how the CI setup hook arrived —
and `sync` will not add it, because `devkit.config.json` is yours. `--upgrade`
fills in only what is missing and says which of your values it left alone.

That report is the point, not a courtesy. The CI setup steps pin their actions by
commit sha, so a version that ships a new one — a supply-chain fix being the
likely reason — changes nothing for a consumer holding their own `ci` block. The
run prints the steps it would have set up, beside the ones it kept, so that
difference is visible rather than inferred.

`--force` rewrites the config from the current inference. It is for starting
over, not for upgrading: this command tells you to check the commands it guessed
and correct the wrong ones, and `--force` is what silently un-corrects them.

It **fails** when the run did not set the repository up: any file held back for
an unanswered `{{commands.*}}` placeholder, or a profile that placed nothing at
all, exits non-zero and says which command keys to add. A partial materialisation
that exited 0 would read afterwards as a working repository whose CI workflows
are simply absent.

The inferred commands are a starting point, not a verdict — `init` names the
runner it guessed so you can correct it. Check them before you rely on them.

## Commands

```bash
devkit init [--profile <name>] [--force]   # set up a repository that has none of this
devkit sync [--profile <name>]        # materialise into the current repository
devkit doctor [--profile <name>] [--check] [--verbose]   # report divergence; --check makes it fail
devkit doctor --accept <path> --reason "<why>"   # this edit is deliberate
devkit closure [--profile <name>] <dir> [<dir>...]   # what does this directory need that it lacks
devkit closure [--profile <name>] --shipped          # the same, for everything the package places
```

In this repository they are also `vp run devkit:sync`, `vp run devkit:doctor`
and `vp run devkit:closure`.

`--shipped` without a profile checks **every** profile in turn, and that is the
form worth running. Checking only the one this repository happens to use leaves
the rest measured by nothing, and it is the only way to catch a file in the small
profile pointing at one the large profile places: that reference resolves for a
consumer who took everything and dangles for the one who did not, so it can only
be seen by checking the smaller set on its own.

## Profiles

A profile decides which groups of files a sync places, and the split is by who
reads the result.

| Profile | What it places                                                                                                                                   |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `agent` | What an agent reads: skills, path rules, subagent definitions, and the contracts and coordination register they bind to.                         |
| `full`  | All of that, plus what CI and git run: the workflows, the git hooks, the pull-request and issue templates, the decision home, and `COMMANDS.md`. |

A consumer who wants the prose and keeps their own process takes `agent` and
receives none of the scaffolding. `full` is the whole setup.

**Set it in `devkit.config.json` rather than passing `--profile`.** Every
command takes the flag, and that is how the commands get out of step: sync the
wider profile by flag, let CI run `doctor --check` without it, and every file
outside the configured profile is dropped from the plan before anything counts
it — so a deleted hook reports no drift. The flag is for a one-off; the config
is what keeps the question from being asked two ways.

**Two things a sync cannot do for you**, because neither is a file:

```bash
git config core.hooksPath .githooks
```

points git at the seeded hooks — without it they sit there and never run. And the
seeded workflows read `.node-version`, so a repository without one fails its
first run on the setup step. That is deliberate: failing there is loud, where
silently using whatever Node the runner happened to have is not.

The hooks arrive **executable**, and the mode is decided by the group the asset
sits in rather than read off the shipped file. It has to be: `pnpm pack` writes
every entry `0644`, so an installed copy of this package holds no executable file
at all. Reading the mode from disk worked in this repository — `workspace:*`
resolves the source directory, where the bit is set — and produced inert hooks
for every consumer, which git skips without a word. The packed-tarball gate now
asserts it, because no test run from a workspace can.

## Acknowledging a deliberate edit

A locally modified file is reported on every run, for ever. That is the right
default — never overwriting your edit is the whole point of the record — but it
makes a permanent customisation indistinguishable from a stale accident, and it
leaves `doctor --check` red in CI for a repository that meant every line of it.

```bash
devkit doctor --accept .claude/rules/routes-data.md \
  --reason "our loaders are tRPC, not React Router"
```

That records the edit in **`.devkit-accepted.json`**, which is a tracked file:
commit it, the same way you commit the manifest. Afterwards the default report
omits that file and `--check` passes; `devkit doctor --verbose` still lists it
with the reason you gave.

`--accept` takes **one file at a time**, refuses a path the report does not
currently call `modified` or `conflict`, and refuses a missing or blank
`--reason`. An acknowledgement nobody had to justify is the one that rots into a
line nobody dares delete.

A `conflict` is acknowledgeable for the same reason a `modified` file is, and
acknowledging one is **not** adopting it: the package's version is still never
written over yours. A repository that authored its own version of a file before
adopting the kit holds that state permanently and legitimately, and without a way
to say so, `devkit doctor --check` can never be green there — which makes it
useless as a gate, since a check that is always red is read exactly like one that
is always green.

The entry is keyed to the file's **on-disk hash**, not just its path, and that is
what makes it safe: edit the file again and the hash no longer matches, so it is
reported as locally modified again — no command to run, and no way to forget.
Reverting back to the acknowledged content quiets it again. To withdraw an
acknowledgement, delete its entry from `.devkit-accepted.json`.

An acknowledged file is never written and never recorded. Recording the edited
content's hash would make the next run compare the package against your edit
rather than against the copy `sync` last wrote, so `updated` and `current` would
swap places for that file. One consequence follows from that and is worth
knowing: an acknowledgement quiets the file **even when the package's own copy
moves on**. `--verbose` is how you find what is being held back.

## Configuration

`devkit.config.json` at the consumer root, all of it optional:

```json
{
  "profile": "agent",
  "paths": {
    "agents": ".claude/agents",
    "coordination": "docs/coordination",
    "decisions": "docs/decisions",
    "docs": "docs/agents",
    "hooks": ".githooks",
    "root": ".",
    "rules": ".claude/rules",
    "skills": ".github/skills",
    "templates": ".github",
    "workflows": ".github/workflows"
  },
  "commands": {
    "install": "vp install",
    "check": "vp run check:push",
    "test": "vp run test:changed",
    "audit": "vp run deps:audit"
  }
}
```

Every `paths` key is a group of shipped files, and `hooks` defaults to
`.githooks` rather than to any one toolchain's hook directory: git runs whatever
`core.hooksPath` names, so naming the directory a particular runner owns would
put the seeds where a consumer on another runner never looks.

`commands` answers the placeholders a shipped file carries. A skill's procedure
travels but the command carrying out each step does not, so the file says
`{{commands.install}}` and this supplies the rest. A file whose placeholders
cannot all be answered is **not written** — materialising `{{commands.install}}`
verbatim would hand a reader something that looks like a command and is not one.

This is the consumer's data, deliberately kept out of the files being shipped —
the same split the toolchain packages made. A shipped file may reference only
something inside its own package, a bin from a declared peer, or a key from
here. `devkit closure` is what checks that.

### Giving a workflow the toolchain it needs

A shipped workflow starts on an empty runner, so `{{commands.install}}` is only
runnable there if the tool it names is already present. That is not something
the command itself can express: `vp install` is exactly right in your terminal
and impossible on a fresh runner, because `vp` is a project dependency and
installing it is the step that was about to run.

Every shipped workflow therefore enables corepack — which supplies the package
manager `packageManager` pins, at that version — and leaves one hook for the
runners corepack cannot reach:

```json
{
  "ci": {
    "setup": [
      "- name: Set up Vite+",
      "  uses: voidzero-dev/setup-vp@<sha>",
      "  with:",
      "    run-install: false"
    ]
  }
}
```

`init` fills this in for the runners that need it and leaves it out for the
rest, so most repositories never see the key. Leaving it out is the normal case
and says nothing; writing it wrongly is an error — `ci.setup` must be an array
of strings, and anything else fails here, naming the entry. Resolved quietly to
"no steps" it would delete the hook from every workflow and each job would fail
at `{{commands.install}}` instead, looking exactly like a repository that
declared no setup at all. The value is YAML **lines**,
indented into place wherever a workflow carries `{{ci.setup}}` — verbatim,
because a step schema in JSON would only ever render back into YAML while
bounding what you can express to whatever this package anticipated.

Unlike a command, an absent value is the ordinary case: it resolves to no steps
rather than to a missing key, so a file is never held back for it.

### Declaring what a file cannot run without

A placeholder is only half the story: a file can depend on a config key while
never interpolating it, and that dependency is invisible to the substitution
above. `requires:` in the file's own frontmatter makes it visible.

```yaml
---
name: epic
requires: [config.commands.install, config.paths.docs]
---
```

A file declaring a key the consumer has not set is **not written**, and is
reported naming the key — the same refusal an unanswered placeholder gets, and
for the same reason. Set the key and the next `sync` writes it.

Only `config.`-prefixed entries are read. `requires:` already means other things
in frontmatter written for people — a shipped reference file uses it for a
library version range — and those are left alone.

Write the list however you like: a flow array, a block sequence, or a lone
scalar for the single-key case, quoted or not, with notes and blank lines
wherever YAML allows them. Restyling a declaration from one spelling into
another is not a behaviour change, and a spelling that read as no declaration
would be — it would put the file in a consumer who cannot satisfy it, silently.

### Declaring the runtime a file needs

A skill's prose shells out to bins that live in a peer package, and prose and
bins skew: a consumer can upgrade the runtime, or never install it, without ever
re-running `sync`. `peer:` states the range the file was written against.

```yaml
---
name: epic
peer: '@lcabrera/repo-standards@<1.0.0'
---
```

One entry per package, spelled `name@range` — the same `name@range` a package
manager takes, split at the **last** `@` so a scoped name survives. Every
spelling `requires:` accepts works here too, and a name with no range means
"installed, at any version". The range is evaluated by `semver`, which is why
this package has a runtime dependency at all: a hand-rolled comparator inside a
compatibility gate is wrong in exactly the way the gate exists to catch.

The peer is **optional**, so a consumer who wants the prose and none of the
gates just does not install it. A file is not written when the peer is absent
**and** not written when the installed version falls outside the range; the
report says which, because one is `install` and the other is `upgrade`. Each
distinct peer is resolved once per run, so `sync` and `doctor` can never
disagree about what is installed.

It is declared in this package's `peerDependencies` as
`@lcabrera/repo-standards: >=0.1.0 <1.0.0`, and the example above bounds the same
pre-1.0 line for the same reason. The two packages are versioned independently,
so a narrower bound starts refusing a file the moment one of them moves without
the other — and below `1.0.0` a caret is narrower than it looks, since `^0.2.0`
does not admit `0.3.0`. Read it as the syntax and not as advice on what to pin: a
range is right only if the consumer's tree answers it, and `devkit doctor` is
what says when it does not.

The range is written out rather than spelled `workspace:*`, which is the form
this repository uses everywhere it _consumes_ the package. pnpm substitutes the
workspace protocol at pack time, and for `peerDependencies` too — `workspace:*`
would publish as an exact pin on whatever version happened to be current, so the
first release that moved only one of the two would leave every consumer with an
unmet peer. This package still resolves the workspace copy locally; it declares
it as a `devDependency` to do that, which is the same split
`@lcabrera/ui` makes for `react`.

## What ships

[`CLASSIFICATION.md`](./CLASSIFICATION.md) carries the verdict for every skill,
rule and subagent definition, and the reason behind each one — including the
ones deliberately kept back.
