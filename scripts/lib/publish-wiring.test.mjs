/**
 * The publishing assumptions this repository has to keep, asserted against this
 * repository — not against the package that encodes them.
 *
 * `@repo/repo-standards` owns the rules (`publish-surface.mjs` derives what a
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

import { describe, expect, it } from 'vite-plus/test';

import {
  buildPublishExports,
  isBuiltPublicPackage,
} from '../../packages/repo-standards/scripts/publish-surface.mjs';
import { releasePackerProblems } from '../../packages/repo-standards/scripts/release-packer.mjs';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const RELEASE_WORKFLOW = join(REPO_ROOT, '.github', 'workflows', 'release.yml');

const readManifest = (directory) =>
  JSON.parse(
    readFileSync(
      join(REPO_ROOT, 'packages', directory, 'package.json'),
      'utf8',
    ),
  );

describe('this repository publishes what it develops against', () => {
  it('reproduces every built package’s committed publishConfig.exports', () => {
    // Catches a hand-edit to package.json that the generator would not produce.
    for (const directory of ['api', 'server', 'utils']) {
      const manifest = readManifest(directory);

      expect(buildPublishExports(manifest.exports)).toEqual(
        manifest.publishConfig.exports,
      );
      expect(manifest.files).toContain('dist');
    }
  });

  it('classifies each package the way its manifest says', () => {
    // ui cannot be prebuilt: StyleX derives theme identity from the source path,
    // so a consumer's own plugin has to compile it. If it ever gains a `build`
    // script this test should fail loudly rather than the gate silently
    // demanding a dist/ that must not exist.
    expect(isBuiltPublicPackage(readManifest('ui'))).toBe(false);

    for (const directory of ['api', 'server', 'utils']) {
      expect(isBuiltPublicPackage(readManifest(directory))).toBe(true);
    }
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
