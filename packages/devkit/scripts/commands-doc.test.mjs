/*
 * The shipped command reference and the tasks this kit wires have to name the
 * same set.
 *
 * A consumer's own gate reads that file and fails on a task documented nowhere
 * in it, or a documented task their repository does not have — so a task added
 * here and left out of the seed hands them a repository that fails its own
 * check on the day it is set up. Nothing at run time can catch that: both halves
 * ship from this package, so the earliest place it can be caught is here.
 *
 * The seed spells the runner as a placeholder rather than literally, because a
 * shipped file may not name one repository's toolchain — which is also why the
 * command lines themselves stay in this package's code and only the names are
 * documented.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vite-plus/test';

import { GATE_TASKS } from './init.mjs';
import { WORKSPACE_TASKS } from './workspace.mjs';

const COMMANDS_DOC = join(
  dirname(dirname(fileURLToPath(import.meta.url))),
  'assets',
  'root',
  'COMMANDS.md',
);

const DOCUMENTED = /\{\{commands\.run\}\} ([a-z][\w:-]*)/g;

const sorted = (names) =>
  [...new Set(names)].toSorted((left, right) => left.localeCompare(right));

const documentedTasks = () =>
  sorted(
    readFileSync(COMMANDS_DOC, 'utf8')
      .matchAll(DOCUMENTED)
      .map(([, name]) => name),
  );

const wiredTasks = () =>
  sorted([
    ...Object.keys(GATE_TASKS),
    ...WORKSPACE_TASKS.map(({ name }) => name),
  ]);

describe('the shipped command reference', () => {
  test('documents a task, so a reader is looking at something', () => {
    expect(documentedTasks().length).toBeGreaterThan(0);
  });

  test('documents every task this kit wires, and only those', () => {
    expect(documentedTasks()).toEqual(wiredTasks());
  });
});
