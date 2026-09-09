import { describe, expect, test } from 'vite-plus/test';

import {
  planTasks,
  recordedTasks,
  renderTasks,
  scriptsAfterTasks,
  taskCounts,
} from './tasks.mjs';

const SHIPPED = { check: 'kit check', 'format:all': 'kit format' };

const stateOf = (entries, name) =>
  entries.find((entry) => entry.name === name)?.state;

const planned = ({ group = {}, ...overrides }) =>
  planTasks({ groups: [{ tasks: SHIPPED, ...group }], ...overrides });

describe('planTasks', () => {
  test('leaves a manifest this kit has never written a task into alone', () => {
    expect(planned({ scripts: { build: 'their own' } })).toEqual([]);
    expect(planned({})).toEqual([]);
  });

  test('a group this run may establish is written into an empty manifest', () => {
    const entries = planned({ group: { establish: true } });
    expect(entries.map((entry) => entry.state)).toEqual(['added', 'added']);
  });

  test('a task whose command does not resolve is not written into a manifest that lacks it', () => {
    const entries = planned({
      group: { establish: true, withheld: new Set(['format:all']) },
    });
    expect(stateOf(entries, 'check')).toBe('added');
    expect(entries.some((entry) => entry.name === 'format:all')).toBe(false);
  });

  test('a withheld task already in the manifest is still reconciled', () => {
    const entries = planned({
      group: { withheld: new Set(['check']) },
      recorded: { check: 'kit check --old' },
      scripts: { check: 'kit check --old' },
    });
    expect(stateOf(entries, 'check')).toBe('updated');
  });

  test('adds what is missing beside a task the consumer wrote themselves', () => {
    const entries = planned({
      recorded: { check: 'kit check' },
      scripts: { build: 'their own', check: 'kit check' },
    });
    expect(stateOf(entries, 'format:all')).toBe('added');
    expect(entries.some((entry) => entry.name === 'build')).toBe(false);
  });

  test('updates a key still holding the value this kit last wrote', () => {
    const entries = planned({
      recorded: { check: 'kit check --old' },
      scripts: { check: 'kit check --old' },
    });
    expect(stateOf(entries, 'check')).toBe('updated');
  });

  test('reports an override rather than replacing it', () => {
    const entries = planned({
      recorded: { check: 'kit check --old' },
      scripts: { check: 'their own check' },
    });
    expect(stateOf(entries, 'check')).toBe('modified');
  });

  test('reports a key the consumer had before this kit ever wrote one', () => {
    const entries = planned({
      recorded: { 'format:all': 'kit format' },
      scripts: { check: 'their own check', 'format:all': 'kit format' },
    });
    expect(stateOf(entries, 'check')).toBe('conflict');
  });

  test('removes a task this kit no longer ships', () => {
    const entries = planned({
      recorded: { check: 'kit check', departed: 'kit departed' },
      scripts: { check: 'kit check', departed: 'kit departed' },
    });
    expect(stateOf(entries, 'departed')).toBe('removed');
  });

  test('keeps a departed task the consumer had changed', () => {
    const entries = planned({
      recorded: { check: 'kit check', departed: 'kit departed' },
      scripts: { check: 'kit check', departed: 'their own' },
    });
    expect(stateOf(entries, 'departed')).toBe('modified');
  });

  test('adopts a key holding exactly what this kit ships, and no other', () => {
    const entries = planned({
      scripts: { check: 'kit check', 'format:all': 'their own' },
    });
    expect(stateOf(entries, 'check')).toBe('current');
    expect(stateOf(entries, 'format:all')).toBe('conflict');
  });
});

describe('planTasks over more than one group', () => {
  const OTHER = { 'other:task': 'kit other' };

  const overGroups = (overrides) =>
    planTasks({
      groups: [{ tasks: SHIPPED }, { tasks: OTHER }],
      ...overrides,
    });

  test('a group with no proof of authorship is not unlocked by another', () => {
    const entries = overGroups({
      recorded: { 'other:task': 'kit other' },
      scripts: { 'other:task': 'kit other' },
    });
    expect(entries.map((entry) => entry.name)).toEqual(['other:task']);
  });

  test('a task shipped at another profile is not read as withdrawn', () => {
    const entries = planTasks({
      groups: [{ tasks: OTHER }],
      recorded: { check: 'kit check', 'other:task': 'kit other' },
      scripts: { check: 'kit check', 'other:task': 'kit other' },
      shipped: [...Object.keys(SHIPPED), ...Object.keys(OTHER)],
    });
    expect(entries.some((entry) => entry.name === 'check')).toBe(false);
  });

  test('and one shipped nowhere still is', () => {
    const entries = planTasks({
      groups: [{ tasks: OTHER }],
      recorded: { departed: 'kit departed', 'other:task': 'kit other' },
      scripts: { departed: 'kit departed', 'other:task': 'kit other' },
      shipped: [...Object.keys(SHIPPED), ...Object.keys(OTHER)],
    });
    expect(stateOf(entries, 'departed')).toBe('removed');
  });
});

describe('scriptsAfterTasks', () => {
  test("writes what a run adds and keeps the consumer's own", () => {
    const scripts = { build: 'their own', check: 'kit check' };
    const entries = planTasks({
      groups: [{ tasks: SHIPPED }],
      recorded: { check: 'kit check' },
      scripts,
    });
    expect(scriptsAfterTasks({ entries, scripts })).toEqual({
      build: 'their own',
      check: 'kit check',
      'format:all': 'kit format',
    });
  });

  test('drops a removed key and nothing beside it', () => {
    const scripts = {
      build: 'their own',
      check: 'kit check',
      departed: 'kit departed',
      'format:all': 'kit format',
    };
    const entries = planTasks({
      groups: [{ tasks: SHIPPED }],
      recorded: { departed: 'kit departed' },
      scripts,
    });
    expect(Object.keys(scriptsAfterTasks({ entries, scripts }))).toEqual([
      'build',
      'check',
      'format:all',
    ]);
  });
});

describe('recordedTasks', () => {
  test('records what this run wrote and keeps what it held back', () => {
    const entries = [
      { command: 'kit check', name: 'check', state: 'updated' },
      { command: 'kit format', name: 'format:all', state: 'modified' },
      { name: 'departed', state: 'removed' },
    ];
    expect(
      recordedTasks({
        entries,
        recorded: {
          check: 'kit check --old',
          departed: 'kit departed',
          'format:all': 'kit format --old',
        },
      }),
    ).toEqual({ check: 'kit check', 'format:all': 'kit format --old' });
  });
});

describe('what a run says it did', () => {
  test('counts a write and a hold-back apart', () => {
    expect(
      taskCounts([
        { name: 'a', state: 'added' },
        { name: 'b', state: 'modified' },
        { name: 'c', state: 'current' },
        { name: 'd', state: 'removed' },
      ]),
    ).toEqual({ reported: 1, written: 2 });
  });

  test('names every key it changed or held back, and nothing quiet', () => {
    const report = renderTasks([
      { name: 'added:one', state: 'added' },
      { name: 'held:one', state: 'modified' },
      { name: 'quiet:one', state: 'current' },
    ]);
    expect(report).toContain('added:one');
    expect(report).toContain('held:one');
    expect(report).not.toContain('quiet:one');
  });

  test('says nothing when a run changed and held back nothing', () => {
    expect(renderTasks([{ name: 'quiet:one', state: 'current' }])).toBe(
      undefined,
    );
  });
});
