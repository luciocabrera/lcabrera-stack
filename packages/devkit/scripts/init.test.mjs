import { describe, expect, test } from 'vite-plus/test';

import {
  GATE_TASKS,
  initFailure,
  initRefusal,
  initSummary,
  initialConfig,
  placedHooksPath,
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

  test('preserves every block it does not own', () => {
    // `devkit.config.json` is shared with the gate runtime, which reads
    // `registers`, `gates`, `publishing` and `conventions` from it. Written as a
    // fresh object, a `--force` re-init deleted all of them — on exactly the
    // repository the flag is documented for, the one customised over time.
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
      // devkit's own answers are rewritten — that is what --force is for
      commands: { install: 'npm ci' },
      conventions: { defaultBranch: 'master', sharedBranchesDir: 'docs/sb' },
      // everything else survives, including the layout nothing here writes
      gates: { strayConfigs: { unreadNames: ['.eslintignore'] } },
      paths: { hooks: '.husky' },
      profile: 'full',
      publishing: { publicPackageDirs: ['ui'] },
      registers: { adrHomes: [{ dir: 'docs/decisions' }] },
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
  test('a run that planned files and left nothing unresolved succeeded', () => {
    expect(initFailure({ planned: 19, unmet: [] })).toBeUndefined();
  });

  test('names the unconfigured commands and the files they hold back', () => {
    expect(initFailure({ planned: 31, unmet: ['check', 'test'] })).toMatch(
      /check, test/,
    );
  });

  test('a profile that planned nothing is a failure, not a clean pass', () => {
    // The shape this kit has shipped twice: a command that asserts nothing
    // passes over an empty result, and reads afterwards as a repository that
    // was set up.
    expect(initFailure({ planned: 0, unmet: [] })).toMatch(
      /nothing was materialised/,
    );
  });

  test('a --force re-init that wrote nothing is a success, not a failure', () => {
    // On an already-materialised tree every entry classifies `current`, so
    // nothing is written. Judged on writes, this reported "this repository has
    // not been set up" over one that is fully set up — reachable straight from
    // this command's own advice to create a package.json and re-run --force.
    expect(initFailure({ planned: 31, unmet: [] })).toBeUndefined();
  });

  test('unresolved commands are reported even when files were planned', () => {
    // The partial success is the dangerous one: 25 of 31 files is a repository
    // whose CI workflows are simply absent, with a zero exit over it.
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
    // A profile that carries no hooks, or one whose hooks were all held back.
    // Naming a directory that is not there would be an instruction about files
    // the consumer does not have.
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
    // An unwired hook and a passing hook produce the identical exit 0 — the
    // same silent absence the executable-bit fix closed. The README says it and
    // COMMANDS.md repeats it; neither is in front of whoever just ran init.
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
