import { describe, expect, test } from 'vite-plus/test';

import { PROFILE_LADDER } from './config.mjs';
import {
  GATE_TASKS,
  initFailure,
  initialConfig,
  initRefusal,
  initSummary,
  placedHooksPath,
  tasksFor,
  unmetCommandKeys,
  withheldTasks,
} from './init.mjs';

describe('initRefusal', () => {
  const clean = {
    configExists: false,
    isGitRepository: true,
    manifestExists: false,
  };

  test('proceeds in an empty git repository', () => {
    expect(initRefusal(clean)).toBeUndefined();
  });

  test('refuses outside a git repository', () => {
    expect(initRefusal({ ...clean, isGitRepository: false })).toMatch(
      /not a git repository/,
    );
  });

  test('refuses when a config is already there', () => {
    expect(initRefusal({ ...clean, configExists: true })).toMatch(
      /already initialised|already here/,
    );
  });

  test('refuses on a manifest alone, with no config beside it', () => {
    expect(initRefusal({ ...clean, manifestExists: true })).toMatch(
      /already here/,
    );
  });

  test('--force overrides an existing config but never a missing repository', () => {
    expect(
      initRefusal({ ...clean, configExists: true, force: true }),
    ).toBeUndefined();
    expect(
      initRefusal({ ...clean, force: true, isGitRepository: false }),
    ).toMatch(/not a git repository/);
  });
});

describe('initialConfig', () => {
  test('writes the commands and the profile, and no path layout', () => {
    expect(
      initialConfig({
        commands: { audit: 'npm audit', install: 'npm ci' },
        profile: 'full',
      }),
    ).toEqual({
      commands: { audit: 'npm audit', install: 'npm ci' },
      profile: 'full',
    });
  });

  test('records the trunk it was given, because the default is often wrong', () => {
    expect(
      initialConfig({
        commands: { install: 'npm ci' },
        defaultBranch: 'master',
        profile: 'agent',
      }),
    ).toEqual({
      commands: { install: 'npm ci' },
      conventions: { defaultBranch: 'master' },
      profile: 'agent',
    });
  });

  test('preserves every block it does not own', () => {
    expect(
      initialConfig({
        commands: { install: 'npm ci' },
        defaultBranch: 'master',
        existing: {
          commands: { install: 'stale' },
          conventions: { defaultBranch: 'main', sharedBranchesDir: 'docs/sb' },
          gates: { strayConfigs: { unreadNames: ['.eslintignore'] } },
          paths: { hooks: '.husky' },
          profile: 'agent',
          publishing: { publicPackageDirs: ['ui'] },
          registers: { adrHomes: [{ dir: 'docs/decisions' }] },
        },
        profile: 'full',
      }),
    ).toEqual({
      commands: { install: 'npm ci' },
      conventions: { defaultBranch: 'master', sharedBranchesDir: 'docs/sb' },
      gates: { strayConfigs: { unreadNames: ['.eslintignore'] } },
      paths: { hooks: '.husky' },
      profile: 'full',
      publishing: { publicPackageDirs: ['ui'] },
      registers: { adrHomes: [{ dir: 'docs/decisions' }] },
    });
  });

  test('writes no conventions block when the branch could not be read', () => {
    for (const defaultBranch of ['', undefined]) {
      expect(
        initialConfig({
          commands: { install: 'npm ci' },
          defaultBranch,
          profile: 'agent',
        }),
      ).toEqual({ commands: { install: 'npm ci' }, profile: 'agent' });
    }
  });
});

const allBins = [...new Set(Object.values(GATE_TASKS).map((task) => task.bin))];

describe('tasksFor', () => {
  test('names every task the rung wires, whatever is installed', () => {
    expect(tasksFor({ profile: 'agent' })).toEqual({
      'branch:verify': 'repo-verify-branch',
      'commit:verify': 'repo-verify-commit',
      'coordination:close': 'repo-close-claim',
      'coordination:verify': 'repo-verify-claims',
      'devkit:check': 'devkit doctor --check',
      'devkit:sync': 'devkit sync',
    });
  });

  test('holds back the tasks whose inputs only arrive at the repo rung', () => {
    const agent = tasksFor({ profile: 'agent' });
    expect(Object.hasOwn(agent, 'adr:verify')).toBe(false);
    expect(Object.hasOwn(agent, 'pr:verify')).toBe(false);
    expect(Object.hasOwn(agent, 'commit:verify')).toBe(true);
  });

  test('the repo rung adds them', () => {
    const repo = tasksFor({ profile: 'repo' });
    expect(repo['adr:verify']).toBe('repo-verify-adrs');
    expect(repo['adr:list']).toBe('repo-verify-adrs --list');
    expect(repo['pr:verify']).toBe('repo-verify-pr');
  });

  test('a rung above repo writes every task repo writes, and its own', () => {
    const repo = tasksFor({ profile: 'repo' });
    const monorepo = tasksFor({ profile: 'monorepo' });
    expect(monorepo).toMatchObject(repo);
    expect(Object.keys(monorepo).length).toBeGreaterThan(
      Object.keys(repo).length,
    );
    expect(tasksFor({ profile: 'full' })).toEqual(monorepo);
  });

  test('every gate task names a rung on the ladder', () => {
    for (const task of Object.values(GATE_TASKS)) {
      expect(PROFILE_LADDER).toContain(task.rung);
    }
  });

  test('an unknown profile writes nothing rather than everything', () => {
    expect(tasksFor({ profile: 'agnet' })).toEqual({});
  });
});

describe('withheldTasks', () => {
  test('names the rung tasks whose bin is not installed, and no other', () => {
    expect(
      withheldTasks({ availableBins: ['devkit'], profile: 'agent' }).toSorted(
        (left, right) => left.localeCompare(right),
      ),
    ).toEqual([
      'branch:verify',
      'commit:verify',
      'coordination:close',
      'coordination:verify',
    ]);
  });

  test('withholds nothing when every bin resolves', () => {
    expect(withheldTasks({ availableBins: allBins, profile: 'full' })).toEqual(
      [],
    );
  });

  test('never names a task the rung does not wire', () => {
    const wired = new Set(Object.keys(tasksFor({ profile: 'agent' })));
    const withheld = withheldTasks({ availableBins: [], profile: 'agent' });
    for (const name of withheld) expect(wired.has(name)).toBe(true);
  });
});

describe('unmetCommandKeys', () => {
  test('collects the keys off the plan, deduplicated and sorted', () => {
    expect(
      unmetCommandKeys([
        { missing: ['install', 'check'], state: 'unresolved' },
        { missing: ['install'], state: 'unresolved' },
        { missing: ['ignored'], state: 'unmet' },
        { state: 'added' },
      ]),
    ).toEqual(['check', 'install']);
  });

  test('an all-resolved plan reports none', () => {
    expect(
      unmetCommandKeys([{ state: 'added' }, { state: 'current' }]),
    ).toEqual([]);
  });
});

describe('initFailure', () => {
  test('a run that planned files and left nothing unresolved succeeded', () => {
    expect(initFailure({ planned: 19, unmet: [] })).toBeUndefined();
  });

  test('names the unconfigured commands and the files they hold back', () => {
    expect(initFailure({ planned: 31, unmet: ['check', 'test'] })).toMatch(
      /check, test/,
    );
  });

  test('a profile that planned nothing is a failure, not a clean pass', () => {
    expect(initFailure({ planned: 0, unmet: [] })).toMatch(
      /nothing was materialised/,
    );
  });

  test('a --force re-init that wrote nothing is a success, not a failure', () => {
    expect(initFailure({ planned: 31, unmet: [] })).toBeUndefined();
  });

  test('unresolved commands are reported even when files were planned', () => {
    expect(initFailure({ planned: 31, unmet: ['install'] })).toBeDefined();
  });
});

describe('placedHooksPath', () => {
  test('reports the directory when the plan actually placed a hook there', () => {
    expect(
      placedHooksPath({
        entries: [{ path: '.githooks/commit-msg' }, { path: 'docs/a.md' }],
        hooksPath: '.githooks',
      }),
    ).toBe('.githooks');
  });

  test('says nothing when no hook was placed', () => {
    expect(
      placedHooksPath({
        entries: [{ path: 'docs/a.md' }],
        hooksPath: '.githooks',
      }),
    ).toBeUndefined();
  });

  test('matches the directory, not a name that merely starts the same', () => {
    expect(
      placedHooksPath({
        entries: [{ path: '.githooks-backup/commit-msg' }],
        hooksPath: '.githooks',
      }),
    ).toBeUndefined();
  });
});

describe('initSummary', () => {
  test('tells the consumer git will not run the hooks until pointed at them', () => {
    const summary = initSummary({
      added: [],
      hooksPath: '.githooks',
      profile: 'full',
      runner: 'npm',
      skipped: [],
      written: 31,
    });
    expect(summary).toMatch(/git config core\.hooksPath \.githooks/);
  });

  test('stays quiet about hooks when none were placed', () => {
    expect(
      initSummary({
        added: [],
        profile: 'agent',
        runner: 'npm',
        skipped: [],
        written: 19,
      }),
    ).not.toMatch(/hooksPath/);
  });

  test('names the inferred runner so a wrong guess can be corrected', () => {
    const summary = initSummary({
      added: ['devkit:sync'],
      profile: 'agent',
      runner: 'pnpm',
      skipped: [],
      written: 19,
    });
    expect(summary).toMatch(/pnpm/);
    expect(summary).toMatch(/19 file\(s\)/);
  });

  test('reports the tasks it left alone', () => {
    expect(
      initSummary({
        added: [],
        profile: 'agent',
        runner: 'npm',
        skipped: ['commit:verify'],
        written: 19,
      }),
    ).toMatch(/commit:verify/);
  });
});
