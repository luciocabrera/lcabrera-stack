# @lcabrera/devkit

## 0.3.0

### Minor Changes

- 9b58238: Make the ADR gate read the record rather than only its name.

  Every ADR now opens with a `---` block declaring `governs` — workspace directory
  names, or the single value `repository` when the decision constrains no one
  workspace — and `repo-verify-adrs` fails a record that omits it, names a
  workspace the roster does not answer to, or is missing `## Context`,
  `## Decision`, `## Consequences` or one of the two alternatives sections. A
  heading whose only content is a template prompt counts as missing. The gate does
  not judge what a section says, and its success line says so.

  `repo-verify-adrs --list --package <workspace>` prints the decisions governing
  one workspace, separated from the repository-wide ones it inherits.

  **Upgrading an existing decision home takes two commands, and the gate is red
  until you run them.** Every record already in the home predates the block, so on
  first run each one fails on `no metadata block` and on whichever sections it
  lacks. `repo-verify-adrs --adopt` writes the baseline once from exactly those
  failures, grandfathering them; `repo-verify-adrs --write` then regenerates the
  index. After that the gate is green, and only NEW records are held to the rules.
  `--adopt` refuses to overwrite a baseline that is already there, so running it
  blind either writes the first one or fails — it will not quietly replace yours.
  That is not a claim that nothing can grandfather afresh: deleting the file and
  adopting again is an ordinary thing to be able to do. What holds either way is
  the bound above.

  Records written before the block are grandfathered in that baseline rather than
  edited into shape. The gate guarantees one thing about it: the list
  may hold at most `maxEntries` entries, and every exemption beyond that count
  fails. A count rather than a number window, because a sequence has gaps and a
  record taking a retired number falls inside any window. `--write` only prunes,
  lowers the bound to what it kept, and refuses to rewrite a baseline that has
  already grown; it regenerates the indexes and then still fails on any record
  finding it cannot fix, so the command the gate names never reports a tree clean
  that a plain run rejects.

  It is not proof against an editor, and it exempts filenames rather than records:
  the list pins how many records escape the content rules, not which. A slot freed
  by classifying one record can be spent on another, and a record can be rewritten
  under a name already on the list without the list moving. Review the records'
  diffs alongside the register's. The path is `registers.adrContentBaseline`.

  `@lcabrera/devkit` ships the template carrying the block with generic
  placeholders, so a scaffolded record fails the gate until its author says what
  the decision governs.

### Patch Changes

- ad03a24: Make the published READMEs readable with only the installed package on disk.
  Every relative link that escaped the package directory is now the absolute URL
  the other READMEs already use, the two-package split states its reasoning
  instead of only citing the ADR that holds it, and the three references to files
  that travel in the repository but not in an install say so.
- 62bb601: Stop shipping documents a consumer cannot read, and gate the recurrence.

  `@lcabrera/ui`, `@lcabrera/server` and `@lcabrera/utils` shipped the whole
  markdown set beside their source — every `ARCHITECTURE.md`, the artifact
  inventory, the pattern guide. Those are written for a reader who has the
  repository cloned: in an install they are pages of relative links to a decisions
  directory that is not in the tarball, plus decision citations by bare number.
  `files` now carries `"!src/**/*.md"`, so the source arrives without them and the
  README states what a consumer needs, linking the rest by absolute URL.

  Every other published package carries the same negation for whichever directory
  it publishes its source from — `src`, or `scripts` for the two `.mjs` packages.
  It is inert in each of them today and changes nothing that ships, which a
  before/after comparison of every packed file list confirms. It is there
  because it is the only guard that makes a newly added `src/ARCHITECTURE.md`
  fail to ship outright, rather than merely be likely to trip the content gate on
  its way out. `@lcabrera/devkit`'s `assets` are the deliberate exception: that
  markdown is what the package exists to copy.

  `@lcabrera/repo-standards` adds `repo-verify-shipped-docs`, which packs each
  package named in `publishing.publicPackageDirs` and reads the markdown back out
  of the tarball — `files` decides its corpus, not the working tree, which is the
  only way to see a negated pattern at all. It reports a relative link that leaves
  the package, a link to a file the package does not ship, a path anchored at one
  of the author repository's own directories (`gates.shippedDocs.repoOnlyDirs`,
  defaulting to the conventional monorepo layout), and a decision cited with no
  absolute URL on the line. An empty package roster, and any package that ships no
  readable document, are refused rather than passed.

  The remaining published READMEs stop naming the repository's own tree in
  passing: the source directory each package lives in is now a link a reader can
  open.

- a26ff71: Remove the comments a declaration's name, signature and types already state,
  from every package source.

  Nothing about behaviour changes, but the removal is visible in an editor: a
  declaration's JSDoc is carried into the published `.d.mts`, so a tooltip that
  used to show a paragraph now shows the signature. What the paragraph said lives
  where it is dated — the ADR that owns the decision, or the pull request that
  made it — and the annotations a build reads (`@param`, `@returns` and the rest,
  in the JavaScript sources that ship them) are untouched, as are the one-line
  notes on a member of an exported type, which reach an installer and state what
  the member's own type cannot.

  Four declarations changed shape rather than only losing prose, because their
  only body was a comment and removing it left an empty block: `getApiBaseUrl`
  resolves a request URL through a helper instead of swallowing the parse in an
  empty `catch`, `parseVersionedPayload` and `collectPersistedStateSlices` return
  and `continue` explicitly, and the logger's no-op is an expression. Each behaves
  as it did. `collectPersistedStateSlices` also drops its `transformRaw`
  parameter, which every caller filled with the percent-decode
  `parseVersionedPayload` already performs.

  Two union member orders moved with them — `TableResponseError`'s arms and
  `AggregateItem`'s intersection — because the sort those rules apply reads the
  member's source text, and the text no longer carries a comment. A union is
  unordered to a consumer.

## 0.2.1

### Patch Changes

- 24d1643: The generated ADR index now says something true for the number of homes the
  repository actually declares.

  `adrHomes` defaults to **one**, and the index rendered a paragraph about "two of
  them" and "no two homes" regardless — not false, but vacuous, and it reads as
  though the reader has missed a second directory. The cross-home sentence is still
  rendered when several homes are declared, because that is where the invariant it
  states is load-bearing. A single-home index now carries the fact that is
  load-bearing there instead — and its limit: `nextFreeNumber` takes the highest
  number in use and adds one, so a gap is never filled and a retired number stays
  retired, **unless** the retired ADR was the highest, in which case the next one
  takes that number back. That exception is stated rather than glossed because the
  index is generated into repositories whose readers will act on it without
  re-deriving it (#974 is about closing the hole).

  `renderIndex` gains an optional `homeCount` option defaulting to the configured
  register, so every existing caller renders exactly as before.

  `@lcabrera/devkit`'s seeded `docs/decisions/README.md` is regenerated to match,
  so a freshly initialised repository's index does not fail its own `adr:verify` on
  the first run.

  The uniqueness sentence is also conditioned on `adrGrandfatheredDuplicates`. The
  duplicate check is home-agnostic, so a declared exemption lets one number name two
  ADRs inside a single home — a repository that declares one was being handed a
  generated page that contradicted its own directory.

- 6070e1f: The shipped `react-19` seed now teaches compiler-first memoization (not an
  absolute ban) and no inline `onClick={() =>`. It stays self-contained — project
  law is restated rather than linked — so a consumer repository gets no dead
  pointers.
- 0be6483: Shipped documentation names React Router rather than the major it is on.

  `@lcabrera/devkit`'s seeded `rules/routes-data.md`, `@lcabrera/ui`'s Form
  `ARCHITECTURE.md` and `INVENTORY.md`, and a `SelectField` comment all stated a
  major version as a present fact — as the shorthand `RR7` in most cases — and every
  one was a full major out of date, because the catalog has pinned the next one for
  some time.
  Nothing checks a version written into prose, which is why it went wrong quietly
  and why the wording is now the framework's name and its mode ("React Router
  framework mode"), which stays true across a major.

  A version still belongs in prose where it is a floor a reader must clear, such as
  the middleware reference's `requires v7.9.0+`; those are unchanged.

- 55211d7: Point `homepage`, `bugs` and `repository.url` at the repository's new name.

  The old URLs still resolve — GitHub redirects them — but only while the old name
  stays unregistered, and a published version's metadata can never be corrected in
  place. Every already-published version keeps the old URL permanently, so this is
  the first release whose links are right on their own.

  `@lcabrera/eslint-plugin` also changes what it prints into a consumer's lint
  output. ESLint shows `meta.docs.url` beside every finding, and none of the ten
  rules had a URL that resolved: eight emitted `https://example.com/rule/<name>`,
  the placeholder the first rule was scaffolded from, and two pointed at a
  `/rules/<name>` path this repository has never had. All ten now link to the
  rule's own section in the package README, which does exist, and they build that
  link from one shared factory instead of ten copies — the copies are what let
  eight of them drift.

## 0.2.0

### Minor Changes

- 0596ec7: The shipped CI workflows can now install on every runner, not just two of five.

  A shipped workflow starts on an empty runner, and the install step named
  whatever `init` inferred — which is right in your terminal and wrong there. On
  GitHub's `ubuntu24` image, after `actions/setup-node`, only `npm` and `yarn` are
  on PATH. `pnpm` and `bun` are not, and neither is `vp`, which is the sharper
  case: it is a project dependency, so installing it is the step that was about to
  run. Every workflow failed at that step with `exit 127`.

  Two changes fix it:

  - **Every workflow now enables corepack** before installing, which supplies the
    package manager `packageManager` pins, at that exact version. This is
    unconditional and harmless where Node already ships the manager.
  - **A new optional `ci.setup`** in `devkit.config.json` carries the extra steps a
    runner needs that corepack cannot supply. `init` fills it in for vite-plus and
    bun — pinned to a commit sha — and leaves it out for everyone else, so most
    repositories never see the key.

  The value is YAML lines, indented into place wherever a workflow carries
  `{{ci.setup}}`. An absent value resolves to no steps rather than to a missing
  key, so no file is ever held back for it — but a `ci.setup` that is present and
  is not an array of strings now fails when the config is read, naming the entry,
  rather than resolving to no steps and taking the hook out of every workflow.

  **If you already ran `init`,** the upgrade path is now one command:

  ```bash
  devkit init --upgrade && devkit sync
  ```

  `--upgrade` gets past the already-initialised refusal and adds only what is
  missing — here, the `ci` block your runner needs — while keeping every command
  you corrected and every block another package owns. It reports which of your
  values it left alone, printing what it would have inferred beside them — which is
  how a bumped action sha reaches a consumer who keeps their own `ci` block.

  Use `--upgrade`, not `--force`. `--force` also gets past the refusal, but it
  rewrites the config from the current inference: it would re-guess the commands
  this same command told you to check and correct.

- 9b28dc6: The agent-setup materialiser is now a published package, `@lcabrera/devkit`.

  It copies one repository's agent setup — skills, path rules, subagent
  definitions and the contracts they bind to — into another, and reports what has
  diverged since. `devkit init` turns an empty repository into a working one;
  `devkit sync` takes an upstream update without discarding a local edit;
  `devkit doctor` reports the difference.

  ```bash
  npm install --save-dev @lcabrera/devkit
  npx devkit init --profile agent
  ```

  Two properties are worth knowing before you install it.

  **It ships `.mjs` and does not build.** The `exports` map names the source files
  directly, because an `.mjs` file loads from `node_modules` as it is. There is no
  `dist`, and nothing to build before you can read what you installed.

  **`@lcabrera/repo-standards` is an optional peer.** A skill can declare a `peer:`
  range in its frontmatter; `sync` refuses to materialise that skill when the
  declared peer is absent or out of range, and reports it rather than writing a
  file whose instructions would not resolve. Skills with no such declaration
  materialise regardless, so the peer is only needed for the ones that name it.
