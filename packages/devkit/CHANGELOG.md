# @lcabrera/devkit

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
