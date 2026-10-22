/**
 * Runs publint over the packed tarball of every public package, after
 * `packages:build`, so an `exports` or `publishConfig.exports` target the
 * tarball does not hold fails before a version is published. `tarball:verify`
 * packs only the `.mjs` packages it installs; this gate covers the roster
 * `vp run suppressions:packages` prints (ADR-073).
 *
 * Usage: node scripts/verify-packed-publint.mjs   (after `vp run packages:build`)
 * Exit codes: 0 = every tarball linted clean and the planted fault was caught,
 *             1 = a publint error, an empty roster, or a pack that failed.
 */

import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import process from 'node:process';

import { publicPackageDirs } from '../packages/repo-standards/scripts/public-package-dirs.mjs';
import { packedPublint } from './lib/packed-publint.mjs';

const REPO_ROOT = process.cwd();

const main = async () => {
  const into = mkdtempSync(join(tmpdir(), 'packed-publint-'));
  try {
    const dirs = publicPackageDirs(REPO_ROOT);
    const { findings, lines } = await packedPublint({
      dirs,
      into,
      repoRoot: REPO_ROOT,
    });
    process.stdout.write(lines.join(''));
    if (findings.length > 0) {
      process.stderr.write(
        `\npublint over the packed public packages — ${findings.length} finding(s):\n\n${findings.map((finding) => `  • ${finding}\n`).join('')}`,
      );
      process.exitCode = 1;
      return;
    }
    process.stdout.write(
      `publint passed: ${dirs.length} public package(s) packed with pnpm and linted with no error, and a planted missing export was caught.\n`,
    );
  } finally {
    rmSync(into, { force: true, recursive: true });
  }
};

try {
  await main();
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
}
