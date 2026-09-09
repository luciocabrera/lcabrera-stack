/*
 * What a real `sync` does to a real manifest.
 *
 * The reconciliation is decided in `tasks.mjs` and tested there against literal
 * values; this suite is the other half — that the command reads the record the
 * last run left, writes the file, and records what it wrote. A run whose
 * decision was right and whose write was not is the same clean output.
 */

import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, test, vi } from 'vite-plus/test';

import { applyInit } from './command-init.mjs';
import { runDoctor, runSync } from './command-sync.mjs';
import { blueprintDependentTasks, GATE_TASKS } from './init.mjs';
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
 * holds the block, one task of the consumer's own, and one this kit is about to
 * stop shipping. `overridden` adds the fourth case — a shipped task the
 * consumer rewrote — which a case wanting only writable drift leaves off.
 *
 * @param {{ overridden?: boolean }} [options]
 */
const settledRepo = ({ overridden = true } = {}) => {
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
      ...(overridden && { check: 'their own check' }),
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

/**
 * What one run wrote to the error stream, and what it returned. A case asserting
 * only the text would pass over a run that said the right thing and exited zero.
 */
const erroredBy = (run) => {
  const { error, restore } = silenced();
  const code = run();
  const output = error.mock.calls.flat().join('\n');
  restore();
  return { code, output };
};

/**
 * A removal is two claims, and a test asserting only the first would pass over
 * a run that deleted a task and said nothing.
 */
const expectRemoved = ({ log, name, root }) => {
  expect(readJson(root, 'package.json').scripts[name]).toBeUndefined();
  expect(log.mock.calls.flat().join('\n')).toMatch(
    new RegExp(String.raw`removed\s+${name}`),
  );
};

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

    expectRemoved({ log, name: DEPARTED, root });
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
    const root = settledRepo({ overridden: false });
    const { restore } = silenced();

    expect(runDoctor(['--check'], root)).toBe(1);
    runSync([], root);
    expect(runDoctor(['--check'], root)).toBe(0);
    restore();
  });

  test('a task left alone is drift, so doctor keeps reporting it after a sync', () => {
    const root = settledRepo();
    const { restore } = silenced();
    runSync([], root);
    restore();

    const { code, output } = erroredBy(() => runDoctor(['--check'], root));

    expect(code).toBe(1);
    expect(output).toContain('1 item(s) differ from the package.');
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

const GATE_TASK = 'adr:verify';

const GATE_COMMAND = GATE_TASKS[GATE_TASK].bin;

/**
 * A repository holding the gate tasks a previous run wired, with the bins they
 * name resolvable — which is what separates "not written because it cannot run"
 * from "not written because this run does not establish this group".
 */
const gateRepo = ({ recorded, scripts }) => {
  const root = mkdtempSync(join(tmpdir(), 'devkit-gate-'));
  roots.push(root);
  mkdirSync(join(root, 'node_modules', '.bin'), { recursive: true });
  mkdirSync(join(root, '.git'));
  const bins = new Set(Object.values(GATE_TASKS).map((task) => task.bin));
  for (const bin of bins) {
    writeFileSync(join(root, 'node_modules', '.bin', bin), '');
  }
  writeJson(root, 'devkit.config.json', {
    commands: COMMANDS,
    profile: 'repo',
  });
  writeJson(root, 'package.json', { name: 'consumer', private: true, scripts });
  writeJson(root, MANIFEST_FILE, {
    files: {},
    packageVersion: '0.0.0',
    tasks: recorded,
    version: 1,
  });
  return root;
};

describe('sync reconciles the gate tasks too', () => {
  test('a gate task still holding what this kit wrote is updated', () => {
    const root = gateRepo({
      recorded: { [GATE_TASK]: `${GATE_COMMAND} --old` },
      scripts: { [GATE_TASK]: `${GATE_COMMAND} --old` },
    });
    const { restore } = silenced();

    runSync([], root);

    expect(readJson(root, 'package.json').scripts[GATE_TASK]).toBe(
      GATE_COMMAND,
    );
    restore();
  });

  test('a gate task the consumer changed is kept and reported', () => {
    const root = gateRepo({
      recorded: { [GATE_TASK]: `${GATE_COMMAND} --old` },
      scripts: { [GATE_TASK]: 'their own checker' },
    });
    const { log, restore } = silenced();

    runSync([], root);

    expect(readJson(root, 'package.json').scripts[GATE_TASK]).toBe(
      'their own checker',
    );
    expect(log.mock.calls.flat().join('\n')).toMatch(
      new RegExp(String.raw`modified\s+${GATE_TASK}`),
    );
    restore();
  });

  test('a gate task this kit stopped shipping goes, and is named', () => {
    const root = gateRepo({
      recorded: { [DEPARTED]: 'repo-departed', [GATE_TASK]: GATE_COMMAND },
      scripts: { [DEPARTED]: 'repo-departed', [GATE_TASK]: GATE_COMMAND },
    });
    const { log, restore } = silenced();

    runSync([], root);

    expectRemoved({ log, name: DEPARTED, root });
    restore();
  });

  test('a repository with no manifest is planned no tasks, and told so', () => {
    const root = mkdtempSync(join(tmpdir(), 'devkit-gate-'));
    roots.push(root);
    mkdirSync(join(root, '.git'));
    writeJson(root, 'devkit.config.json', {
      commands: COMMANDS,
      profile: 'repo',
    });
    const { error, restore } = silenced();

    applyInit({ profile: 'repo', root, upgrade: true });

    expect(readJson(root, MANIFEST_FILE).tasks).toBeUndefined();
    expect(error.mock.calls.flat().join('\n')).toContain(
      'no gate tasks were written',
    );
    restore();
  });

  test('sync does not wire a repository that has taken no gate task; init does', () => {
    const root = gateRepo({ recorded: {}, scripts: { build: 'their own' } });
    const { restore } = silenced();

    runSync([], root);
    expect(readJson(root, 'package.json').scripts).toEqual({
      build: 'their own',
    });

    applyInit({ profile: 'repo', root, upgrade: true });
    const { scripts } = readJson(root, 'package.json');

    expect(scripts.build).toBe('their own');
    expect(scripts[GATE_TASK]).toBe(GATE_COMMAND);
    restore();
  });
});

const withoutRunKey = () => {
  const root = mkdtempSync(join(tmpdir(), 'devkit-keys-'));
  roots.push(root);
  writeJson(root, 'devkit.config.json', {
    commands: Object.fromEntries(
      Object.entries(COMMANDS).filter(([key]) => key !== 'run'),
    ),
    profile: 'repo',
  });
  writeJson(root, 'package.json', { name: 'consumer', private: true });
  return root;
};

describe('what a run says when a command key is missing', () => {
  test('sync names the key it cannot answer, and the command that adds it', () => {
    const root = withoutRunKey();

    const { output } = erroredBy(() => runSync([], root));

    expect(output).toContain('run');
    expect(output).toContain('devkit init --upgrade');
  });

  test('doctor --check names it beside what sync can still write', () => {
    const root = withoutRunKey();

    const { code, output } = erroredBy(() => runDoctor(['--check'], root));

    expect(code).toBe(1);
    expect(output).toContain('Run devkit sync for the rest.');
    expect(output).toContain('devkit init --upgrade');
  });

  test('and does not send them to sync when sync would write nothing', () => {
    const root = withoutRunKey();
    erroredBy(() => runSync([], root));

    const { code, output } = erroredBy(() => runDoctor(['--check'], root));

    expect(code).toBe(1);
    expect(output).toContain('would change none of them');
    expect(output).not.toContain('Run devkit sync');
    expect(output).toContain('devkit init --upgrade');
  });
});

const monorepoRepo = (scripts) => {
  const root = gateRepo({ recorded: {}, scripts });
  writeJson(root, 'devkit.config.json', {
    commands: COMMANDS,
    profile: 'monorepo',
  });
  return root;
};

describe('a gate that checks what the blueprint places', () => {
  const [DOC_GATE] = blueprintDependentTasks({ profile: 'monorepo' });

  test('is one task, so the rest of the rung is unaffected', () => {
    expect(blueprintDependentTasks({ profile: 'monorepo' })).toEqual([
      'commands:verify',
    ]);
    expect(blueprintDependentTasks({ profile: 'repo' })).toEqual([]);
  });

  test('is withheld from a repository that has not taken the blueprint', () => {
    const root = monorepoRepo({ build: 'their own build' });
    const { restore } = silenced();

    applyInit({ profile: 'monorepo', root, upgrade: true });
    const { scripts } = readJson(root, 'package.json');

    expect(scripts[DOC_GATE]).toBeUndefined();
    expect(scripts['adr:verify']).toBe(GATE_TASKS['adr:verify'].bin);
    restore();
  });

  test('and is wired once the blueprint block is there', () => {
    const root = monorepoRepo({ ...WORKSPACE_SCRIPTS });
    const { restore } = silenced();

    applyInit({ profile: 'monorepo', root, upgrade: true });

    expect(readJson(root, 'package.json').scripts[DOC_GATE]).toBe(
      GATE_TASKS[DOC_GATE].bin,
    );
    restore();
  });
});
