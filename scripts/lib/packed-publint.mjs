/**
 * Packing each public workspace with pnpm and running publint over the
 * tarball (verify-packed-publint.mjs). pnpm is the packer because the release
 * publishes through it, and only pnpm substitutes `publishConfig.exports`, so
 * the `exports` publint reads are the ones a consumer installs (ADR-073).
 */

import { join } from 'node:path';

import { packDirectory } from './devkit-pack.mjs';
import { publintGate } from './devkit-tarball-publint.mjs';

export const EMPTY_ROSTER =
  'no public package was found, so publint linted nothing — the roster is the workspaces whose .gitignore covers eslint-suppressions.json';

/**
 * @param {{ dirs: string[], into: string, repoRoot: string }} args
 * @returns {Promise<{ findings: string[], lines: string[] }>}
 */
export const packedPublint = async ({ dirs, into, repoRoot }) => {
  if (dirs.length === 0) return { findings: [EMPTY_ROSTER], lines: [] };
  const tarballs = dirs.map(
    (dir) => packDirectory({ into, packageDir: join(repoRoot, dir) }).tarball,
  );
  return publintGate({ into, tarballs });
};
