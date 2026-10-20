/**
 * REPO_STANDARDS_NO_DOCKER is what keeps a run away from the machine's Docker,
 * so the suite runs the bin as a subprocess with a recording docker named
 * outright and first on PATH. Every case pins that stand-in, so even a broken
 * switch reaches the stand-in and never the real binary.
 */
import { spawnSync } from 'node:child_process';
import { chmodSync, existsSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import {
  DOCKER_ENV,
  dockerFor,
  NO_DOCKER_ENV,
} from './housekeeping-containers.mjs';
import {
  buildSortingRepository,
  gitIn,
  recordingDocker,
  scratchRoots,
  worktreePaths,
} from './housekeeping-fixtures.mjs';
import { runPrune } from './housekeeping-run.mjs';

const { drain, make } = scratchRoots();

afterEach(drain);

const BIN = join(
  dirname(fileURLToPath(import.meta.url)),
  'housekeeping-prune.mjs',
);

const runBin = ({ argv, extraEnv, root }) => {
  const docker = recordingDocker(root);
  const tree = buildSortingRepository(root);
  const result = spawnSync(process.execPath, [BIN, ...argv], {
    cwd: tree.repo,
    encoding: 'utf8',
    env: {
      [DOCKER_ENV]: docker.path,
      HOME: process.env.HOME,
      PATH: [docker.directory, '/usr/local/bin', '/usr/bin', '/bin'].join(':'),
      REPO_STANDARDS_HOST_ROOT: tree.repo,
      ...extraEnv,
    },
    input: '',
  });
  return { docker, result };
};

describe(NO_DOCKER_ENV, () => {
  it('keeps --apply from spawning docker at all, and says so', () => {
    const { docker, result } = runBin({
      argv: ['--apply'],
      extraEnv: { [NO_DOCKER_ENV]: '1' },
      root: make(),
    });

    expect(result.status).toBe(0);
    expect(docker.wasCalled()).toBe(false);
    expect(result.stderr).not.toContain('STAND-IN DOCKER CALLED');
    expect(result.stdout).toContain(
      `note: no containers checked: container checks are off because ${NO_DOCKER_ENV} is set`,
    );
  });

  it('turns the checks off for any non-empty value, including 0', () => {
    const { docker } = runBin({
      argv: [],
      extraEnv: { [NO_DOCKER_ENV]: '0' },
      root: make(),
    });

    expect(docker.wasCalled()).toBe(false);
  });

  it('leaves them on when unset, so the stand-in is the docker that would run', () => {
    const { docker, result } = runBin({ argv: [], extraEnv: {}, root: make() });

    expect(docker.wasCalled()).toBe(true);
    expect(result.stdout).toContain(
      'docker could not list containers (STAND-IN DOCKER CALLED)',
    );
  });
});

describe('dockerFor', () => {
  it('answers without any docker when the switch is set, even with one named', () => {
    const docker = recordingDocker(make());
    const host = dockerFor({
      [DOCKER_ENV]: docker.path,
      [NO_DOCKER_ENV]: 'yes',
    });

    expect(host.list().error).toBe(
      `container checks are off because ${NO_DOCKER_ENV} is set`,
    );
    expect(host.remove('abc').ok).toBe(false);
    expect(docker.wasCalled()).toBe(false);
  });

  it('runs the executable the variable names', () => {
    const docker = recordingDocker(make());

    const listed = dockerFor({ [DOCKER_ENV]: docker.path }).list();

    expect(docker.wasCalled()).toBe(true);
    expect(listed.error).toContain('STAND-IN DOCKER CALLED');
  });

  it('treats a name that is not an absolute path to a file as no docker', () => {
    expect(dockerFor({ [DOCKER_ENV]: 'docker' }).list().error).toBe(
      'docker is not installed',
    );
    expect(
      dockerFor({ [DOCKER_ENV]: '/nonexistent/docker' }).list().error,
    ).toBe('docker is not installed');
  });
});

const listingDocker = ({ root, worktree }) => {
  const path = join(root, 'listing-docker');
  const marker = join(root, 'docker-rm-called');
  const current = JSON.stringify({
    id: 'c1',
    label: worktree,
    name: 'pg',
    state: 'running',
  });
  const whole = JSON.stringify({
    ID: 'c1',
    Labels: `keep=a,b,devkit.throwaway=${worktree}`,
    Names: 'pg',
    State: 'running',
  });
  writeFileSync(
    path,
    [
      '#!/bin/sh',
      'case "$1" in',
      `  ps) case "$*" in *'{{json .}}'*) echo '${whole}' ;; *) echo '${current}' ;; esac ;;`,
      `  rm) echo "$@" >> '${marker}' ;;`,
      'esac',
      '',
    ].join('\n'),
  );
  chmodSync(path, 0o755);
  return { path, wasRemoved: () => existsSync(marker) };
};

describe('a throwaway container whose label holds a comma and an equals sign', () => {
  it('is matched to its live worktree and kept', () => {
    const root = make();
    const tree = buildSortingRepository(root);
    const worktree = join(root, 'wt,odd=1');
    gitIn(tree.repo, 'worktree', 'add', '-q', '-b', 'odd', worktree, 'main');
    const docker = listingDocker({ root, worktree });

    const { lines } = runPrune({
      argv: ['--apply'],
      docker: dockerFor({ [DOCKER_ENV]: docker.path }),
      pullRequests: [{ headRefName: 'odd', number: 4, state: 'OPEN' }],
      root: tree.repo,
    });

    expect(lines).toContain(
      `  container pg — running for ${worktree}, which is still there`,
    );
    expect(docker.wasRemoved()).toBe(false);
    expect(worktreePaths(tree.repo)).toContain(worktree);
  });
});
