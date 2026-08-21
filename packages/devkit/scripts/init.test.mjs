import { describe, expect, test } from 'vite-plus/test';

import {
  GATE_TASKS,
  initFailure,
  initRefusal,
  initSummary,
  inferRunner,
  initialConfig,
  scriptsAfter,
  tasksFor,
  unmetCommandKeys,
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
    // The state a consumer reaches by syncing without ever writing a config.
    // Read as uninitialised, init would infer a command map over a repository
    // whose files are already recorded, and the first `doctor` after it would
    // report drift on a tree nobody had touched.
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

describe('inferRunner', () => {
  test('prefers the declared runner over the lockfile beneath it', () => {
    // A Vite+ repository also has a pnpm lockfile. Answering `pnpm install`
    // there would work and would still be wrong: it names a toolchain the
    // repository deliberately does not drive itself through.
    expect(
      inferRunner({
        dependencies: ['vite-plus'],
        files: ['pnpm-lock.yaml', 'package.json'],
      }).name,
    ).toBe('vite-plus');
  });

  test('reads pnpm from either of its two marker files', () => {
    expect(inferRunner({ files: ['pnpm-lock.yaml'] }).name).toBe('pnpm');
    expect(inferRunner({ files: ['pnpm-workspace.yaml'] }).name).toBe('pnpm');
  });

  test('reads yarn and bun from their lockfiles', () => {
    expect(inferRunner({ files: ['yarn.lock'] }).name).toBe('yarn');
    expect(inferRunner({ files: ['bun.lockb'] }).name).toBe('bun');
  });

  test('falls back to npm, which every repository with a manifest can run', () => {
    expect(inferRunner({ files: ['package.json'] }).name).toBe('npm');
    expect(inferRunner().name).toBe('npm');
  });

  test('every runner answers all four keys the shipped files ask for', () => {
    // The keys are read off the assets at runtime, so this is the standing
    // half: a runner missing one would leave the files that use it unwritten
    // for every consumer it matched.
    for (const files of [
      ['pnpm-lock.yaml'],
      ['yarn.lock'],
      ['bun.lockb'],
      ['package.json'],
    ]) {
      expect(Object.keys(inferRunner({ files }).commands).toSorted()).toEqual([
        'audit',
        'check',
        'install',
        'test',
      ]);
    }
  });
});

describe('initialConfig', () => {
  test('writes the commands and the profile, and no path layout', () => {
    // Writing the path defaults back out as if they were choices would freeze
    // them: a later change to one would be a silent no-op in every repository
    // init ever touched.
    expect(
      initialConfig({
        commands: { install: 'npm ci', audit: 'npm audit' },
        profile: 'full',
      }),
    ).toEqual({
      commands: { audit: 'npm audit', install: 'npm ci' },
      profile: 'full',
    });
  });

  test('records the trunk it was given, because the default is often wrong', () => {
    // `git init` still produces `master` unless `init.defaultBranch` says
    // otherwise, and the shipped gates default to `main` — so a consumer who
    // took the default failed the branch gate and the coordination gate on
    // their own trunk, on day one.
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

  test('writes no conventions block when the branch could not be read', () => {
    // A detached HEAD, or a `.git` this command cannot read. Writing an empty
    // string would be worse than writing nothing: it names a trunk no branch can
    // ever match, so every branch becomes a topic branch.
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

describe('tasksFor', () => {
  const allBins = [
    ...new Set(Object.values(GATE_TASKS).map((task) => task.bin)),
  ];

  test('writes a task only for a bin that is actually installed', () => {
    // The failure this prevents: a consumer who took `devkit` alone being given
    // a dozen tasks that every exit with a command-not-found.
    expect(tasksFor({ availableBins: ['devkit'], profile: 'agent' })).toEqual({
      'devkit:check': 'devkit doctor --check',
      'devkit:sync': 'devkit sync',
    });
  });

  test('holds back the tasks whose inputs only arrive with the full profile', () => {
    const agent = tasksFor({ availableBins: allBins, profile: 'agent' });
    expect(Object.hasOwn(agent, 'adr:verify')).toBe(false);
    expect(Object.hasOwn(agent, 'pr:verify')).toBe(false);
    expect(Object.hasOwn(agent, 'commit:verify')).toBe(true);
  });

  test('the full profile adds them', () => {
    const full = tasksFor({ availableBins: allBins, profile: 'full' });
    expect(full['adr:verify']).toBe('repo-verify-adrs');
    expect(full['adr:list']).toBe('repo-verify-adrs --list');
    expect(full['pr:verify']).toBe('repo-verify-pr');
  });

  test('an unknown profile writes nothing rather than everything', () => {
    expect(tasksFor({ availableBins: allBins, profile: 'agnet' })).toEqual({});
  });
});

describe('scriptsAfter', () => {
  test("keeps the consumer's own task of the same name and reports it", () => {
    expect(
      scriptsAfter({
        existing: { build: 'tsc', 'commit:verify': 'my-own-checker' },
        tasks: {
          'branch:verify': 'repo-verify-branch',
          'commit:verify': 'repo-verify-commit',
        },
      }),
    ).toEqual({
      added: ['branch:verify'],
      scripts: {
        'branch:verify': 'repo-verify-branch',
        build: 'tsc',
        'commit:verify': 'my-own-checker',
      },
      skipped: ['commit:verify'],
    });
  });

  test('an absent script block is the same as an empty one', () => {
    expect(scriptsAfter({ tasks: { 'devkit:sync': 'devkit sync' } })).toEqual({
      added: ['devkit:sync'],
      scripts: { 'devkit:sync': 'devkit sync' },
      skipped: [],
    });
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
  test('a run that wrote files and left nothing unresolved succeeded', () => {
    expect(initFailure({ unmet: [], written: 19 })).toBeUndefined();
  });

  test('names the unconfigured commands and the file they hold back', () => {
    expect(initFailure({ unmet: ['check', 'test'], written: 25 })).toMatch(
      /check, test/,
    );
  });

  test('a run that materialised nothing is a failure, not a clean pass', () => {
    // The shape this kit has shipped twice: a command that asserts nothing
    // passes over an empty result, and reads afterwards as a repository that
    // was set up.
    expect(initFailure({ unmet: [], written: 0 })).toMatch(
      /nothing was materialised/,
    );
  });

  test('unresolved commands are reported even when files were written', () => {
    // The partial success is the dangerous one: 25 of 31 files is a repository
    // whose CI workflows are simply absent, with a zero exit over it.
    expect(initFailure({ unmet: ['install'], written: 25 })).toBeDefined();
  });
});

describe('initSummary', () => {
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
