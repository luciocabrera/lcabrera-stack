# @lcabrera/vite-config

## 0.4.1

### Patch Changes

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

- Updated dependencies [62bb601]
- Updated dependencies [a26ff71]
  - @lcabrera/eslint-plugin@0.3.1

## 0.4.0

### Minor Changes

- ff3a7cb: New rule `no-habit-return-types`, enabled in both shared ESLint configs.

  It removes a return-type annotation TypeScript would have written itself, and it
  is auto-fixable. An explicit return type is sometimes deliberate — it can promise
  callers **less** than the function really returns — and that is indistinguishable
  in the source text from a redundant one. Telling them apart needs a type checker,
  which this plugin does not have.

  So the rule reports only annotations that cannot be hiding anything, because the
  body shape fixes the inferred type exactly: `void` and `Promise<void>` on a block
  body that returns no value and whose end point is plainly reachable, `boolean`
  where every return carries a comparison or a boolean literal, and `JSX.Element`
  where every return carries JSX — both under the same reachability condition,
  because a body that can fall off its end returns `undefined` on that path and
  inference gives `T | undefined`. Everywhere else it is silent — so a
  deliberate widening is never flagged, and the rule has no options and nothing to
  disable.

  The `void` arms ask whether the body can reach its bottom, because that is the
  question that separates `void` from `never`: TypeScript infers `never` for a
  function that neither returns nor reaches its bottom, so an annotation there is
  widening `never` to `void` and must not be removed. An `if`/`else` where both
  arms throw, a `switch` whose `default` throws, `for (;;)` and a throwing
  `finally` all make the bottom unreachable, while a guard clause — `if (bad)
{ throw … }` — does not, and is reported.

  **One case is out of reach and stays wrong.** A call to a function declared
  `(): never` also makes the bottom unreachable, so `(): void => { process.exit(1); }`
  infers `never` and this rule removes the annotation anyway. Deciding it means
  resolving the callee's signature, which needs a type checker this plugin does not
  have. The rule is auto-fixable and has nothing to disable, so if you meet this the
  annotation has to be restored by hand. Closing it properly needs a type-aware
  rule; it is stated here rather than left to be found.

  **Consumers of `@lcabrera/vite-config` get this as an error on their next
  upgrade.** It is auto-fixable, so `eslint --fix` clears it; the findings it
  raises are annotations their own compiler already reproduces.

  The trade is deliberate: `(): string` over a body returning a `string` is a habit
  this rule will not catch, because the same annotation over a body returning
  `'a' | 'b'` is a widening.

### Patch Changes

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

- Updated dependencies [ff3a7cb]
- Updated dependencies [55211d7]
  - @lcabrera/eslint-plugin@0.3.0

## 0.3.0

### Minor Changes

- 4022625: The `eslint-plugin-unicorn` peer range moves to `^73.0.0`.

  **This is the breaking part:** the range no longer admits unicorn 72, so a
  consumer staying on 72 gets an unmet peer and must move with it.

  unicorn 73's recommended set adds `unicorn/single-line-block-comment-style`. The
  shared config turns it **off** for now, so upgrading does not silently impose a
  new comment style on anyone consuming this config.

  The rule's default option is `multiline`, and applied to a codebase that writes
  one-line doc comments its fixer rewrites

  ```ts
  /** One page of distinct values for a column. */
  ```

  into

  ```ts
  /*
  One page of distinct values for a column.
  */
  ```

  — a block comment with no `*` prefix on its content line, which is no longer
  JSDoc. Its other option, `single-line`, enforces the opposite direction. Picking
  between the two is a house-style decision rather than a correctness one, and it
  is deferred rather than settled: the entry in `SHARED_PLUGIN_RULE_SEVERITIES`
  carries the reason and names the issue that decides it.

  A consumer who wants the rule can enable it with either option; nothing here
  prevents that, and a comment already in canonical JSDoc form (`/**` followed by
  `* `-prefixed lines) is exempt under both.

## 0.2.0

### Minor Changes

- 1bac0d7: The repo's shared toolchain configuration is now a published package,
  `@lcabrera/vite-config`. It carries the Vite+ `fmt`/`lint`/`pack`/`run` factories
  and the two ESLint flat configs — the settings a monorepo otherwise copies into
  every workspace — plus the React Router asset-fix Vite plugin, folded in from
  what was a separate one-export package.

  ```ts
  // vite.config.ts, at the repo root
  import { createFmtConfig } from '@lcabrera/vite-config/fmt';
  import { createLintConfig } from '@lcabrera/vite-config/lint';
  import { defineConfig } from 'vite-plus';

  export default defineConfig({
    fmt: createFmtConfig({ ignorePatterns: ['build/'] }),
    lint: createLintConfig({
      workspaceRuntimes: {
        browser: ['apps/web/**'],
        node: ['packages/tooling/**'],
      },
    }),
  });
  ```

  Nine subpaths: `./fmt`, `./lint`, `./pack`, `./plugins`, `./run`,
  `./eslint-custom-rules`, `./eslint-base-custom-rules`, `./eslint-restrictions`
  and `./fixReactRouterAssets`.

  **Nothing here hardcodes a directory of ours.** Three things did, and each became
  an argument whose default is "none": the Oxlint workspace roster
  (`createLintConfig({ workspaceRuntimes })`), the StyleX source alias
  (`createReactRouterPluginsConfig({ stylexAliases })`) and the env files the
  `start` task sources (`createReactRouterRunConfig({ envFiles })`, defaulting to
  the app's own `.env` alone — a bare `react-router-serve` inherits no environment
  at all, which is the failure that option exists for).

  **Import boundaries are tables you pass in, not switches you turn on.**
  `createCustomRulesLintConfig` took `enforceUiPublicImportBoundary` /
  `enforceServerClientImportBoundary` booleans that enabled tables naming packages
  of ours; it now takes `publicImportBoundaryPatterns` and
  `serverOnlySyntaxRestrictions`. `./eslint-restrictions` publishes the generic
  tables to compose into them — barrels, state libraries, the test runner, the
  `node:` protocol and the `pg` driver. Compose rather than re-declare: ESLint flat
  config replaces a rule wholesale when a later block sets it again, so a second
  `no-restricted-syntax` block silently drops the first one's restrictions.

  **The peer list is long, and that is the honest cost.** Every ESLint and Vite
  plugin this composes is a peer, so a consumer never resolves a second copy of
  one; the five only `./plugins` reaches are optional peers. One trap:
  `./eslint-custom-rules` resolves its plugins from the consuming project's
  `tsconfigRootDir` rather than from this package, so the project running ESLint
  must declare the React plugin set itself. The declared ranges are the versions
  this package is exercised against.

  Published as compiled ESM (`.mjs` + `.d.mts`) with source maps, one output per
  source module, `"sideEffects": false`. The ESLint configs ship as JavaScript,
  because flat config is JavaScript; their declarations are generated from the
  source's JSDoc.

### Patch Changes

- Updated dependencies [c678c77]
- Updated dependencies [22c5efb]
  - @lcabrera/eslint-plugin@0.2.0
