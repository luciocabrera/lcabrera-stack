# Vision — who this is for, and what they get

Two products ship from this repository, and three kinds of person judge them.
Every requirement in [`requirements/`](./requirements/) is written for exactly
one of those people, in their words. This page defines them and nothing else.

## The two product lines

They split by **who installs them**, not by how they are built — a line contains
TypeScript source and plain `.mjs` alike.

| Line                         | Installed by            | What it is for                                                                                                              |
| ---------------------------- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **The application stack**    | another **application** | rendering, querying and serving data: the grid a user works in, the wire contract between the two ends, and the query layer |
| **The repository toolchain** | another **repository**  | the standards a repository runs on: configs, gates, hooks, lint rules and the agent instructions that come with them        |

Which published package belongs to which line is stated once, in
[`AGENTS.md`](../../AGENTS.md) §1, and is not copied here — that roster moves
whenever a package is added or published, and a second copy of it is a copy
nothing keeps in step. Why publishing did not merge the pairs that look
mergeable is [ADR-069](../decisions/ADR-069-publish-the-shared-toolchain.md);
why the runtime split is load-bearing is
[ADR-038](../decisions/ADR-038-public-package-topology-by-runtime.md).

The apps in this repository are neither line. They are the harness that puts the
packages under load, and when app convenience and package cleanliness pull apart,
the package wins.

## The three personas

A persona earns a place here by having a **different definition of "it works"**.
Three do; a fourth would have to bring a fourth definition, not a fourth job
title.

### The application developer

Installs the application stack into an application they own, and reaches the
product through an `import`. It works when the import resolves, the component
renders with the props its documentation names, and the server half speaks the
same contract as the client half — with no wiring that only exists in this
repository's own harness.

Their requirements are the ones that fail as a resolution error, a type error, or
a component that needs something the documentation never mentioned.

### The repository maintainer

Installs the toolchain into a repository they own, along with everyone working in
it — **including the agents**, who read the instructions the toolchain ships and
act on them without re-deriving them. It works when a gate fires on the thing it
claims to guard and stays quiet otherwise, when a document they are pointed at
opens with only the installed package on disk, and when two instructions they are
handed do not tell them opposite things.

Their requirements are the ones that fail as a broken link on a registry page, a
gate that reports a clean pass because it read nothing, or a rule that
contradicts another rule.

### The data user

Installs nothing and never sees a package name. They meet the product as an
application the developer above shipped, and they judge it the way they would
judge a database administration tool they did not have to learn: browse a table,
filter it, group it, drill into a group, edit a row — without writing SQL and
without asking anyone technical.

Their requirements are the ones that are true of the composition rather than of
any one package, which is exactly why they are easy to lose: every package can
pass its own tests while the thing the data user needs is reachable only by
assembling an application by hand.

## How the lines and personas meet

The application stack serves the application developer directly and the data user
through them — so a requirement in the data user's vocabulary is still a claim
about packages, and still names the packages it concerns. The toolchain serves
the repository maintainer only.

## This page lists no requirements

Not by omission. An index is one region that every branch adding a requirement
appends to, so two agents working in the same week conflict on a file neither of
them was editing — and in this repository a conflicting pull request silently
skips its checks, which is a worse outcome than the conflict itself. The
directory is the listing, and adding a requirement changes exactly one file. The
reasoning in full is
[ADR-075](../decisions/ADR-075-the-index-does-not-list-the-adrs.md), which
retired the same table from the ADR home for the same reason.
