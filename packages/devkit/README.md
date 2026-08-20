# @repo/devkit

Materialises this repository's agent setup — skills, path rules and subagent
definitions — into a consumer repository, and reports what has diverged.

Private while the mechanism is being proved here. It publishes as
`@lcabrera/devkit` ([ADR-081](../../docs/decisions/ADR-081-ship-the-repo-setup-as-two-packages.md)).

## Why a command rather than an import

This material is discovered by **path**: an agent reads the skills directory,
and agents without a skill mechanism read the files directly. A package sitting
in `node_modules` puts nothing where any of them look, so the files have to be
copied into the consumer's tree — and a copy with no record of what it wrote
cannot ever take an upstream fix without destroying local work.

The record is what makes it distribution rather than copy-paste. Every
materialised file is hashed into `.devkit-manifest.json`, and each subsequent
run classifies it:

| State                | What happens                                                               |
| -------------------- | -------------------------------------------------------------------------- |
| `added` / `restored` | written — the consumer does not have it                                    |
| `updated`            | written — untouched locally, and the package has moved on                  |
| `current`            | nothing written; adopted into the record                                   |
| `modified`           | **left alone** — edited locally, and reported on every run                 |
| `conflict`           | **left alone** — an unmanaged file already occupies that path              |
| `unresolved`         | **refused** — a `{{commands.*}}` placeholder has no answer                 |
| `unmet`              | **refused** — a `requires:` key is unset, or a `peer:` range is unanswered |

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

## Commands

```bash
devkit sync [--profile <name>]   # materialise into the current repository
devkit doctor [--check]          # report divergence; --check makes it fail
devkit closure <dir> [<dir>...]  # what does this directory need that it lacks
```

In this repository they are also `vp run devkit:sync`, `vp run devkit:doctor`
and `vp run devkit:closure`.

## Configuration

`devkit.config.json` at the consumer root, all of it optional:

```json
{
  "profile": "agent",
  "paths": {
    "agents": ".claude/agents",
    "coordination": "docs/coordination",
    "docs": "docs/agents",
    "rules": ".claude/rules",
    "skills": ".github/skills"
  },
  "commands": {
    "install": "vp install"
  }
}
```

`commands` answers the placeholders a shipped file carries. A skill's procedure
travels but the command carrying out each step does not, so the file says
`{{commands.install}}` and this supplies the rest. A file whose placeholders
cannot all be answered is **not written** — materialising `{{commands.install}}`
verbatim would hand a reader something that looks like a command and is not one.

This is the consumer's data, deliberately kept out of the files being shipped —
the same split the toolchain packages made. A shipped file may reference only
something inside its own package, a bin from a declared peer, or a key from
here. `devkit closure` is what checks that.

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
peer: '@repo/repo-standards@>=0.1.0 <1.0.0'
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

It is declared in this package's `peerDependencies` as `@repo/repo-standards` —
the name that resolves today. It becomes `@lcabrera/repo-standards` when #800
publishes both packages.

## What ships

[`CLASSIFICATION.md`](./CLASSIFICATION.md) carries the verdict for every skill,
rule and subagent definition, and the reason behind each one — including the
ones deliberately kept back.
