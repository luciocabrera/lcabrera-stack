# Vision — who this is for, and what they get

Two products ship from this repository, and four kinds of person judge them.
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

## The stack the packages require

Both lines assume a stack, and it is a **precondition of using them** rather
than a detail of how they are built: **React 19, React Router in framework mode,
StyleX, Vite+, and pnpm.**

This is the one place that stack is stated. `@lcabrera/ui` publishes TypeScript
source rather than a build, so a consumer's own toolchain compiles it, and it
needs StyleX wired into that build — off this stack the package does not work at
all, and saying so bounds the promise instead of implying a portability nothing
here tests. A consumer on a different framework or styling system is not an
unlucky consumer; they were never a consumer.

Two rules follow, and both are load-bearing. A package may assume the stack, and
may **not** assume anything a bootstrapper wrote — the existing "no relying on a
consumer's tsconfig `paths`" rule, one level up. And the mechanism is the
catalog: a bootstrapped repository receives a `pnpm-workspace.yaml` that pins
these at install time, because a contract with no mechanism is a sentence. The
decision is [ADR-107](../decisions/ADR-107-the-stack-is-a-precondition-of-the-packages.md).

## The four personas

A persona earns a place here by having a **different definition of "it works"**.
Four do; a fifth would have to bring a fifth definition, not a fifth job title.

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

### The project starter

Has neither product yet, and no repository to install into — they are beginning
one. They reach the product through a single command and judge it before they
have read anything: it works when that command leaves them a repository that
installs, builds, tests, lints, gates itself, and has an agent able to work in it,
with an ADR register and a coordination register present and empty, ready to be
written into.

Their requirements are the ones that fail as **absence** rather than as
misbehaviour — a command that half-finishes, a repository that looks configured
and does not build, a harness that arrives without the rules it references. That
is what separates them from the repository maintainer, whose failures are all
about something behaving wrongly in a repository that already works. The two
would otherwise collapse into one, and folding this persona into the maintainer
"at time zero" was the live alternative when it was added
([#1066](https://github.com/luciocabrera/lcabrera-stack/issues/1066)).

Worth stating because it is the trap: this persona's failures are the easiest of
the four to miss from inside this repository, which already has everything a
starter lacks. Nothing here can observe a missing piece, which is why the
requirement they own is checked by building a repository elsewhere.

## How the lines and personas meet

The application stack is installed by the application developer, and reaches the
data user through them — so a requirement in the data user's vocabulary is still
a claim about packages, and still names the packages it concerns. The toolchain
is installed by the repository maintainer. The project starter installs **both
lines at once**, which is why their requirement is the only one that declares
both.

**That is a statement about who installs what, and it is not a rule for which
persona a requirement declares.** The two fields answer different questions:
`packages` says what the requirement is about, `persona` says whose definition of
"it works" the statement is written in. A requirement owed by **both** lines —
a shipped document that has to read correctly wherever it lands is the worked
case — still declares exactly one persona, and picks the one it fails hardest
for. The failure list closing each persona's section above is what decides that;
counting packages is not.

Worth knowing before trusting a checker on it: a cross-line requirement naming a
persona from either of its lines is **well-formed whichever it picks**, so a
structural check reports the same pass for the right answer and the wrong one.
The first entry written here got it wrong for exactly that reason, and what
caught it was the failure list, not the schema.

## This page lists no requirements

Not by omission. An index is one region that every branch adding a requirement
appends to, so two agents working in the same week conflict on a file neither of
them was editing — and in this repository a conflicting pull request silently
skips its checks, which is a worse outcome than the conflict itself. The
directory is the listing, and adding a requirement changes exactly one file. The
reasoning in full is
[ADR-075](../decisions/ADR-075-the-index-does-not-list-the-adrs.md), which
retired the same table from the ADR home for the same reason.
