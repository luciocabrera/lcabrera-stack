# @lcabrera/repo-standards

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
