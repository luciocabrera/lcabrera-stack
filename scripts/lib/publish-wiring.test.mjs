/**
 * The publishing assumptions this repository has to keep, asserted against this
 * repository — not against the package that encodes them.
 *
 * `@lcabrera/repo-standards` owns the rules (`publish-surface.mjs` derives what a
 * tarball must expose; `release-packer.mjs` states what a pnpm publish depends
 * on). Neither can assert that THIS tree still satisfies them without naming a
 * repository fact, which is the one thing a package meant for other
 * repositories must not do. So the rules travel and the facts stay here, the
 * same split `git-exec-drift.test.mjs` and `branch-type-drift.test.mjs` make.
 *
 * What they defend: consumers install `publishConfig.exports`, which points at
 * `dist`, while `exports` points at `src` so no workspace has to build before
 * it can typecheck. Only the second map is ever exercised in this repo, so
 * drift in the first is invisible until someone installs the package — and the
 * substitution that produces it happens only because changesets shells out to
 * pnpm. Nothing else here says so.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import getReleasePlan from '@changesets/get-release-plan';
import { describe, expect, it } from 'vite-plus/test';

import { readPublishing } from '../../packages/repo-standards/scripts/config.mjs';
import {
  buildPublishExports,
  isBuiltPublicPackage,
} from '../../packages/repo-standards/scripts/publish-surface.mjs';
import { releasePackerProblems } from '../../packages/repo-standards/scripts/release-packer.mjs';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const RELEASE_WORKFLOW = join(REPO_ROOT, '.github', 'workflows', 'release.yml');

const { packagesDir, publicPackageDirs } = readPublishing(REPO_ROOT);

/**
 * Packages that have deliberately left beta, and why.
 *
 * The gate below refuses to take any package out of `0.x`, because Changesets
 * turns a `major` on a `0.x` package into `1.0.0` and an npm version is
 * permanent. Promoting one is a decision, so it is recorded here with its
 * reason rather than made by editing an assertion — an edited assertion leaves
 * no trace of why, which is the whole thing this gate exists to prevent.
 *
 * Empty on purpose: nothing here has left beta yet.
 */
const STABLE_PACKAGES = new Map([
  // ['@lcabrera/example', 'promoted in #000 — the API has not moved since …'],
]);

const readManifest = (directory) =>
  JSON.parse(
    readFileSync(
      join(REPO_ROOT, packagesDir, directory, 'package.json'),
      'utf8',
    ),
  );

/**
 * Taken from the roster rather than written out, so a package is covered the
 * day it is published rather than the day someone remembers this file. The
 * hardcoded list this replaced named three of them and the test above it
 * claimed to check every one.
 */
const builtPackages = publicPackageDirs.filter((directory) =>
  isBuiltPublicPackage(readManifest(directory)),
);

describe('this repository publishes what it develops against', () => {
  it('reproduces every built package’s committed publishConfig.exports', () => {
    // An empty roster would pass this silently, which reads the same as clean.
    expect(builtPackages.length).toBeGreaterThan(0);

    // Catches a hand-edit to package.json that the generator would not produce.
    for (const directory of builtPackages) {
      const manifest = readManifest(directory);

      expect(buildPublishExports(manifest.exports)).toEqual(
        manifest.publishConfig.exports,
      );
      expect(manifest.files).toContain('dist');
    }
  });

  it('classifies each package the way its manifest says', () => {
    // Three packages ship source, for two unrelated reasons, and the difference
    // is what the next test checks.
    //
    // `ui` cannot be prebuilt: StyleX derives theme identity from the source
    // path, so a consumer's own plugin has to compile it. `devkit` and
    // `repo-standards` need no build at all — they are `.mjs`, which loads from
    // `node_modules` as it is. If any of them gains a `build` script this test
    // should fail loudly rather than the gate silently demanding a dist/ that
    // must not exist.
    //
    // Asserted as the whole exception rather than one case, since `builtPackages`
    // is derived by the same predicate and could not contradict itself.
    const sourceShipping = publicPackageDirs.filter(
      (directory) => !isBuiltPublicPackage(readManifest(directory)),
    );

    expect(sourceShipping).toEqual(['devkit', 'repo-standards', 'ui']);
  });

  it('declares no workspace-protocol peer on a published package', () => {
    // pnpm substitutes `workspace:*` at pack time in `peerDependencies` too, and
    // the substitution is to the EXACT current version — so a workspace-protocol
    // peer publishes as a pin, not a range. These packages are versioned
    // independently by Changesets, so the first release that moves one and not
    // the other leaves every consumer with an unmet peer, and `npm install`
    // resolving the peer to `latest` fails outright.
    //
    // Invisible in this repo, where `workspace:*` resolves the sibling directory
    // and the pin never exists. An npm version is permanent, so it has to be
    // caught before the publish rather than after.
    //
    // `dependencies` are deliberately not checked: there the substitution is
    // what makes a workspace dependency resolvable at all.
    const workspacePeers = publicPackageDirs.flatMap((directory) =>
      Object.entries(readManifest(directory).peerDependencies ?? {})
        .filter(([, range]) => range.startsWith('workspace:'))
        .map(([name, range]) => `${directory}: ${name}@${range}`),
    );

    expect(workspacePeers).toEqual([]);
  });

  it('ships no TypeScript from a package that does not build', () => {
    // What makes "no build needed" true for `devkit` and `repo-standards` is
    // the extension, not the intention: Node refuses to strip types inside
    // `node_modules` (ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING), so a `.ts`
    // target in either map would be unloadable for every consumer while
    // resolving perfectly in this repo, where nothing reads the published maps.
    //
    // `ui` is excluded because it is the opposite case — it ships `.ts`
    // deliberately, and its consumer compiles it.
    const unbuilt = publicPackageDirs
      .filter((directory) => directory !== 'ui')
      .filter((directory) => !isBuiltPublicPackage(readManifest(directory)));

    // An empty list would pass having checked nothing.
    expect(unbuilt.length).toBeGreaterThan(0);

    for (const directory of unbuilt) {
      const manifest = readManifest(directory);
      const targets = [
        ...Object.values(manifest.exports ?? {}),
        ...Object.values(manifest.bin ?? {}),
      ].filter((target) => target !== './package.json');

      expect(targets.length).toBeGreaterThan(0);
      expect(targets.filter((target) => !target.endsWith('.mjs'))).toEqual([]);
    }
  });

  it('bumps a peer dependent only when the new version leaves its range', () => {
    // Changesets bumps a package that PEERS on another workspace package to
    // `major` whenever that dependency gets anything above a patch — and by
    // default it does so without consulting the declared range, so a range
    // written to let the two move independently buys nothing. Left at the
    // default, `@lcabrera/devkit` planned `1.0.0` off its own `minor`
    // changeset, and every later minor of `@lcabrera/repo-standards` would
    // force another devkit major.
    //
    // Invisible until this repository had two published packages with a peer
    // edge between them: `privatePackages: false` kept them out of the release
    // plan entirely while they were private.
    const config = JSON.parse(
      readFileSync(join(REPO_ROOT, '.changeset', 'config.json'), 'utf8'),
    );

    expect(
      config.___experimentalUnsafeOptions_WILL_CHANGE_IN_PATCH
        ?.onlyUpdatePeerDependentsWhenOutOfRange,
    ).toBe(true);

    // The same name at the top level parses without complaint and does
    // nothing — changesets reads it only from the nested object. A reader who
    // "fixes" this by hoisting it would get a green config and the old plan.
    expect(config.onlyUpdatePeerDependentsWhenOutOfRange).toBeUndefined();

    // The key's own name warns that it can move in a patch release, and this
    // test would still pass if changesets stopped reading it. What checks the
    // behaviour is `pnpm exec changeset status --verbose`: no published package
    // should be listed under "bumped at major" without a changeset asking for
    // one.
  });

  it('plans no release that takes a package out of pre-1.0', async () => {
    // Asked of the PLANNED RELEASE, not of the changeset text. Every public
    // package here is beta, and Changesets takes `major` on a `0.x` package
    // straight to `1.0.0` — so a promotion is not "this breaks", it is "this
    // API is now stable", and an npm version is permanent.
    //
    // Scanning declarations was tried and was wrong twice: first matching only
    // a single-quoted package name, then only a bare bump value. YAML also
    // admits `'@lcabrera/ui': 'major'`, `{ '@lcabrera/ui': major }` and a
    // trailing comment, and Changesets honours every one — so a pattern keeps
    // reporting the same clean pass a repository with no promotion gets.
    //
    // The plan cannot be spelled around: it is the tool's own resolution. It
    // also catches a promotion nothing declares — a peer dependent dragged to
    // `1.0.0` by the package it peers on, which is the trap
    // `onlyUpdatePeerDependentsWhenOutOfRange` exists to disarm.
    //
    // Read through the API, not the `changeset status` CLI: that command also
    // asks git which packages changed since the trunk, and CI checks out
    // without a local `main`, so it fails there while passing on any developer
    // machine. `getReleasePlan` touches no git at all.
    const { changesets, releases } = await getReleasePlan(REPO_ROOT);

    // Only the changesets that declared the `major`, not every changeset that
    // touches the package — `release.changesets` is the latter, and for a busy
    // package that is a list too long to act on. An empty answer is the useful
    // one: nothing declared it, so it arrives through a peer edge.
    const declaredIn = (name) =>
      changesets
        .filter((changeset) =>
          changeset.releases.some(
            (release) => release.name === name && release.type === 'major',
          ),
        )
        .map((changeset) => changeset.id);

    const promotions = releases
      .filter(
        (release) =>
          release.oldVersion.startsWith('0.') &&
          !release.newVersion.startsWith('0.') &&
          !STABLE_PACKAGES.has(release.name),
      )
      .map((release) => {
        const sources = declaredIn(release.name);
        const origin =
          sources.length > 0
            ? `declared major in ${sources.join(', ')}`
            : 'declared by no changeset, so it arrives through a peer edge';
        return `${release.name}: ${release.oldVersion} would become ${release.newVersion} — ${origin}`;
      });

    expect(promotions).toEqual([]);
  });

  it('gitignores dist so a build is never committed', () => {
    const ignored = readFileSync(join(REPO_ROOT, '.gitignore'), 'utf8');

    expect(ignored.split('\n')).toContain('dist');
  });

  it('still publishes through pnpm', () => {
    expect(
      releasePackerProblems({
        lockfiles: readdirSync(REPO_ROOT),
        packageManager: JSON.parse(
          readFileSync(join(REPO_ROOT, 'package.json'), 'utf8'),
        ).packageManager,
        workflowText: readFileSync(RELEASE_WORKFLOW, 'utf8'),
      }),
    ).toEqual([]);
  });
});
