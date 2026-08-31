import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterEach, describe, expect, it } from 'vite-plus/test';

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

    const inherited = { ...process.env, GIT_DIR: join(real, '.git') };
    const scratch = makeTemporaryDirectory();
    git({ args: ['add', '.'], cwd: scratch, env: inherited });

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
