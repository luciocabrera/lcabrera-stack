/*
 * The set of git variables that select a repository is defined once, in
 * `@repo/repo-standards`, and copied wherever the definition cannot reach — the
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
  // A fourth copy now lives in the CQMS repository (#683 took the workspace
  // that held it). Nothing here can reach it, so that one is unguarded — say so
  // rather than letting two green assertions imply all copies agree.
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

  it('matches run-git.mjs in @repo/scan-report', () => {
    // A published package cannot import root tooling (ADR-039), so it carries
    // its own copy of the same discipline.
    const runner = readRepoFile('packages/scan-report/scripts/run-git.mjs');
    const listed = [...runner.matchAll(/'(?<name>GIT_[A-Z_]+)'/gu)].map(
      (match) => match.groups.name,
    );

    const byName = (a, b) => a.localeCompare(b);

    expect(listed.toSorted(byName)).toEqual(
      GIT_REPOSITORY_VARIABLES.toSorted(byName),
    );
  });
});
