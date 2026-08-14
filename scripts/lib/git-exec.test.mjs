import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vite-plus/test';

import { buildGitEnv, GIT_REPOSITORY_VARIABLES, runGit } from './git-exec.mjs';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

const readRepoFile = (relativePath) =>
  readFileSync(join(REPO_ROOT, relativePath), 'utf8');

describe('buildGitEnv', () => {
  it('removes every repository-selecting variable', () => {
    const env = buildGitEnv({
      GIT_DIR: '/elsewhere/.git',
      GIT_INDEX_FILE: '/elsewhere/index',
      GIT_WORK_TREE: '/elsewhere',
      HOME: '/home/dev',
    });

    for (const name of GIT_REPOSITORY_VARIABLES) {
      expect(env[name]).toBeUndefined();
    }
  });

  it('keeps the rest of the environment', () => {
    // A denylist on purpose: git needs HOME for global config, which is where
    // safe.directory lives. Dropping it would trade one silent failure for
    // another.
    expect(buildGitEnv({ HOME: '/home/dev', LANG: 'C' })).toMatchObject({
      HOME: '/home/dev',
      LANG: 'C',
    });
  });

  it('pins PATH to fixed system directories, overriding any inherited one', () => {
    expect(buildGitEnv({ PATH: '/tmp/evil:/usr/bin' }).PATH).toBe(
      '/usr/local/bin:/usr/bin:/bin',
    );
  });
});

describe('the repository-variable list', () => {
  // Copies exist because a shell hook, a TypeScript package util, a published
  // package's runner and this module cannot import from one another. Copies
  // drift; this is the guard that makes them fail loudly instead.
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

  it('matches buildGitChildEnv in @repo/scan-ingestion', () => {
    const util = readRepoFile(
      'packages/scan-ingestion/src/ingestion/git/buildGitChildEnv.util.ts',
    );
    const listed = [...util.matchAll(/'(?<name>GIT_[A-Z_]+)'/gu)].map(
      (match) => match.groups.name,
    );

    const byName = (a, b) => a.localeCompare(b);

    expect(listed.toSorted(byName)).toEqual(
      GIT_REPOSITORY_VARIABLES.toSorted(byName),
    );
  });
});

describe('runGit', () => {
  it('returns trimmed stdout for a command that succeeds', () => {
    expect(runGit({ args: ['--version'], cwd: REPO_ROOT })).toMatch(
      /^git version /u,
    );
  });

  it('returns undefined rather than throwing when git fails', () => {
    // Callers branch on the absent answer; a throw here would take out the
    // whole gate because one branch could not be read.
    expect(
      runGit({ args: ['rev-parse', '--verify', 'nope'], cwd: '/' }),
    ).toBeUndefined();
  });
});
