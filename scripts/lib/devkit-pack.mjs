/**
 * Packing one distributed workspace and reading files back out of the tarball,
 * shared by the gates that exercise what a consumer receives rather than the
 * workspace link (ADR-073): verify-devkit-tarball.mjs and
 * verify-devkit-workspace.mjs.
 */

import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import process from 'node:process';

/**
 * @param {string} command
 * @param {string[]} args
 * @param {string} cwd
 * @returns {string}
 */
export const run = (command, args, cwd) =>
  execFileSync(command, args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

/**
 * @param {string} tarball
 * @returns {(target: string) => string | undefined}
 */
export const packedFileReader = (tarball) => (target) => {
  try {
    return run('tar', ['-xzOf', tarball, `package/${target}`], process.cwd());
  } catch {
    return undefined;
  }
};

/**
 * @param {{ directory: string, into: string, repoRoot: string }} args
 * @returns {{ manifest: Record<string, unknown>, tarball: string }}
 */
export const packOne = ({ directory, into, repoRoot }) => {
  const packageDir = join(repoRoot, 'packages', directory);
  const output = run('pnpm', ['pack', '--pack-destination', into], packageDir);
  const tarball = output
    .split('\n')
    .map((line) => line.trim())
    .findLast((line) => line.endsWith('.tgz'));

  if (tarball === undefined) {
    throw new Error(`pnpm pack produced no tarball for packages/${directory}`);
  }

  const packed = packedFileReader(tarball)('package.json');
  if (packed === undefined) {
    throw new Error(`the tarball for packages/${directory} holds no manifest`);
  }
  return { manifest: JSON.parse(packed), tarball };
};
