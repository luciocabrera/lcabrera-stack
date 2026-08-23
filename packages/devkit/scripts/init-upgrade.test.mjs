import { describe, expect, test } from 'vite-plus/test';

import {
  initialConfig,
  initRefusal,
  initSummary,
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

describe('initSummary under --upgrade', () => {
  const summary = (upgrade) =>
    initSummary({
      added: [],
      defaultBranch: 'main',
      profile: 'full',
      runner: 'vite-plus',
      skipped: [],
      upgrade,
      written: 0,
    });

  test('does not claim commands were inferred', () => {
    expect(summary(true)).toContain('kept as you wrote it');
    expect(summary(true)).not.toContain('were inferred');
  });

  // Recording the current branch as the trunk is an init-time decision; on an
  // upgrade the consumer already has one and it is not being re-recorded.
  test('does not claim to have recorded a trunk', () => {
    expect(summary(true)).not.toContain("repository's trunk");
    expect(summary(false)).toContain("repository's trunk");
  });
});
