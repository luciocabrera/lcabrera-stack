/*
 * The two routes by which the hooks a rung places get turned on: `create`, for
 * the repository it makes, and the script the monorepo rung's `prepare` task
 * runs on every install, for a clone. The script is run the way an install runs
 * it, as a child process from the root of a tree.
 *
 * Real git and a real directory, because every claim is about one of them — a
 * repository git runs the hooks in, and the trees an install must leave alone
 * without failing.
 */

import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';
import { afterEach, describe, expect, test, vi } from 'vite-plus/test';

import { hooksPathAction } from '../assets/workspace/scripts/hooks-path.mjs';
import { runCreate } from './command-create.mjs';
import { runCommand } from './command-router.mjs';
import { INITIAL_COMMIT_MESSAGE } from './create.mjs';
import {
  CLEAN_ENV,
  gitIn as git,
  HOOKS_SCRIPT,
  localHooksPathIn as localHooksPath,
  PACKAGE_ROOT,
  scratchDirectories,
} from './hooks-path-fixtures.mjs';
import { silencedConsole } from './test-fixtures.mjs';
import { HOOKS_PATH_SCRIPT, WORKSPACE_SCRIPTS } from './workspace.mjs';

const { drain, scratch } = scratchDirectories('devkit-hooks-path-');

afterEach(drain);

const install = (cwd) =>
  spawnSync(process.execPath, [HOOKS_SCRIPT], {
    cwd,
    encoding: 'utf8',
    env: CLEAN_ENV,
  });

const clone = ({ hooks = '.githooks' } = {}) => {
  const root = scratch();
  git(['init', '--quiet', '.'], root);
  mkdirSync(join(root, hooks));
  writeFileSync(join(root, hooks, 'commit-msg'), '#!/usr/bin/env sh\n');
  return root;
};

const printedBy = (run) => {
  const silenced = silencedConsole(vi);
  try {
    return { code: run(), printed: silenced.log.mock.calls.flat().join('\n') };
  } finally {
    silenced.restore();
  }
};

const created = (profile) => {
  const parent = scratch();
  const { code, printed } = printedBy(() =>
    runCreate(['demo', '--profile', profile], parent),
  );
  return { code, printed, root: join(parent, 'demo') };
};

describe('devkit create', () => {
  test('turns the hooks on, and says so instead of asking', () => {
    const { code, printed, root } = created('repo');

    expect(code).toBe(0);
    expect(localHooksPath(root)).toBe('.githooks');
    expect(printed).toContain("this repository's core.hooksPath points there");
    expect(printed).not.toContain('git will NOT run them');
  });

  test('turns them on after an initial commit nothing installed could pass', () => {
    const { code, root } = created('monorepo');

    expect(code).toBe(0);
    expect(git(['log', '-1', '--pretty=%s'], root)).toBe(
      INITIAL_COMMIT_MESSAGE,
    );
    expect(localHooksPath(root)).toBe('.githooks');
  });

  test('leaves git alone on a rung that places no hooks', () => {
    const { code, printed, root } = created('agent');

    expect(code).toBe(0);
    expect(localHooksPath(root)).toBe('');
    expect(printed).not.toContain('core.hooksPath');
  });
});

describe('the prepare task', () => {
  test('runs the script the blueprint ships', () => {
    expect(WORKSPACE_SCRIPTS.prepare).toContain(`node ${HOOKS_PATH_SCRIPT}`);
  });

  test('ships a tree the closure calls self-contained on every path that places it', () => {
    const { code, printed } = printedBy(() =>
      runCommand({
        argv: ['closure', '--profile', 'monorepo', '--shipped'],
        root: PACKAGE_ROOT,
      }),
    );

    expect(code).toBe(0);
    expect(printed).toContain('self-contained');
  });
});

describe('an install in a clone', () => {
  test('points git at the hooks the tree commits', () => {
    const root = clone();
    const { status } = install(root);

    expect(status).toBe(0);
    expect(localHooksPath(root)).toBe('.githooks');
  });

  test('points it at the directory devkit.config.json names', () => {
    const root = clone({ hooks: 'hooks' });
    writeFileSync(
      join(root, 'devkit.config.json'),
      `${JSON.stringify({ paths: { hooks: 'hooks' } })}\n`,
    );

    expect(install(root).status).toBe(0);
    expect(localHooksPath(root)).toBe('hooks');
  });

  test('keeps a core.hooksPath the clone already set to something else', () => {
    const root = clone();
    git(['config', 'core.hooksPath', '.husky'], root);
    const { status, stdout } = install(root);

    expect(status).toBe(0);
    expect(localHooksPath(root)).toBe('.husky');
    expect(stdout).toContain('git config core.hooksPath .githooks');
  });

  test('points nothing when the tree holds no hooks', () => {
    const root = scratch();
    git(['init', '--quiet', '.'], root);

    expect(install(root).status).toBe(0);
    expect(localHooksPath(root)).toBe('');
  });
});

describe('an install outside a work tree', () => {
  test('exits 0 and writes no git config', () => {
    const root = scratch();
    mkdirSync(join(root, '.githooks'));
    const { status } = install(root);

    expect(status).toBe(0);
    expect(localHooksPath(root)).toBe('');
  });

  test('exits 0 without reading a devkit.config.json it cannot parse', () => {
    const root = scratch();
    mkdirSync(join(root, '.githooks'));
    writeFileSync(join(root, 'devkit.config.json'), '{ not json');

    expect(install(root).status).toBe(0);
  });

  test('leaves the repository around it alone', () => {
    const outer = clone();
    const inner = join(outer, 'unpacked');
    mkdirSync(join(inner, '.githooks'), { recursive: true });

    expect(install(inner).status).toBe(0);
    expect(localHooksPath(outer)).toBe('');
  });
});

describe('hooksPathAction', () => {
  const args = {
    current: '',
    hooksPath: '.githooks',
    hooksPresent: true,
    root: '/tree',
    topLevel: '/tree',
  };

  test.each([
    [{}, 'point'],
    [{ current: '.githooks' }, 'pointed'],
    [{ current: '.husky' }, 'kept'],
    [{ hooksPresent: false }, 'absent'],
    [{ topLevel: '' }, 'outside'],
    [{ topLevel: '/' }, 'outside'],
  ])('%o is %s', (overrides, action) => {
    expect(hooksPathAction({ ...args, ...overrides })).toBe(action);
  });
});
