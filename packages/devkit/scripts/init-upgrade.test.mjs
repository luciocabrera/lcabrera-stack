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

/** A repository set up by an older version: corrected commands, no `ci` block. */
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

  // The whole reason --upgrade exists rather than --force: `init` tells a
  // consumer to correct what it guessed, so an upgrade that re-guessed would
  // undo the one thing it asked for.
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

  // An edited `ci` block is the consumer's, the same as an edited command.
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

  // Guards the contrast this whole path is built on, so a change that made
  // --force additive (or --upgrade destructive) cannot pass quietly.
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

  // A key the consumer invented is theirs, not a kept inference.
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

  // The case the sha pinning exists for: a later devkit bumps the pinned action
  // and a consumer with their own block keeps the superseded one. Kept silently,
  // that is a supply-chain fix they are never shown.
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

  // A runner that needs no setup steps infers nothing, so there is no
  // alternative to report a hand-written block against.
  test('says nothing when this version would set up no steps', () => {
    expect(
      upgradeKeptCiSetup({ existing: { ci: { setup: ['- name: Mine'] } } }),
    ).toEqual([]);
  });

  test('tolerates a hand-written ci block that is not a list of steps', () => {
    expect(
      upgradeKeptCiSetup({
        ciSetup: inferred,
        existing: { ci: { setup: 'nope' } },
      }),
    ).toEqual([]);
  });
});

describe('recordsDefaultBranch', () => {
  // The regression: an upgrade whose config predates `conventions.defaultBranch`
  // DOES record the branch it is standing on — and a consumer taking a new
  // version by PR is standing on a topic branch when they run it.
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

  // `currentBranch` answers '' on a detached HEAD, and '' is not a branch name.
  test('records nothing when the branch could not be read', () => {
    expect(recordsDefaultBranch({ defaultBranch: '' })).toBe(false);
  });

  // The predicate and the write must not drift: this is the same question asked
  // of the config `initialConfig` produced from the same inputs.
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

  // Keyed on the write, not on the flag. Keyed on `!upgrade`, the one upgrade
  // that records a trunk was the one told nothing about it.
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
