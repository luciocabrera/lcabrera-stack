/**
 * The session-start count. Its default advice must name a command that runs
 * in a repository that installed this package, so the suite runs that command
 * from a scratch consumer layout: the bin linked into node_modules/.bin, the
 * way an install places it.
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync, symlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import {
  repositoryWithGoneBranches,
  worktreePaths,
} from './housekeeping-fixtures.mjs';
import { PLAN_COMMAND } from './housekeeping-plan.mjs';
import { runHint } from './housekeeping-run.mjs';
import { createFixtureRoots } from './repo-fixtures.mjs';

const { make, removeAll: drain } = createFixtureRoots('repo-housekeeping-');

afterEach(drain);

const BIN = join(
  dirname(fileURLToPath(import.meta.url)),
  'housekeeping-prune.mjs',
);

const NODE_DIRECTORY = dirname(process.execPath);

const installBin = (repo) => {
  const binDirectory = join(repo, 'node_modules', '.bin');
  mkdirSync(binDirectory, { recursive: true });
  symlinkSync(BIN, join(binDirectory, 'repo-housekeeping-prune'));
};

const runInShell = ({ command, cwd }) =>
  spawnSync('/bin/sh', ['-c', command], {
    cwd,
    encoding: 'utf8',
    env: {
      HOME: process.env.HOME,
      PATH: [NODE_DIRECTORY, '/usr/local/bin', '/usr/bin', '/bin'].join(':'),
      REPO_STANDARDS_HOST_ROOT: cwd,
    },
    input: '',
  });

describe('repo-housekeeping-prune --hint', () => {
  it('prints one line naming the count and a runnable command above the threshold', () => {
    const repo = repositoryWithGoneBranches({ gone: 3, live: 1, root: make() });

    const { code, lines } = runHint({
      argv: ['--hint', '--threshold', '2'],
      root: repo,
    });

    expect(code).toBe(0);
    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain('3 git worktrees look removable');
    expect(lines[0]).toContain(`print the plan with: ${PLAN_COMMAND}`);
    expect(lines[0]).not.toContain('/worktree-housekeeping');
  });

  it('prints nothing at or below the threshold, which defaults to ten', () => {
    const repo = repositoryWithGoneBranches({ gone: 3, live: 1, root: make() });

    expect(
      runHint({ argv: ['--hint', '--threshold', '3'], root: repo }).lines,
    ).toEqual([]);
    expect(runHint({ argv: ['--hint'], root: repo }).lines).toEqual([]);
  });

  it('deletes nothing', () => {
    const repo = repositoryWithGoneBranches({ gone: 3, live: 1, root: make() });
    const before = worktreePaths(repo);

    runHint({ argv: ['--hint', '--threshold', '0'], root: repo });

    expect(worktreePaths(repo)).toEqual(before);
  });

  it('does not count a worktree holding uncommitted work', () => {
    const repo = repositoryWithGoneBranches({ gone: 2, live: 0, root: make() });
    writeFileSync(join(repo, '..', 'gone-1', 'draft.txt'), 'not committed\n');

    expect(
      runHint({ argv: ['--hint', '--threshold', '0'], root: repo }).lines[0],
    ).toContain('1 git worktree looks removable');
  });

  it('stays silent outside a git repository, and refuses a threshold that is not a number', () => {
    expect(
      runHint({ argv: ['--hint', '--threshold', '0'], root: make() }).lines,
    ).toEqual([]);
    expect(
      runHint({ argv: ['--hint', '--threshold', 'many'], root: make() }).code,
    ).toBe(1);
  });
});

describe('the default advice', () => {
  it('names a command that runs from a repository that installed the package', () => {
    const repo = repositoryWithGoneBranches({ gone: 1, live: 0, root: make() });
    installBin(repo);
    const [line = ''] = runHint({
      argv: ['--hint', '--threshold', '0'],
      root: repo,
    }).lines;
    const command = line.split(' | ').at(-1) ?? '';

    const result = runInShell({ command, cwd: repo });

    expect(command).toBe('npx --no -- repo-housekeeping-prune');
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('housekeeping:prune — dry run');
  });

  it('fails the same way when the package is not installed, so the probe discriminates', () => {
    const repo = repositoryWithGoneBranches({ gone: 1, live: 0, root: make() });
    writeFileSync(join(repo, 'package.json'), '{}');

    expect(
      runInShell({ command: 'npx --no -- repo-housekeeping-prune', cwd: repo })
        .status,
    ).not.toBe(0);
  });
});

describe('--advice', () => {
  it('ends the line with the text it is given', () => {
    const repo = repositoryWithGoneBranches({ gone: 2, live: 0, root: make() });

    const { lines } = runHint({
      argv: [
        '--hint',
        '--threshold',
        '0',
        '--advice',
        'run /worktree-housekeeping to review them.',
      ],
      root: repo,
    });

    expect(lines).toEqual([
      '2 git worktrees look removable — run /worktree-housekeeping to review them.',
    ]);
  });

  it('refuses a flag with no text after it', () => {
    expect(runHint({ argv: ['--hint', '--advice'], root: make() }).code).toBe(
      1,
    );
    expect(
      runHint({
        argv: ['--hint', '--advice', '--threshold', '1'],
        root: make(),
      }).code,
    ).toBe(1);
  });
});

describe('--threshold', () => {
  it.each([
    [['--hint', '--threshold']],
    [['--hint', '--threshold', '--advice', 'x']],
    [['--hint', '--threshold', 'many']],
    [['--hint', '--threshold', '-1']],
    [['--hint', '--threshold', '']],
  ])('refuses %j with a message and a non-zero exit', (argv) => {
    const result = runHint({ argv, root: make() });

    expect(result.code).toBe(1);
    expect(result.errors).toEqual(['--threshold needs a whole number']);
    expect(result.lines).toEqual([]);
  });
});
