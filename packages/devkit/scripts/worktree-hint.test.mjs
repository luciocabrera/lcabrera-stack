import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, test, vi } from 'vite-plus/test';

import { runWorktreesWith } from './command-worktrees.mjs';
import { silencedConsole } from './test-fixtures.mjs';
import { gitIn, scratchRoots, worktreePaths } from './worktree-fixtures.mjs';
import { renderHint } from './worktree-hint.mjs';

const { drain, make } = scratchRoots();

afterEach(drain);

const repositoryWithGoneBranches = ({ gone, live }) => {
  const root = make();
  const origin = join(root, 'origin.git');
  const repo = join(root, 'repo');
  gitIn(root, 'init', '-q', '--bare', '-b', 'main', origin);
  gitIn(root, 'clone', '-q', origin, repo);
  gitIn(repo, 'config', 'user.email', 'fixture@example.invalid');
  gitIn(repo, 'config', 'user.name', 'Fixture');
  gitIn(repo, 'config', 'commit.gpgsign', 'false');
  gitIn(repo, 'commit', '-q', '--allow-empty', '-m', 'root');
  gitIn(repo, 'push', '-q', '-u', 'origin', 'main');
  const names = [
    ...Array.from({ length: gone }, (_, index) => `gone-${index}`),
    ...Array.from({ length: live }, (_, index) => `live-${index}`),
  ];
  for (const name of names) {
    gitIn(repo, 'worktree', 'add', '-q', '-b', name, join(root, name), 'main');
    gitIn(repo, 'push', '-q', '-u', 'origin', name);
  }
  const goneNames = names.filter((entry) => entry.startsWith('gone-'));
  for (const name of goneNames) {
    gitIn(repo, 'push', '-q', 'origin', '--delete', name);
  }
  gitIn(repo, 'fetch', '-q', '--prune');
  return repo;
};

const throwingHosts = {
  containers: () => {
    throw new Error('the hint asked the container engine');
  },
  pullRequests: () => {
    throw new Error('the hint asked the code host');
  },
  removeContainer: () => {
    throw new Error('the hint removed a container');
  },
};

const hint = ({ argv, root }) => {
  const console_ = silencedConsole(vi);
  const code = runWorktreesWith({
    argv: ['--hint', ...argv],
    hosts: throwingHosts,
    root,
  });
  const out = console_.log.mock.calls.map((call) => call.join(' '));
  console_.restore();
  return { code, out };
};

describe('devkit worktrees --hint', () => {
  test('prints one line naming the count and the skill above the threshold', () => {
    const repo = repositoryWithGoneBranches({ gone: 3, live: 1 });

    const { code, out } = hint({ argv: ['--threshold', '2'], root: repo });

    expect(code).toBe(0);
    expect(out).toHaveLength(1);
    expect(out[0]).toContain('3 git worktrees');
    expect(out[0]).toContain('/worktree-housekeeping');
  });

  test('prints nothing at or below the threshold', () => {
    const repo = repositoryWithGoneBranches({ gone: 3, live: 1 });

    expect(hint({ argv: ['--threshold', '3'], root: repo }).out).toEqual([]);
    expect(hint({ argv: ['--threshold', '10'], root: repo }).out).toEqual([]);
  });

  test('defaults the threshold to ten', () => {
    const repo = repositoryWithGoneBranches({ gone: 2, live: 0 });

    expect(hint({ argv: [], root: repo }).out).toEqual([]);
    expect(renderHint({ count: 11, threshold: 10 })).toContain(
      '11 git worktrees',
    );
    expect(renderHint({ count: 10, threshold: 10 })).toBeUndefined();
  });

  test('deletes nothing and asks neither the code host nor the container engine', () => {
    const repo = repositoryWithGoneBranches({ gone: 3, live: 1 });
    const before = worktreePaths(repo);

    const { code } = hint({ argv: ['--threshold', '0'], root: repo });

    expect(code).toBe(0);
    expect(worktreePaths(repo)).toEqual(before);
  });

  test('does not count a gone branch whose worktree holds uncommitted work', () => {
    const repo = repositoryWithGoneBranches({ gone: 2, live: 0 });
    writeFileSync(join(repo, '..', 'gone-1', 'draft.txt'), 'not committed\n');

    const { out } = hint({ argv: ['--threshold', '0'], root: repo });

    expect(out[0]).toContain('1 git worktree looks');
  });

  test('stays silent outside a git repository', () => {
    expect(hint({ argv: ['--threshold', '0'], root: make() }).out).toEqual([]);
  });

  test('refuses a threshold that is not a whole number', () => {
    const console_ = silencedConsole(vi);
    const code = runWorktreesWith({
      argv: ['--hint', '--threshold', 'many'],
      hosts: throwingHosts,
      root: make(),
    });
    console_.restore();

    expect(code).toBe(1);
  });
});
