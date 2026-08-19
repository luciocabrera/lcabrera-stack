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

| State                | What happens                                                  |
| -------------------- | ------------------------------------------------------------- |
| `added` / `restored` | written — the consumer does not have it                       |
| `updated`            | written — untouched locally, and the package has moved on     |
| `current`            | nothing written; adopted into the record                      |
| `modified`           | **left alone** — edited locally, and reported on every run    |
| `conflict`           | **left alone** — an unmanaged file already occupies that path |

A local edit is a supported state, not a defect. It survives every sync, which
is what stops a consumer forking the kit to change one line.

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

## What ships

[`CLASSIFICATION.md`](./CLASSIFICATION.md) carries the verdict for every skill,
rule and subagent definition, and the reason behind each one — including the
ones deliberately kept back.
