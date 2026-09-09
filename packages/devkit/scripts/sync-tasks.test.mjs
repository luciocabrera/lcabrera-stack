/*
 * What a real `sync` does to a real manifest.
 *
 * The reconciliation is decided in `tasks.mjs` and tested there against literal
 * values; this suite is the other half — that the command reads the record the
 * last run left, writes the file, and records what it wrote. A run whose
 * decision was right and whose write was not is the same clean output.
 */

import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, test, vi } from 'vite-plus/test';

import { runDoctor, runSync } from './command-sync.mjs';
import { MANIFEST_FILE } from './manifest.mjs';
import { silencedConsole } from './test-fixtures.mjs';
import { WORKSPACE_SCRIPTS } from './workspace.mjs';

const COMMANDS = {
  audit: 'true',
  check: 'true',
  install: 'true',
  run: 'true',
  test: 'true',
};

const ARRIVING = 'format:all';

const DEPARTED = 'legacy:task';

const roots = [];

const writeJson = (root, name, value) =>
  writeFileSync(join(root, name), `${JSON.stringify(value, undefined, 2)}\n`);

const readJson = (root, name) =>
  JSON.parse(readFileSync(join(root, name), 'utf8'));

const shippedExcept = (name) =>
  Object.fromEntries(
    Object.entries(WORKSPACE_SCRIPTS).filter(([task]) => task !== name),
  );

/**
 * A repository this kit set up, as it stands the day before an upgrade: it
 * holds the block, one task the consumer overrode, one of their own, and one
 * this kit is about to stop shipping.
 */
const settledRepo = () => {
  const root = mkdtempSync(join(tmpdir(), 'devkit-tasks-'));
  roots.push(root);
  const recorded = { ...shippedExcept(ARRIVING), [DEPARTED]: 'kit departed' };
  writeJson(root, 'devkit.config.json', {
    commands: COMMANDS,
    profile: 'monorepo',
  });
  writeJson(root, 'package.json', {
    name: 'consumer',
    private: true,
    scripts: {
      ...recorded,
      build: 'their own build',
      check: 'their own check',
    },
  });
  writeJson(root, MANIFEST_FILE, {
    files: {},
    packageVersion: '0.0.0',
    tasks: recorded,
    version: 1,
  });
  return root;
};

const silenced = () => silencedConsole(vi);

afterEach(() => {
  for (const root of roots) rmSync(root, { force: true, recursive: true });
  roots.length = 0;
});

describe('sync reconciles the task block', () => {
  test('a task the consumer added survives a run that adds one of ours', () => {
    const root = settledRepo();
    const { restore } = silenced();

    expect(runSync([], root)).toBe(0);
    const { scripts } = readJson(root, 'package.json');

    expect(scripts.build).toBe('their own build');
    expect(scripts[ARRIVING]).toBe(WORKSPACE_SCRIPTS[ARRIVING]);
    restore();
  });

  test('a task the consumer changed is kept and named in the report', () => {
    const root = settledRepo();
    const { log, restore } = silenced();

    runSync([], root);

    expect(readJson(root, 'package.json').scripts.check).toBe(
      'their own check',
    );
    expect(log.mock.calls.flat().join('\n')).toMatch(
      /modified\s+check\s+\(left alone/,
    );
    restore();
  });

  test('a task this kit stopped shipping goes, and is named', () => {
    const root = settledRepo();
    const { log, restore } = silenced();

    runSync([], root);

    expect(readJson(root, 'package.json').scripts[DEPARTED]).toBeUndefined();
    expect(log.mock.calls.flat().join('\n')).toMatch(
      new RegExp(String.raw`removed\s+${DEPARTED}`),
    );
    restore();
  });

  test('the record carries what the run wrote into the next one', () => {
    const root = settledRepo();
    const { restore } = silenced();

    runSync([], root);
    const { tasks } = readJson(root, MANIFEST_FILE);

    expect(tasks[ARRIVING]).toBe(WORKSPACE_SCRIPTS[ARRIVING]);
    expect(tasks[DEPARTED]).toBeUndefined();
    expect(tasks.check).toBe(WORKSPACE_SCRIPTS.check);
    restore();
  });

  test('a second run has nothing left to do', () => {
    const root = settledRepo();
    const { restore } = silenced();

    runSync([], root);
    const after = readJson(root, 'package.json');
    runSync([], root);

    expect(readJson(root, 'package.json')).toEqual(after);
    restore();
  });

  test('doctor reports the pending block, and stops once it is synced', () => {
    const root = settledRepo();
    const { restore } = silenced();

    expect(runDoctor(['--check'], root)).toBe(1);
    runSync([], root);
    expect(runDoctor(['--check'], root)).toBe(0);
    restore();
  });

  test('a manifest this kit never wrote a task into is left alone', () => {
    const root = mkdtempSync(join(tmpdir(), 'devkit-tasks-'));
    roots.push(root);
    writeJson(root, 'devkit.config.json', {
      commands: COMMANDS,
      profile: 'monorepo',
    });
    writeJson(root, 'package.json', {
      name: 'consumer',
      private: true,
      scripts: { build: 'their own build' },
    });
    const { restore } = silenced();

    runSync([], root);

    expect(readJson(root, 'package.json').scripts).toEqual({
      build: 'their own build',
    });
    expect(readJson(root, MANIFEST_FILE).tasks).toBeUndefined();
    restore();
  });
});
