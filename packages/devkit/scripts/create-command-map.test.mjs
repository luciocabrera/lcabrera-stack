/*
 * The command map a created repository is left with names tasks that
 * repository has.
 *
 * The workflows and the pre-push hook read these keys, and a key naming a task
 * the tree does not define fails every push and every CI run. The map and the
 * blueprint's task list live in different modules, so this is where a rename in
 * one without the other is caught.
 */

import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  afterAll,
  beforeAll,
  describe,
  expect,
  test,
  vi,
} from 'vite-plus/test';

import { runCreate } from './command-create.mjs';
import { includesRung, PROFILE_LADDER } from './config.mjs';
import { silencedConsole } from './test-fixtures.mjs';

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));

const createdIn = ({ parent, profile }) => {
  const silenced = silencedConsole(vi);
  try {
    const code = runCreate([profile, '--profile', profile], parent);
    const root = join(parent, profile);
    return {
      code,
      commands: readJson(join(root, 'devkit.config.json')).commands,
      scripts: readJson(join(root, 'package.json')).scripts,
    };
  } finally {
    silenced.restore();
  }
};

const taskNamedBy = ({ command, prefix }) =>
  command.startsWith(`${prefix} `)
    ? command.slice(prefix.length + 1).split(' ', 1)[0]
    : undefined;

const BLUEPRINT_PROFILES = PROFILE_LADDER.filter((profile) =>
  includesRung({ profile, rung: 'monorepo' }),
);

describe.each(BLUEPRINT_PROFILES)('a tree created at %s', (profile) => {
  const parent = mkdtempSync(join(tmpdir(), 'devkit-command-map-'));
  const tree = {};

  beforeAll(() => {
    Object.assign(tree, createdIn({ parent, profile }));
  });

  afterAll(() => {
    rmSync(parent, { force: true, recursive: true });
  });

  test('runs a task it defines for every key that runs a task', () => {
    const { code, commands, scripts } = tree;

    expect(code).toBe(0);
    const named = Object.entries(commands)
      .map(([key, command]) => [
        key,
        taskNamedBy({ command, prefix: commands.run }),
      ])
      .filter(([, task]) => task !== undefined);
    expect(named.length).toBeGreaterThan(0);
    for (const [key, task] of named) {
      expect({ defined: Object.hasOwn(scripts, task), key, task }).toEqual({
        defined: true,
        key,
        task,
      });
    }
  });

  test('tests and audits through the tasks it wires, not a guess', () => {
    const { commands, scripts } = tree;

    for (const key of ['audit', 'test']) {
      const task = taskNamedBy({
        command: commands[key],
        prefix: commands.run,
      });
      expect(task).toBeDefined();
      expect(Object.keys(scripts)).toContain(task);
    }
  });
});
