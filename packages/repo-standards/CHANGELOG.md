# @lcabrera/repo-standards

## 0.4.0

### Minor Changes

- d15da5e: Make `repo-adr --dry-run` report the decision it reached instead of printing the
  template it read.

  The dry run used to write the whole rendered record to stdout: the ADR template,
  with its instruction comment stripped and its heading filled in. The template is
  not the package's file. Its directory is `registers.adrTemplateHome`, which the
  installing repository sets, so a preview echoed the bytes of a file at a path
  chosen outside the package to the terminal and to whatever collects the
  terminal's output.

  It now prints one line — the path it would write, the number it took and the
  title you gave it:

  ```
  would write docs/decisions/ADR-107-a-decision.md as ADR-107 — A decision
  ```

  That is what the flag exists to confirm. The number and the home are the two
  things a new record gets wrong, and both are in the path; the body under them is
  a file you already have.

  The template is still rendered on this path, so a dry run against a template that
  has lost its `# ADR-NNN — …` heading still fails with the same message rather
  than passing and failing on the write.

  `scaffoldSummary` is new on the `./adr-scaffold` subpath, alongside `renderAdr`,
  for anyone building a different front end over the same scaffold.

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

### Patch Changes

- ad03a24: Make the published READMEs readable with only the installed package on disk.
  Every relative link that escaped the package directory is now the absolute URL
  the other READMEs already use, the two-package split states its reasoning
  instead of only citing the ADR that holds it, and the three references to files
  that travel in the repository but not in an install say so.
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

## 0.3.0

### Minor Changes

- 4f2e1ae: The ADR duplicate-number exemption is configuration, and defaults to none.

  `GRANDFATHERED_DUPLICATES` was a module constant holding `001`–`005` and `008` —
  one repository's historical overlap from when each of its ADR homes ran its own
  sequence from 001, baked into a shared package. It exempted five numbers that
  most consumers never duplicated, and a number the gate permits twice is a
  citation that can silently point at the wrong document.

  It is now `registers.adrGrandfatheredDuplicates`, alongside `adrHomes` and the
  rest, and it defaults to `[]` for the same reason `publicPackageDirs` does: an
  overlap is the host repository's own history and cannot be guessed.

  **Migration.** A repository whose homes genuinely reuse a number — it passed
  `vp run adr:verify` before and now fails with "ADR-0NN is used by 2 documents" —
  declares those numbers:

  ```json
  { "registers": { "adrGrandfatheredDuplicates": [5] } }
  ```

  Entries that are not positive integers are dropped. A repository with no overlap
  declares nothing and gets a stricter gate: numbers that were silently exempt are
  now checked like every other, and any new repeat is rejected.

- 0834cac: New `parseThreadId` export on `./cli-input`, alongside `parsePullNumber` and
  `parseRepository`. It accepts a GitHub GraphQL node id in either format still in
  circulation and refuses anything a spawned CLI would parse as a flag rather than
  a value — see ADR-089.

### Patch Changes

- 6293d32: `adrFindings` accepts the grandfathered-duplicate set as an option, defaulting to
  the configured register.

  Behaviour is unchanged for every caller: omit the option and it reads
  `registers.adrGrandfatheredDuplicates` exactly as before.

  The reason is coverage, not flexibility. The set is read from config and is empty
  by default, so in a repository that declares no overlaps the `> 2` branch of the
  duplicate check is unreachable from a test — deleting it left the whole suite
  green. It is not dead code: the register exists so a consuming repository can
  declare its own overlaps, which makes that branch live product behaviour. It is
  now driven from a synthetic set, and both cases — a grandfathered number passing
  twice, and failing on a third use — are asserted.

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

- eb13e5e: Two application-specific crosscutting commit scopes are no longer recognised.
  They named applications in one particular repository, which is not something a
  shared standard should carry. An unrecognised scope has always been a
  non-blocking hint rather than a failure, so no commit that passed before starts
  failing — either one now prints the same "not a known workspace or area" line
  any other unknown scope gets.

## 0.2.0

### Minor Changes

- 9b28dc6: The repository gates are now a published package, `@lcabrera/repo-standards`.

  They keep a repository's commits, branches, pull requests, issues, coordination
  register, architecture decisions and published packages to one enforced shape —
  and they ship as commands, so a repository runs them from its own hooks and CI
  without vendoring a script.

  ```bash
  npm install --save-dev @lcabrera/repo-standards
  npx repo-verify-commit .git/COMMIT_EDITMSG
  ```

  **Every repository fact these gates need is configuration, not a constant.**
  `devkit.config.json` supplies the default branch, the shared-branches directory,
  the ADR homes and the public-package roster; the package hardcodes none of them.
  A gate that told a repository to "retarget to `main`" when its default branch is
  named something else would be reporting a failure that is not one, so it reads
  the name instead. The file is shared with `@lcabrera/devkit` — it is the
  consumer's data, and two files invite drift between them — but each package
  reads only the block it owns.

  Like `@lcabrera/devkit`, this package ships `.mjs` and does not build: the
  `exports` map and the `bin` entries name the source files directly.
