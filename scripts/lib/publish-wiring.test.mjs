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
import { publicPackageDirs as derivedPublicPackageDirs } from '../../packages/repo-standards/scripts/coverage-workspaces.mjs';
import {
  buildPublishExports,
  isBuiltPublicPackage,
} from '../../packages/repo-standards/scripts/publish-surface.mjs';
import { releasePackerProblems } from '../../packages/repo-standards/scripts/release-packer.mjs';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const RELEASE_WORKFLOW = join(REPO_ROOT, '.github', 'workflows', 'release.yml');

const { packagesDir, publicPackageDirs } = readPublishing(REPO_ROOT);

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

const builtPackages = publicPackageDirs.filter((directory) =>
  isBuiltPublicPackage(readManifest(directory)),
);

describe('this repository publishes what it develops against', () => {
  it('declares the same roster the never-baseline rule is resolved from', () => {
    const declared = [...publicPackageDirs]
      .map((directory) => `${packagesDir}/${directory}`)
      .sort((left, right) => left.localeCompare(right));
    expect(declared.length).toBeGreaterThan(0);
    expect(
      declared,
      'This couples two rules that coincide today but are stated separately: ' +
        'a package publishes because its manifest is not private, and it never ' +
        'baselines because it gitignores eslint-suppressions.json. If they ever ' +
        'legitimately diverge, change the rule that permits it before changing ' +
        'this assertion.',
    ).toEqual(derivedPublicPackageDirs(REPO_ROOT));
  });

  it('reproduces every built package’s committed publishConfig.exports', () => {
    expect(builtPackages.length).toBeGreaterThan(0);

    for (const directory of builtPackages) {
      const manifest = readManifest(directory);

      expect(buildPublishExports(manifest.exports)).toEqual(
        manifest.publishConfig.exports,
      );
      expect(manifest.files).toContain('dist');
    }
  });

  it('classifies each package the way its manifest says', () => {
    const sourceShipping = publicPackageDirs.filter(
      (directory) => !isBuiltPublicPackage(readManifest(directory)),
    );

    expect(sourceShipping).toEqual(['devkit', 'repo-standards', 'ui']);
  });

  it('declares no workspace-protocol peer on a published package', () => {
    const workspacePeers = publicPackageDirs.flatMap((directory) =>
      Object.entries(readManifest(directory).peerDependencies ?? {})
        .filter(([, range]) => range.startsWith('workspace:'))
        .map(([name, range]) => `${directory}: ${name}@${range}`),
    );

    expect(workspacePeers).toEqual([]);
  });

  it('ships no TypeScript from a package that does not build', () => {
    const unbuilt = publicPackageDirs
      .filter((directory) => directory !== 'ui')
      .filter((directory) => !isBuiltPublicPackage(readManifest(directory)));

    expect(unbuilt.length).toBeGreaterThan(0);

    for (const directory of unbuilt) {
      const manifest = readManifest(directory);
      const targets = [
        ...Object.values(manifest.exports ?? {}),
        ...Object.values(manifest.bin ?? {}),
      ].filter((target) => target !== './package.json');

      expect(targets.length).toBeGreaterThan(0);
      expect(targets.filter((target) => !/\.[mc]js$/.test(target))).toEqual([]);
    }
  });

  it('bumps a peer dependent only when the new version leaves its range', () => {
    const config = JSON.parse(
      readFileSync(join(REPO_ROOT, '.changeset', 'config.json'), 'utf8'),
    );

    expect(
      config.___experimentalUnsafeOptions_WILL_CHANGE_IN_PATCH
        ?.onlyUpdatePeerDependentsWhenOutOfRange,
    ).toBe(true);

    expect(config.onlyUpdatePeerDependentsWhenOutOfRange).toBeUndefined();
  });

  it('plans no release that takes a package out of pre-1.0', async () => {
    const { changesets, releases } = await getReleasePlan(REPO_ROOT);

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
