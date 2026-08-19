/*
 * The branch-type vocabulary is defined once, in `@repo/repo-standards`, and
 * repeated once — `coordination-claim.sh` is bash and cannot import it.
 *
 * This check belongs to the REPOSITORY rather than to the package: it asserts
 * that one of this repo's own scripts agrees with the shared spec, which is
 * exactly the kind of edge a publishable package must not carry. A divergence
 * should fail here, not show up as a rejected push after the branch already
 * exists.
 */
import { validateBranchName } from '@repo/repo-standards/commit-convention';
import { describe, expect, it } from 'vite-plus/test';

import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

const errorsOf = (result) => result.errors ?? [];

describe('coordination-claim.sh', () => {
  it('accepts exactly the branch types the shared spec does', () => {
    const script = readFileSync(
      join(REPO_ROOT, 'scripts', 'coordination-claim.sh'),
      'utf8',
    );
    const line = /\n\s*(feat\|[a-z|]+)\)\s*;;/.exec(script);
    expect(line, 'type case-list not found in coordination-claim.sh').not.toBe(
      null,
    );
    for (const type of line[1].split('|')) {
      expect(errorsOf(validateBranchName(`${type}/1-x`))).toEqual([]);
    }
  });
});
