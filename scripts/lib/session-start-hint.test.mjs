/*
 * This repository's SessionStart hook names the worktree-housekeeping skill
 * through the hint's `--advice`, because the package that prints the line
 * does not ship that skill. The suite runs the hook's own command, read from
 * `.claude/settings.json`, against a scratch repository with removable
 * worktrees, lowering only its threshold.
 */
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterEach, describe, expect, it } from 'vite-plus/test';

import { repositoryWithGoneBranches } from '../../packages/repo-standards/scripts/housekeeping-fixtures.mjs';
import { createFixtureRoots } from '../../packages/repo-standards/scripts/repo-fixtures.mjs';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

const { make, removeAll: drain } = createFixtureRoots('repo-housekeeping-');

afterEach(drain);

const hookCommand = () =>
  JSON.parse(readFileSync(join(REPO_ROOT, '.claude', 'settings.json'), 'utf8'))
    .hooks.SessionStart.flatMap((entry) => entry.hooks)
    .map((hook) => hook.command)
    .find((command) => command.includes('housekeeping-prune.mjs')) ?? '';

const runHook = ({ command, hostRoot }) =>
  spawnSync('/bin/sh', ['-c', command], {
    cwd: hostRoot,
    encoding: 'utf8',
    env: {
      CLAUDE_PROJECT_DIR: REPO_ROOT,
      HOME: process.env.HOME,
      PATH: [
        dirname(process.execPath),
        '/usr/local/bin',
        '/usr/bin',
        '/bin',
      ].join(':'),
      REPO_STANDARDS_HOST_ROOT: hostRoot,
    },
    input: '',
  });

describe('the SessionStart hook', () => {
  it('prints a line naming /worktree-housekeeping above its threshold', () => {
    const hostRoot = repositoryWithGoneBranches({
      gone: 1,
      live: 0,
      root: make(),
    });
    const command = hookCommand().replace('--threshold 10', '--threshold 0');

    const result = runHook({ command, hostRoot });

    expect(command).toContain('--threshold 0');
    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe(
      '1 git worktree looks removable — run /worktree-housekeeping to review and remove them.',
    );
  });

  it('prints nothing at or below its threshold', () => {
    const hostRoot = repositoryWithGoneBranches({
      gone: 1,
      live: 0,
      root: make(),
    });

    const result = runHook({ command: hookCommand(), hostRoot });

    expect(result.status).toBe(0);
    expect(result.stdout).toBe('');
  });
});
