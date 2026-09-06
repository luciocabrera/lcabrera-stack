/*
 * The set of git variables that select a repository is defined once, in
 * `@lcabrera/repo-standards`, and copied wherever the definition cannot reach —
 * the pre-push hook is shell, so it cannot import it, and `@lcabrera/devkit`
 * declares the gates as an optional peer, so it cannot resolve them at all.
 *
 * These checks belong to the REPOSITORY: each asserts that one of this repo's
 * own files agrees with the shared list, which is the kind of edge a publishable
 * package must not carry. A divergence should fail here.
 */
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vite-plus/test';

import { GIT_REPOSITORY_VARIABLES as DEVKIT_VARIABLES } from '../../packages/devkit/scripts/git-exec.mjs';
import { GIT_REPOSITORY_VARIABLES } from '../../packages/repo-standards/scripts/git-exec.mjs';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const readRepoFile = (...parts) =>
  readFileSync(join(REPO_ROOT, ...parts), 'utf8');

describe('the repository-variable list', () => {
  it('matches the set @lcabrera/devkit scrubs before it makes a repository', () => {
    expect([...DEVKIT_VARIABLES].toSorted()).toEqual(
      [...GIT_REPOSITORY_VARIABLES].toSorted(),
    );
  });

  it('matches the set the pre-push hook scrubs', () => {
    const shell = readRepoFile('.vite-hooks/scrub-git-env.sh');
    const unset = new Set(
      [...shell.matchAll(/^unset (?<name>\w+)$/gmu)].map(
        (match) => match.groups.name,
      ),
    );

    for (const name of GIT_REPOSITORY_VARIABLES) {
      expect(unset.has(name), `${name} is not unset by the hook`).toBe(true);
    }
  });
});
