import { describe, expect, test } from 'vite-plus/test';

import {
  initialConfig,
  initRefusal,
  initSummary,
  recordsDefaultBranch,
  upgradeKeptCiSetup,
  upgradeKeptCommands,
} from './init.mjs';

const INFERRED = {
  audit: 'vp run deps:audit',
  check: 'vp check',
  install: 'vp install',
  test: 'vp run test',
};

const settled = {
  commands: {
    ...INFERRED,
    audit: 'vp run deps:audit --strict',
    test: 'vp run test:all',
  },
  conventions: { defaultBranch: 'trunk' },
  profile: 'full',
  registers: { adrHomes: [{ dir: 'docs/adr' }] },
};

describe('initRefusal', () => {
  test('lets an upgrade past the already-initialised refusal', () => {
    const args = {
      configExists: true,
      isGitRepository: true,
      manifestExists: true,
    };
    expect(initRefusal({ ...args, upgrade: true })).toBeUndefined();
    expect(initRefusal(args)).toContain('--upgrade');
  });

  test('still refuses an upgrade outside a git repository', () => {
    expect(
      initRefusal({
        configExists: true,
        isGitRepository: false,
        manifestExists: true,
        upgrade: true,
      }),
    ).toContain('not a git repository');
  });
});

describe('initialConfig under --upgrade', () => {
  const upgraded = initialConfig({
    ciSetup: ['- name: Set up Vite+', '  uses: o/a@sha'],
    commands: INFERRED,
    defaultBranch: 'main',
    existing: settled,
    profile: 'full',
    upgrade: true,
  });

  test('keeps every command the consumer set', () => {
    expect(upgraded.commands.audit).toBe('vp run deps:audit --strict');
    expect(upgraded.commands.test).toBe('vp run test:all');
  });

  test('adds a key the consumer does not have', () => {
    expect(upgraded.ci).toEqual({
      setup: ['- name: Set up Vite+', '  uses: o/a@sha'],
    });
  });

  test('leaves a default branch the consumer already recorded', () => {
    expect(upgraded.conventions.defaultBranch).toBe('trunk');
  });

  test('leaves another package’s block alone', () => {
    expect(upgraded.registers).toEqual(settled.registers);
  });

  test('does not overwrite a ci block that is already there', () => {
    expect(
      initialConfig({
        ciSetup: ['- name: Inferred'],
        commands: INFERRED,
        existing: { ...settled, ci: { setup: ['- name: Mine'] } },
        profile: 'full',
        upgrade: true,
      }).ci,
    ).toEqual({ setup: ['- name: Mine'] });
  });

  test('--force still rewrites what --upgrade keeps', () => {
    const forced = initialConfig({
      ciSetup: [],
      commands: INFERRED,
      existing: settled,
      profile: 'full',
    });
    expect(forced.commands.test).toBe('vp run test');
    expect(forced.registers).toEqual(settled.registers);
  });
});

describe('upgradeKeptCommands', () => {
  test('names each kept value beside what would have been inferred', () => {
    expect(
      upgradeKeptCommands({ commands: INFERRED, existing: settled }),
    ).toEqual([
      'audit: kept "vp run deps:audit --strict" (would infer "vp run deps:audit")',
      'test: kept "vp run test:all" (would infer "vp run test")',
    ]);
  });

  test('says nothing about a command that matches the inference', () => {
    expect(
      upgradeKeptCommands({
        commands: INFERRED,
        existing: { commands: INFERRED },
      }),
    ).toEqual([]);
  });

  test('says nothing when there is no config yet', () => {
    expect(upgradeKeptCommands({ commands: INFERRED })).toEqual([]);
  });

  test('ignores a command this version does not infer', () => {
    expect(
      upgradeKeptCommands({
        commands: INFERRED,
        existing: { commands: { ...INFERRED, deploy: 'vp run deploy' } },
      }),
    ).toEqual([]);
  });
});

describe('upgradeKeptCiSetup', () => {
  const inferred = ['- name: Set up Vite+', '  uses: o/setup-vp@newsha'];

  test('prints the steps this version would have set up', () => {
    expect(
      upgradeKeptCiSetup({
        ciSetup: inferred,
        existing: {
          ci: { setup: ['- name: Set up Vite+', '  uses: o/setup-vp@oldsha'] },
        },
      }),
    ).toEqual([
      'ci.setup: kept your steps. This version would have set up:',
      '  - name: Set up Vite+',
      '    uses: o/setup-vp@newsha',
    ]);
  });

  test('says nothing when the kept block is the inferred one', () => {
    expect(
      upgradeKeptCiSetup({
        ciSetup: inferred,
        existing: { ci: { setup: inferred } },
      }),
    ).toEqual([]);
  });

  test('says nothing when the consumer has no ci block to keep', () => {
    expect(
      upgradeKeptCiSetup({ ciSetup: inferred, existing: settled }),
    ).toEqual([]);
  });

  test('says nothing when this version would set up no steps', () => {
    expect(
      upgradeKeptCiSetup({ existing: { ci: { setup: ['- name: Mine'] } } }),
    ).toEqual([]);
  });

  test('says nothing about a ci block that has no setup key', () => {
    expect(
      upgradeKeptCiSetup({ ciSetup: inferred, existing: { ci: { other: 1 } } }),
    ).toEqual([]);
  });
});

// The two halves must ask the same question. Keyed differently, a `ci` block
// with no `setup` was neither written nor reported: `devkit init --upgrade &&
// devkit sync` reported success, the placeholder was deleted from every
// workflow, and every job failed at {{commands.install}} with exit 127.
describe('a ci block that carries no setup key', () => {
  const existing = { ...settled, ci: { registry: 'ghcr.io' } };
  const ciSetup = ['- name: Set up Vite+', '  uses: o/setup-vp@sha'];

  test('is filled in rather than left as it is', () => {
    expect(
      initialConfig({
        ciSetup,
        commands: INFERRED,
        existing,
        profile: 'full',
        upgrade: true,
      }).ci,
    ).toEqual({ registry: 'ghcr.io', setup: ciSetup });
  });

  test('reports nothing kept, because nothing was kept', () => {
    expect(upgradeKeptCiSetup({ ciSetup, existing })).toEqual([]);
  });
});

describe('recordsDefaultBranch', () => {
  test('records when an upgrade finds no trunk recorded', () => {
    expect(
      recordsDefaultBranch({
        defaultBranch: 'fix/123-take-devkit-0.2.0',
        existing: { conventions: { sharedBranchesDir: 'docs/branches' } },
        upgrade: true,
      }),
    ).toBe(true);
  });

  test('leaves a trunk the consumer already recorded', () => {
    expect(
      recordsDefaultBranch({
        defaultBranch: 'fix/123-take-devkit-0.2.0',
        existing: settled,
        upgrade: true,
      }),
    ).toBe(false);
  });

  test('records on a fresh init', () => {
    expect(recordsDefaultBranch({ defaultBranch: 'main' })).toBe(true);
  });

  test('records nothing when the branch could not be read', () => {
    expect(recordsDefaultBranch({ defaultBranch: '' })).toBe(false);
  });

  test('agrees with what initialConfig wrote', () => {
    const args = {
      defaultBranch: 'fix/123-take-devkit-0.2.0',
      existing: { conventions: { sharedBranchesDir: 'docs/branches' } },
      upgrade: true,
    };
    expect(
      initialConfig({ ...args, commands: INFERRED, profile: 'full' })
        .conventions.defaultBranch,
    ).toBe('fix/123-take-devkit-0.2.0');
    expect(recordsDefaultBranch(args)).toBe(true);
  });
});

describe('initSummary under --upgrade', () => {
  const summary = ({ recordedTrunk = false, upgrade }) =>
    initSummary({
      added: [],
      defaultBranch: 'main',
      profile: 'full',
      recordedTrunk,
      runner: 'vite-plus',
      skipped: [],
      upgrade,
      written: 0,
    });

  test('does not claim commands were inferred', () => {
    expect(summary({ upgrade: true })).toContain('kept as you wrote it');
    expect(summary({ upgrade: true })).not.toContain('were inferred');
  });

  test('warns whenever a trunk was recorded', () => {
    expect(summary({ recordedTrunk: true, upgrade: true })).toContain(
      "repository's trunk",
    );
    expect(summary({ recordedTrunk: true, upgrade: false })).toContain(
      "repository's trunk",
    );
  });

  test('stays quiet when no trunk was recorded', () => {
    expect(summary({ upgrade: true })).not.toContain("repository's trunk");
    expect(summary({ upgrade: false })).not.toContain("repository's trunk");
  });
});
