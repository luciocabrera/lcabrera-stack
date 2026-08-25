/*
 * The set of git variables that select a repository is defined once, in
 * `@lcabrera/repo-standards`, and copied wherever the definition cannot reach — the
 * pre-push hook is shell, and the scanners carry their own runner.
 *
 * These checks belong to the REPOSITORY: each asserts that one of this repo's
 * own files agrees with the shared list, which is the kind of edge a publishable
 * package must not carry. A divergence should fail here.
 */
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vite-plus/test';

import { GIT_REPOSITORY_VARIABLES } from '../../packages/repo-standards/scripts/git-exec.mjs';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const readRepoFile = (...parts) =>
  readFileSync(join(REPO_ROOT, ...parts), 'utf8');

describe('the repository-variable list', () => {
  // Copies exist because a shell hook, a package's runner and this module
  // cannot import from one another. Copies drift; this is the guard that makes
  // them fail loudly instead.
  //
  // Copies outside this repository cannot be reached, so they are unguarded —
  // say so rather than letting a green assertion imply all copies agree.
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
