/*
 * The worktree-housekeeping skill tells an agent which command applies the
 * plan. The suite runs that command, read from the skill's step 3, the way a
 * repository that installed the gate runtime would: the bin linked into
 * node_modules/.bin, node's own npx on PATH, and a stand-in `gh` that prints
 * one merged pull request. Container checks are turned off, and a recording
 * docker is named outright and first on PATH, so even a broken switch never
 * reaches this machine's Docker. The repository is a scratch one.
 */
import { spawnSync } from 'node:child_process';
import {
  chmodSync,
  mkdirSync,
  readFileSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterEach, describe, expect, it } from 'vite-plus/test';

import {
  buildSortingRepository,
  recordingDocker,
  worktreePaths,
} from '../../packages/repo-standards/scripts/housekeeping-fixtures.mjs';
import { createFixtureRoots } from '../../packages/repo-standards/scripts/repo-fixtures.mjs';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

const SKILL = join(
  REPO_ROOT,
  '.github',
  'skills',
  'worktree-housekeeping',
  'SKILL.md',
);

const BIN = join(
  REPO_ROOT,
  'packages',
  'repo-standards',
  'scripts',
  'housekeeping-prune.mjs',
);

const { make, removeAll: drain } = createFixtureRoots('repo-housekeeping-');

afterEach(drain);

const stepThreeCommand = () => {
  const text = readFileSync(SKILL, 'utf8');
  const step = text.slice(text.indexOf('## 3. Apply it'));
  return /```bash\n(?<command>[^\n]+)\n```/u.exec(step)?.groups?.command ?? '';
};

const fakeGh = (root) => {
  const directory = join(root, 'fake-bin');
  mkdirSync(directory);
  const path = join(directory, 'gh');
  writeFileSync(
    path,
    `#!/bin/sh\necho '[{"headRefName":"merged","number":1,"state":"MERGED"}]'\n`,
  );
  chmodSync(path, 0o755);
  return directory;
};

describe("the skill's step 3 command", () => {
  it('removes the worktree the plan lists, in a repository that installed the package', () => {
    const root = make();
    const tree = buildSortingRepository(root);
    mkdirSync(join(tree.repo, 'node_modules', '.bin'), { recursive: true });
    symlinkSync(
      BIN,
      join(tree.repo, 'node_modules', '.bin', 'repo-housekeeping-prune'),
    );
    const command = stepThreeCommand();
    const docker = recordingDocker(root);

    const result = spawnSync('/bin/sh', ['-c', command], {
      cwd: tree.repo,
      encoding: 'utf8',
      env: {
        HOME: process.env.HOME,
        PATH: [
          docker.directory,
          fakeGh(root),
          dirname(process.execPath),
          '/usr/local/bin',
          '/usr/bin',
          '/bin',
        ].join(':'),
        REPO_STANDARDS_DOCKER: docker.path,
        REPO_STANDARDS_HOST_ROOT: tree.repo,
        REPO_STANDARDS_NO_DOCKER: '1',
      },
    });

    expect(command).toContain('--apply');
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('housekeeping:prune — applying');
    expect(worktreePaths(tree.repo)).not.toContain(tree.merged);
    expect(worktreePaths(tree.repo)).toContain(tree.unique);
    expect(docker.wasCalled()).toBe(false);
  });
});
