import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterEach, describe, expect, it } from 'vite-plus/test';

// The invariant these assertions defend: nothing a git hook runs may reach the
// real repository through git's inherited environment.
//
// Git exports GIT_DIR to every hook, and it overrides the working directory for
// any `git` the hook spawns. `readGitMetadata.util.test.ts` builds a throwaway
// repo with `git init` + `git add .`; run under a hook, that re-initialises the
// real repository and stages the deletion of every tracked file, because
// `git add .` has staged deletions as well as additions since Git 2.0. HEAD is
// left alone, so nothing looks wrong until the NEXT commit writes a near-empty
// tree. Two commits were lost that way.
//
// The first test reproduces the damage against throwaway repositories, so the
// mechanism is asserted rather than described. The second checks the hook still
// carries the guard.

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const GIT_IDENTITY = [
  '-c',
  'user.email=test@example.com',
  '-c',
  'user.name=Test',
];

const temporaryDirectories = [];

const makeTemporaryDirectory = () => {
  const directory = mkdtempSync(join(tmpdir(), 'git-env-scrub-'));
  temporaryDirectories.push(directory);
  return directory;
};

const git = ({ args, cwd, env }) =>
  execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    env: env ?? process.env,
    stdio: ['ignore', 'pipe', 'ignore'],
  });

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { force: true, recursive: true });
  }
});

describe('inherited git environment', () => {
  it('lets a temp-repo command wipe another repository index', () => {
    const real = makeTemporaryDirectory();
    git({ args: ['init', '-q'], cwd: real });
    writeFileSync(join(real, 'a.txt'), 'a\n');
    writeFileSync(join(real, 'b.txt'), 'b\n');
    git({ args: ['add', '.'], cwd: real });
    git({ args: [...GIT_IDENTITY, 'commit', '-qm', 'init'], cwd: real });

    expect(
      git({ args: ['ls-files'], cwd: real })
        .trim()
        .split('\n'),
    ).toEqual(['a.txt', 'b.txt']);

    // Exactly what a hook hands to everything it spawns.
    const inherited = { ...process.env, GIT_DIR: join(real, '.git') };
    const scratch = makeTemporaryDirectory();
    git({ args: ['add', '.'], cwd: scratch, env: inherited });

    // The other repository's index is now empty, while its HEAD is untouched —
    // which is precisely why this is invisible until the next commit.
    expect(git({ args: ['ls-files'], cwd: real }).trim()).toBe('');
    expect(
      git({ args: ['ls-tree', 'HEAD', '--name-only'], cwd: real }).trim(),
    ).toBe('a.txt\nb.txt');
  });

  it('is neutralised once the scrub has been applied', () => {
    const real = makeTemporaryDirectory();
    git({ args: ['init', '-q'], cwd: real });
    writeFileSync(join(real, 'a.txt'), 'a\n');
    git({ args: ['add', '.'], cwd: real });
    git({ args: [...GIT_IDENTITY, 'commit', '-qm', 'init'], cwd: real });

    // Same call, with the variables the hook unsets removed.
    const { GIT_DIR: _removed, ...scrubbed } = {
      ...process.env,
      GIT_DIR: join(real, '.git'),
    };
    const scratch = makeTemporaryDirectory();
    git({ args: ['init', '-q'], cwd: scratch, env: scrubbed });
    git({ args: ['add', '.'], cwd: scratch, env: scrubbed });

    expect(git({ args: ['ls-files'], cwd: real }).trim()).toBe('a.txt');
  });
});

describe('the pre-push hook', () => {
  const hook = readFileSync(join(REPO_ROOT, '.vite-hooks', 'pre-push'), 'utf8');

  it('sources the scrub before running any task', () => {
    const scrubAt = hook.indexOf('scrub-git-env.sh');
    const firstTaskAt = hook.indexOf('vp run');

    expect(scrubAt).toBeGreaterThan(-1);
    expect(firstTaskAt).toBeGreaterThan(-1);
    expect(scrubAt).toBeLessThan(firstTaskAt);
  });

  it('unsets every variable that can redirect git at another repository', () => {
    const scrub = readFileSync(
      join(REPO_ROOT, '.vite-hooks', 'scrub-git-env.sh'),
      'utf8',
    );

    // GIT_DIR alone caused the incident; the rest redirect git the same way and
    // are unset so a future hook change cannot reintroduce it by another name.
    for (const variable of [
      'GIT_DIR',
      'GIT_WORK_TREE',
      'GIT_INDEX_FILE',
      'GIT_COMMON_DIR',
      'GIT_NAMESPACE',
      'GIT_OBJECT_DIRECTORY',
    ]) {
      expect(scrub).toContain(`unset ${variable}`);
    }
  });

  it('refuses to run when the scrub is missing, rather than continuing', () => {
    expect(hook).toContain('exit 1');
    expect(hook).toMatch(/if \[ ! -f "\$__scrub" \]/);
  });
});
